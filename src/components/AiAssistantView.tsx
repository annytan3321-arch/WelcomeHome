import React, { useEffect, useState } from 'react';
import { Bot, Send, ShieldAlert, User } from 'lucide-react';
import type { PropertyListing } from '../data/properties.ts';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
}

interface AiAssistantViewProps {
  listings: PropertyListing[];
  initialPropertyId?: string;
}

const STARTER_PROMPTS = [
  'Compare renting a 3BR condo near NUS vs Orchard co-living for 2 undergrad students.',
  'Walk me through HDB Option to Purchase (OTP), HFE letter, and stamp duty timelines.',
  'How do ABSD and TDSR (55%) affect a Singapore PR buying a second private condo?',
  'What should an elderly homeowner check when downsizing to a 4-room HDB flat?',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  listings,
  initialPropertyId,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    initialPropertyId || listings[0]?.id || ''
  );

  useEffect(() => {
    if (initialPropertyId) {
      setSelectedPropertyId(initialPropertyId);
    }
  }, [initialPropertyId]);

  const [userRole, setUserRole] = useState<string>('Home Buyer / Tenant');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Hello! I am the WelcomeHome SG AI Property Assistant. Attach any live HDB resale record on the left or ask me about Singapore HDB/URA districts, indicative price benchmarks, ABSD/BSD stamp duties, co-living suitability, or transaction checklists.\n\nNote: My responses provide indicative guidance and are not official valuations, financial advice, or regulated CEA estate agency advice.',
    },
  ]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedPropertyId: selectedPropertyId || undefined,
          userRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Assistant could not process request.');
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          mode: data.mode,
        },
      ]);
    } catch {
      setErrorMsg('Unable to reach server AI endpoint. Please check connection and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const selectedProp = listings.find((l) => l.id === selectedPropertyId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-emerald-700">Gemini Server-Side Integration · Singapore PropTech Context</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          AI Property Assistant
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask questions about Singapore districts, lease terms, stamp duties, co-living fit, or request an indicative breakdown for a selected live HDB record.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Context Sidebar */}
        <div className="lg:col-span-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Your Profile Perspective</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option>Home Buyer / Upgrader</option>
              <option>Tenant / Expatriate Family</option>
              <option>Undergraduate Student (NUS/SMU/NTU)</option>
              <option>Property Owner / Landlord</option>
              <option>Elderly Downsizing Household</option>
              <option>Residential Property Investor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Attach Live HDB Transaction Context</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">General Singapore Market (No Unit Attached)</option>
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {item.town || item.district}
                </option>
              ))}
            </select>
          </div>

          {selectedProp && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
              <p className="font-semibold text-slate-900">{selectedProp.title}</p>
              <p className="text-slate-600">{selectedProp.district}</p>
              <p className="font-mono text-slate-800 tabular-nums">
                S${selectedProp.price.toLocaleString()} · {selectedProp.sqft.toLocaleString()} sqft
              </p>
              <p className="text-slate-500">
                {selectedProp.flatModel || selectedProp.propertyType} · {selectedProp.remainingLease || selectedProp.tenure}
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-700">Quick Singapore Prompts</p>
            <div className="mt-2 space-y-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left text-xs text-slate-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <span>
              PDPA & Regulatory Notice: Do not enter NRIC/FIN numbers or bank details. AI outputs are informational only, not CEA agency or financial advice.
            </span>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-8 flex h-[600px] flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  {msg.content}
                  {msg.mode && (
                    <span className="mt-2 block text-[11px] text-slate-400">
                      Response mode: {msg.mode === 'gemini-live' ? 'Gemini AI Live' : 'Simulated Demo Fallback'}
                    </span>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Analyzing Singapore property context...
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {errorMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-slate-50 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about PSF comparison, ABSD, HDB OTP, student co-living, or amenities..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
