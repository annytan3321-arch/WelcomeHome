import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import type { PropertyListing } from '../data/properties.ts';
import type { DatagsgQuery, LiveDatagsgResponse } from '../utils/datagsgClient.ts';
import { LiveHdbResalePanel } from './LiveHdbResalePanel.tsx';

interface PriceComparisonViewProps {
  listings: PropertyListing[];
  datagsgData: LiveDatagsgResponse | null;
  query: DatagsgQuery;
  loading: boolean;
  error: string | null;
  healthStatus: { ok: boolean; apiKeyConfigured: boolean } | null;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onSetCompareSlot: (slotIndex: number, propertyId: string) => void;
  onUpdateQuery: (patch: Partial<DatagsgQuery>) => void;
  onRetry: () => void;
}

export const PriceComparisonView: React.FC<PriceComparisonViewProps> = ({
  listings,
  datagsgData,
  query,
  loading,
  error,
  healthStatus,
  compareIds,
  onToggleCompare,
  onSetCompareSlot,
  onUpdateQuery,
  onRetry,
}) => {
  const [explorerTab, setExplorerTab] = useState<'live-hdb' | 'compare'>('live-hdb');

  const activeProperties = useMemo(() => {
    if (listings.length === 0) return [];
    return [0, 1, 2]
      .map((idx) => {
        const id = compareIds[idx];
        return listings.find((l) => l.id === id) || listings[idx];
      })
      .filter((item): item is PropertyListing => Boolean(item));
  }, [listings, compareIds]);

  // Real Analytics: Group live /api/datagsg records by Flat Type to compute actual Average PSF & Average Price
  const flatTypeAnalytics = useMemo(() => {
    const records = datagsgData?.records || [];
    const groups = new Map<string, { flatType: string; count: number; totalPsf: number; totalPrice: number }>();
    for (const rec of records) {
      const existing = groups.get(rec.flatType) || {
        flatType: rec.flatType,
        count: 0,
        totalPsf: 0,
        totalPrice: 0,
      };
      existing.count += 1;
      existing.totalPsf += rec.psf;
      existing.totalPrice += rec.resalePrice;
      groups.set(rec.flatType, existing);
    }
    return Array.from(groups.values())
      .map((g) => ({
        flatType: g.flatType,
        count: g.count,
        avgPsf: Math.round(g.totalPsf / g.count),
        avgPrice: Math.round(g.totalPrice / g.count),
      }))
      .sort((a, b) => a.avgPsf - b.avgPsf);
  }, [datagsgData]);

  const handleDownloadHtmlReport = () => {
    if (activeProperties.length === 0) return;
    const sampleMedian = datagsgData?.summary.medianPsf || 0;
    const rowsHtml = activeProperties
      .map((p) => {
        const psf = p.psf || Math.round(p.price / Math.max(p.sqft, 1));
        const benchmark = sampleMedian || p.districtMedianPsf || psf;
        const diff = benchmark > 0 ? ((psf - benchmark) / benchmark) * 100 : 0;
        return `
          <tr>
            <td><strong>${p.title}</strong><br/><small>${p.town || p.district}</small></td>
            <td>${p.registeredMonth || 'N/A'} · ${p.flatModel || p.propertyType}</td>
            <td>S$${p.price.toLocaleString()}</td>
            <td>${p.sqft.toLocaleString()} sqft (${p.sqm || '—'} sqm)</td>
            <td>S$${psf.toLocaleString()} psf</td>
            <td>${diff > 0 ? '+' : ''}${diff.toFixed(1)}% vs S$${benchmark.toLocaleString()} median</td>
            <td>${p.storeyRange || 'N/A'}</td>
            <td>${p.remainingLease || p.tenure}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WelcomeHome SG — Live HDB Resale Comparison Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 980px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    .disclaimer { margin-top: 24px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; font-size: 12px; color: #78350f; }
  </style>
</head>
<body>
  <h1>WelcomeHome SG — HDB Resale Comparison Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} · Source: Housing & Development Board via data.gov.sg Collection 189</div>
  <table>
    <thead>
      <tr>
        <th>Block & Street</th>
        <th>Registered / Model</th>
        <th>Resale Price</th>
        <th>Floor Area</th>
        <th>Unit PSF</th>
        <th>vs Sample Median PSF</th>
        <th>Storey Range</th>
        <th>Remaining Lease</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="disclaimer">
    <strong>Source & Disclaimer:</strong> Registered resale prices retrieved live from data.gov.sg Collection 189. Historical transaction records are indicative market references and do not constitute an official HDB/bank valuation or professional financial advice.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'WelcomeHome-SG-HDB-Comparison-Report.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const sampleMedianPsf = datagsgData?.summary.medianPsf || 0;
  const maxChartPsf = Math.max(
    sampleMedianPsf,
    ...flatTypeAnalytics.map((g) => g.avgPsf),
    100
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            Price Explorer · Live data.gov.sg Collection 189
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Price Explorer &amp; HDB Resale Benchmarks
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect live registered HDB resale transactions from data.gov.sg and compare real units side-by-side with live PSF analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setExplorerTab('live-hdb')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                explorerTab === 'live-hdb'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live HDB Data (data.gov.sg)
            </button>
            <button
              type="button"
              onClick={() => setExplorerTab('compare')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                explorerTab === 'compare'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Compare Units ({activeProperties.length})
            </button>
          </div>
          {explorerTab === 'compare' && activeProperties.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                Print View
              </button>
              <button
                type="button"
                onClick={handleDownloadHtmlReport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                Download Report (.HTML)
              </button>
            </>
          )}
        </div>
      </div>

      {explorerTab === 'live-hdb' ? (
        <LiveHdbResalePanel
          data={datagsgData}
          query={query}
          loading={loading}
          error={error}
          healthStatus={healthStatus}
          compareIds={compareIds}
          onToggleCompare={onToggleCompare}
          onUpdateQuery={onUpdateQuery}
          onRetry={onRetry}
        />
      ) : loading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs text-red-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Unable to Load Live Comparison Data</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-800 shrink-0"
          >
            Retry /api/datagsg
          </button>
        </div>
      ) : activeProperties.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          No live HDB records loaded for comparison. Adjust your filters in Live HDB Data and try again.
        </div>
      ) : (
        <>
          {/* Selector Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 no-print">
            {[0, 1, 2].map((slot) => (
              <div key={slot} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <label className="block text-xs font-medium text-slate-500">
                  Comparison Slot 0{slot + 1}
                </label>
                <select
                  value={activeProperties[slot]?.id || ''}
                  onChange={(e) => onSetCompareSlot(slot, e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                >
                  {listings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {item.town || item.district} (S${item.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Real HDB Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="p-4 w-52">Metric</th>
                  {activeProperties.map((prop, idx) => (
                    <th key={`${prop.id}-${idx}`} className="p-4">
                      <span className="block text-slate-900">{prop.title}</span>
                      <span className="mt-0.5 block font-normal text-slate-500">
                        {prop.town || prop.district}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr>
                  <td className="p-4 font-medium text-slate-600">Registered Month &amp; Model</td>
                  {activeProperties.map((prop, idx) => (
                    <td key={idx} className="p-4 text-slate-900">
                      {prop.registeredMonth || 'User Entry'} · {prop.flatModel || prop.propertyType}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-600">Transacted Resale Price</td>
                  {activeProperties.map((prop, idx) => (
                    <td key={idx} className="p-4 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      S${prop.price.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-600">Floor Area &amp; Storey</td>
                  {activeProperties.map((prop, idx) => (
                    <td key={idx} className="p-4 font-mono text-slate-800 tabular-nums">
                      {prop.sqft.toLocaleString()} sqft ({prop.sqm || '—'} sqm) · Storey{' '}
                      {prop.storeyRange || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-600">Unit PSF vs Live Sample Median</td>
                  {activeProperties.map((prop, idx) => {
                    const psf = prop.psf || Math.round(prop.price / Math.max(prop.sqft, 1));
                    const benchmark = sampleMedianPsf || prop.districtMedianPsf || psf;
                    const diff = benchmark > 0 ? ((psf - benchmark) / benchmark) * 100 : 0;
                    const favorable = diff <= 0;
                    return (
                      <td key={idx} className="p-4">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          S${psf.toLocaleString()} psf
                        </span>
                        <span
                          className={`mt-1 block font-mono tabular-nums ${
                            favorable ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} vs S$
                          {benchmark.toLocaleString()} sample median
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-600">Lease Commence Date</td>
                  {activeProperties.map((prop, idx) => (
                    <td key={idx} className="p-4 font-mono text-slate-800 tabular-nums">
                      {prop.leaseCommenceDate || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-600">Remaining Lease</td>
                  {activeProperties.map((prop, idx) => (
                    <td key={idx} className="p-4 text-slate-700">
                      {prop.remainingLease || prop.tenure}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Live /api/datagsg Analytics Chart (Computed Directly from Fetched Records) */}
          {flatTypeAnalytics.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <BarChart3 className="h-4 w-4 text-emerald-700" />
                    <span>Live PSF Analytics by Flat Type (data.gov.sg Sample)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Average PSF computed from the {datagsgData?.records.length || 0} live transactions currently loaded from Collection 189 ({query.town === 'ALL' ? 'All Towns' : query.town}).
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-700 tabular-nums">
                  Sample Median: S${sampleMedianPsf.toLocaleString()} psf
                </span>
              </div>

              <div className="space-y-3">
                {flatTypeAnalytics.map((group) => {
                  const widthPct = Math.max(8, Math.round((group.avgPsf / maxChartPsf) * 100));
                  return (
                    <div key={group.flatType} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">
                          {group.flatType}{' '}
                          <span className="text-slate-400 font-normal">({group.count} txns)</span>
                        </span>
                        <span className="font-mono text-slate-900 tabular-nums">
                          Avg S${group.avgPsf.toLocaleString()} psf · Avg S$
                          {group.avgPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500">
                Source: Housing &amp; Development Board via data.gov.sg Collection 189 (/api/datagsg). Figures reflect actual filtered transaction records and are not official appraisals.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
