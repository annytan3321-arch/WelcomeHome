import React, { useMemo, useState } from 'react';
import { Check, Download, Layers, RefreshCw, Shield } from 'lucide-react';
import type {
  MaintenanceRequest,
  PropertyListing,
  SubscriptionTier,
  TransactionRecord,
  ViewingAppointment,
} from '../data/properties.ts';
import type { LiveDatagsgResponse } from '../utils/datagsgClient.ts';

interface BusinessAndArchitectureViewProps {
  activeTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  listings: PropertyListing[];
  datagsgData: LiveDatagsgResponse | null;
  datagsgLoading: boolean;
  datagsgError: string | null;
  onRetryDatagsg: () => void;
  viewings: ViewingAppointment[];
  maintenance: MaintenanceRequest[];
  transactions: TransactionRecord[];
  onUpdateListingStatus: (id: string, status: PropertyListing['status']) => Promise<void>;
}

const TIERS: Array<{
  tier: SubscriptionTier;
  audience: string;
  price: string;
  limits: string[];
}> = [
  {
    tier: 'Freemium',
    audience: 'For individual home & room seekers',
    price: 'S$0 / month',
    limits: [
      'Live HDB resale search via data.gov.sg Collection 189',
      '10 AI Property Assistant queries / month',
      'Basic Affordability & Stamp Duty calculator',
      '1 active viewing booking at a time',
    ],
  },
  {
    tier: 'Bronze',
    audience: 'For students, expats & first-time buyers',
    price: 'S$19 / month',
    limits: [
      '75 AI Property Assistant queries / month',
      'Side-by-side comparison & HTML report exports',
      'Priority viewing slot scheduling',
      'Saved search & town benchmark tracking',
    ],
  },
  {
    tier: 'Silver',
    audience: 'For active landlords & direct sellers',
    price: 'S$49 / month',
    limits: [
      'Up to 3 direct property listings with unit spec briefs',
      'Unlimited AI Assistant + virtual inspection notes',
      'End-to-end OTP / Tenancy workflow tracker',
      '10% partner discount on aircon & move-out services',
    ],
  },
  {
    tier: 'Gold',
    audience: 'For multi-unit owners, investors & corporates',
    price: 'S$129 / month',
    limits: [
      'Up to 15 managed properties & rental maintenance queue',
      'Collection 189 town & flat-type CSV analytics exports',
      'Dedicated referral routing to mortgage & legal partners',
      'Multi-user household or corporate team access',
    ],
  },
];

