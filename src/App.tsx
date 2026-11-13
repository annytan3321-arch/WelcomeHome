import React, { useEffect, useState } from 'react';
import {
  Bot,
  Building2,
  Calculator,
  CalendarCheck,
  CreditCard,
  GitCompare,
  Menu,
  Wrench,
  X,
} from 'lucide-react';
import {
  DEMO_PROPERTIES,
  INITIAL_MAINTENANCE,
  INITIAL_TRANSACTIONS,
  INITIAL_VIEWINGS,
  type MaintenanceRequest,
  type PropertyListing,
  type SubscriptionTier,
  type TransactionRecord,
  type ViewingAppointment,
} from './data/properties.ts';
import { MarketplaceView } from './components/MarketplaceView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { PriceComparisonView } from './components/PriceComparisonView.tsx';
import { AffordabilityCalculatorView } from './components/AffordabilityCalculatorView.tsx';
import { ViewingsTransactionsView } from './components/ViewingsTransactionsView.tsx';
import { MaintenanceServicesView } from './components/MaintenanceServicesView.tsx';
import { BusinessAndArchitectureView } from './components/BusinessAndArchitectureView.tsx';

type NavTab =
  | 'marketplace'
  | 'assistant'
  | 'compare'
  | 'calculator'
  | 'transactions'
  | 'maintenance'
  | 'business';

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'marketplace', label: 'Property Search', icon: Building2 },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'compare', label: 'Price Explorer', icon: GitCompare },
  { id: 'calculator', label: 'Affordability', icon: Calculator },
  { id: 'transactions', label: 'Viewings & Tracker', icon: CalendarCheck },
  { id: 'maintenance', label: 'Home Maintenance', icon: Wrench },
  { id: 'business', label: 'Plans & Admin', icon: CreditCard },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('marketplace');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [compareIds, setCompareIds] = useState<string[]>(['sg-prop-01', 'sg-prop-02', 'sg-prop-06']);
  const [aiPropertyId, setAiPropertyId] = useState<string>('sg-prop-01');
  const [bookingPropertyId, setBookingPropertyId] = useState<string>('sg-prop-01');
  const [activeTier, setActiveTier] = useState<SubscriptionTier>('Freemium');

  useEffect(() => {
    async function fetchJsonSafe(url: string) {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    async function loadInitialData() {
      try {
        const [lData, vData, mData, tData] = await Promise.all([
          fetchJsonSafe('/api/listings'),
          fetchJsonSafe('/api/viewings'),
          fetchJsonSafe('/api/maintenance'),
          fetchJsonSafe('/api/transactions'),
        ]);
        setListings(lData?.listings || DEMO_PROPERTIES);
        setViewings(vData?.viewings || INITIAL_VIEWINGS);
        setMaintenance(mData?.requests || INITIAL_MAINTENANCE);
        setTransactions(tData?.transactions || INITIAL_TRANSACTIONS);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleSetCompareSlot = (slotIndex: number, propertyId: string) => {
    setCompareIds((prev) => {
      const next = [...prev];
      next[slotIndex] = propertyId;
      return next;
    });
  };

  const handleCreateListing = async (payload: Partial<PropertyListing>) => {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.listing) {
      setListings((prev) => [data.listing, ...prev]);
    }
  };

  const handleUpdateListingStatus = async (id: string, status: PropertyListing['status']) => {
    const res = await fetch(`/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.listing) {
      setListings((prev) => prev.map((item) => (item.id === id ? data.listing : item)));
    }
  };

  const handleCreateViewing = async (
    payload: Omit<ViewingAppointment, 'id' | 'status' | 'propertyTitle'>
  ) => {
    const res = await fetch('/api/viewings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to schedule viewing.');
    setViewings((prev) => [data.viewing, ...prev]);
  };

  const handleUpdateViewingStatus = async (id: string, status: ViewingAppointment['status']) => {
    const res = await fetch(`/api/viewings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.viewing) {
      setViewings((prev) => prev.map((v) => (v.id === id ? data.viewing : v)));
    }
  };

  const handleCreateMaintenance = async (
    payload: Omit<MaintenanceRequest, 'id' | 'status' | 'estimatedCostSgd' | 'createdAt'>
  ) => {
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit request.');
    setMaintenance((prev) => [data.request, ...prev]);
  };

  const handleUpdateMaintenanceStatus = async (
    id: string,
    status: MaintenanceRequest['status']
  ) => {
    const res = await fetch(`/api/maintenance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.request) {
      setMaintenance((prev) => prev.map((m) => (m.id === id ? data.request : m)));
    }
  };

  const handleUpdateTransactionStep = async (
    txId: string,
    stepId: string,
    status: 'Completed' | 'In Progress' | 'Pending'
  ) => {
    const res = await fetch(`/api/transactions/${txId}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data.transaction) {
      setTransactions((prev) => prev.map((t) => (t.id === txId ? data.transaction : t)));
    }
  };

  const currentNavLabel = NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Workspace';

  const navigateTo = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center px-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => navigateTo('marketplace')}
            className="text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            WelcomeHome SG
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs space-y-1.5">
          <p className="font-semibold text-slate-900 truncate">Demo Account · Anny Tan</p>
          <p className="text-slate-500">
            Active Tier: <span className="font-medium text-emerald-700">{activeTier}</span>
          </p>
          <button
            type="button"
            onClick={() => navigateTo('business')}
            className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-emerald-700"
          >
            Manage Plan & Admin
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (3-zone contract, single-line controls, <= 15% mobile height) */}
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="font-medium text-slate-500 hidden sm:inline">Workspace</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('compare')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 tabular-nums"
            >
              Compare ({compareIds.length}/3)
            </button>
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Bot className="h-3.5 w-3.5" />
              Ask AI Assistant
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 max-w-full flex-col bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-base font-semibold text-slate-900">WelcomeHome SG</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-4 space-y-1 flex-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Active Module Viewport */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {activeTab === 'marketplace' && (
            <MarketplaceView
              listings={listings}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onBookViewing={(prop) => {
                setBookingPropertyId(prop.id);
                navigateTo('transactions');
              }}
              onAskAiAboutProperty={(prop) => {
                setAiPropertyId(prop.id);
                navigateTo('assistant');
              }}
              onCreateListing={handleCreateListing}
              isLoading={loading}
            />
          )}

          {activeTab === 'assistant' && (
            <AiAssistantView listings={listings} initialPropertyId={aiPropertyId} />
          )}

          {activeTab === 'compare' && (
            <PriceComparisonView
              listings={listings}
              compareIds={compareIds}
              onSetCompareSlot={handleSetCompareSlot}
            />
          )}

          {activeTab === 'calculator' && <AffordabilityCalculatorView />}

          {activeTab === 'transactions' && (
            <ViewingsTransactionsView
              listings={listings}
              viewings={viewings}
              transactions={transactions}
              preselectedPropertyId={bookingPropertyId}
              onCreateViewing={handleCreateViewing}
              onUpdateViewingStatus={handleUpdateViewingStatus}
              onUpdateTransactionStep={handleUpdateTransactionStep}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceServicesView
              requests={maintenance}
              onCreateRequest={handleCreateMaintenance}
              onUpdateStatus={handleUpdateMaintenanceStatus}
            />
          )}

          {activeTab === 'business' && (
            <BusinessAndArchitectureView
              activeTier={activeTier}
              onSelectTier={setActiveTier}
              listings={listings}
              viewings={viewings}
              maintenance={maintenance}
              transactions={transactions}
              onUpdateListingStatus={handleUpdateListingStatus}
            />
          )}
        </main>

        {/* Quiet Compliance Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              WelcomeHome SG MVP · Sample Singapore listings & historical benchmarks are simulated demo data.
            </p>
            <p>
              AI insights are not official valuations, MAS financial advice, or regulated CEA agency services.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
