import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, GitCompare, RefreshCw, Search } from 'lucide-react';
import {
  FLAT_TYPES,
  HDB_TOWNS,
  type DatagsgQuery,
  type LiveDatagsgResponse,
} from '../utils/datagsgClient.ts';

interface LiveHdbResalePanelProps {
  data: LiveDatagsgResponse | null;
  query: DatagsgQuery;
  loading: boolean;
  error: string | null;
  healthStatus: { ok: boolean; apiKeyConfigured: boolean } | null;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onUpdateQuery: (patch: Partial<DatagsgQuery>) => void;
  onRetry: () => void;
}

export const LiveHdbResalePanel: React.FC<LiveHdbResalePanelProps> = ({
  data,
  query,
  loading,
  error,
  healthStatus,
  compareIds,
  onToggleCompare,
  onUpdateQuery,
  onRetry,
}) => {
  const [searchText, setSearchText] = useState(query.q);

  useEffect(() => {
    setSearchText(query.q);
  }, [query.q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateQuery({ q: searchText.trim(), offset: 0 });
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
              {healthStatus?.ok && (
                <span className="text-slate-500 font-normal">
                  · Backend Healthy ({healthStatus.apiKeyConfigured ? 'API Key Active' : 'Public Access'})
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
            onClick={onRetry}
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
              value={query.datasetId || data?.activeDataset.datasetId || ''}
              onChange={(e) => onUpdateQuery({ datasetId: e.target.value, offset: 0 })}
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
              value={query.town}
              onChange={(e) => onUpdateQuery({ town: e.target.value, offset: 0 })}
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
              value={query.flatType}
              onChange={(e) => onUpdateQuery({ flatType: e.target.value, offset: 0 })}
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
            onClick={onRetry}
            className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-800 shrink-0"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Town &amp; Address</th>
                  <th className="px-4 py-3 font-semibold">Flat Type / Model</th>
                  <th className="px-4 py-3 font-semibold">Storey</th>
                  <th className="px-4 py-3 font-semibold text-right">Area (sqft)</th>
                  <th className="px-4 py-3 font-semibold">Remaining Lease</th>
                  <th className="px-4 py-3 font-semibold text-right">Resale Price</th>
                  <th className="px-4 py-3 font-semibold text-right">PSF</th>
                  <th className="px-4 py-3 font-semibold text-right">Compare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="animate-pulse">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="h-4 w-full rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : !data || data.records.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      No registered resale transactions found for {query.town} · {query.flatType}
                      {query.q ? ` matching "${query.q}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  data.records.map((rec) => {
                    const listingId = `hdb-${rec.id}`;
                    const isCompared = compareIds.includes(listingId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5 font-mono text-slate-700 tabular-nums">
                          {rec.month}
                        </td>
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
                        <td className="px-4 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleCompare(listingId)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                              isCompared
                                ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <GitCompare className="h-3 w-3" />
                            {isCompared ? 'Added' : 'Compare'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
                value={query.limit}
                onChange={(e) => onUpdateQuery({ limit: Number(e.target.value), offset: 0 })}
                aria-label="Rows per page"
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-800"
              >
                <option value={18}>18 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || !pagination?.hasPrev}
                onClick={() =>
                  onUpdateQuery({ offset: Math.max(0, (pagination?.offset || 0) - query.limit) })
                }
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
                onClick={() => onUpdateQuery({ offset: (pagination?.offset || 0) + query.limit })}
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
