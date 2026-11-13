export type PropertyType = 'HDB' | 'Condo' | 'Co-Living' | 'Executive Condo' | 'Landed';
export type ListingMode = 'Buy' | 'Rent' | 'Co-Living';
export type TargetProfile = 'Families' | 'Students' | 'Expats' | 'Investors' | 'Elderly-Friendly';
export type ImageKey = 'tiongbahru' | 'marinabay' | 'orchard' | 'clementi' | 'katong' | 'punggol';
export type SubscriptionTier = 'Freemium' | 'Bronze' | 'Silver' | 'Gold';

export interface PriceTrendPoint {
  quarter: string;
  unitPsf: number;
  districtMedianPsf: number;
}

export interface VirtualTourRoom {
  id: string;
  room: string;
  dimensions: string;
  orientation: string;
  highlights: string;
  aiInsight: string;
}

export interface PropertyListing {
  id: string;
  title: string;
  address: string;
  district: string;
  region: 'CCR' | 'RCR' | 'OCR';
  propertyType: PropertyType;
  listingMode: ListingMode;
  targetProfiles: TargetProfile[];
  price: number; // S$ total for Buy, S$/mo for Rent or Co-Living
  sqft: number;
  sqm?: number;
  psf?: number;
  town?: string;
  flatModel?: string;
  storeyRange?: string;
  registeredMonth?: string;
  leaseCommenceDate?: string;
  remainingLease?: string;
  sourceType?: 'datagsg' | 'owner';
  bedrooms: number;
  bathrooms: number;
  tenure: string;
  remainingLeaseYears: number;
  nearestMrt: string;
  mrtWalkMins: number;
  nearbySchools: string[];
  nearbyAmenities: string[];
  districtMedianPsf: number;
  estimatedGrossYieldPct: number;
  historicalPsfTrend: PriceTrendPoint[];
  virtualTourRooms: VirtualTourRoom[];
  ownerVerifiedDemo: boolean;
  status: 'Active' | 'Under Offer' | 'Pending Review';
  imageKey: ImageKey;
  description: string;
  isDemoData: boolean;
}

export interface ViewingAppointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  visitorName: string;
  visitorEmail: string;
  visitorProfile: TargetProfile;
  viewingFormat: 'In-Person' | 'AI-Assisted Virtual';
  date: string;
  timeSlot: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  pdpaConsent: boolean;
  notes: string;
}

export interface MaintenanceRequest {
  id: string;
  unitAddress: string;
  category: 'Aircon Servicing' | 'Plumbing & Leak' | 'Electrical' | 'Housekeeping & Move-Out' | 'Elderly Safety Grab-Bar';
  urgency: 'Routine' | 'Priority' | 'Urgent';
  preferredDate: string;
  estimatedCostSgd: string;
  status: 'Submitted' | 'Vendor Assigned' | 'In Progress' | 'Resolved';
  description: string;
  pdpaConsent: boolean;
  createdAt: string;
}

export interface TransactionStep {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  owner: 'Buyer/Tenant' | 'Seller/Landlord' | 'Bank / Solicitor' | 'HDB / URA Portal';
  status: 'Completed' | 'In Progress' | 'Pending';
  dueDate: string;
  documents: string[];
}

export interface TransactionRecord {
  id: string;
  propertyTitle: string;
  transactionType: 'Resale Purchase' | 'Residential Lease';
  counterpartyLabel: string;
  agreedAmountSgd: number;
  targetCompletionDate: string;
  steps: TransactionStep[];
}

