import React, { useState } from 'react';
import { Check, Download, Layers, Shield } from 'lucide-react';
import type {
  MaintenanceRequest,
  PropertyListing,
  SubscriptionTier,
  TransactionRecord,
  ViewingAppointment,
} from '../data/properties.ts';

interface BusinessAndArchitectureViewProps {
  activeTier: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  listings: PropertyListing[];
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
      'Unlimited property search & demo filters',
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
      'Verified tenant/co-living profile badge (simulated)',
      'Priority viewing slot alerts',
    ],
  },
  {
    tier: 'Silver',
    audience: 'For active landlords & direct sellers',
    price: 'S$49 / month',
    limits: [
      'Up to 3 direct property listings with virtual tour cards',
      'Unlimited AI Assistant + virtual viewing briefs',
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
      'Quarterly district PSF & gross yield benchmark exports',
      'Dedicated referral routing to mortgage & legal partners',
      'Multi-user household or corporate team access',
    ],
  },
];

export const BusinessAndArchitectureView: React.FC<BusinessAndArchitectureViewProps> = ({
  activeTier,
  onSelectTier,
  listings,
  viewings,
  maintenance,
  transactions,
  onUpdateListingStatus,
}) => {
  const [subTab, setSubTab] = useState<'plans' | 'admin' | 'architecture'>('plans');

  const handleExportInventoryCsv = () => {
    const header = 'ID,Title,District,Mode,Type,PriceSGD,Sqft,DistrictMedianPSF,Status\n';
    const rows = listings
      .map(
        (l) =>
          `"${l.id}","${l.title.replace(/"/g, '""')}","${l.district}","${l.listingMode}","${l.propertyType}",${l.price},${l.sqft},${l.districtMedianPsf},"${l.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WelcomeHome-SG-Demo-Listings.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">SaaS Monetisation, Operations & Engineering Blueprint</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Plans, Admin Console & System Architecture
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Switch subscription tiers, moderate demo listings in the admin console, and inspect the production architecture and regulatory boundaries.
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
            Admin & Analytics
          </button>
          <button
            type="button"
            onClick={() => setSubTab('architecture')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              subTab === 'architecture' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture & Guardrails
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
                  {isSelected ? 'Active Demo Plan' : `Switch to ${plan.tier}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Admin & Platform Analytics */}
      {subTab === 'admin' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Demo Listings</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {listings.length}
              </div>
              <span className="text-xs text-emerald-700">
                {listings.filter((l) => l.status === 'Active').length} Active
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
              <span className="text-xs text-slate-500">Maintenance Tickets</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {maintenance.length}
              </div>
              <span className="text-xs text-amber-700">
                {maintenance.filter((m) => m.status !== 'Resolved').length} Open
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Active Workflows</span>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {transactions.length}
              </div>
              <span className="text-xs text-slate-600">Resale & Lease</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Listing Moderation & Inventory</h2>
                <p className="text-xs text-slate-500">Update demo listing status or export CSV inventory.</p>
              </div>
              <button
                type="button"
                onClick={handleExportInventoryCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Property</th>
                    <th className="px-4 py-3 font-semibold">District</th>
                    <th className="px-4 py-3 font-semibold">Type / Mode</th>
                    <th className="px-4 py-3 font-semibold text-right">Asking (S$)</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                      <td className="px-4 py-3 text-slate-600">{item.district}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.propertyType} · {item.listingMode}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                        S${item.price.toLocaleString()}
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
          </div>
        </div>
      )}

      {/* Tab 3: Technical Architecture, Schema & Production Roadmap */}
      {subTab === 'architecture' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Layers className="h-4 w-4 text-emerald-700" />
              MVP vs Production Functionality Matrix
            </h2>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="font-semibold text-emerald-900">Functional in This MVP</p>
                <p className="mt-1 text-emerald-800 leading-relaxed">
                  Live Vercel-compatible serverless connection to data.gov.sg Collection 189 (`api/datagsg.ts` &amp; `api/health.ts`) for registered HDB resale flat prices across all historical datasets, multi-filter Singapore marketplace, direct owner listing creation, server-side Gemini AI Assistant &amp; virtual tour notes, 3-way PSF price comparison + HTML/CSV export, SG MSR/TDSR/BSD/ABSD calculator, viewing scheduler, maintenance ticket queue, and transaction tracker.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Simulated Demo Data</p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  Direct property listing cards (D01–D19 samples), private condo/co-living historical PSF curves, identity verification labels, vendor rate cards, and in-memory server persistence.
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="font-semibold text-amber-900">Requires External Integration for Production</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Singpass MyInfo (NRIC/income verification), URA SPACE private condo transaction API, Stripe/PayNow billing, and PostgreSQL + Firebase Auth / OIDC.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Shield className="h-4 w-4 text-emerald-700" />
              Recommended Production Stack, Schema &amp; Compliance
            </h2>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div>
                <p className="font-semibold text-slate-900">Stack &amp; API Endpoints</p>
                <p className="mt-0.5">
                  React + TypeScript + Tailwind CSS frontend; Vercel-compatible Serverless API routes (`/api/health.ts`, `/api/datagsg.ts`) + Express server with `@google/genai` (`gemini-4-hydrogen`) proxy; PostgreSQL (Cloud SQL / Drizzle ORM) for relational listings, leases, and audit logs.
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-600">
                  GET /api/health · GET /api/datagsg (data.gov.sg Collection 189) · GET/POST /api/listings · GET/POST /api/viewings · GET/POST /api/maintenance · PATCH /api/transactions/:id/steps/:stepId · POST /api/ai/chat
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Core Relational Schema</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600">
                  users(id, email, role, tier, singpass_sub) · properties(id, owner_id, district, type, mode, price_sgd, sqft, tenure, status) · viewings(id, property_id, visitor_id, slot, format, pdpa_consent) · maintenance_tickets(id, property_id, category, urgency, status) · transaction_workflows(id, property_id, steps_json)
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Singapore PDPA & CEA Guardrails</p>
                <p className="mt-0.5">
                  Explicit purpose-bound PDPA consent on every booking/ticket, zero NRIC storage in demo flows, server-only AI API keys, and clear disclaimers distinguishing self-service guidance from official valuations, MAS financial advice, and CEA-licensed agency representation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
