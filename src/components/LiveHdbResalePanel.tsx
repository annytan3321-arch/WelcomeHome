import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, RefreshCw, Search } from 'lucide-react';
import type { DataGovDatasetSummary, NormalizedHdbRecord } from '../../api/datagsg.ts';

interface LiveHdbResponse {
  source: string;
  metadataEndpoint: string;
  collection: {
    collectionId: string;
    name: string;
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

interface HealthStatusResponse {
  ok: boolean;
  status: string;
  environment?: {
    dataGovSgApiKeyConfigured: boolean;
    dataGovSgPublicAccess: boolean;
  };
}

const HDB_TOWNS = [
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

const FLAT_TYPES = ['ALL', '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE', 'MULTI-GENERATION'];

export const LiveHdbResalePanel: React.FC = () => {
  const [datasetId, setDatasetId] = useState('');
  const [town, setTown] = useState('QUEENSTOWN');
  const [flatType, setFlatType] = useState('4 ROOM');
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<LiveHdbResponse | null>(null);
  const [health, setHealth] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: HealthStatusResponse | null) => {
        if (json) setHealth(json);
      })
      .catch(() => {
        // Non-blocking health check
      });
  }, []);

  const fetchLiveHdb = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        town,
        flatType,
        limit: String(limit),
        offset: String(offset),
      });
      if (datasetId) {
        params.set('datasetId', datasetId);
      }
      if (submittedSearch.trim()) {
        params.set('q', submittedSearch.trim());
      }

      const res = await fetch(`/api/datagsg?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load live HDB resale data from /api/datagsg.');
      }
      setData(json as LiveHdbResponse);
      if (!datasetId && json.activeDataset?.datasetId) {
        setDatasetId(json.activeDataset.datasetId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reach /api/datagsg.');
    } finally {
      setLoading(false);
    }
  }, [datasetId, town, flatType, submittedSearch, limit, offset]);

  useEffect(() => {
    fetchLiveHdb();
  }, [fetchLiveHdb]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setSubmittedSearch(searchText);
  };

  const handleTownChange = (nextTown: string) => {
    setTown(nextTown);
    setOffset(0);
  };

  const handleFlatTypeChange = (nextFlatType: string) => {
    setFlatType(nextFlatType);
    setOffset(0);
  };

  const handleDatasetChange = (nextDatasetId: string) => {
    setDatasetId(nextDatasetId);
    setOffset(0);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setOffset(0);
  };

  const pagination = data?.pagination;
  const startRow = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const endRow = pagination ? pagination.offset + (data?.records.length || 0) : 0;

  return (
    <div className="space-y-5">
      {/* Live Source Context & Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700">
              <Database className="h-3.5 w-3.5" />
              <span>Live Government Feed · data.gov.sg Collection 189</span>
              {health?.ok && (
                <span className="text-slate-500 font-normal">
                  · Backend Healthy ({health.environment?.dataGovSgApiKeyConfigured ? 'API Key Active' : 'Public Access'})
                </span>
              )}
            </div>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Registered HDB Resale Flat Transactions
            </h2>
            <p className="text-xs text-slate-500">
              {data
                ? `${data.collection.managedBy} · ${data.activeDataset.name} · Updated ${new Date(
                    data.activeDataset.lastUpdatedAt
                  ).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' })}`
                : 'Connecting to /api/datagsg (Collection 189)...'}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLiveHdb}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap self-start shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Filters & Dataset Period Selector */}
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Collection 189 Dataset Period
            </label>
            <select
              value={datasetId || data?.activeDataset.datasetId || ''}
              onChange={(e) => handleDatasetChange(e.target.value)}
              disabled={!data?.datasets?.length}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
            >
              {(data?.datasets || []).map((ds) => (
                <option key={ds.datasetId} value={ds.datasetId}>
                  {ds.name}
                </option>
              ))}
              {!data?.datasets?.length && <option value="">Loading datasets...</option>}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">HDB Town</label>
            <select
              value={town}
              onChange={(e) => handleTownChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
            >
              {HDB_TOWNS.map((t) => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'All Towns' : t}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Flat Type</label>
            <select
              value={flatType}
              onChange={(e) => handleFlatTypeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800"
            >
              {FLAT_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft === 'ALL' ? 'All Types' : ft}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 lg:col-span-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Street or Block Filter
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="e.g. DAWSON or 96"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <div>
            <span className="block text-xs text-slate-500">Page Median Price</span>
            <span className="mt-0.5 block font-mono text-lg font-semibold text-slate-900 tabular-nums">
              {loading ? '—' : `S$${(data?.summary.medianPrice || 0).toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Page Median PSF</span>
            <span className="mt-0.5 block font-mono text-lg font-semibold text-emerald-700 tabular-nums">
              {loading ? '—' : `S$${(data?.summary.medianPsf || 0).toLocaleString()} psf`}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Price Range (Page)</span>
            <span className="mt-0.5 block font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {loading
                ? '—'
                : data?.summary.minPrice
                ? `S$${Math.round(data.summary.minPrice / 1000)}k – S$${Math.round(
                    data.summary.maxPrice / 1000
                  )}k`
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Total Matched Records</span>
            <span className="mt-0.5 block font-mono text-sm font-semibold text-slate-900 tabular-nums">
              {loading
                ? '—'
                : `${(data?.summary.totalMatched || 0).toLocaleString()} (Latest: ${
                    data?.summary.latestMonth || 'N/A'
                  })`}
            </span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs text-red-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Live data.gov.sg Connection Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchLiveHdb}
            className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-800 shrink-0"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Town & Address</th>
                  <th className="px-4 py-3 font-semibold">Flat Type / Model</th>
                  <th className="px-4 py-3 font-semibold">Storey</th>
                  <th className="px-4 py-3 font-semibold text-right">Area (sqft)</th>
                  <th className="px-4 py-3 font-semibold">Remaining Lease</th>
                  <th className="px-4 py-3 font-semibold text-right">Resale Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Est. PSF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="animate-pulse">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-4 w-full rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : !data || data.records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No registered resale transactions found for {town} · {flatType}
                      {submittedSearch ? ` matching "${submittedSearch}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  data.records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono text-slate-700 tabular-nums">{rec.month}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-900">
                          Blk {rec.block} {rec.streetName}
                        </span>
                        <span className="block text-[11px] text-slate-500">{rec.town}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {rec.flatType} · {rec.flatModel}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 tabular-nums">
                        {rec.storeyRange}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-700 tabular-nums">
                        {rec.floorAreaSqft.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{rec.remainingLease}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        S${rec.resalePrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-700 tabular-nums">
                        S${rec.psf.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono tabular-nums">
                {pagination && pagination.total > 0
                  ? `Showing ${startRow.toLocaleString()}–${endRow.toLocaleString()} of ${pagination.total.toLocaleString()}`
                  : '0 records'}
              </span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                aria-label="Rows per page"
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-800"
              >
                <option value={15}>15 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || !pagination?.hasPrev}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="font-mono text-xs text-slate-700 tabular-nums px-1">
                Page {pagination?.currentPage || 1} / {pagination?.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={loading || !pagination?.hasNext}
                onClick={() => setOffset((prev) => prev + limit)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
