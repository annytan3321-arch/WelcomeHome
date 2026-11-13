import React, { useMemo, useState } from 'react';
import {
  Building2,
  Calendar,
  Compass,
  Eye,
  Filter,
  GitCompare,
  MapPin,
  Plus,
  Search,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';
import type {
  ListingMode,
  PropertyListing,
  PropertyType,
  TargetProfile,
} from '../data/properties.ts';
import { PropertyImage } from './PropertyImage.tsx';

interface MarketplaceViewProps {
  listings: PropertyListing[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onBookViewing: (property: PropertyListing) => void;
  onAskAiAboutProperty: (property: PropertyListing) => void;
  onCreateListing: (payload: Partial<PropertyListing>) => Promise<void>;
  isLoading: boolean;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  listings,
  compareIds,
  onToggleCompare,
  onBookViewing,
  onAskAiAboutProperty,
  onCreateListing,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'All' | ListingMode>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | PropertyType>('All');
  const [profileFilter, setProfileFilter] = useState<'All' | TargetProfile>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'yield-desc'>('featured');
  const [activeTourProperty, setActiveTourProperty] = useState<PropertyListing | null>(null);
  const [selectedRoomIdx, setSelectedRoomIdx] = useState(0);
  const [virtualFocus, setVirtualFocus] = useState('Afternoon West Sun & Ventilation');
  const [aiTourNote, setAiTourNote] = useState<string | null>(null);
  const [aiTourLoading, setAiTourLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newDistrict, setNewDistrict] = useState('D14 · Geylang / Paya Lebar');
  const [newMode, setNewMode] = useState<ListingMode>('Rent');
  const [newType, setNewType] = useState<PropertyType>('Condo');
  const [newPrice, setNewPrice] = useState('3900');
  const [newSqft, setNewSqft] = useState('840');
  const [newBeds, setNewBeds] = useState('2');
  const [newMrt, setNewMrt] = useState('Paya Lebar MRT (EW8/CC9)');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = listings.filter((item) => {
      if (modeFilter !== 'All' && item.listingMode !== modeFilter) return false;
      if (typeFilter !== 'All' && item.propertyType !== typeFilter) return false;
      if (profileFilter !== 'All' && !item.targetProfiles.includes(profileFilter)) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.nearestMrt.toLowerCase().includes(q) ||
        item.nearbySchools.some((s) => s.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'yield-desc') return [...list].sort((a, b) => b.estimatedGrossYieldPct - a.estimatedGrossYieldPct);
    return list;
  }, [listings, searchQuery, modeFilter, typeFilter, profileFilter, sortBy]);

  const handleOpenTour = (prop: PropertyListing) => {
    setActiveTourProperty(prop);
    setSelectedRoomIdx(0);
    setAiTourNote(null);
  };

  const handleGenerateVirtualInsight = async () => {
    if (!activeTourProperty) return;
    setAiTourLoading(true);
    setAiTourNote(null);
    try {
      const res = await fetch('/api/ai/virtual-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: activeTourProperty.id,
          focusArea: virtualFocus,
        }),
      });
      const data = await res.json();
      setAiTourNote(data.summary || data.error || 'Unable to load tour analysis.');
    } catch {
      setAiTourNote('Network error generating virtual inspection note.');
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
        price: Number(newPrice) || 3800,
        sqft: Number(newSqft) || 850,
        bedrooms: Number(newBeds) || 2,
        bathrooms: 2,
        nearestMrt: newMrt,
        description: newDesc || 'Direct owner demo listing created in workspace.',
        imageKey: newType === 'HDB' ? 'tiongbahru' : newType === 'Co-Living' ? 'orchard' : 'clementi',
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewAddress('');
      setNewDesc('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Demo Data Transparency Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">Singapore Property Marketplace · Demo Dataset</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Direct Listings & Price Transparency
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Search HDB flats, private condos, co-living suites, and landed homes with indicative district PSF benchmarks. Sample data is labelled for MVP demonstration; production connects to HDB, URA SPACE, and LTA APIs.
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

      {/* Filter & Search Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search district, MRT (e.g. Tiong Bahru, NUS, Marina Bay), or school..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Segmented Mode Control */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0 overflow-x-auto">
            {(['All', 'Buy', 'Rent', 'Co-Living'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setModeFilter(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  modeFilter === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span>Property</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'All' | PropertyType)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="HDB">HDB Flat</option>
                <option value="Condo">Condominium</option>
                <option value="Co-Living">Co-Living Suite</option>
                <option value="Executive Condo">Executive Condo</option>
                <option value="Landed">Landed Terrace</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Suitable For</span>
              <select
                value={profileFilter}
                onChange={(e) => setProfileFilter(e.target.value as 'All' | TargetProfile)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="All">All Profiles</option>
                <option value="Families">Families</option>
                <option value="Students">Undergrad Students</option>
                <option value="Expats">Expatriates</option>
                <option value="Investors">Investors</option>
                <option value="Elderly-Friendly">Elderly-Friendly</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="featured">Featured Demo Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="yield-desc">Est. Yield: High to Low</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-500 tabular-nums">
            Showing {filtered.length} of {listings.length} demo listings · {compareIds.length}/3 selected for comparison
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white p-4">
              <div className="aspect-4/3 w-full rounded-lg bg-slate-100" />
              <div className="mt-4 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No matching demo properties</h3>
          <p className="mt-1 text-sm text-slate-600">
            Adjust your transaction mode, property type, or district query to inspect available sample listings.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setModeFilter('All');
              setTypeFilter('All');
              setProfileFilter('All');
            }}
            className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prop) => {
            const psf = prop.price / Math.max(prop.sqft, 1);
            const diffPct = ((psf - prop.districtMedianPsf) / prop.districtMedianPsf) * 100;
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
                        {prop.listingMode !== 'Buy' ? '/mo' : ''}
                      </span>
                      <span className="font-mono text-xs text-slate-200 tabular-nums">
                        S${psf.toFixed(prop.listingMode === 'Buy' ? 0 : 2)} psf
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-emerald-700">{prop.listingMode}</span>
                    <span aria-hidden="true">·</span>
                    <span>{prop.propertyType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{prop.status}</span>
                    <span aria-hidden="true">·</span>
                    <span>Demo Data</span>
                  </div>

                  <h3 className="mt-1.5 text-base font-semibold text-slate-900 leading-snug">
                    {prop.title}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{prop.address} · {prop.district}</span>
                  </p>

                  {/* Key Metrics Strip */}
                  <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-100 py-2.5 text-xs">
                    <div>
                      <span className="block text-slate-400">Size / Rooms</span>
                      <span className="font-mono font-medium text-slate-800 tabular-nums">
                        {prop.sqft} sqft · {prop.bedrooms}BR
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400">vs Demo Median</span>
                      <span
                        className={`font-mono font-medium tabular-nums ${
                          isBelowMedian ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Est. Yield</span>
                      <span className="font-mono font-medium text-slate-800 tabular-nums">
                        {prop.estimatedGrossYieldPct.toFixed(1)}% p.a.
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5 truncate">
                      <TrainFront className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{prop.nearestMrt} ({prop.mrtWalkMins} min walk)</span>
                    </p>
                    <p className="text-slate-500 truncate">
                      Suited for: {prop.targetProfiles.join(', ')}
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
                      Virtual Tour
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
      )}

      {/* Property Detail & AI Virtual Home Viewing Modal */}
      {activeTourProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs text-slate-500">
                  AI-Assisted Virtual Home Viewing · {activeTourProperty.district} · Demo Listing
                </p>
                <h2 className="text-lg font-semibold text-slate-900">{activeTourProperty.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTourProperty(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close virtual tour"
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

                {/* Room Switcher */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500">Interactive Room Inspection</h3>
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
                        Spatial Note: {activeTourProperty.virtualTourRooms[selectedRoomIdx].aiInsight}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-500">Asking Price</span>
                    <div className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                      S${activeTourProperty.price.toLocaleString()}
                      {activeTourProperty.listingMode !== 'Buy' ? '/mo' : ''}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{activeTourProperty.tenure}</p>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700">
                    {activeTourProperty.description}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Nearby Schools:</span>{' '}
                      <span className="text-slate-600">{activeTourProperty.nearbySchools.join(' · ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Neighbourhood Amenities:</span>{' '}
                      <span className="text-slate-600">{activeTourProperty.nearbyAmenities.join(' · ')}</span>
                    </div>
                  </div>

                  {/* AI Virtual Inspection Generator */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      AI Virtual Viewing Focus
                    </label>
                    <select
                      value={virtualFocus}
                      onChange={(e) => setVirtualFocus(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option>Afternoon West Sun & Ventilation</option>
                      <option>Elderly & Family Accessibility</option>
                      <option>Student Study & Transit Convenience</option>
                      <option>Rental Yield & Corporate Tenant Fit</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleGenerateVirtualInsight}
                      disabled={aiTourLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {aiTourLoading ? 'Analyzing Space...' : 'Generate AI Inspection Brief'}
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
                    Schedule Physical or Virtual Viewing
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
                    Open Full AI Assistant With This Unit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Owner Listing Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Create Direct Owner Demo Listing</h2>
                <p className="text-xs text-slate-500">Added immediately to the interactive MVP marketplace.</p>
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
                  placeholder="e.g. Paya Lebar Residences Bright 2BR"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Singapore Address / Block</label>
                <input
                  required
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 12 Paya Lebar Crescent, #07-04"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Mode</label>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value as ListingMode)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="Buy">Buy</option>
                  <option value="Rent">Rent</option>
                  <option value="Co-Living">Co-Living</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Property Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PropertyType)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="HDB">HDB</option>
                  <option value="Condo">Condo</option>
                  <option value="Co-Living">Co-Living</option>
                  <option value="Executive Condo">Executive Condo</option>
                  <option value="Landed">Landed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {newMode === 'Buy' ? 'Asking Price (S$)' : 'Monthly Rent (S$)'}
                </label>
                <input
                  required
                  type="number"
                  min={400}
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
                  min={100}
                  value={newSqft}
                  onChange={(e) => setNewSqft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">District</label>
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Nearest MRT & Bedrooms</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={newMrt}
                    onChange={(e) => setNewMrt(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={newBeds}
                    onChange={(e) => setNewBeds(e.target.value)}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Unit Highlights</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Renovation year, facing, MRT walk time..."
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
                {submitting ? 'Publishing...' : 'Publish Demo Listing'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
