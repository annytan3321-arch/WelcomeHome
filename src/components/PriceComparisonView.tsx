import React, { useState } from 'react';
import { Download, Printer, TrendingUp } from 'lucide-react';
import type { PropertyListing } from '../data/properties.ts';
import { LiveHdbResalePanel } from './LiveHdbResalePanel.tsx';

interface PriceComparisonViewProps {
  listings: PropertyListing[];
  compareIds: string[];
  onSetCompareSlot: (slotIndex: number, propertyId: string) => void;
}

export const PriceComparisonView: React.FC<PriceComparisonViewProps> = ({
  listings,
  compareIds,
  onSetCompareSlot,
}) => {
  const [explorerTab, setExplorerTab] = useState<'live-hdb' | 'compare'>('live-hdb');
  const activeProperties = [0, 1, 2].map((idx) => {
    const id = compareIds[idx];
    return listings.find((l) => l.id === id) || listings[idx] || listings[0];
  });

  const handleDownloadHtmlReport = () => {
    const rowsHtml = activeProperties
      .map((p) => {
        const psf = p.price / Math.max(p.sqft, 1);
        const diff = ((psf - p.districtMedianPsf) / p.districtMedianPsf) * 100;
        return `
          <tr>
            <td><strong>${p.title}</strong><br/><small>${p.address} (${p.district})</small></td>
            <td>${p.listingMode} · ${p.propertyType}</td>
            <td>S$${p.price.toLocaleString()}${p.listingMode !== 'Buy' ? '/mo' : ''}</td>
            <td>${p.sqft} sqft</td>
            <td>S$${psf.toFixed(p.listingMode === 'Buy' ? 0 : 2)}</td>
            <td>S$${p.districtMedianPsf} (${diff > 0 ? '+' : ''}${diff.toFixed(1)}%)</td>
            <td>${p.estimatedGrossYieldPct.toFixed(1)}%</td>
            <td>${p.nearestMrt} (${p.mrtWalkMins}m)</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>WelcomeHome SG — Property Comparison Report (Demo)</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 960px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; font-weight: 600; }
    .disclaimer { margin-top: 24px; padding: 12px; background: #fffbeb; border: 1px solid #fde68a; font-size: 12px; color: #78350f; }
  </style>
</head>
<body>
  <h1>WelcomeHome SG — Property Comparison & Benchmark Report</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} · Dataset: Demo Singapore Market Data</div>
  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>Type</th>
        <th>Asking Price</th>
        <th>Area</th>
        <th>Unit PSF</th>
        <th>District Benchmark</th>
        <th>Est. Yield</th>
        <th>Nearest MRT</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="disclaimer">
    <strong>Disclaimer:</strong> All figures and historical benchmarks in this report use simulated demo data for MVP illustration. They do not constitute an official HDB/bank valuation, SISV appraisal, or professional financial advice.
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'WelcomeHome-SG-Property-Comparison-Report.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Compute SVG chart coordinates for the primary selected property's 6-quarter PSF trend
  const primary = activeProperties[0];
  const chartPoints = primary?.historicalPsfTrend || [];
  const allVals = chartPoints.flatMap((d) => [d.unitPsf, d.districtMedianPsf]);
  const minVal = allVals.length ? Math.min(...allVals) * 0.96 : 0;
  const maxVal = allVals.length ? Math.max(...allVals) * 1.04 : 100;
  const span = Math.max(maxVal - minVal, 1);

  const buildPolyline = (key: 'unitPsf' | 'districtMedianPsf') =>
    chartPoints
      .map((pt, idx) => {
        const x = 40 + (idx * 500) / Math.max(chartPoints.length - 1, 1);
        const y = 170 - ((pt[key] - minVal) / span) * 135;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">Price Explorer · Live data.gov.sg & Comparison Matrix</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Price Explorer & HDB Resale Benchmarks
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Inspect live HDB resale transactions from data.gov.sg Collection 189 or compare demo units side-by-side.
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
          {explorerTab === 'compare' && (
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
        <LiveHdbResalePanel />
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
                  {item.title} ({item.listingMode})
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="p-4 w-48">Metric</th>
              {activeProperties.map((prop, idx) => (
                <th key={`${prop.id}-${idx}`} className="p-4">
                  <span className="block text-slate-900">{prop.title}</span>
                  <span className="mt-0.5 block font-normal text-slate-500">{prop.district}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            <tr>
              <td className="p-4 font-medium text-slate-600">Mode & Property Type</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 text-slate-900">
                  {prop.listingMode} · {prop.propertyType} ({prop.region})
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Asking Price / Monthly Rent</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  S${prop.price.toLocaleString()}
                  {prop.listingMode !== 'Buy' ? '/mo' : ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Floor Area & Layout</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 font-mono text-slate-800 tabular-nums">
                  {prop.sqft} sqft · {prop.bedrooms} Bed / {prop.bathrooms} Bath
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Unit PSF vs District Median (Demo)</td>
              {activeProperties.map((prop, idx) => {
                const psf = prop.price / Math.max(prop.sqft, 1);
                const diff = ((psf - prop.districtMedianPsf) / prop.districtMedianPsf) * 100;
                const favorable = diff <= 0;
                return (
                  <td key={idx} className="p-4">
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      S${psf.toFixed(prop.listingMode === 'Buy' ? 0 : 2)} psf
                    </span>
                    <span
                      className={`mt-1 block font-mono tabular-nums ${
                        favorable ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} vs S${prop.districtMedianPsf} median
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Est. Gross Rental Yield</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 font-mono text-slate-800 tabular-nums">
                  {prop.estimatedGrossYieldPct.toFixed(1)}% p.a.
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Tenure & Remaining Lease</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 text-slate-700">
                  {prop.tenure}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">MRT Access</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 text-slate-700">
                  {prop.nearestMrt} · {prop.mrtWalkMins} min walk
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-slate-600">Schools & Amenities</td>
              {activeProperties.map((prop, idx) => (
                <td key={idx} className="p-4 text-slate-600 leading-relaxed">
                  {prop.nearbySchools[0]} · {prop.nearbyAmenities.slice(0, 2).join(', ')}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Historical PSF Trend Chart for Slot 01 */}
      {primary && chartPoints.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 text-emerald-700" />
                <span>Price Explorer: {primary.title} vs District Benchmark Trend (Demo)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Quarterly PSF trajectory comparing indicative unit value against simulated URA/HDB district median.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="h-0.5 w-4 bg-emerald-700 inline-block" /> Unit Est. PSF
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-0.5 w-4 bg-slate-400 inline-block" /> District Median PSF
              </span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg viewBox="0 0 580 205" className="h-52 w-full min-w-[480px]">
              {[0, 0.5, 1].map((ratio) => {
                const y = 35 + ratio * 135;
                const labelVal = maxVal - ratio * span;
                return (
                  <g key={ratio}>
                    <line x1={40} x2={540} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <text x={4} y={y + 4} fontSize="10" fill="#64748b" className="font-mono">
                      {labelVal.toFixed(primary.listingMode === 'Buy' ? 0 : 1)}
                    </text>
                  </g>
                );
              })}

              <polyline
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={buildPolyline('districtMedianPsf')}
              />
              <polyline
                fill="none"
                stroke="#047857"
                strokeWidth="2.5"
                points={buildPolyline('unitPsf')}
              />

              {chartPoints.map((pt, idx) => {
                const x = 40 + (idx * 500) / Math.max(chartPoints.length - 1, 1);
                const yUnit = 170 - ((pt.unitPsf - minVal) / span) * 135;
                return (
                  <g key={pt.quarter}>
                    <circle cx={x} cy={yUnit} r="3.5" fill="#047857" />
                    <text x={x - 18} y={194} fontSize="10" fill="#64748b">
                      {pt.quarter}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Disclaimer: Benchmark curves use simulated historical demo data and do not represent official URA REALIS or HDB Resale Statistics.
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
};