export const DEMO_PROPERTIES: PropertyListing[] = [
  {
    id: 'sg-prop-01',
    title: 'Tiong Bahru Heritage 4-Room HDB',
    address: 'Blk 55 Tiong Bahru Road, #08-14',
    district: 'D03 · Queenstown / Tiong Bahru',
    region: 'RCR',
    propertyType: 'HDB',
    listingMode: 'Buy',
    targetProfiles: ['Families', 'Elderly-Friendly', 'Investors'],
    price: 928000,
    sqft: 990,
    bedrooms: 3,
    bathrooms: 2,
    tenure: '99-year Leasehold (from 1973 · SERS Upgraded)',
    remainingLeaseYears: 46,
    nearestMrt: 'Tiong Bahru MRT (EW17)',
    mrtWalkMins: 5,
    nearbySchools: ['Zhangde Primary (0.4 km)', 'Gan Eng Seng Primary (0.9 km)'],
    nearbyAmenities: ['Tiong Bahru Market (3 min walk)', 'Outram Polyclinic', 'Kim Pong Park'],
    districtMedianPsf: 965,
    estimatedGrossYieldPct: 4.4,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 890, districtMedianPsf: 915 },
      { quarter: 'Q4 2025', unitPsf: 905, districtMedianPsf: 930 },
      { quarter: 'Q1 2026', unitPsf: 918, districtMedianPsf: 942 },
      { quarter: 'Q2 2026', unitPsf: 925, districtMedianPsf: 950 },
      { quarter: 'Q3 2026', unitPsf: 932, districtMedianPsf: 958 },
      { quarter: 'Q4 2026', unitPsf: 937, districtMedianPsf: 965 },
    ],
    virtualTourRooms: [
      {
        id: 'tb-living',
        room: 'Living & Dining Hall',
        dimensions: '5.8m × 3.9m',
        orientation: 'North-South Facing (Cross-Ventilated)',
        highlights: 'Step-free timber flooring, wide doorway clearances, unobstructed rain-tree canopy view.',
        aiInsight: 'Low afternoon west-sun heat load; natural airflow lowers daytime aircon demand.'
      },
      {
        id: 'tb-kitchen',
        room: 'Galley Kitchen & Service Yard',
        dimensions: '4.1m × 2.3m',
        orientation: 'East Utility Exposure',
        highlights: 'Quartz countertops, induction hob ready, separate laundry drying rack.',
        aiInsight: 'Good wet/dry separation suited for multi-generational households.'
      },
      {
        id: 'tb-master',
        room: 'Master Suite & En-suite Bath',
        dimensions: '4.2m × 3.4m',
        orientation: 'Quiet Courtyard Side',
        highlights: 'Built-in full-height wardrobe, anti-slip bathroom tiles, grab-bar ready wall.',
        aiInsight: 'Barrier-free layout aligns well with ageing-in-place / elderly accessibility criteria.'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'tiongbahru',
    description: 'Bright corner 4-room HDB flat with lift-level access, renovated in 2024, 5 minutes to Tiong Bahru MRT and wet market. Direct owner demo listing.',
    isDemoData: true
  },
  {
    id: 'sg-prop-02',
    title: 'Marina One Residences Waterfront 2BR',
    address: '21 Marina Way, #26-08',
    district: 'D01 · Marina Bay / Raffles Place',
    region: 'CCR',
    propertyType: 'Condo',
    listingMode: 'Buy',
    targetProfiles: ['Investors', 'Expats'],
    price: 2180000,
    sqft: 1012,
    bedrooms: 2,
    bathrooms: 2,
    tenure: '99-year Leasehold (from 2011)',
    remainingLeaseYears: 84,
    nearestMrt: 'Marina Bay / Downtown MRT (4 Interchanges)',
    mrtWalkMins: 3,
    nearbySchools: ['Cantonment Primary (1.7 km)', 'SMU City Campus (10 min MRT)'],
    nearbyAmenities: ['Marina Bay Sands Promenade', 'Cold Storage Heart', 'Gardens by the Bay'],
    districtMedianPsf: 2210,
    estimatedGrossYieldPct: 3.9,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 2090, districtMedianPsf: 2140 },
      { quarter: 'Q4 2025', unitPsf: 2115, districtMedianPsf: 2160 },
      { quarter: 'Q1 2026', unitPsf: 2120, districtMedianPsf: 2175 },
      { quarter: 'Q2 2026', unitPsf: 2135, districtMedianPsf: 2190 },
      { quarter: 'Q3 2026', unitPsf: 2148, districtMedianPsf: 2200 },
      { quarter: 'Q4 2026', unitPsf: 2154, districtMedianPsf: 2210 },
    ],
    virtualTourRooms: [
      {
        id: 'mb-living',
        room: 'Panoramic Living Salon',
        dimensions: '6.2m × 4.4m',
        orientation: 'East-Southeast Bay View',
        highlights: 'Double-glazed floor-to-ceiling curtain wall, travertine flooring, automated blinds.',
        aiInsight: 'Asking PSF of S$2,154 sits 2.5% below D01 CCR median benchmark for high-floor 2BR stacks.'
      },
      {
        id: 'mb-study',
        room: 'Flex Study Alcove',
        dimensions: '2.4m × 2.0m',
        orientation: 'Interior Acoustic Partition',
        highlights: 'Fiber-ready dual Ethernet drops for remote CBD professionals.',
        aiInsight: 'High corporate tenant appeal from adjacent MBFC towers.'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'marinabay',
    description: 'High-floor 2-bedroom + study residence directly connected to four MRT lines at Marina Bay. Strong corporate leasing track record.',
    isDemoData: true
  },
  {
    id: 'sg-prop-03',
    title: 'Orchard Emerald Co-Living Studio Suite',
    address: '38 Cairnhill Road, Unit #06-03',
    district: 'D09 · Orchard / River Valley',
    region: 'CCR',
    propertyType: 'Co-Living',
    listingMode: 'Co-Living',
    targetProfiles: ['Students', 'Expats'],
    price: 1750,
    sqft: 245,
    bedrooms: 1,
    bathrooms: 1,
    tenure: 'Flexible 6–12 Month Co-Living Lease',
    remainingLeaseYears: 99,
    nearestMrt: 'Somerset MRT (NS23)',
    mrtWalkMins: 6,
    nearbySchools: ['SMU Bras Basah Campus (12 min MRT)', 'LASALLE / NAFA (14 min)'],
    nearbyAmenities: ['Orchard Central', '313@Somerset', 'Mount Elizabeth Hospital'],
    districtMedianPsf: 7.45, // S$/sqft monthly rent benchmark
    estimatedGrossYieldPct: 5.1,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 6.9, districtMedianPsf: 7.1 },
      { quarter: 'Q4 2025', unitPsf: 7.0, districtMedianPsf: 7.2 },
      { quarter: 'Q1 2026', unitPsf: 7.05, districtMedianPsf: 7.25 },
      { quarter: 'Q2 2026', unitPsf: 7.1, districtMedianPsf: 7.35 },
      { quarter: 'Q3 2026', unitPsf: 7.12, districtMedianPsf: 7.4 },
      { quarter: 'Q4 2026', unitPsf: 7.14, districtMedianPsf: 7.45 },
    ],
    virtualTourRooms: [
      {
        id: 'or-suite',
        room: 'Private Studio & Study Zone',
        dimensions: '4.5m × 3.6m',
        orientation: 'South Courtyard Greenery',
        highlights: 'Queen storage bed, ergonomic oak desk, utilities + 2Gbps WiFi + weekly housekeeping included.',
        aiInsight: 'All-in rent eliminates utility setup friction for incoming undergrads and short-term expats.'
      },
      {
        id: 'or-shared',
        room: 'Shared Chef Kitchen & Co-Work Lounge',
        dimensions: '8.0m × 4.5m',
        orientation: 'Level 2 Communal Terrace',
        highlights: 'Verified co-tenant matching with house rules and quiet hours after 10:30 PM.',
        aiInsight: 'Co-living profile verification reduces roommate mismatch risk.'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'orchard',
    description: 'Move-in ready private co-living studio with en-suite bath, bi-weekly housekeeping, and verified student/young-professional housemates.',
    isDemoData: true
  },
  {
    id: 'sg-prop-04',
    title: 'Parc Clematis Family 3-Bedroom Condo',
    address: '8 Jalan Lempeng, #11-22',
    district: 'D05 · Clementi / West Coast',
    region: 'OCR',
    propertyType: 'Condo',
    listingMode: 'Rent',
    targetProfiles: ['Families', 'Expats', 'Students'],
    price: 4850,
    sqft: 1044,
    bedrooms: 3,
    bathrooms: 2,
    tenure: '99-year Leasehold (from 2019)',
    remainingLeaseYears: 92,
    nearestMrt: 'Clementi MRT (EW23)',
    mrtWalkMins: 7,
    nearbySchools: ['Nan Hua Primary (0.3 km)', 'NUS Kent Ridge Campus (8 min bus)', 'UWCSEA Dover (10 min)'],
    nearbyAmenities: ['The Clementi Mall', 'Clementi Stadium & Swim Complex', 'West Coast Park'],
    districtMedianPsf: 4.85, // Monthly rent PSF
    estimatedGrossYieldPct: 3.8,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 4.5, districtMedianPsf: 4.6 },
      { quarter: 'Q4 2025', unitPsf: 4.55, districtMedianPsf: 4.65 },
      { quarter: 'Q1 2026', unitPsf: 4.6, districtMedianPsf: 4.72 },
      { quarter: 'Q2 2026', unitPsf: 4.62, districtMedianPsf: 4.78 },
      { quarter: 'Q3 2026', unitPsf: 4.65, districtMedianPsf: 4.82 },
      { quarter: 'Q4 2026', unitPsf: 4.65, districtMedianPsf: 4.85 },
    ],
    virtualTourRooms: [
      {
        id: 'cl-living',
        room: 'Pool-Facing Living & Balcony',
        dimensions: '5.5m × 4.0m',
        orientation: 'North-Facing Pool Deck',
        highlights: 'Child-safe invisible balcony grille installed, zero afternoon glare.',
        aiInsight: 'Popular among expat families near NUS and Nan Hua Primary; priced 4.1% below D05 rent PSF median.'
      },
      {
        id: 'cl-bed3',
        room: 'Bedroom 2 & 3 (Flex Kids / Study)',
        dimensions: '3.1m × 2.8m each',
        orientation: 'Quiet Internal Landscape',
        highlights: 'Fits queen or twin bunk beds plus study desks.',
        aiInsight: 'Ideal for sharing between 3 NUS/NTU postgrads or a family of four.'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'clementi',
    description: 'Pool-facing 3BR family unit within 300m of Nan Hua Primary and quick bus link to NUS. Quarterly aircon servicing package included.',
    isDemoData: true
  },
  {
    id: 'sg-prop-05',
    title: 'Joo Chiat Heritage Conservation Terrace',
    address: '112 Koon Seng Road',
    district: 'D15 · Katong / East Coast',
    region: 'RCR',
    propertyType: 'Landed',
    listingMode: 'Buy',
    targetProfiles: ['Families', 'Investors'],
    price: 3980000,
    sqft: 2150,
    bedrooms: 4,
    bathrooms: 4,
    tenure: 'Freehold',
    remainingLeaseYears: 999,
    nearestMrt: 'Eunos MRT (EW7) / Marine Parade (TE26)',
    mrtWalkMins: 9,
    nearbySchools: ['Haig Girls’ School (0.5 km)', 'Tao Nan School (1.1 km)'],
    nearbyAmenities: ['East Coast Park (8 min cycle)', 'i12 Katong', 'Joo Chiat Culinary Stretch'],
    districtMedianPsf: 1940,
    estimatedGrossYieldPct: 3.1,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 1760, districtMedianPsf: 1830 },
      { quarter: 'Q4 2025', unitPsf: 1785, districtMedianPsf: 1855 },
      { quarter: 'Q1 2026', unitPsf: 1805, districtMedianPsf: 1880 },
      { quarter: 'Q2 2026', unitPsf: 1825, districtMedianPsf: 1905 },
      { quarter: 'Q3 2026', unitPsf: 1840, districtMedianPsf: 1925 },
      { quarter: 'Q4 2026', unitPsf: 1851, districtMedianPsf: 1940 },
    ],
    virtualTourRooms: [
      {
        id: 'kt-courtyard',
        room: 'Skylit Airwell Courtyard',
        dimensions: '6.5m × 4.8m',
        orientation: 'Central Tropical Atrium',
        highlights: 'Double-height timber louvers, passive stack cooling, terrazzo flooring.',
        aiInsight: 'Freehold D15 landed supply is scarce; note conservation façade maintenance guidelines.'
      },
      {
        id: 'kt-upper',
        room: '2nd Storey Family Gallery & Master',
        dimensions: '7.0m × 4.6m',
        orientation: 'Front & Rear Cross Breeze',
        highlights: 'Restored Peranakan timber shutters with acoustic secondary glazing.',
        aiInsight: 'Acoustic glazing mitigates street noise while preserving heritage character.'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'katong',
    description: 'Restored freehold 2-storey heritage terrace with skylit airwell courtyard in D15. Eligible for Singapore Citizens (LDAU approval applies to foreign buyers).',
    isDemoData: true
  },
  {
    id: 'sg-prop-06',
    title: 'Punggol Waterfront Executive Condo (5BR/3BR)',
    address: '62 Punggol Central, #09-11',
    district: 'D19 · Punggol / Sengkang',
    region: 'OCR',
    propertyType: 'Executive Condo',
    listingMode: 'Buy',
    targetProfiles: ['Families', 'Elderly-Friendly'],
    price: 1390000,
    sqft: 1109,
    bedrooms: 3,
    bathrooms: 2,
    tenure: '99-year Leasehold (from 2016 · MOP Fulfilled)',
    remainingLeaseYears: 89,
    nearestMrt: 'Punggol MRT / LRT (NE17)',
    mrtWalkMins: 6,
    nearbySchools: ['Punggol Green Primary (0.4 km)', 'Edgefield Secondary (0.6 km)'],
    nearbyAmenities: ['Waterway Point Mall', 'My Waterway@Punggol Park', 'Punggol Polyclinic'],
    districtMedianPsf: 1295,
    estimatedGrossYieldPct: 4.1,
    historicalPsfTrend: [
      { quarter: 'Q3 2025', unitPsf: 1180, districtMedianPsf: 1220 },
      { quarter: 'Q4 2025', unitPsf: 1200, districtMedianPsf: 1240 },
      { quarter: 'Q1 2026', unitPsf: 1218, districtMedianPsf: 1258 },
      { quarter: 'Q2 2026', unitPsf: 1230, districtMedianPsf: 1272 },
      { quarter: 'Q3 2026', unitPsf: 1242, districtMedianPsf: 1285 },
      { quarter: 'Q4 2026', unitPsf: 1253, districtMedianPsf: 1295 },
    ],
    virtualTourRooms: [
      {
        id: 'pg-dining',
        room: 'Open Kitchen & Canal Dining Zone',
        dimensions: '6.0m × 3.8m',
        orientation: 'North-East Waterfront Breeze',
        highlights: 'Island quartz bar, direct sliding connection to breezy canal balcony.',
        aiInsight: 'Recently reached 5-year Minimum Occupation Period (MOP); MSR 30% applies if HDB/EC loan rules govern, wait—post-MOP resale EC follows standard private TDSR!'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: 'punggol',
    description: 'Post-MOP 3-bedroom Executive Condo overlooking Punggol Waterway park connector. Direct access to step-free jogging & wheelchair paths.',
    isDemoData: true
  }
];

export const INITIAL_VIEWINGS: ViewingAppointment[] = [
  {
    id: 'vw-101',
    propertyId: 'sg-prop-01',
    propertyTitle: 'Tiong Bahru Heritage 4-Room HDB',
    visitorName: 'Wei Ming Tan',
    visitorEmail: 'weiming.tan@example.sg',
    visitorProfile: 'Families',
    viewingFormat: 'In-Person',
    date: '2026-11-16',
    timeSlot: '11:00 AM',
    status: 'Scheduled',
    pdpaConsent: true,
    notes: 'Interested in lift-level elderly access for parents.'
  },
  {
    id: 'vw-102',
    propertyId: 'sg-prop-03',
    propertyTitle: 'Orchard Emerald Co-Living Studio Suite',
    visitorName: 'Priya Nair',
    visitorEmail: 'priya.nair@example.edu.sg',
    visitorProfile: 'Students',
    viewingFormat: 'AI-Assisted Virtual',
    date: '2026-11-15',
    timeSlot: '04:30 PM',
    status: 'Scheduled',
    pdpaConsent: true,
    notes: 'Incoming SMU exchange student; checking desk ergonomics and quiet hours.'
  }
];

export const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'mt-301',
    unitAddress: 'Blk 55 Tiong Bahru Road, #08-14',
    category: 'Aircon Servicing',
    urgency: 'Routine',
    preferredDate: '2026-11-18',
    estimatedCostSgd: 'S$120 (4-unit chemical wash)',
    status: 'Vendor Assigned',
    description: 'Quarterly split-unit aircon servicing and drainage flush before tenant handover.',
    pdpaConsent: true,
    createdAt: '2026-11-11'
  },
  {
    id: 'mt-302',
    unitAddress: '8 Jalan Lempeng, #11-22',
    category: 'Plumbing & Leak',
    urgency: 'Priority',
    preferredDate: '2026-11-14',
    estimatedCostSgd: 'S$95 – S$160',
    status: 'In Progress',
    description: 'Slow kitchen sink P-trap drainage detected during pre-move-in inspection.',
    pdpaConsent: true,
    createdAt: '2026-11-12'
  }
];

