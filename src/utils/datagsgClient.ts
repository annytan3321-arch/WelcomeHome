import type { DataGovDatasetSummary, NormalizedHdbRecord } from '../../api/datagsg.ts';
import type { ImageKey, PropertyListing } from '../data/properties.ts';

export interface DatagsgQuery {
  datasetId: string;
  town: string;
  flatType: string;
  q: string;
  limit: number;
  offset: number;
}

export interface LiveDatagsgResponse {
  source: string;
  metadataEndpoint: string;
  collection: {
    collectionId: string;
    name: string;
    description: string;
    lastUpdatedAt: string;
    frequency: string;
    managedBy: string;
    childDatasets: string[];
  };
  datasets: DataGovDatasetSummary[];
  activeDataset: DataGovDatasetSummary;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasPrev: boolean;
    hasNext: boolean;
    currentPage: number;
    totalPages: number;
  };
  filtersApplied: {
    datasetId: string;
    town: string;
    flatType: string;
    q: string;
  };
  summary: {
    count: number;
    totalMatched: number;
    medianPrice: number;
    medianPsf: number;
    minPrice: number;
    maxPrice: number;
    latestMonth: string | null;
  };
  cache?: {
    metadataHit: boolean;
    recordsHit: boolean;
  };
  records: NormalizedHdbRecord[];
}

export const HDB_TOWNS = [
  'ALL',
  'ANG MO KIO',
  'BEDOK',
  'BISHAN',
  'BUKIT BATOK',
  'BUKIT MERAH',
  'BUKIT PANJANG',
  'CHOA CHU KANG',
  'CLEMENTI',
  'GEYLANG',
  'HOUGANG',
  'JURONG EAST',
  'JURONG WEST',
  'KALLANG/WHAMPOA',
  'MARINE PARADE',
  'PASIR RIS',
  'PUNGGOL',
  'QUEENSTOWN',
  'SEMBAWANG',
  'SENGKANG',
  'SERANGOON',
  'TAMPINES',
  'TOA PAYOH',
  'WOODLANDS',
  'YISHUN',
];

export const FLAT_TYPES = [
  'ALL',
  '2 ROOM',
  '3 ROOM',
  '4 ROOM',
  '5 ROOM',
  'EXECUTIVE',
  'MULTI-GENERATION',
];

const CCR_TOWNS = new Set(['CENTRAL AREA', 'BUKIT TIMAH']);
const RCR_TOWNS = new Set([
  'BISHAN',
  'BUKIT MERAH',
  'GEYLANG',
  'KALLANG/WHAMPOA',
  'MARINE PARADE',
  'QUEENSTOWN',
  'TOA PAYOH',
]);

function inferRegion(town: string): 'CCR' | 'RCR' | 'OCR' {
  const upper = town.toUpperCase();
  if (CCR_TOWNS.has(upper)) return 'CCR';
  if (RCR_TOWNS.has(upper)) return 'RCR';
  return 'OCR';
}

function inferImageKey(town: string): ImageKey {
  const upper = town.toUpperCase();
  if (upper === 'PUNGGOL' || upper === 'SENGKANG' || upper === 'PASIR RIS') return 'punggol';
  if (upper === 'CLEMENTI' || upper === 'JURONG EAST' || upper === 'JURONG WEST') return 'clementi';
  if (upper === 'MARINE PARADE' || upper === 'BEDOK' || upper === 'TAMPINES') return 'katong';
  return 'tiongbahru';
}

function inferBedrooms(flatType: string): number {
  const upper = flatType.toUpperCase();
  if (upper.includes('1 ROOM') || upper.includes('2 ROOM')) return 1;
  if (upper.includes('3 ROOM')) return 2;
  if (upper.includes('4 ROOM') || upper.includes('5 ROOM')) return 3;
  return 4;
}

function parseRemainingYears(remainingLease: string, leaseCommenceDate: string): number {
  const match = remainingLease.match(/(\d+)\s*year/i);
  if (match) return Number(match[1]);
  const commenceYear = Number(leaseCommenceDate);
  if (Number.isFinite(commenceYear) && commenceYear > 1950) {
    return Math.max(0, 99 - (new Date().getFullYear() - commenceYear));
  }
  return 0;
}

