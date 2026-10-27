import React, { useState, useEffect } from 'react';
import {
  generateEmbedSnippets,
  checkPhonePermissions,
  requestAllPhonePermissions,
  PhonePermissionsStatus
} from '../utils/polyglot-sdk';
import {
  Code2,
  Smartphone,
  Server,
  Globe,
  Copy,
  Check,
  ShieldCheck,
  Camera,
  Mic,
  Search,
  Sparkles,
  X,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface IntegrationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntegrationStudioModal: React.FC<IntegrationStudioModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'website' | 'mobile' | 'backend' | 'permissions' | 'search_grounding'>('website');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Phone permissions status
  const [permStatus, setPermStatus] = useState<PhonePermissionsStatus | null>(null);
  const [permTestMessage, setPermTestMessage] = useState<string | null>(null);

  // Search grounding playground
  const [searchQuery, setSearchQuery] = useState('What are the latest regional variations in American Sign Language?');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkPhonePermissions().then(setPermStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://polyglot-asl.app';
  const snippets = generateEmbedSnippets(appOrigin);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestPhonePermissions = async () => {
    setPermTestMessage('Requesting camera & microphone access...');
    const result = await requestAllPhonePermissions();
    if (result.cameraGranted && result.micGranted) {
      setPermTestMessage('Permissions successfully granted! Your phone is fully configured for real-time ASL seeing and speech hearing.');
    } else {
      setPermTestMessage(result.error || 'Permissions partially granted. Ensure camera & mic are enabled in browser settings.');
    }
    checkPhonePermissions().then(setPermStatus);
  };

  const handleRunSearchGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/grounded-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      setSearchResult({ answer: 'Search grounding failed to reach server.', fallback: true });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="integration-modal-title"
    >
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="integration-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                POLYGLOT Universal Integration Suite
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                  v2.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Embed into any website, mobile app (iOS / Android), or backend API in minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close integration studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('website')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'website'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Website Embeds
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mobile'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Phones (iOS & Android)
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Phone Permissions Bridge
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backend'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Backend REST APIs
          </button>
          <button
            onClick={() => setActiveTab('search_grounding')}
            className={`py-3 px-3.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'search_grounding'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 text-amber-400" />
            Google Search Grounding
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* TAB 1: WEBSITE EMBEDS */}
          {activeTab === 'website' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    Option A: Responsive iFrame Embed (WordPress, Shopify, Webflow, Squarespace)
                  </span>
                  <button
                    onClick={() => handleCopy(snippets.iframeSnippet, 'iframe')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'iframe' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {snippets.iframeSnippet}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    Option B: React / Next.js Component
                  </span>
                  <button
                    onClick={() => handleCopy(snippets.reactComponent, 'react')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'react' ? 'Copied!' : 'Copy React Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {snippets.reactComponent}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE APPS */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                POLYGLOT can run inside iOS and Android mobile native apps via WebViews with native hardware acceleration:
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white">
                    React Native (react-native-webview)
                  </span>
                  <button
                    onClick={() => handleCopy(snippets.reactNativeWebView, 'rn')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'rn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'rn' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {snippets.reactNativeWebView}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white">
                    Flutter (webview_flutter)
                  </span>
                  <button
                    onClick={() => handleCopy(snippets.flutterWebView, 'flutter')}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {copiedKey === 'flutter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'flutter' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto">
                  {snippets.flutterWebView}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: PHONE PERMISSIONS BRIDGE */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
                <span className="font-semibold block mb-1">Mobile Device Hardware Permissions:</span>
                For POLYGLOT to "see" live ASL hand gestures and "hear" live speech on smartphones (iPhone/Android), camera and microphone permissions are requested over HTTPS.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Camera Hardware</div>
                      <div className="text-[10px] text-slate-400">For 21-point ASL landmark tracking</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    permStatus?.camera === 'granted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {permStatus?.camera || 'Checking...'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Microphone Input</div>
                      <div className="text-[10px] text-slate-400">For live speech-to-ASL hearing</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    permStatus?.microphone === 'granted'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {permStatus?.microphone || 'Checking...'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleTestPhonePermissions}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Request & Test Mobile Permissions Now
              </button>

              {permTestMessage && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                  {permTestMessage}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BACKEND REST APIS */}
          {activeTab === 'backend' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Connect your custom backend (Node, Python, Go, Java) directly to POLYGLOT's endpoints:
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-white font-mono font-bold mb-1">
                    <span className="text-emerald-400">POST /api/translate</span>
                    <span className="text-[10px] text-slate-500">JSON</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">Translates text in any language to ASL gloss & non-manual facial markers.</p>
                  <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto">
                    {`curl -X POST ${appOrigin}/api/translate \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Where is the library?", "sourceLang": "en"}'`}
                  </pre>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-white font-mono font-bold mb-1">
                    <span className="text-emerald-400">POST /api/see-asl</span>
                    <span className="text-[10px] text-slate-500">Base64 Vision</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">Analyzes camera frame using Gemini 3.8 Flash to identify sign and transcribe.</p>
                  <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto">
                    {`curl -X POST ${appOrigin}/api/see-asl \\
  -H "Content-Type: application/json" \\
  -d '{"imageData": "<base64_jpeg>", "targetLanguage": "Spanish"}'`}
                  </pre>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-white font-mono font-bold mb-1">
                    <span className="text-emerald-400">GET /api/health</span>
                    <span className="text-[10px] text-slate-500">Healthcheck</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Returns service status, capabilities, and version.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE SEARCH GROUNDING */}
          {activeTab === 'search_grounding' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                <span className="font-semibold block mb-1">Google Search Grounding Active:</span>
                Powered by `gemini-3.8-flash` with the Google Search tool to answer up-to-date questions about regional ASL variants, international sign languages, and Deaf culture events.
              </div>

              <form onSubmit={handleRunSearchGrounding} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Ask a question grounded in Google Search..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearching ? 'Searching...' : 'Search'}</span>
                </button>
              </form>

              {searchResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Grounded Research Response:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {searchResult.answer}
                  </p>
                  {searchResult.searchQueries && searchResult.searchQueries.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Google Search Queries:</span>
                      <span className="font-mono text-indigo-400">
                        {searchResult.searchQueries.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-xs text-slate-400">
            OpenAPI 3.1 & SDK specification available at <code className="text-indigo-400">/api/health</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
