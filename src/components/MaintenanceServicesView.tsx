import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import type { MaintenanceRequest } from '../data/properties.ts';

interface MaintenanceServicesViewProps {
  requests: MaintenanceRequest[];
  onCreateRequest: (
    payload: Omit<MaintenanceRequest, 'id' | 'status' | 'estimatedCostSgd' | 'createdAt'>
  ) => Promise<void>;
  onUpdateStatus: (id: string, status: MaintenanceRequest['status']) => Promise<void>;
}

const VALUE_ADDED_PARTNERS = [
  {
    name: 'Partner Aircon & HVAC Care',
    category: 'Home Maintenance',
    rate: 'From S$90 / 3-4 fan coils',
    note: 'Simulated vendor marketplace integration for landlords & tenants.',
  },
  {
    name: 'Partner Conveyancing & Legal Desk',
    category: 'Transaction Support',
    rate: 'Fixed-fee conveyancing quote',
    note: 'External licensed Singapore law firm referral (requires formal engagement).',
  },
  {
    name: 'ElderCare Companion & Housekeeping',
    category: 'Value-Added Living',
    rate: 'Weekly / Bi-weekly packages',
    note: 'Supports elderly homeowners and busy expat/student co-living households.',
  },
];

export const MaintenanceServicesView: React.FC<MaintenanceServicesViewProps> = ({
  requests,
  onCreateRequest,
  onUpdateStatus,
}) => {
  const [unitAddress, setUnitAddress] = useState('Blk 55 Tiong Bahru Road, #08-14');
  const [category, setCategory] = useState<MaintenanceRequest['category']>('Aircon Servicing');
  const [urgency, setUrgency] = useState<MaintenanceRequest['urgency']>('Routine');
  const [preferredDate, setPreferredDate] = useState('2026-11-22');
  const [description, setDescription] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pdpaConsent) {
      setError('Please accept PDPA consent so maintenance details can be dispatched.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateRequest({
        unitAddress,
        category,
        urgency,
        preferredDate,
        description,
        pdpaConsent: true,
      });
      setDescription('');
      setPdpaConsent(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-emerald-700">1-Stop Home Maintenance & Value-Added Services · Demo Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Rental Maintenance & Home Services
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit aircon servicing, plumbing, electrical, move-out housekeeping, or elderly grab-bar maintenance tickets and track vendor progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Submit Ticket Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-emerald-700" />
            Submit Maintenance Request
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700">Property / Unit Address</label>
            <input
              required
              type="text"
              value={unitAddress}
              onChange={(e) => setUnitAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Service Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaintenanceRequest['category'])}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="Aircon Servicing">Aircon Servicing</option>
                <option value="Plumbing & Leak">Plumbing & Leak</option>
                <option value="Electrical">Electrical</option>
                <option value="Housekeeping & Move-Out">Housekeeping & Move-Out</option>
                <option value="Elderly Safety Grab-Bar">Elderly Safety Grab-Bar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as MaintenanceRequest['urgency'])}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <option value="Routine">Routine</option>
                <option value="Priority">Priority</option>
                <option value="Urgent">Urgent (24h)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Preferred Service Date</label>
            <input
              required
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Issue Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the unit issue, room location, or servicing package needed..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={pdpaConsent}
              onChange={(e) => setPdpaConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-700"
            />
            <span>
              <strong>PDPA Consent:</strong> I consent to sharing unit address and job details for simulated vendor dispatch.
            </span>
          </label>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {submitting ? 'Submitting Ticket...' : 'Submit Maintenance Ticket'}
          </button>
        </form>

        {/* Active Requests Table */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Active Maintenance Queue ({requests.length})</h2>
              <span className="text-xs text-slate-500">Live MVP state</span>
            </div>

            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-mono text-slate-700 tabular-nums">{req.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-800">{req.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.urgency}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">Target {req.preferredDate}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{req.unitAddress}</p>
                    <p className="text-xs text-slate-600">{req.description}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Est. Partner Rate: {req.estimatedCostSgd}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <select
                      value={req.status}
                      onChange={(e) =>
                        onUpdateStatus(req.id, e.target.value as MaintenanceRequest['status'])
                      }
                      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Vendor Assigned">Vendor Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partner Referral Ecosystem */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Value-Added Referral & Service Partners (Simulated)</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VALUE_ADDED_PARTNERS.map((partner) => (
                <div key={partner.name} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1">
                  <p className="text-emerald-700 font-medium">{partner.category}</p>
                  <p className="font-semibold text-slate-900">{partner.name}</p>
                  <p className="font-mono text-slate-700 tabular-nums">{partner.rate}</p>
                  <p className="text-slate-500 leading-relaxed">{partner.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
