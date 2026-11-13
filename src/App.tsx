import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  INITIAL_MAINTENANCE,
  INITIAL_TRANSACTIONS,
  INITIAL_VIEWINGS,
  type MaintenanceRequest,
  type PropertyListing,
  type SubscriptionTier,
  type TransactionRecord,
  type ViewingAppointment,
} from './data/properties.ts';
import {
  fetchDatagsg,
  mapHdbRecordToListing,
  type DatagsgQuery,
  type LiveDatagsgResponse,
} from './utils/datagsgClient.ts';
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

  const [datagsgQuery, setDatagsgQuery] = useState<DatagsgQuery>({
    datasetId: '',
    town: 'ALL',
    flatType: 'ALL',
    q: '',
    limit: 18,
    offset: 0,
  });
  const [datagsgData, setDatagsgData] = useState<LiveDatagsgResponse | null>(null);
  const [datagsgLoading, setDatagsgLoading] = useState(true);
  const [datagsgError, setDatagsgError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    ok: boolean;
    apiKeyConfigured: boolean;
  } | null>(null);

  const [customListings, setCustomListings] = useState<PropertyListing[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, PropertyListing['status']>>({});

  const [viewings, setViewings] = useState<ViewingAppointment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [aiPropertyId, setAiPropertyId] = useState<string>('');
  const [bookingPropertyId, setBookingPropertyId] = useState<string>('');
  const [activeTier, setActiveTier] = useState<SubscriptionTier>('Freemium');

  const loadDatagsg = useCallback(async (query: DatagsgQuery) => {
    setDatagsgLoading(true);
    setDatagsgError(null);
    try {
      const response = await fetchDatagsg(query);
      setDatagsgData(response);
      if (!query.datasetId && response.activeDataset?.datasetId) {
        setDatagsgQuery((prev) =>
          prev.datasetId ? prev : { ...prev, datasetId: response.activeDataset.datasetId }
        );
      }
    } catch (err: unknown) {
      setDatagsgError(
        err instanceof Error ? err.message : 'Unable to fetch live HDB records from /api/datagsg.'
      );
    } finally {
      setDatagsgLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDatagsg(datagsgQuery);
  }, [datagsgQuery, loadDatagsg]);

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

    async function loadWorkspaceState() {
      const [hData, vData, mData, tData] = await Promise.all([
        fetchJsonSafe('/api/health'),
        fetchJsonSafe('/api/viewings'),
        fetchJsonSafe('/api/maintenance'),
        fetchJsonSafe('/api/transactions'),
      ]);

      if (hData?.ok) {
        setHealthStatus({
          ok: true,
          apiKeyConfigured: Boolean(hData.environment?.dataGovSgApiKeyConfigured),
        });
      }
      setViewings(vData?.viewings || INITIAL_VIEWINGS);
      setMaintenance(mData?.requests || INITIAL_MAINTENANCE);
      setTransactions(tData?.transactions || INITIAL_TRANSACTIONS);
    }

    void loadWorkspaceState();
  }, []);

  const listings = useMemo(() => {
    const medianPsf = datagsgData?.summary.medianPsf || 0;
    const liveListings = (datagsgData?.records || []).map((rec) =>
      mapHdbRecordToListing(rec, medianPsf)
    );
    return [...customListings, ...liveListings].map((item) =>
      statusOverrides[item.id] ? { ...item, status: statusOverrides[item.id] } : item
    );
  }, [datagsgData, customListings, statusOverrides]);

  // Seed initial compare / AI / viewing selection strictly from live /api/datagsg records
  useEffect(() => {
    if (listings.length === 0) return;
    setCompareIds((prev) => {
      const valid = prev.filter((id) => listings.some((l) => l.id === id));
      if (valid.length > 0) return valid;
      return listings.slice(0, 3).map((l) => l.id);
    });
    setAiPropertyId((prev) => (prev && listings.some((l) => l.id === prev) ? prev : listings[0].id));
    setBookingPropertyId((prev) =>
      prev && listings.some((l) => l.id === prev) ? prev : listings[0].id
    );
  }, [listings]);

  const handleUpdateDatagsgQuery = useCallback((patch: Partial<DatagsgQuery>) => {
    setDatagsgQuery((prev) => ({ ...prev, ...patch }));
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
    const price = Number(payload.price) || 500000;
    const sqft = Number(payload.sqft) || 900;
    const psf = Math.round(price / Math.max(sqft, 1));
    const localId = `owner-${Date.now().toString().slice(-6)}`;

    const created: PropertyListing = {
      id: localId,
      title: String(payload.title || 'Owner HDB Listing').trim(),
      address: String(payload.address || 'Singapore').trim(),
      district: payload.district || 'QUEENSTOWN · Owner Entry',
      region: payload.region || 'RCR',
      propertyType: payload.propertyType || 'HDB',
      listingMode: payload.listingMode || 'Buy',
      targetProfiles: ['Families'],
      price,
      sqft,
      sqm: Math.round(sqft / 10.7639),
      psf,
      town: payload.district || 'OWNER ENTRY',
      flatModel: 'Owner Submitted',
      storeyRange: 'User Specified',
      registeredMonth: new Date().toISOString().slice(0, 7),
      leaseCommenceDate: 'N/A',
      remainingLease: 'User Specified',
      sourceType: 'owner',
      bedrooms: Number(payload.bedrooms) || 3,
      bathrooms: 2,
      tenure: 'Owner-submitted listing',
      remainingLeaseYears: 80,
      nearestMrt: payload.nearestMrt || 'Singapore',
      mrtWalkMins: 0,
      nearbySchools: [],
      nearbyAmenities: [],
      districtMedianPsf: datagsgData?.summary.medianPsf || psf,
      estimatedGrossYieldPct: 0,
      historicalPsfTrend: [],
      virtualTourRooms: [
        {
          id: `owner-room-${localId}`,
          room: 'Owner Listing Summary',
          dimensions: `${sqft} sqft`,
          orientation: payload.district || 'Singapore',
          highlights: payload.description || 'Owner-submitted unit specification.',
          aiInsight: 'Added in current browser session.',
        },
      ],
      ownerVerifiedDemo: true,
      status: 'Active',
      imageKey: payload.imageKey || 'tiongbahru',
      description: payload.description || 'Owner-submitted property listing.',
      isDemoData: false,
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.listing) {
          setCustomListings((prev) => [{ ...created, id: data.listing.id }, ...prev]);
          return;
        }
      }
    } catch {
      // Fallback to local session state when running on static Vercel deployment
    }
    setCustomListings((prev) => [created, ...prev]);
  };

  const handleUpdateListingStatus = async (id: string, status: PropertyListing['status']) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    try {
      await fetch(`/api/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Non-blocking on static Vercel deployment
    }
  };

  const handleCreateViewing = async (
    payload: Omit<ViewingAppointment, 'id' | 'status' | 'propertyTitle'>
  ) => {
    const matched = listings.find((l) => l.id === payload.propertyId);
    const localViewing: ViewingAppointment = {
      ...payload,
      id: `vw-${Date.now().toString().slice(-5)}`,
      propertyTitle: matched?.title || 'Selected HDB Unit',
      status: 'Scheduled',
    };
    try {
      const res = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setViewings((prev) => [data.viewing, ...prev]);
        return;
      }
    } catch {
      // Local fallback on static Vercel deployment
    }
    setViewings((prev) => [localViewing, ...prev]);
  };

  const handleUpdateViewingStatus = async (id: string, status: ViewingAppointment['status']) => {
    setViewings((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    try {
      await fetch(`/api/viewings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleCreateMaintenance = async (
    payload: Omit<MaintenanceRequest, 'id' | 'status' | 'estimatedCostSgd' | 'createdAt'>
  ) => {
    const localRequest: MaintenanceRequest = {
      ...payload,
      id: `mt-${Date.now().toString().slice(-5)}`,
      estimatedCostSgd: 'Quote pending vendor review',
      status: 'Submitted',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setMaintenance((prev) => [data.request, ...prev]);
        return;
      }
    } catch {
      // Local fallback
    }
    setMaintenance((prev) => [localRequest, ...prev]);
  };

  const handleUpdateMaintenanceStatus = async (
    id: string,
    status: MaintenanceRequest['status']
  ) => {
    setMaintenance((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    try {
      await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleUpdateTransactionStep = async (
    txId: string,
    stepId: string,
    status: 'Completed' | 'In Progress' | 'Pending'
  ) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              steps: t.steps.map((s) => (s.id === stepId ? { ...s, status } : s)),
            }
          : t
      )
    );
    try {
      await fetch(`/api/transactions/${txId}/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Non-blocking
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
          <p className="font-semibold text-slate-900 truncate">WelcomeHome SG Workspace</p>
          <p className="text-slate-500">
            Active Tier: <span className="font-medium text-emerald-700">{activeTier}</span>
          </p>
          <button
            type="button"
            onClick={() => navigateTo('business')}
            className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-emerald-700"
          >
            Manage Plan &amp; Admin
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
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
              datagsgData={datagsgData}
              query={datagsgQuery}
              compareIds={compareIds}
              isLoading={datagsgLoading}
              error={datagsgError}
              onUpdateQuery={handleUpdateDatagsgQuery}
              onRetry={() => void loadDatagsg(datagsgQuery)}
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
            />
          )}

          {activeTab === 'assistant' && (
            <AiAssistantView listings={listings} initialPropertyId={aiPropertyId} />
          )}

          {activeTab === 'compare' && (
            <PriceComparisonView
              listings={listings}
              datagsgData={datagsgData}
              query={datagsgQuery}
              loading={datagsgLoading}
              error={datagsgError}
              healthStatus={healthStatus}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onSetCompareSlot={handleSetCompareSlot}
              onUpdateQuery={handleUpdateDatagsgQuery}
              onRetry={() => void loadDatagsg(datagsgQuery)}
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
              datagsgData={datagsgData}
              datagsgLoading={datagsgLoading}
              datagsgError={datagsgError}
              onRetryDatagsg={() => void loadDatagsg(datagsgQuery)}
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
              WelcomeHome SG · HDB resale records sourced live from Housing &amp; Development Board via data.gov.sg Collection 189.
            </p>
            <p>
              Indicative transaction data is not an official valuation, MAS financial advice, or regulated CEA agency service.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
