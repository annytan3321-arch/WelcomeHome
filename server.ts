import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  DEMO_PROPERTIES,
  INITIAL_MAINTENANCE,
  INITIAL_TRANSACTIONS,
  INITIAL_VIEWINGS,
  type MaintenanceRequest,
  type PropertyListing,
  type TransactionRecord,
  type ViewingAppointment,
} from './src/data/properties.ts';
import healthHandler from './api/health.ts';
import datagsgHandler from './api/datagsg.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

// In-memory MVP store (seeded with realistic demo Singapore data)
let listings: PropertyListing[] = structuredClone(DEMO_PROPERTIES);
let viewings: ViewingAppointment[] = structuredClone(INITIAL_VIEWINGS);
let maintenanceRequests: MaintenanceRequest[] = structuredClone(INITIAL_MAINTENANCE);
let transactions: TransactionRecord[] = structuredClone(INITIAL_TRANSACTIONS);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --- Health Check (Vercel-compatible /api/health.ts) ---
app.get('/api/health', (req, res) => {
  void healthHandler(req, res);
});

// --- Live HDB Resale Flat Prices (Vercel-compatible /api/datagsg.ts) ---
app.get('/api/datagsg', (req, res) => {
  void datagsgHandler(req, res);
});

// --- Property Listings API ---
app.get('/api/listings', (_req, res) => {
  res.json({ listings, isDemoDataset: true });
});

app.post('/api/listings', (req, res) => {
  const body = req.body as Partial<PropertyListing>;
  if (!body.title || !body.address || !body.price || !body.sqft) {
    res.status(400).json({ error: 'Title, address, price, and floor area (sqft) are required.' });
    return;
  }

  const price = Number(body.price);
  const sqft = Number(body.sqft);
  const currentPsf = Math.round((price / Math.max(sqft, 1)) * 100) / 100;
  const medianPsf = Number(body.districtMedianPsf) || Math.round(currentPsf * 1.04);

  const newListing: PropertyListing = {
    id: `sg-prop-${Date.now().toString().slice(-5)}`,
    title: String(body.title).trim(),
    address: String(body.address).trim(),
    district: body.district || 'D14 · Geylang / Paya Lebar',
    region: body.region || 'RCR',
    propertyType: body.propertyType || 'Condo',
    listingMode: body.listingMode || 'Rent',
    targetProfiles: Array.isArray(body.targetProfiles) && body.targetProfiles.length > 0
      ? body.targetProfiles
      : ['Families', 'Expats'],
    price,
    sqft,
    bedrooms: Number(body.bedrooms) || 2,
    bathrooms: Number(body.bathrooms) || 2,
    tenure: body.tenure || '99-year Leasehold (Demo Entry)',
    remainingLeaseYears: Number(body.remainingLeaseYears) || 85,
    nearestMrt: body.nearestMrt || 'Paya Lebar MRT (EW8/CC9)',
    mrtWalkMins: Number(body.mrtWalkMins) || 6,
    nearbySchools: Array.isArray(body.nearbySchools) && body.nearbySchools.length > 0
      ? body.nearbySchools
      : ['Kong Hwa School (0.8 km)'],
    nearbyAmenities: Array.isArray(body.nearbyAmenities) && body.nearbyAmenities.length > 0
      ? body.nearbyAmenities
      : ['PLQ Mall', 'Paya Lebar Hawker Centre'],
    districtMedianPsf: medianPsf,
    estimatedGrossYieldPct: Number(body.estimatedGrossYieldPct) || 4.0,
    historicalPsfTrend: [
      { quarter: 'Q1 2026', unitPsf: Math.round(currentPsf * 0.96), districtMedianPsf: Math.round(medianPsf * 0.97) },
      { quarter: 'Q2 2026', unitPsf: Math.round(currentPsf * 0.98), districtMedianPsf: Math.round(medianPsf * 0.98) },
      { quarter: 'Q3 2026', unitPsf: Math.round(currentPsf * 0.99), districtMedianPsf: Math.round(medianPsf * 0.99) },
      { quarter: 'Q4 2026', unitPsf: Math.round(currentPsf), districtMedianPsf: medianPsf },
    ],
    virtualTourRooms: [
      {
        id: `room-${Date.now()}`,
        room: 'Primary Living Space',
        dimensions: '5.2m × 3.8m',
        orientation: 'North-South Facing',
        highlights: 'Owner-submitted demo floor space.',
        aiInsight: 'Added via direct owner self-service listing flow (demo state).'
      }
    ],
    ownerVerifiedDemo: true,
    status: 'Active',
    imageKey: body.imageKey || 'clementi',
    description: body.description || 'Direct owner demo listing submitted through WelcomeHome SG.',
    isDemoData: true,
  };

  listings = [newListing, ...listings];
  res.status(201).json({ listing: newListing });
});