export const BusinessAndArchitectureView: React.FC<BusinessAndArchitectureViewProps> = ({
  activeTier,
  onSelectTier,
  listings,
  datagsgData,
  datagsgLoading,
  datagsgError,
  onRetryDatagsg,
  viewings,
  maintenance,
  transactions,
  onUpdateListingStatus,
}) => {
  const [subTab, setSubTab] = useState<'plans' | 'admin' | 'architecture'>('plans');

  const townBreakdown = useMemo(() => {
    const records = datagsgData?.records || [];
    const map = new Map<string, { town: string; count: number; totalPrice: number; totalPsf: number }>();
    for (const r of records) {
      const curr = map.get(r.town) || { town: r.town, count: 0, totalPrice: 0, totalPsf: 0 };
      curr.count += 1;
      curr.totalPrice += r.resalePrice;
      curr.totalPsf += r.psf;
      map.set(r.town, curr);
    }
    return Array.from(map.values())
      .map((t) => ({
        town: t.town,
        count: t.count,
        avgPrice: Math.round(t.totalPrice / t.count),
        avgPsf: Math.round(t.totalPsf / t.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [datagsgData]);

  const handleExportInventoryCsv = () => {
    const header =
      'ID,Month,Town,Title,FlatModel,StoreyRange,Sqft,ResalePriceSGD,PSF,RemainingLease,Status\n';
    const rows = listings
      .map(
        (l) =>
          `"${l.id}","${l.registeredMonth || ''}","${(l.town || l.district).replace(/"/g, '""')}","${l.title.replace(/"/g, '""')}","${l.flatModel || l.propertyType}","${l.storeyRange || ''}",${l.sqft},${l.price},${l.psf || Math.round(l.price / Math.max(l.sqft, 1))},"${(l.remainingLease || l.tenure).replace(/"/g, '""')}","${l.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WelcomeHome-SG-Live-HDB-Records.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            SaaS Monetisation, Live Analytics &amp; Engineering Blueprint
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Plans, Admin &amp; Live HDB Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Switch subscription tiers, inspect live analytics computed from /api/datagsg records, and review the production architecture.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('plans')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'plans' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subscription Plans
          </button>
          <button
            type="button"
            onClick={() => setSubTab('admin')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'admin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin &amp; Live Analytics
          </button>
          <button
            type="button"
            onClick={() => setSubTab('architecture')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'architecture' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture &amp; Guardrails
          </button>
        </div>
      </div>

      {/* Tab 1: Subscription Tiers */}
      {subTab === 'plans' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((plan) => {
            const isSelected = activeTier === plan.tier;
            return (
              <div
                key={plan.tier}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 ${
                  isSelected ? 'border-emerald-700 ring-1 ring-emerald-700' : 'border-slate-200'
                }`}
              >
                <div>
                  <p className="text-xs font-medium text-emerald-700">{plan.audience}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{plan.tier}</h2>
                  <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                    {plan.price}
                  </p>
                  <ul className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-700">
                    {plan.limits.map((lim) => (
                      <li key={lim} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-700 mt-0.5" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTier(plan.tier)}
                  className={`mt-6 w-full rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-700 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? 'Active Plan' : `Switch to ${plan.tier}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Admin & Live Platform Analytics */}
      {subTab === 'admin' && (
        <div className="space-y-5">
          {datagsgError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Live /api/datagsg Analytics Unavailable</p>
                <p className="mt-0.5">{datagsgError}</p>
              </div>
              <button
                type="button"
                onClick={onRetryDatagsg}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Matched Collection 189 Records</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {datagsgLoading ? '—' : (datagsgData?.summary.totalMatched || 0).toLocaleString()}
              </div>
              <span className="text-xs text-emerald-700">
                Latest: {datagsgData?.summary.latestMonth || 'N/A'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Live Sample Median Price</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {datagsgLoading ? '—' : `S$${(datagsgData?.summary.medianPrice || 0).toLocaleString()}`}
              </div>
              <span className="text-xs text-slate-600 font-mono tabular-nums">
                S${(datagsgData?.summary.medianPsf || 0).toLocaleString()} psf median
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Viewing Appointments</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {viewings.length}
              </div>
              <span className="text-xs text-slate-600">
                {viewings.filter((v) => v.status === 'Scheduled').length} Scheduled
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Maintenance &amp; Workflows</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {maintenance.length} / {transactions.length}
              </div>
              <span className="text-xs text-amber-700">
                {maintenance.filter((m) => m.status !== 'Resolved').length} Open Tickets
              </span>
            </div>
          </div>

          {/* Live Town Breakdown Analytics */}
          {townBreakdown.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Town Breakdown (Computed from Live /api/datagsg Sample)
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {townBreakdown.map((t) => (
                  <div key={t.town} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="font-semibold text-slate-900 truncate">{t.town}</p>
                    <p className="mt-1 font-mono text-slate-700 tabular-nums">
                      Avg S${t.avgPrice.toLocaleString()} · S${t.avgPsf.toLocaleString()} psf
                    </p>
                    <p className="mt-0.5 text-slate-500 tabular-nums">{t.count} records in page</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory & Moderation Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Live HDB Records &amp; Listing Moderation ({listings.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Manage active listing visibility or export current live HDB records to CSV.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportInventoryCsv}
                disabled={listings.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>

            {datagsgLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-6 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                No live HDB records loaded in current query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Block &amp; Street</th>
                      <th className="px-4 py-3 font-semibold">Town / Month</th>
                      <th className="px-4 py-3 font-semibold">Flat Model</th>
                      <th className="px-4 py-3 font-semibold text-right">Resale Price (S$)</th>
                      <th className="px-4 py-3 font-semibold text-right">PSF</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                        <td className="px-4 py-3 text-slate-600">{item.district}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.flatModel || item.propertyType}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                          S${item.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-700">
                          S${(item.psf || Math.round(item.price / Math.max(item.sqft, 1))).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.status}
                            onChange={(e) =>
                              onUpdateListingStatus(item.id, e.target.value as PropertyListing['status'])
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                          >
                            <option value="Active">Active</option>
                            <option value="Under Offer">Under Offer</option>
                            <option value="Pending Review">Pending Review</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Technical Architecture, Schema & Production Roadmap */}
      {subTab === 'architecture' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Layers className="h-4 w-4 text-emerald-700" />
              Live Data &amp; Production Integration Matrix
            </h2>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="font-semibold text-emerald-900">Live Government Data (data.gov.sg Collection 189)</p>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  Property Search, Live HDB Resale Table, Unit Comparisons, PSF Analytics, and Admin Inventory are powered directly by `/api/datagsg` and `/api/health` retrieving real HDB resale transactions across all 5 historical datasets.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Interactive Client Workflows</p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  SG MSR/TDSR/BSD/ABSD Affordability Calculator, Viewing Appointment Scheduler, End-to-End Resale/Lease Tracker, Home Maintenance Queue, and HTML/CSV Report Exports.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="font-semibold text-amber-900">Future External Integrations</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Singpass MyInfo (NRIC/income verification), URA SPACE private condo transactions, Stripe/PayNow billing, and managed PostgreSQL persistence.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-emerald-700" />
              Production Stack, Serverless Routes &amp; Compliance
            </h2>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div>
                <p className="font-semibold text-slate-900">Stack &amp; API Endpoints</p>
                <p className="mt-0.5">
                  React + TypeScript + Tailwind CSS frontend; Vercel-compatible Serverless API routes (`/api/health.ts`, `/api/datagsg.ts`); optional Node Express runtime (`server.ts`) for `@google/genai` AI Assistant.
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-600">
                  GET /api/health · GET /api/datagsg (data.gov.sg Collection 189) · POST /api/ai/chat
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Environment Variables</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  DATA_GOV_SG_API_KEY (optional, public access supported) · GEMINI_API_KEY (server-side AI)
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Singapore PDPA &amp; CEA Guardrails</p>
                <p className="mt-0.5">
                  Explicit purpose-bound PDPA consent on booking/ticket forms, zero NRIC storage, server-only API keys, and clear disclaimers distinguishing official transaction records from formal appraisals, MAS financial advice, or CEA-licensed representation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
