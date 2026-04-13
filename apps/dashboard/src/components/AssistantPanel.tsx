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

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ color: '#ad1457', fontWeight: 600, margin: 0 }}>🤖 Natural Language Assistant</h3>
        <button
          onClick={() => setShowStatus(!showStatus)}
          style={{
            padding: '6px 12px',
            backgroundColor: getStatusColor(),
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 'bold',
          }}
        >
          {getStatusText()}
        </button>
      </div>

      {showStatus && status && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#f5f5f5',
            borderRadius: 4,
            marginBottom: 12,
            fontSize: 12,
            borderLeft: `4px solid ${getStatusColor()}`,
          }}
        >
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
            <div style={{ color: '#dc3545', marginTop: 8 }}>
              <strong>Message:</strong> {status.message}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAsk} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as 'nl' | 'en')}
            style={{
              flex: 0.3,
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: 14,
            }}
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
          style={{
            padding: '10px',
            borderRadius: 4,
            border: '1px solid #ddd',
            fontFamily: 'inherit',
            fontSize: 14,
            resize: 'vertical',
          }}
        />

        <button
          type="submit"
          disabled={loading || !prompt.trim() || !status?.model_available}
          style={{
            padding: '10px 16px',
            backgroundColor: loading || !prompt.trim() || !status?.model_available ? '#ccc' : '#ad1457',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading || !prompt.trim() || !status?.model_available ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: 14,
          }}
        >
          {loading ? (lang === 'nl' ? 'Verwerking...' : 'Processing...') : lang === 'nl' ? 'Vraag' : 'Ask'}
        </button>
      </form>

      {response && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: response.intent === 'error' ? '#ffebee' : '#f9f9f9',
            borderRadius: 4,
            borderLeft: `4px solid ${getIntentColor(response.intent)}`,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 'bold', color: getIntentColor(response.intent), marginBottom: 4 }}>
              Intent: <span style={{ textTransform: 'uppercase' }}>{response.intent}</span>
            </div>
            {response.action && (
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                Action: {response.action}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {lang === 'nl' ? '📋 Samenvatting' : '📋 Summary'}:
            </div>
            <div style={{ padding: 10, backgroundColor: '#fff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>
              {response.summary}
            </div>
          </div>

          {Object.keys(response.parameters || {}).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {lang === 'nl' ? '⚙️ Parameters' : '⚙️ Parameters'}:
              </div>
              <div style={{ padding: 10, backgroundColor: '#fff', borderRadius: 4, fontSize: 12 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(response.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {response.error && (
            <div style={{ padding: 10, backgroundColor: '#ffebee', borderRadius: 4, color: '#c62828', fontSize: 12 }}>
              <strong>Error:</strong> {response.error}
            </div>
          )}

          {response.timestamp && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
              {new Date(response.timestamp).toLocaleTimeString(lang === 'nl' ? 'nl-NL' : 'en-US')}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#f0f4f8',
          borderRadius: 4,
          fontSize: 12,
          color: '#555',
        }}
      >
        <strong>{lang === 'nl' ? '💡 Tips:' : '💡 Tips:'}</strong>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
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