app.patch('/api/listings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: PropertyListing['status'] };
  if (!status || !['Active', 'Under Offer', 'Pending Review'].includes(status)) {
    res.status(400).json({ error: 'Valid listing status required.' });
    return;
  }
  const idx = listings.findIndex((item) => item.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }
  listings[idx] = { ...listings[idx], status };
  res.json({ listing: listings[idx] });
});

// --- Viewings API ---
app.get('/api/viewings', (_req, res) => {
  res.json({ viewings });
});

app.post('/api/viewings', (req, res) => {
  const body = req.body as Partial<ViewingAppointment>;
  if (!body.propertyId || !body.visitorName || !body.visitorEmail || !body.date || !body.timeSlot) {
    res.status(400).json({ error: 'Property, visitor name, email, date, and time slot are required.' });
    return;
  }
  if (!body.pdpaConsent) {
    res.status(400).json({ error: 'PDPA consent is required to schedule a viewing.' });
    return;
  }
  const matchedProperty = listings.find((l) => l.id === body.propertyId);
  const created: ViewingAppointment = {
    id: `vw-${Date.now().toString().slice(-5)}`,
    propertyId: body.propertyId,
    propertyTitle: matchedProperty?.title || body.propertyTitle || 'Selected Listing',
    visitorName: String(body.visitorName).trim(),
    visitorEmail: String(body.visitorEmail).trim(),
    visitorProfile: body.visitorProfile || 'Families',
    viewingFormat: body.viewingFormat || 'In-Person',
    date: body.date,
    timeSlot: body.timeSlot,
    status: 'Scheduled',
    pdpaConsent: true,
    notes: String(body.notes || '').trim(),
  };
  viewings = [created, ...viewings];
  res.status(201).json({ viewing: created });
});

app.patch('/api/viewings/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: ViewingAppointment['status'] };
  if (!status || !['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid viewing status.' });
    return;
  }
  const idx = viewings.findIndex((v) => v.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Viewing appointment not found.' });
    return;
  }
  viewings[idx] = { ...viewings[idx], status };
  res.json({ viewing: viewings[idx] });
});

// --- Maintenance Requests API ---
app.get('/api/maintenance', (_req, res) => {
  res.json({ requests: maintenanceRequests });
});

app.post('/api/maintenance', (req, res) => {
  const body = req.body as Partial<MaintenanceRequest>;
  if (!body.unitAddress || !body.category || !body.preferredDate || !body.description) {
    res.status(400).json({ error: 'Unit address, category, preferred date, and description are required.' });
    return;
  }
  if (!body.pdpaConsent) {
    res.status(400).json({ error: 'PDPA consent is required to dispatch vendor requests.' });
    return;
  }
  const costEstimates: Record<MaintenanceRequest['category'], string> = {
    'Aircon Servicing': 'S$90 – S$140 (Partner Rate)',
    'Plumbing & Leak': 'S$85 – S$180 (Partner Rate)',
    'Electrical': 'S$95 – S$210 (EMA Licensed)',
    'Housekeeping & Move-Out': 'S$160 – S$320 (Fixed Package)',
    'Elderly Safety Grab-Bar': 'S$110 – S$240 (HDB EASE Guide)',
  };

  const created: MaintenanceRequest = {
    id: `mt-${Date.now().toString().slice(-5)}`,
    unitAddress: String(body.unitAddress).trim(),
    category: body.category,
    urgency: body.urgency || 'Routine',
    preferredDate: body.preferredDate,
    estimatedCostSgd: costEstimates[body.category] || 'S$100 – S$200',
    status: 'Submitted',
    description: String(body.description).trim(),
    pdpaConsent: true,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  maintenanceRequests = [created, ...maintenanceRequests];
  res.status(201).json({ request: created });
});

app.patch('/api/maintenance/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: MaintenanceRequest['status'] };
  if (!status || !['Submitted', 'Vendor Assigned', 'In Progress', 'Resolved'].includes(status)) {
    res.status(400).json({ error: 'Invalid maintenance status.' });
    return;
  }
  const idx = maintenanceRequests.findIndex((r) => r.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Maintenance request not found.' });
    return;
  }
  maintenanceRequests[idx] = { ...maintenanceRequests[idx], status };
  res.json({ request: maintenanceRequests[idx] });
});

