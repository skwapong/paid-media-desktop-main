import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

const DEFAULT_LLM_PROXY_URL = 'https://llm-proxy.us01.treasuredata.com';

const TDX_REGIONS = [
  { value: 'https://api.treasuredata.com', label: 'US (api.treasuredata.com)' },
  { value: 'https://api.eu01.treasuredata.com', label: 'EU (api.eu01.treasuredata.com)' },
  { value: 'https://api.ap01.treasuredata.com', label: 'AP01 (api.ap01.treasuredata.com)' },
  { value: 'https://api.ap02.treasuredata.com', label: 'AP02 (api.ap02.treasuredata.com)' },
  { value: 'https://api.ap03.treasuredata.com', label: 'AP03 (api.ap03.treasuredata.com)' },
];

const MODEL_OPTIONS = [
  { value: '', label: 'Default (Sonnet)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { value: 'claude-haiku-3-5-20241022', label: 'Claude 3.5 Haiku' },
];

export default function SettingsPage() {
  const { organizationId } = useAppStore();

  // TDX account state
  const [tdxApiKey, setTdxApiKey] = useState('');
  const [tdxEndpoint, setTdxEndpoint] = useState(TDX_REGIONS[0].value);
  const [tdxDatabase, setTdxDatabase] = useState('');

  // AI configuration state
  const [apiKey, setApiKey] = useState('');
  const [llmProxyUrl, setLlmProxyUrl] = useState(DEFAULT_LLM_PROXY_URL);
  const [model, setModel] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.paidMediaSuite?.settings.get();
        if (settings) {
          if (settings.tdxApiKey) setTdxApiKey(settings.tdxApiKey as string);
          if (settings.tdxEndpoint) setTdxEndpoint(settings.tdxEndpoint as string);
          if (settings.tdxDatabase) setTdxDatabase(settings.tdxDatabase as string);
          if (settings.apiKey) setApiKey(settings.apiKey as string);
          if (settings.llmProxyUrl) setLlmProxyUrl(settings.llmProxyUrl as string);
          if (settings.model) setModel(settings.model as string);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await window.paidMediaSuite?.settings.set({
        tdxApiKey: tdxApiKey || undefined,
        tdxEndpoint: tdxEndpoint || TDX_REGIONS[0].value,
        tdxDatabase: tdxDatabase || undefined,
        apiKey,
        llmProxyUrl: llmProxyUrl || DEFAULT_LLM_PROXY_URL,
        model: model || undefined,
      });
      setSaveMessage('Configuration saved successfully.');
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveMessage('Failed to save configuration.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleTestConnection = async () => {
    await handleSaveAll();
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await window.paidMediaSuite?.settings.testConnection();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Failed to run connection test.' });
    } finally {
      setIsTesting(false);
    }
  };

  const snippetCode = `<!-- Web Personalization Snippet -->
<script>
  (function(w, d, s, o) {
    w['WPT'] = o;
    w[o] = w[o] || function() { (w[o].q = w[o].q || []).push(arguments) };
    var js = d.createElement(s);
    js.src = 'https://cdn.yourapp.com/snippet.js';
    js.async = true;
    js.setAttribute('data-org-id', '${organizationId}');
    d.head.appendChild(js);
  })(window, document, 'script', 'wpt');
</script>`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Configure your personalization settings</p>
      </div>

      <div className="p-6 space-y-6 max-w-3xl">
        {/* TDX Account Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">TDX Account</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect to your Treasure Data account for segments, audiences, and data access.
          </p>

          <div className="space-y-4">
            {/* API Endpoint / Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <select
                value={tdxEndpoint}
                onChange={(e) => setTdxEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {TDX_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select the region where your Treasure Data account is hosted.
              </p>
            </div>

            {/* TDX API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TDX API Key
              </label>
              <input
                type="password"
                value={tdxApiKey}
                onChange={(e) => setTdxApiKey(e.target.value)}
                placeholder="1/xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                Your Treasure Data API master key from TD Console. Used for TDX CLI, segments, and data queries.
              </p>
            </div>

            {/* Database */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database
              </label>
              <input
                type="text"
                value={tdxDatabase}
                onChange={(e) => setTdxDatabase(e.target.value)}
                placeholder="e.g. cdp_audience"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                The Treasure Data database containing your audience tables (optional).
              </p>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {tdxApiKey ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500">TDX API key configured</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">No TDX API key configured</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">AI Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure the LLM proxy connection for AI-powered campaign creation.
          </p>

          <div className="space-y-4">
            {/* LLM Proxy URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LLM Proxy URL
              </label>
              <input
                type="text"
                value={llmProxyUrl}
                onChange={(e) => setLlmProxyUrl(e.target.value)}
                placeholder={DEFAULT_LLM_PROXY_URL}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                The Treasure Data LLM proxy endpoint.
              </p>
            </div>

            {/* LLM API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LLM Proxy API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="1/xxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                API key for authenticating with the LLM proxy. May differ from the TDX API key.
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {apiKey ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-500">LLM API key configured</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span className="text-xs text-gray-500">No LLM API key configured (demo mode active)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save & Test — shared for both sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || (!apiKey && !tdxApiKey)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>

          {/* Connection test result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {testResult.success ? (
                'Connection successful! The proxy accepted your API key.'
              ) : (
                <div>
                  <span className="font-medium">Connection failed:</span>{' '}
                  {testResult.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Installation Snippet */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Installation Snippet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Add this code snippet to your website&apos;s &lt;head&gt; tag to enable personalization.
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre">{snippetCode}</pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(snippetCode)}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700"
          >
            Copy to clipboard
          </button>
        </div>

        {/* Profile Attributes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Profile Attributes</h3>
          <p className="text-sm text-gray-500 mb-4">
            Define custom attributes that can be used for audience segmentation.
          </p>
          <div className="space-y-2">
            {[
              { name: 'industry', type: 'string' },
              { name: 'company_size', type: 'string' },
              { name: 'country', type: 'string' },
              { name: 'device_type', type: 'string' },
              { name: 'returning_visitor', type: 'boolean' },
            ].map((attr) => (
              <div key={attr.name} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="font-mono text-sm text-gray-700">{attr.name}</span>
                <span className="text-xs text-gray-500">{attr.type}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-primary-600 hover:text-primary-700">
            + Add attribute
          </button>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect external services to enhance personalization.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Bynder', description: 'Digital Asset Management', connected: false },
              { name: 'Adobe AEM', description: 'Digital Asset Management', connected: false },
              { name: 'Segment', description: 'Customer Data Platform', connected: false },
              { name: 'Salesforce', description: 'CRM', connected: false },
            ].map((integration) => (
              <div key={integration.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{integration.name}</span>
                  {integration.connected ? (
                    <span className="text-xs text-green-600">Connected</span>
                  ) : (
                    <button className="text-xs text-primary-600 hover:text-primary-700">
                      Connect
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
