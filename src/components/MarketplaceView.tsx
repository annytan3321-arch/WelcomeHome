import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Database,
  Eye,
  GitCompare,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { ListingMode, PropertyListing, PropertyType } from '../data/properties.ts';
import {
  FLAT_TYPES,
  HDB_TOWNS,
  type DatagsgQuery,
  type LiveDatagsgResponse,
} from '../utils/datagsgClient.ts';
import { PropertyImage } from './PropertyImage.tsx';

interface MarketplaceViewProps {
  listings: PropertyListing[];
  datagsgData: LiveDatagsgResponse | null;
  query: DatagsgQuery;
  compareIds: string[];
  isLoading: boolean;
  error: string | null;
  onUpdateQuery: (patch: Partial<DatagsgQuery>) => void;
  onRetry: () => void;
  onToggleCompare: (id: string) => void;
  onBookViewing: (property: PropertyListing) => void;
  onAskAiAboutProperty: (property: PropertyListing) => void;
  onCreateListing: (payload: Partial<PropertyListing>) => Promise<void>;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  datagsgData,
  query,
  compareIds,
  isLoading,
  error,
  onUpdateQuery,
  onRetry,
  onToggleCompare,
  onBookViewing,
  onAskAiAboutProperty,
  onCreateListing,
}) => {
  const [searchInput, setSearchInput] = useState(query.q);

  useEffect(() => {
    setSearchInput(query.q);
  }, [query.q]);
  const [sortBy, setSortBy] = useState<'latest' | 'price-asc' | 'price-desc' | 'psf-asc' | 'sqft-desc'>('latest');
  const [activeTourProperty, setActiveTourProperty] = useState<PropertyListing | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [virtualFocus, setVirtualFocus] = useState('Resale Price vs Sample Median & Lease');
  const [aiTourNote, setAiTourNote] = useState<string | null>(null);
  const [aiTourLoading, setAiTourLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDistrict, setNewDistrict] = useState('QUEENSTOWN');
  const [newMode, setNewMode] = useState<ListingMode>('Buy');
  const [newType, setNewType] = useState<PropertyType>('HDB');
  const [newPrice, setNewPrice] = useState('680000');
  const [newSqft, setNewSqft] = useState('990');
  const [newBeds, setNewBeds] = useState('3');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sortedListings = useMemo(() => {
    if (sortBy === 'price-asc') return [...listings].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...listings].sort((a, b) => b.price - a.price);
    if (sortBy === 'psf-asc') {
      return [...listings].sort(
        (a, b) => a.price / Math.max(a.sqft, 1) - b.price / Math.max(b.sqft, 1)
      );
    }
    if (sortBy === 'sqft-desc') return [...listings].sort((a, b) => b.sqft - a.sqft);
    return listings;
  }, [listings, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateQuery({ q: searchInput.trim(), offset: 0 });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    onUpdateQuery({ town: 'ALL', flatType: 'ALL', q: '', offset: 0 });
  };

  const handleOpenTour = (prop: PropertyListing) => {
    setActiveTourProperty(prop);
    setSelectedRoomIdx(0);
    setAiTourNote(null);
  };

  const handleGenerateVirtualInsight = async () => {
    if (!activeTourProperty) return;
    setAiTourLoading(true);
    setAiTourNote(null);
    const psf = activeTourProperty.psf || Math.round(activeTourProperty.price / Math.max(activeTourProperty.sqft, 1));
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Provide a concise 4-bullet inspection checklist for this registered HDB resale flat focused on "${virtualFocus}": ${activeTourProperty.title}, ${activeTourProperty.town || activeTourProperty.district}, Flat Model ${activeTourProperty.flatModel || 'HDB'}, Storey ${activeTourProperty.storeyRange || 'N/A'}, ${activeTourProperty.sqft} sqft, S$${activeTourProperty.price.toLocaleString()} (S$${psf} psf vs page median S$${activeTourProperty.districtMedianPsf} psf), ${activeTourProperty.tenure}.`,
          userRole: 'Home Buyer / Researcher',
        }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.reply) {
          setAiTourNote(data.reply);
          return;
        }
      }
      setAiTourNote(
        `Inspection Checklist for ${activeTourProperty.title} (${virtualFocus}):\n• Transacted at S$${psf.toLocaleString()} psf vs current sample median S$${activeTourProperty.districtMedianPsf.toLocaleString()} psf.\n• Floor area: ${activeTourProperty.sqft.toLocaleString()} sqft (${activeTourProperty.sqm || Math.round(activeTourProperty.sqft / 10.7639)} sqm), Storey ${activeTourProperty.storeyRange || 'N/A'}.\n• Lease note: ${activeTourProperty.tenure}.\n• Verify physical unit condition, facing, and remaining lease eligibility on HDB Flat Portal.`
      );
    } catch {
      setAiTourNote(
        `Inspection Checklist for ${activeTourProperty.title} (${virtualFocus}):\n• Transacted at S$${psf.toLocaleString()} psf vs sample median S$${activeTourProperty.districtMedianPsf.toLocaleString()} psf.\n• Floor area: ${activeTourProperty.sqft.toLocaleString()} sqft, Storey ${activeTourProperty.storeyRange || 'N/A'}.\n• Lease note: ${activeTourProperty.tenure}.`
      );
    } finally {
      setAiTourLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAddress.trim()) return;
    setSubmitting(true);
    try {
      await onCreateListing({
        title: newTitle,
        address: newAddress,
        district: newDistrict,
        listingMode: newMode,
        propertyType: newType,
        price: Number(newPrice) || 680000,
        sqft: Number(newSqft) || 950,
        bedrooms: Number(newBeds) || 3,
        bathrooms: 2,
        description: newDesc || 'Owner-submitted listing.',
        imageKey: 'tiongbahru',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewAddress('');
      setNewDesc('');
    } finally {
      setSubmitting(false);
    }
  };

  const pagination = datagsgData?.pagination;
  const startRow = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const endRow = pagination ? pagination.offset + (datagsgData?.records.length || 0) : 0;
  const medianPsf = datagsgData?.summary.medianPsf || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <Database className="h-3.5 w-3.5" />
            <span>Live HDB Resale Transactions · data.gov.sg Collection 189</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            HDB Resale Search &amp; Property Listings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Browse real registered HDB resale transactions retrieved live from{' '}
            <span className="font-mono text-xs text-slate-700">/api/datagsg</span>, filter by town, flat type, or street, and compare PSF against live sample medians.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Owner Listing
        </button>
      </div>

      {/* Live Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search street or block in live HDB records (e.g. DAWSON, TIONG BAHRU, ANG MO KIO AVE 1)..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
            >
              Search Live Data
            </button>
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Town</span>
              <select
                value={query.town}
                onChange={(e) => onUpdateQuery({ town: e.target.value, offset: 0 })}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                {HDB_TOWNS.map((t) => (
                  <option key={t} value={t}>
                    {t === 'ALL' ? 'All HDB Towns' : t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Flat Type</span>
              <select
                value={query.flatType}
                onChange={(e) => onUpdateQuery({ flatType: e.target.value, offset: 0 })}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                {FLAT_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft === 'ALL' ? 'All Flat Types' : ft}
                  </option>
                ))}
              </select>
            </label>

            {datagsgData?.datasets && datagsgData.datasets.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span>Period</span>
                <select
                  value={query.datasetId || datagsgData.activeDataset.datasetId}
                  onChange={(e) => onUpdateQuery({ datasetId: e.target.value, offset: 0 })}
                  className="max-w-56 truncate rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {datagsgData.datasets.map((ds) => (
                    <option key={ds.datasetId} value={ds.datasetId}>
                      {ds.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="latest">Latest Registered</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="psf-asc">PSF: Low to High</option>
                <option value="sqft-desc">Area: Largest First</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-500 tabular-nums">
            {pagination && pagination.total > 0
              ? `Showing ${startRow.toLocaleString()}–${endRow.toLocaleString()} of ${pagination.total.toLocaleString()} records`
              : `${sortedListings.length} records`}
            {medianPsf > 0 ? ` · Page Median: S$${medianPsf.toLocaleString()} psf` : ''}
            {` · ${compareIds.length}/3 compared`}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-xs text-red-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Unable to Load Live HDB Resale Records</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-700 px-4 py-2 text-xs font-medium text-white hover:bg-red-800 shrink-0"
          >
            Retry /api/datagsg
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white p-4">
              <div className="aspect-4/3 w-full rounded-lg bg-slate-100" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
              <div className="mt-4 h-10 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : !error && sortedListings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            No matching HDB resale records found
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            No registered transactions in Collection 189 matched your town, flat type, or street query.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sortedListings.map((prop) => {
              const psf = prop.psf || Math.round(prop.price / Math.max(prop.sqft, 1));
              const benchmark = prop.districtMedianPsf || psf;
              const diffPct = benchmark > 0 ? ((psf - benchmark) / benchmark) * 100 : 0;
              const isBelowMedian = diffPct <= 0;
              const isCompared = compareIds.includes(prop.id);

              return (
                <article
                  key={prop.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300"
                >
                  <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                    <PropertyImage imageKey={prop.imageKey} alt={prop.title} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent p-3.5 text-white">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-lg font-semibold tabular-nums">
                          S${prop.price.toLocaleString()}
                        </span>
                        <span className="font-mono text-xs text-slate-200 tabular-nums">
                          S${psf.toLocaleString()} psf
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    {/* Unboxed Metadata Line */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-medium text-emerald-700">
                        {prop.sourceType === 'owner' ? 'Owner Entry' : `Registered ${prop.registeredMonth || ''}`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.flatModel || prop.propertyType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{prop.status}</span>
                    </div>

                    <h3 className="mt-1.5 text-base font-semibold text-slate-900 leading-snug">
                      {prop.title}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {prop.town || prop.district} · Storey {prop.storeyRange || 'N/A'}
                      </span>
                    </p>

                    {/* Key Metrics Strip */}
                    <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-2.5 text-xs">
                      <div>
                        <span className="block text-slate-400">Floor Area</span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums">
                          {prop.sqft.toLocaleString()} sqft
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">vs Page Median</span>
                        <span
                          className={`font-mono font-medium tabular-nums ${
                            isBelowMedian ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Lease Commence</span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums">
                          {prop.leaseCommenceDate || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p className="truncate">
                        Remaining Lease: {prop.remainingLease || `${prop.remainingLeaseYears} years`}
                      </p>
                      <p className="text-slate-500 truncate">
                        Source: {prop.sourceType === 'owner' ? 'User-submitted session entry' : 'HDB · data.gov.sg Collection 189'}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenTour(prop)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect Specs
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(prop.id)}
                        className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isCompared
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        {isCompared ? 'Added' : 'Compare'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onBookViewing(prop)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        View
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Live API Pagination Bar */}
          {pagination && pagination.total > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono tabular-nums">
                Page {pagination.currentPage} of {pagination.totalPages.toLocaleString()} · Showing{' '}
                {startRow.toLocaleString()}–{endRow.toLocaleString()} of {pagination.total.toLocaleString()} HDB records
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading || !pagination.hasPrev}
                  onClick={() =>
                    onUpdateQuery({ offset: Math.max(0, pagination.offset - query.limit) })
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={isLoading || !pagination.hasNext}
                  onClick={() => onUpdateQuery({ offset: pagination.offset + query.limit })}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Unit Inspection & Virtual Spec Modal */}
      {activeTourProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs text-slate-500">
                  Registered HDB Unit Breakdown · {activeTourProperty.district}
                </p>
                <h2 className="text-lg font-semibold text-slate-900">{activeTourProperty.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTourProperty(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close unit inspection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 space-y-5">
                <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-slate-100">
                  <PropertyImage
                    imageKey={activeTourProperty.imageKey}
                    alt={activeTourProperty.title}
                  />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500">Transaction Specifications</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeTourProperty.virtualTourRooms.map((rm, idx) => (
                      <button
                        key={rm.id}
                        type="button"
                        onClick={() => setSelectedRoomIdx(idx)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedRoomIdx === idx
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {rm.room}
                      </button>
                    ))}
                  </div>

                  {activeTourProperty.virtualTourRooms[selectedRoomIdx] && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {activeTourProperty.virtualTourRooms[selectedRoomIdx].room}
                        </span>
                        <span className="font-mono text-xs text-slate-600 tabular-nums">
                          {activeTourProperty.virtualTourRooms[selectedRoomIdx].dimensions}
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Compass className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{activeTourProperty.virtualTourRooms[selectedRoomIdx].orientation}</span>
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeTourProperty.virtualTourRooms[selectedRoomIdx].highlights}
                      </p>
                      <p className="border-t border-slate-200 pt-2 text-xs text-emerald-800">
                        {activeTourProperty.virtualTourRooms[selectedRoomIdx].aiInsight}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500">Transacted Resale Price</span>
                    <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                      S${activeTourProperty.price.toLocaleString()}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{activeTourProperty.tenure}</p>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700">
                    {activeTourProperty.description}
                  </p>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Buyer Inspection Checklist Focus
                    </label>
                    <select
                      value={virtualFocus}
                      onChange={(e) => setVirtualFocus(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option>Resale Price vs Sample Median &amp; Lease</option>
                      <option>Elderly &amp; Family Accessibility</option>
                      <option>Renovation &amp; Defect Inspection</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleGenerateVirtualInsight}
                      disabled={aiTourLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiTourLoading ? 'Generating Brief...' : 'Generate Inspection Brief'}
                    </button>
                    {aiTourNote && (
                      <div className="rounded-md border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {aiTourNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeTourProperty;
                      setActiveTourProperty(null);
                      onBookViewing(target);
                    }}
                    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Schedule Viewing Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeTourProperty;
                      setActiveTourProperty(null);
                      onAskAiAboutProperty(target);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ask AI Assistant About This Unit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Add Owner Property Listing</h2>
                <p className="text-xs text-slate-500">Appends your custom listing to this workspace session.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Listing Title</label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Blk 88 Dawson Rd 4-Room HDB"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Address / Block</label>
                <input
                  required
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Blk 88 Dawson Rd, #12-04"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Town / District</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Property Type</label>
                <select
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value as PropertyType);
                    setNewMode('Buy');
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="HDB">HDB</option>
                  <option value="Condo">Condo</option>
                  <option value="Executive Condo">Executive Condo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Asking Price (S$)</label>
                <input
                  required
                  type="number"
                  min={100000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Floor Area (sqft)</label>
                <input
                  required
                  type="number"
                  min={200}
                  value={newSqft}
                  onChange={(e) => setNewSqft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Bedrooms</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newBeds}
                  onChange={(e) => setNewBeds(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Notes</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Floor level, lease..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {submitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