export async function fetchDatagsg(query: DatagsgQuery): Promise<LiveDatagsgResponse> {
  const params = new URLSearchParams({
    town: query.town || 'ALL',
    flatType: query.flatType || 'ALL',
    limit: String(query.limit || 18),
    offset: String(query.offset || 0),
  });
  if (query.datasetId) params.set('datasetId', query.datasetId);
  if (query.q.trim()) params.set('q', query.q.trim());

  const res = await fetch(`/api/datagsg?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Failed fetching /api/datagsg (HTTP ${res.status})`);
  }
  return data as LiveDatagsgResponse;
}

export function mapHdbRecordToListing(
  rec: NormalizedHdbRecord,
  sampleMedianPsf: number
): PropertyListing {
  const bedrooms = inferBedrooms(rec.flatType);
  const bathrooms = bedrooms >= 3 ? 2 : 1;
  const remainingYears = parseRemainingYears(rec.remainingLease, rec.leaseCommenceDate);

  return {
    id: `hdb-${rec.id}`,
    title: `Blk ${rec.block} ${rec.streetName}`,
    address: `Blk ${rec.block} ${rec.streetName}, Storey ${rec.storeyRange}`,
    district: `${rec.town} · ${rec.month}`,
    region: inferRegion(rec.town),
    propertyType: 'HDB',
    listingMode: 'Buy',
    targetProfiles: bedrooms >= 3 ? ['Families', 'Investors'] : ['Families', 'Elderly-Friendly'],
    price: rec.resalePrice,
    sqft: rec.floorAreaSqft,
    sqm: rec.floorAreaSqm,
    psf: rec.psf,
    town: rec.town,
    flatModel: rec.flatModel,
    storeyRange: rec.storeyRange,
    registeredMonth: rec.month,
    leaseCommenceDate: rec.leaseCommenceDate,
    remainingLease: rec.remainingLease,
    sourceType: 'datagsg',
    bedrooms,
    bathrooms,
    tenure: `99-year HDB (from ${rec.leaseCommenceDate}) · ${rec.remainingLease}`,
    remainingLeaseYears: remainingYears,
    nearestMrt: `${rec.town} Town`,
    mrtWalkMins: 0,
    nearbySchools: [],
    nearbyAmenities: [],
    districtMedianPsf: sampleMedianPsf || rec.psf,
    estimatedGrossYieldPct: 0,
    historicalPsfTrend: [],
    virtualTourRooms: [
      {
        id: `spec-area-${rec.id}`,
        room: 'Floor Area & Model',
        dimensions: `${rec.floorAreaSqm} sqm (${rec.floorAreaSqft.toLocaleString()} sqft)`,
        orientation: `Storey ${rec.storeyRange}`,
        highlights: `${rec.flatType} · ${rec.flatModel} layout registered in ${rec.town}.`,
        aiInsight: `Actual transacted PSF of S$${rec.psf.toLocaleString()} vs current sample median of S$${(sampleMedianPsf || rec.psf).toLocaleString()} psf.`,
      },
      {
        id: `spec-lease-${rec.id}`,
        room: 'Lease & Registration',
        dimensions: `Commenced ${rec.leaseCommenceDate}`,
        orientation: `Registered ${rec.month}`,
        highlights: `Remaining lease recorded by HDB: ${rec.remainingLease}.`,
        aiInsight: 'Official registered resale transaction retrieved live from data.gov.sg Collection 189.',
      },
    ],
    ownerVerifiedDemo: false,
    status: 'Active',
    imageKey: inferImageKey(rec.town),
    description: `Registered ${rec.flatType} (${rec.flatModel}) HDB resale transaction at Blk ${rec.block} ${rec.streetName}, ${rec.town}, storey ${rec.storeyRange}, registered in ${rec.month}. Source: HDB via data.gov.sg Collection 189.`,
    isDemoData: false,
  };
}
