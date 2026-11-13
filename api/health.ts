export interface ServerlessRequest {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
}

export interface ServerlessResponse {
  statusCode?: number;
  status?: (code: number) => ServerlessResponse;
  json?: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  end?: (chunk?: string) => void;
}

const COLLECTION_189_METADATA_URL =
  'https://api-production.data.gov.sg/v2/public/api/collections/189/metadata';

function sendJson(res: ServerlessResponse, statusCode: number, body: unknown): void {
  if (typeof res.status === 'function') {
    const statusRes = res.status(statusCode);
    if (typeof statusRes.json === 'function') {
      statusRes.json(body);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader?.('Content-Type', 'application/json; charset=utf-8');
  res.end?.(JSON.stringify(body));
}

function readQueryParam(req: ServerlessRequest, key: string): string {
  const val = req.query?.[key];
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  if (req.url && req.url.includes('?')) {
    const search = new URLSearchParams(req.url.split('?')[1]);
    return search.get(key) ?? '';
  }
  return '';
}

export default async function handler(
  req: ServerlessRequest,
  res: ServerlessResponse
): Promise<void> {
  res.setHeader?.('Cache-Control', 'no-store');

  const probeUpstream = readQueryParam(req, 'probe') === 'true';
  const dataGovKeyConfigured = Boolean(
    process.env.DATA_GOV_SG_API_KEY && process.env.DATA_GOV_SG_API_KEY.trim().length > 0
  );
  const geminiKeyConfigured = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim().length > 0 &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
  );

  let upstreamStatus: {
    reachable: boolean;
    statusCode?: number;
    latencyMs?: number;
    error?: string;
  } | null = null;

  if (probeUpstream) {
    const started = Date.now();
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (dataGovKeyConfigured && process.env.DATA_GOV_SG_API_KEY) {
        headers['x-api-key'] = process.env.DATA_GOV_SG_API_KEY;
      }
      const resp = await fetch(COLLECTION_189_METADATA_URL, {
        headers,
        signal: AbortSignal.timeout(6000),
      });
      upstreamStatus = {
        reachable: resp.ok,
        statusCode: resp.status,
        latencyMs: Date.now() - started,
      };
    } catch (err: unknown) {
      upstreamStatus = {
        reachable: false,
        latencyMs: Date.now() - started,
        error: err instanceof Error ? err.message : 'Upstream probe failed',
      };
    }
  }

  sendJson(res, 200, {
    ok: true,
    status: 'healthy',
    service: 'WelcomeHome SG Serverless API',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      dataGovSgCollectionId: '189',
      dataGovSgPublicAccess: true,
      dataGovSgApiKeyConfigured: dataGovKeyConfigured,
      geminiApiKeyConfigured: geminiKeyConfigured,
    },
    ...(upstreamStatus ? { upstream: upstreamStatus } : {}),
  });
}
