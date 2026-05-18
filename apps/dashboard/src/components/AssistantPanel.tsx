import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

type AssistantLanguage = 'nl' | 'en';

type AssistantResponse = {
  intent: string;
  action: string;
  parameters: Record<string, any>;
  summary: string;
  error?: string;
  timestamp?: string;
  language?: string;
};

type AssistantStatus = {
  status: string;
  provider: string;
  runtime: string;
  model?: string;
  model_available: boolean;
  models?: string[];
  message?: string;
};

const AssistantPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [lang, setLang] = useState<AssistantLanguage>('nl');
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  // Fetch assistant status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await apiFetch<AssistantStatus>('/api/assistant/status');
        setStatus(result);
      } catch (e) {
        setStatus({
          status: 'error',
          provider: 'docker',
          runtime: 'unknown',
          model_available: false,
          message: 'Could not check status',
        });
      }
    };
    checkStatus();
  }, []);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const result = await apiFetch<AssistantResponse>('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          language: lang,
        }),
      });
      setResponse(result);
    } catch (e: any) {
      setResponse({
        intent: 'error',
        action: 'error',
        parameters: {},
        summary: `${lang === 'nl' ? 'Fout' : 'Error'}: ${e.message}`,
        error: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!status) return '#999';
    if (status.status === 'ok' && status.model_available) return '#28a745';
    if (status.runtime === 'running') return '#ffc107';
    return '#dc3545';
  };

  const getStatusText = () => {
    if (!status) return '?';
    if (status.status === 'ok' && status.model_available) return '✓ Ready';
    if (status.runtime === 'running' && !status.model_available)
      return lang === 'nl' ? 'Model laden...' : 'Loading model...';
    return lang === 'nl' ? 'Niet beschikbaar' : 'Not available';
  };

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      search: '#2196f3',
      add: '#28a745',
      edit: '#ff9800',
      delete: '#dc3545',
      show: '#9c27b0',
      stats: '#00bcd4',
      info: '#607d8b',
      error: '#dc3545',
    };
    return colors[intent] || '#666';
  };

  const statusToneStyle = (): React.CSSProperties => ({
    ['--lt-assistant-tone' as any]: getStatusColor(),
    backgroundColor: getStatusColor(),
  });

  const responseToneStyle = (intent: string): React.CSSProperties => ({
    borderLeftColor: getIntentColor(intent),
  });

  return (
    <div className="lt-panel-shell lt-assistant">
      <div className="lt-assistant-header">
        <h3 className="lt-assistant-title">🤖 Natural Language Assistant</h3>
        <button
          type="button"
          onClick={() => setShowStatus(!showStatus)}
          style={statusToneStyle()}
          className={`lt-assistant-status-toggle${!status ? ' is-disabled' : ''}`}
        >
          {getStatusText()}
        </button>
      </div>

      {showStatus && status && (
        <div className="lt-assistant-status-card" style={{ borderLeftColor: getStatusColor() }}>
          <div>
            <strong>Status:</strong> {status.status}
          </div>
          <div>
            <strong>Provider:</strong> {status.provider}
          </div>
          <div>
            <strong>Runtime:</strong> {status.runtime}
          </div>
          {status.model && (
            <div>
              <strong>Model:</strong> {status.model}
            </div>
          )}
          <div>
            <strong>Model Available:</strong> {status.model_available ? 'Yes ✓' : 'No ✗'}
          </div>
          {status.models && status.models.length > 0 && (
            <div>
              <strong>Models:</strong> {status.models.join(', ')}
            </div>
          )}
          {status.message && (
            <div className="lt-assistant-status-message">
              <strong>Message:</strong> {status.message}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAsk} className="lt-assistant-form">
        <div className="lt-assistant-row">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as 'nl' | 'en')}
            className="form-select lt-assistant-lang"
          >
            <option value="nl">🇳🇱 Nederlands</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </div>

        <textarea
          placeholder={
            lang === 'nl'
              ? 'Stel een vraag in natuurlijke taal... Bijv: "Zoek alle methodes voor regelgeving", "Voeg een tool toe", "Toon statistieken"'
              : 'Ask a question in natural language... E.g: "Find all methods for legislation", "Add a tool", "Show statistics"'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="form-control lt-assistant-textarea"
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim() || !status?.model_available}
          className="btn btn-primary lt-assistant-submit"
        >
          {loading ? (lang === 'nl' ? 'Verwerking...' : 'Processing...') : lang === 'nl' ? 'Vraag' : 'Ask'}
        </button>
      </form>

      {response && (
        <div
          className={`lt-assistant-response${response.intent === 'error' ? ' is-error' : ''}`}
          style={responseToneStyle(response.intent)}
        >
          <div className="lt-assistant-block">
            <div className="lt-assistant-kicker" style={{ color: getIntentColor(response.intent) }}>
              Intent: <span style={{ textTransform: 'uppercase' }}>{response.intent}</span>
            </div>
            {response.action && (
              <div className="lt-assistant-action">
                Action: {response.action}
              </div>
            )}
          </div>

          <div className="lt-assistant-block">
            <div className="lt-assistant-kicker">
              {lang === 'nl' ? '📋 Samenvatting' : '📋 Summary'}:
            </div>
            <div className="lt-assistant-surface">
              {response.summary}
            </div>
          </div>

          {Object.keys(response.parameters || {}).length > 0 && (
            <div className="lt-assistant-block">
              <div className="lt-assistant-kicker">
                {lang === 'nl' ? '⚙️ Parameters' : '⚙️ Parameters'}:
              </div>
              <div className="lt-assistant-surface lt-assistant-json">
                <pre>
                  {JSON.stringify(response.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {response.error && (
            <div className="lt-assistant-error">
              <strong>Error:</strong> {response.error}
            </div>
          )}

          {response.timestamp && (
            <div className="lt-assistant-time">
              {new Date(response.timestamp).toLocaleTimeString(lang === 'nl' ? 'nl-NL' : 'en-US')}
            </div>
          )}
        </div>
      )}

      <div className="lt-assistant-tips">
        <strong>{lang === 'nl' ? '💡 Tips:' : '💡 Tips:'}</strong>
        <ul>
          {lang === 'nl' ? (
            <>
              <li>Stel vragen in natuurlijke taal</li>
              <li>Bijv: "Laat alle standaarden zien", "Voeg een methode toe voor regelgeving"</li>
              <li>De assistent zal je vraag begrijpen en structureren</li>
              <li>Zorg dat Docker model runtime (of Ollama fallback) lokaal draait met Mistral model</li>
            </>
          ) : (
            <>
              <li>Ask questions in natural language</li>
              <li>E.g: "Show all standards", "Add a method for legislation"</li>
              <li>The assistant will understand and structure your question</li>
              <li>Make sure Docker model runtime (or Ollama fallback) is running locally with Mistral</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default AssistantPanel;