// --- Transaction Tracker API ---
app.get('/api/transactions', (_req, res) => {
  res.json({ transactions });
});

app.patch('/api/transactions/:id/steps/:stepId', (req, res) => {
  const { id, stepId } = req.params;
  const { status } = req.body as { status?: 'Completed' | 'In Progress' | 'Pending' };
  if (!status || !['Completed', 'In Progress', 'Pending'].includes(status)) {
    res.status(400).json({ error: 'Invalid step status.' });
    return;
  }
  const txIdx = transactions.findIndex((t) => t.id === id);
  if (txIdx === -1) {
    res.status(404).json({ error: 'Transaction record not found.' });
    return;
  }
  transactions[txIdx] = {
    ...transactions[txIdx],
    steps: transactions[txIdx].steps.map((step) =>
      step.id === stepId ? { ...step, status } : step
    ),
  };
  res.json({ transaction: transactions[txIdx] });
});

// --- Gemini AI Property Assistant API ---
app.post('/api/ai/chat', async (req, res) => {
  const { message, history, selectedPropertyId, userRole } = req.body as {
    message?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    selectedPropertyId?: string;
    userRole?: string;
  };

  if (!message || !message.trim()) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  const propertyContext = selectedPropertyId
    ? listings.find((l) => l.id === selectedPropertyId)
    : undefined;

  const contextSummary = propertyContext
    ? `\nAttached Demo Property Context:\n- Title: ${propertyContext.title}\n- Address: ${propertyContext.address} (${propertyContext.district}, ${propertyContext.region})\n- Type/Mode: ${propertyContext.propertyType} · ${propertyContext.listingMode}\n- Asking Price: S$${propertyContext.price.toLocaleString()}${propertyContext.listingMode !== 'Buy' ? '/month' : ''}\n- Floor Area: ${propertyContext.sqft} sqft (${Math.round((propertyContext.price / propertyContext.sqft) * 100) / 100} PSF vs District Demo Median ${propertyContext.districtMedianPsf} PSF)\n- Tenure: ${propertyContext.tenure}\n- Nearest MRT: ${propertyContext.nearestMrt} (${propertyContext.mrtWalkMins} min walk)\n- Nearby Schools: ${propertyContext.nearbySchools.join(', ')}\n- Nearby Amenities: ${propertyContext.nearbyAmenities.join(', ')}`
    : '\nNo specific listing attached; use general Singapore real estate knowledge and reference our demo listings where helpful.';

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful simulated fallback when GEMINI_API_KEY is absent
    const fallbackReply = propertyContext
      ? `[Simulated Assistant Mode — GEMINI_API_KEY not configured on server]\n\nHere is an indicative breakdown for **${propertyContext.title}** (${propertyContext.district}):\n- **Price vs Demo Benchmark**: Asking S$${propertyContext.price.toLocaleString()}${propertyContext.listingMode !== 'Buy' ? '/mo' : ''} (${(propertyContext.price / propertyContext.sqft).toFixed(2)} PSF) compared against our demo district median of S$${propertyContext.districtMedianPsf} PSF.\n- **Suitability**: Best aligned with ${propertyContext.targetProfiles.join(', ')} given proximity to ${propertyContext.nearestMrt} (${propertyContext.mrtWalkMins} min walk) and ${propertyContext.nearbySchools[0] || 'local amenities'}.\n- **Next Step**: Use the Affordability Calculator to verify TDSR/MSR or schedule an In-Person / AI Virtual Viewing.\n\n*Disclaimer: This response is an indicative demo analysis, not an official valuation, financial advice, or regulated CEA estate agency representation.*`
      : `[Simulated Assistant Mode — GEMINI_API_KEY not configured on server]\n\nWelcome to WelcomeHome SG. In Singapore property transactions:\n1. **Financing & Stamp Duties**: HDB/EC buyers are subject to the 30% MSR and 55% TDSR caps, plus IRAS BSD and applicable ABSD.\n2. **Renting & Co-Living**: Standard leases require an LOI, Tenancy Agreement, and IRAS e-Stamping (0.4% of total lease value).\n3. **Data Sources**: Production deployment integrates official URA SPACE, HDB Data.gov.sg, and Singpass MyInfo APIs.\n\n*Disclaimer: Indicative guidance only; does not replace licensed CEA agents, mortgage bankers, or conveyancing solicitors.*`;

    res.json({ reply: fallbackReply, mode: 'simulated' });
    return;
  }

  try {
    const recentTurns = (history || [])
      .slice(-6)
      .map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
      .join('\n');

    const systemInstruction = `You are the WelcomeHome SG AI Property Assistant, serving buyers, sellers, landlords, tenants, undergraduate students, expatriate families, elderly households, and investors in Singapore.
Strict Guardrails:
1. Never present AI price insights as official valuations (official valuations require licensed valuers / HDB / banks).
2. Never present financing figures as professional financial or legal advice.
3. Never claim the platform legally replaces regulated Council for Estate Agencies (CEA) estate agency services or conveyancing lawyers where required.
4. Clearly note when referencing sample/demo listings vs official HDB/URA/LTA rules.
5. Respect Singapore PDPA principles: never ask users to paste NRIC/FIN numbers or bank credentials.
6. Keep answers structured, concise, actionable, and grounded in Singapore real estate concepts (HDB HFE/MOP/OTP, URA districts CCR/RCR/OCR, TDSR 55%, MSR 30%, BSD/ABSD, IRAS tenancy e-stamping, MRT & school proximity).`;

    const prompt = `User Role: ${userRole || 'Home Seeker / Investor'}${contextSummary}\n\nRecent Conversation:\n${recentTurns}\n\nCurrent User Question: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.json({
      reply: response.text || 'I could not generate a response for that query. Please try rephrasing.',
      mode: 'gemini-live',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown Gemini API error';
    console.error('Gemini chat error:', msg);
    res.status(502).json({
      error: `AI Assistant service encountered an error (${msg}). Please try again shortly.`,
    });
  }
});

// --- AI Virtual Home Viewing Insight Endpoint ---
app.post('/api/ai/virtual-tour', async (req, res) => {
  const { propertyId, focusArea } = req.body as { propertyId?: string; focusArea?: string };
  const prop = listings.find((l) => l.id === propertyId);
  if (!prop) {
    res.status(404).json({ error: 'Listing not found.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.json({
      summary: `Simulated Virtual Viewing Brief for ${prop.title}: Focus on "${focusArea || 'Overall Layout & Sunlight'}". North-South/courtyard orientation helps reduce tropical afternoon heat; ${prop.nearestMrt} is ${prop.mrtWalkMins} mins away on foot. Verify actual window facing, ceiling height, and damp/plumbing checks during physical inspection.`,
      mode: 'simulated',
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Provide a concise 4-bullet AI-assisted virtual viewing checklist for this demo Singapore unit:
Title: ${prop.title} (${prop.propertyType}, ${prop.district})
Rooms: ${prop.virtualTourRooms.map((r) => `${r.room} (${r.dimensions}, ${r.orientation}): ${r.highlights}`).join(' | ')}
Focus requested by viewer: ${focusArea || 'Natural light, layout flow, and Singapore climate comfort'}
Remind the viewer briefly that AI virtual notes do not replace a physical inspection.`,
      config: {
        systemInstruction: 'You are a concise Singapore residential spatial inspection assistant. Be factual, grounded in tropical climate comfort (west sun, ventilation, noise, accessibility), and keep under 140 words.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    res.json({ summary: response.text || 'Virtual tour summary unavailable.', mode: 'gemini-live' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI virtual tour error';
    res.status(502).json({ error: msg });
  }
});

function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteInitPromise = import('vite')
      .then(({ createServer }) =>
        createServer({
          server: { middlewareMode: true },
          appType: 'spa',
        })
      )
      .then((vite) => {
        viteMiddleware = vite.middlewares;
      })
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
        throw err;
      });

    app.use((req, res, next) => {
      if (viteMiddleware) {
        viteMiddleware(req, res, next);
        return;
      }
      viteInitPromise
        .then(() => {
          if (viteMiddleware) {
            viteMiddleware(req, res, next);
          } else {
            next();
          }
        })
        .catch(next);
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WelcomeHome SG server listening on http://localhost:${PORT}`);
  });
}

startServer();
