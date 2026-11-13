import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, FileText, ShieldCheck } from 'lucide-react';
import type {
  PropertyListing,
  TargetProfile,
  TransactionRecord,
  ViewingAppointment,
} from '../data/properties.ts';

interface ViewingsTransactionsViewProps {
  listings: PropertyListing[];
  viewings: ViewingAppointment[];
  transactions: TransactionRecord[];
  preselectedPropertyId?: string;
  onCreateViewing: (payload: Omit<ViewingAppointment, 'id' | 'status' | 'propertyTitle'>) => Promise<void>;
  onUpdateViewingStatus: (id: string, status: ViewingAppointment['status']) => Promise<void>;
  onUpdateTransactionStep: (
    txId: string,
    stepId: string,
    status: 'Completed' | 'In Progress' | 'Pending'
  ) => Promise<void>;
}

export const ViewingsTransactionsView: React.FC<ViewingsTransactionsViewProps> = ({
  listings,
  viewings,
  transactions,
  preselectedPropertyId,
  onCreateViewing,
  onUpdateViewingStatus,
  onUpdateTransactionStep,
}) => {
  const [propertyId, setPropertyId] = useState(preselectedPropertyId || listings[0]?.id || '');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorProfile, setVisitorProfile] = useState<TargetProfile>('Families');
  const [viewingFormat, setViewingFormat] = useState<'In-Person' | 'AI-Assisted Virtual'>('In-Person');
  const [date, setDate] = useState('2026-11-20');
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [notes, setNotes] = useState('');
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [activeTxId, setActiveTxId] = useState<string>(transactions[0]?.id || '');

  useEffect(() => {
    if (preselectedPropertyId) {
      setPropertyId(preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  useEffect(() => {
    if (!activeTxId && transactions[0]?.id) {
      setActiveTxId(transactions[0].id);
    }
  }, [transactions, activeTxId]);

  const activeTx = transactions.find((t) => t.id === activeTxId) || transactions[0];
  const completedSteps = activeTx ? activeTx.steps.filter((s) => s.status === 'Completed').length : 0;
  const totalSteps = activeTx ? activeTx.steps.length : 1;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!pdpaConsent) {
      setFormError('Please confirm Singapore PDPA consent before submitting your booking.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateViewing({
        propertyId,
        visitorName,
        visitorEmail,
        visitorProfile,
        viewingFormat,
        date,
        timeSlot,
        pdpaConsent: true,
        notes,
      });
      setVisitorName('');
      setVisitorEmail('');
      setNotes('');
      setPdpaConsent(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Unable to book viewing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-emerald-700">Automated Scheduling & Milestone Guidance · Demo Workflow</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Viewing Scheduler & Transaction Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Book physical or AI-assisted virtual viewings and track Singapore HDB resale or private tenancy milestones step by step.
        </p>
      </div>

      {/* Section 1: Viewing Appointment Scheduler */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleBook}
          className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Calendar className="h-4 w-4 text-emerald-700" />
            Book Viewing Appointment
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Select Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {listings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.listingMode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Your Name</label>
                <input
                  required
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Email</label>
                <input
                  required
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="name@example.sg"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Viewing Format</label>
                <select
                  value={viewingFormat}
                  onChange={(e) => setViewingFormat(e.target.value as 'In-Person' | 'AI-Assisted Virtual')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="In-Person">In-Person Visit</option>
                  <option value="AI-Assisted Virtual">AI-Assisted Virtual Tour</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Visitor Profile</label>
                <select
                  value={visitorProfile}
                  onChange={(e) => setVisitorProfile(e.target.value as TargetProfile)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="Families">Family</option>
                  <option value="Students">Undergrad Student</option>
                  <option value="Expats">Expatriate</option>
                  <option value="Investors">Investor</option>
                  <option value="Elderly-Friendly">Elderly / Multi-Gen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">Date</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono"
                >
                  <option>10:30 AM</option>
                  <option>01:00 PM</option>
                  <option>04:30 PM</option>
                  <option>07:00 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Questions / Accessibility Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Check sunlight, wheelchair access, or lease start date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={pdpaConsent}
                onChange={(e) => setPdpaConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <span>
                <strong>PDPA Consent:</strong> I consent to WelcomeHome SG storing my contact details solely to coordinate this viewing demo (do not enter NRIC/FIN).
              </span>
            </label>

            {formError && <p className="text-xs text-red-700">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? 'Scheduling...' : 'Confirm Viewing Request'}
            </button>
          </div>
        </form>

        {/* Scheduled Viewings List */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Scheduled Viewings ({viewings.length})</h2>
            <span className="text-xs text-slate-500">Automated confirmation queue</span>
          </div>

          <div className="divide-y divide-slate-100">
            {viewings.map((vw) => (
              <div key={vw.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-800 tabular-nums">
                      {vw.date} · {vw.timeSlot}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{vw.viewingFormat}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-medium ${
                        vw.status === 'Completed'
                          ? 'text-emerald-700'
                          : vw.status === 'Cancelled'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {vw.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{vw.propertyTitle}</p>
                  <p className="text-xs text-slate-600">
                    {vw.visitorName} ({vw.visitorProfile}) · {vw.visitorEmail}
                  </p>
                  {vw.notes && <p className="text-xs text-slate-500">Note: {vw.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={vw.status}
                    onChange={(e) =>
                      onUpdateViewingStatus(vw.id, e.target.value as ViewingAppointment['status'])
                    }
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Personalised End-to-End Transaction Tracker */}
      {activeTx && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-medium text-emerald-700">Personalised End-to-End Transaction Support</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{activeTx.propertyTitle}</h2>
              <p className="text-xs text-slate-500">
                {activeTx.transactionType} · {activeTx.counterpartyLabel} · Target Completion:{' '}
                <span className="font-mono tabular-nums">{activeTx.targetCompletionDate}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {transactions.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setActiveTxId(tx.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTx.id === tx.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tx.transactionType}
                  </button>
                ))}
              </div>
              <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                {completedSteps}/{totalSteps} Steps ({progressPct}%)
              </span>
            </div>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-700 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="divide-y divide-slate-100">
            {activeTx.steps.map((step) => (
              <div key={step.id} className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {step.status === 'Completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    ) : (
                      <Clock className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        0{step.order}. {step.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        · Owner: {step.owner} · Target {step.dueDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{step.subtitle}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>Required Docs: {step.documents.join(' · ')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-8 md:pl-0">
                  <select
                    value={step.status}
                    onChange={(e) =>
                      onUpdateTransactionStep(
                        activeTx.id,
                        step.id,
                        e.target.value as 'Completed' | 'In Progress' | 'Pending'
                      )
                    }
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" />
            <span>
              <strong>Regulatory Compliance Note:</strong> This tracker supports self-managed owners, buyers, and tenants with checklists. Where regulated Council for Estate Agencies (CEA) representation or legal conveyancing is required under Singapore law, users must engage licensed professionals.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