export const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'tx-sg-01',
    propertyTitle: 'Tiong Bahru Heritage 4-Room HDB',
    transactionType: 'Resale Purchase',
    counterpartyLabel: 'Direct Owner Demo Party (Verified Identity Simulation)',
    agreedAmountSgd: 928000,
    targetCompletionDate: '2027-01-22',
    steps: [
      {
        id: 'step-1',
        order: 1,
        title: 'Identity & HFE / Eligibility Pre-Check',
        subtitle: 'Simulated Singpass MyInfo & HDB Flat Eligibility (HFE) verification.',
        owner: 'Buyer/Tenant',
        status: 'Completed',
        dueDate: '2026-11-02',
        documents: ['HFE Letter (Demo)', 'NRIC Verification (Simulated)']
      },
      {
        id: 'step-2',
        order: 2,
        title: 'Offer & Option to Purchase (OTP)',
        subtitle: 'Standard HDB OTP issued with S$1,000 option fee; 21-day exercise window.',
        owner: 'Seller/Landlord',
        status: 'Completed',
        dueDate: '2026-11-08',
        documents: ['Signed HDB OTP Form (Template)']
      },
      {
        id: 'step-3',
        order: 3,
        title: 'HDB Valuation & Bank Letter of Offer',
        subtitle: 'Request HDB valuation and finalize bank IPA / HDB housing loan.',
        owner: 'Bank / Solicitor',
        status: 'In Progress',
        dueDate: '2026-11-24',
        documents: ['Bank IPA Letter', 'Valuation Request']
      },
      {
        id: 'step-4',
        order: 4,
        title: 'Resale Application & Stamp Duty (BSD/ABSD)',
        subtitle: 'Submit resale application on HDB Flat Portal; pay IRAS Buyer Stamp Duty within 14 days of exercise.',
        owner: 'HDB / URA Portal',
        status: 'Pending',
        dueDate: '2026-12-10',
        documents: ['IRAS Stamp Certificate']
      },
      {
        id: 'step-5',
        order: 5,
        title: 'Completion Appointment & Key Handover',
        subtitle: 'Final conveyancing settlement, CPF disbursement, and physical key handover.',
        owner: 'HDB / URA Portal',
        status: 'Pending',
        dueDate: '2027-01-22',
        documents: ['Completion Statement', 'Key Handover Checklist']
      }
    ]
  },
  {
    id: 'tx-sg-02',
    propertyTitle: 'Parc Clematis Family 3-Bedroom Condo',
    transactionType: 'Residential Lease',
    counterpartyLabel: 'Expat Family Tenant (24-Month Lease)',
    agreedAmountSgd: 4850,
    targetCompletionDate: '2026-12-01',
    steps: [
      {
        id: 'lstep-1',
        order: 1,
        title: 'Tenant Work Pass / Student Pass Check',
        subtitle: 'Verify valid Employment Pass / Student Pass & ICA status (simulated check).',
        owner: 'Buyer/Tenant',
        status: 'Completed',
        dueDate: '2026-11-05',
        documents: ['Employment Pass Verification (Simulated)']
      },
      {
        id: 'lstep-2',
        order: 2,
        title: 'Letter of Intent (LOI) & Good Faith Deposit',
        subtitle: '1-month good faith deposit upon LOI acceptance.',
        owner: 'Buyer/Tenant',
        status: 'Completed',
        dueDate: '2026-11-09',
        documents: ['Signed LOI']
      },
      {
        id: 'lstep-3',
        order: 3,
        title: 'Tenancy Agreement (TA) & IRAS e-Stamping',
        subtitle: 'Standard Singapore CEA-aligned TA template + 0.4% lease stamp duty.',
        owner: 'Seller/Landlord',
        status: 'In Progress',
        dueDate: '2026-11-18',
        documents: ['Draft Tenancy Agreement', 'IRAS e-Stamp Duty Receipt']
      },
      {
        id: 'lstep-4',
        order: 4,
        title: 'Inventory Audit & Key Handover',
        subtitle: 'Joint photo inventory report, utility account transfer, and keys.',
        owner: 'Seller/Landlord',
        status: 'Pending',
        dueDate: '2026-12-01',
        documents: ['Photo Inventory Log']
      }
    ]
  }
];
