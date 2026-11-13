export interface ServerlessRequest {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
}

export interface ServerlessResponse {
  statusCode?: number;
  status?: (code: number) => ServerlessResponse;
  json?: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (chunk?: string) => void;
}

function sendJson(res: ServerlessResponse, statusCode: number, body: unknown): void {
  if (typeof res.status === 'function') {
    const statusRes = res.status(statusCode);
    if (typeof statusRes.json === 'function') {
      statusRes.json(body);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end?.(JSON.stringify(body));
}

interface DataGovCollectionMetadata {
  collectionId: string;
  name: string;
  description: string;
  lastUpdatedAt: string;
  coverageStart: string;
  coverageEnd: string;
  frequency: string;
  sources: string[];
  managedBy: string;
  childDatasets: string[];
}

export interface DataGovDatasetSummary {
  datasetId: string;
  name: string;
  format: string;
  lastUpdatedAt: string;
  coverageStart: string;
  coverageEnd: string;
}

interface RawHdbRecord {
  _id: number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease?: string;
  resale_price: string;
}

export interface NormalizedHdbRecord {
  id: number;
  month: string;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  floorAreaSqm: number;
  floorAreaSqft: number;
  flatModel: string;
  leaseCommenceDate: string;
  remainingLease: string;
  resalePrice: number;
  psf: number;
}

const COLLECTION_ID = 189;
const COLLECTION_METADATA_URL = `https://api-production.data.gov.sg/v2/public/api/collections/${COLLECTION_ID}/metadata`;
const DATASTORE_SEARCH_URL = 'https://data.gov.sg/api/action/datastore_search';
const SQM_TO_SQFT = 10.7639104;
const METADATA_CACHE_TTL_MS = 10 * 60 * 1000;
const RECORDS_CACHE_TTL_MS = 60 * 1000;

let metadataCache: {
  expiresAt: number;
  collection: DataGovCollectionMetadata;
  datasets: DataGovDatasetSummary[];
} | null = null;

const recordsCache = new Map<
  string,
  {
    expiresAt: number;
    payload: Record<string, unknown>;
  }
>();

function readQueryParam(req: ServerlessRequest, key: string): string {
  const val = req.query?.[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  if (req.url && req.url.includes('?')) {
    const search = new URLSearchParams(req.url.split('?')[1]);
    return search.get(key) ?? '';
  }
  return '';
}

function buildApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = process.env.DATA_GOV_SG_API_KEY?.trim();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  return headers;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return Math.round(sorted[mid]);
}

async function fetchCollectionAndDatasets(): Promise<{
  collection: DataGovCollectionMetadata;
  datasets: DataGovDatasetSummary[];
  cacheHit: boolean;
}> {
  if (metadataCache && Date.now() < metadataCache.expiresAt) {
    return {
      collection: metadataCache.collection,
      datasets: metadataCache.datasets,
      cacheHit: true,
    };
  }

  const headers = buildApiHeaders();
  const metaResp = await fetch(COLLECTION_METADATA_URL, {
    headers,
    signal: AbortSignal.timeout(10000),
  });

  if (!metaResp.ok) {
    throw new Error(`Collection ${COLLECTION_ID} metadata returned HTTP ${metaResp.status}`);
  }

  const metaJson = (await metaResp.json()) as {
    code?: number;
    errorMsg?: string;
    data?: { collectionMetadata?: DataGovCollectionMetadata };
  };

  const collection = metaJson.data?.collectionMetadata;
  if (!collection || !Array.isArray(collection.childDatasets) || collection.childDatasets.length === 0) {
    throw new Error(metaJson.errorMsg || `Collection ${COLLECTION_ID} returned no childDatasets.`);
  }

  const settledDatasets = await Promise.allSettled(
    collection.childDatasets.map(async (datasetId) => {
      const dsResp = await fetch(
        `https://api-production.data.gov.sg/v2/public/api/datasets/${datasetId}/metadata`,
        {
          headers,
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!dsResp.ok) {
        throw new Error(`Dataset ${datasetId} metadata HTTP ${dsResp.status}`);
      }
      const dsJson = (await dsResp.json()) as {
        data?: {
          datasetId: string;
          name: string;
          format?: string;
          lastUpdatedAt: string;
          coverageStart: string;
          coverageEnd: string;
        };
      };
      if (!dsJson.data) {
        throw new Error(`Dataset ${datasetId} metadata missing data object`);
      }
      return {
        datasetId: dsJson.data.datasetId,
        name: dsJson.data.name,
        format: dsJson.data.format || 'CSV',
        lastUpdatedAt: dsJson.data.lastUpdatedAt,
        coverageStart: dsJson.data.coverageStart,
        coverageEnd: dsJson.data.coverageEnd,
      } satisfies DataGovDatasetSummary;
    })
  );

  const datasets: DataGovDatasetSummary[] = settledDatasets.map((res, idx) => {
    if (res.status === 'fulfilled') return res.value;
    return {
      datasetId: collection.childDatasets[idx],
      name: `Dataset ${collection.childDatasets[idx]}`,
      format: 'CSV',
      lastUpdatedAt: collection.lastUpdatedAt,
      coverageStart: collection.coverageStart,
      coverageEnd: collection.coverageEnd,
    };
  });

  metadataCache = {
    expiresAt: Date.now() + METADATA_CACHE_TTL_MS,
    collection,
    datasets,
  };

  return { collection, datasets, cacheHit: false };
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  if (req.method && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    const requestedDatasetId = readQueryParam(req, 'datasetId').trim();
    const townParam = readQueryParam(req, 'town').trim().toUpperCase();
    const flatTypeParam = readQueryParam(req, 'flatType').trim().toUpperCase();
    const searchQuery = readQueryParam(req, 'q').trim();
    const rawLimit = Number(readQueryParam(req, 'limit')) || 20;
    const limit = Math.min(100, Math.max(5, rawLimit));
    const rawOffset = Number(readQueryParam(req, 'offset'));
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

    const { collection, datasets, cacheHit: metadataCacheHit } =
      await fetchCollectionAndDatasets();

    // Default to Jan-2017 onwards dataset (first childDataset in Collection 189)
    const activeDatasetId = requestedDatasetId || collection.childDatasets[0];
    if (!collection.childDatasets.includes(activeDatasetId)) {
      sendJson(res, 400, {
        error: `Dataset "${activeDatasetId}" is not part of data.gov.sg Collection ${COLLECTION_ID}.`,
        allowedDatasets: collection.childDatasets,
      });
      return;
    }

    const cacheKey = JSON.stringify({
      activeDatasetId,
      townParam,
      flatTypeParam,
      searchQuery,
      limit,
      offset,
    });

    const cachedEntry = recordsCache.get(cacheKey);
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
      res.setHeader?.('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      res.setHeader?.('X-Data-Cache', 'HIT');
      sendJson(res, 200, {
        ...cachedEntry.payload,
        cache: { metadataHit: metadataCacheHit, recordsHit: true },
      });
      return;
    }

    const filters: Record<string, string> = {};
    if (townParam && townParam !== 'ALL') {
      filters.town = townParam;
    }
    if (flatTypeParam && flatTypeParam !== 'ALL') {
      filters.flat_type = flatTypeParam;
    }

    const params = new URLSearchParams({
      resource_id: activeDatasetId,
      limit: String(limit),
      offset: String(offset),
      sort: 'month desc',
    });

    if (Object.keys(filters).length > 0) {
      params.set('filters', JSON.stringify(filters));
    }
    if (searchQuery) {
      params.set('q', searchQuery);
    }

    const recordsResp = await fetch(`${DATASTORE_SEARCH_URL}?${params.toString()}`, {
      headers: buildApiHeaders(),
      signal: AbortSignal.timeout(12000),
    });

    if (!recordsResp.ok) {
      throw new Error(`data.gov.sg datastore_search returned HTTP ${recordsResp.status}`);
    }

    const recordsJson = (await recordsResp.json()) as {
      success?: boolean;
      error?: { message?: string };
      result?: {
        total?: number;
        records?: RawHdbRecord[];
      };
    };

    if (!recordsJson.success || !recordsJson.result) {
      throw new Error(
        recordsJson.error?.message || 'data.gov.sg datastore_search returned unsuccessful status.'
      );
    }

    const rawRecords = recordsJson.result.records || [];
    const totalMatched = recordsJson.result.total ?? rawRecords.length;

    const records: NormalizedHdbRecord[] = rawRecords.map((rec) => {
      const sqm = Number(rec.floor_area_sqm) || 0;
      const sqft = Math.round(sqm * SQM_TO_SQFT);
      const price = Number(rec.resale_price) || 0;
      const psf = sqft > 0 ? Math.round(price / sqft) : 0;

      return {
        id: rec._id,
        month: rec.month,
        town: rec.town,
        flatType: rec.flat_type,
        block: rec.block,
        streetName: rec.street_name,
        storeyRange: rec.storey_range,
        floorAreaSqm: sqm,
        floorAreaSqft: sqft,
        flatModel: rec.flat_model,
        leaseCommenceDate: rec.lease_commence_date,
        remainingLease: rec.remaining_lease || 'Not listed (pre-2015 schema)',
        resalePrice: price,
        psf,
      };
    });

    const prices = records.map((r) => r.resalePrice).filter((n) => n > 0);
    const psfs = records.map((r) => r.psf).filter((n) => n > 0);
    const activeDataset = datasets.find((d) => d.datasetId === activeDatasetId) || datasets[0];

    const payload = {
      source: 'data.gov.sg',
      metadataEndpoint: COLLECTION_METADATA_URL,
      collection: {
        collectionId: collection.collectionId,
        name: collection.name,
        description: collection.description,
        lastUpdatedAt: collection.lastUpdatedAt,
        frequency: collection.frequency,
        managedBy: collection.managedBy,
        childDatasets: collection.childDatasets,
      },
      datasets,
      activeDataset,
      pagination: {
        limit,
        offset,
        total: totalMatched,
        hasPrev: offset > 0,
        hasNext: offset + records.length < totalMatched,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.max(1, Math.ceil(totalMatched / limit)),
      },
      filtersApplied: {
        datasetId: activeDatasetId,
        town: townParam || 'ALL',
        flatType: flatTypeParam || 'ALL',
        q: searchQuery,
      },
      summary: {
        count: records.length,
        totalMatched,
        medianPrice: computeMedian(prices),
        medianPsf: computeMedian(psfs),
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        latestMonth: records[0]?.month || null,
      },
      records,
    };

    // Cap cache map size to prevent unbounded memory growth
    if (recordsCache.size > 100) {
      const oldestKey = recordsCache.keys().next().value;
      if (oldestKey) recordsCache.delete(oldestKey);
    }
    recordsCache.set(cacheKey, {
      expiresAt: Date.now() + RECORDS_CACHE_TTL_MS,
      payload,
    });

    res.setHeader?.('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.setHeader?.('X-Data-Cache', 'MISS');

    sendJson(res, 200, {
      ...payload,
      cache: { metadataHit: metadataCacheHit, recordsHit: false },
    });
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    const message = err instanceof Error ? err.message : 'Unknown error connecting to data.gov.sg';
    console.error('data.gov.sg serverless API error:', message);
    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout
        ? 'Timed out waiting for data.gov.sg API response. Please retry.'
        : `Failed retrieving live data from data.gov.sg (${message}).`,
    });
  }
}
