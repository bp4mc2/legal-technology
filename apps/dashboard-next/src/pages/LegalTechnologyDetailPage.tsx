import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../utils/api';

type MediaDocumentationPayload = {
  technology_id: string;
  section_title: string;
  content: string;
  source: string;
  correlation_id: string;
};

type LegalTechnologyDocumentation = {
  beoogdGebruik?: string;
  toegevoegdeWaarde?: string;
  onderdelen?: string;
  ontwikkelingEnBeheer?: string;
};

type LegalTechnologyDetail = {
  id?: string;
  naam?: string;
  gebruiksstatus?: string;
  technologietype?: string;
  documentatie?: LegalTechnologyDocumentation;
};

type DocumentationError = {
  message: string;
  source: string;
  correlationId: string;
};

type DocumentationView = 'media' | 'technology';

const asText = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

export default function LegalTechnologyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const technologyId = (id ?? '').trim();
  const [detail, setDetail] = useState<LegalTechnologyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [mediaDocumentation, setMediaDocumentation] = useState<MediaDocumentationPayload | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<DocumentationError | null>(null);
  const [documentationView, setDocumentationView] = useState<DocumentationView>('media');
  const latestDocumentationRequestId = useRef(0);
  const activeDocumentationAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!technologyId) {
      setDetailError('Missing legal technology id.');
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    void apiFetch<LegalTechnologyDetail>(`/api/legaltechnologies/${encodeURIComponent(technologyId)}`)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setDetail(payload);
      })
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }
        const message = caughtError instanceof Error ? caughtError.message : 'Could not load legal technology detail.';
        setDetailError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [technologyId]);

  const requestMediaDocumentation = (targetTechnologyId: string) => {
    activeDocumentationAbortController.current?.abort();
    const controller = new AbortController();
    activeDocumentationAbortController.current = controller;
    latestDocumentationRequestId.current += 1;
    const requestId = latestDocumentationRequestId.current;

    setMediaLoading(true);
    setMediaError(null);

    void apiFetch<MediaDocumentationPayload>(
      `/api/legaltechnologies/${encodeURIComponent(targetTechnologyId)}/documentation`,
      { signal: controller.signal },
    )
      .then((payload) => {
        if (requestId !== latestDocumentationRequestId.current) {
          return;
        }
        setMediaDocumentation(payload);
      })
      .catch((caughtError) => {
        if (controller.signal.aborted || requestId !== latestDocumentationRequestId.current) {
          return;
        }

        const fallbackCorrelation = `doc-${requestId}`;
        if (caughtError instanceof ApiError) {
          setMediaError({
            message: 'Documentation unavailable.',
            source: caughtError.source ?? 'media/legal-technologies.md',
            correlationId: caughtError.correlationId ?? fallbackCorrelation,
          });
        } else {
          setMediaError({
            message: 'Documentation unavailable.',
            source: 'media/legal-technologies.md',
            correlationId: fallbackCorrelation,
          });
        }
        setMediaDocumentation(null);
      })
      .finally(() => {
        if (requestId === latestDocumentationRequestId.current) {
          setMediaLoading(false);
        }
      });
  };

  useEffect(() => {
    if (!technologyId || detailError) {
      return;
    }

    requestMediaDocumentation(technologyId);

    return () => {
      activeDocumentationAbortController.current?.abort();
    };
  }, [technologyId, detailError]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  if (detailLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-600">Loading legal technology detail...</p>
      </main>
    );
  }

  if (detailError) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          <strong>Could not load legal technology detail.</strong>
          <p>{detailError}</p>
        </div>
        <button
          type="button"
          className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
          onClick={goBack}
        >
          Back to discovery
        </button>
      </main>
    );
  }

  const technologyName = asText(detail?.naam, technologyId || 'Unknown technology');
  const technologyDocumentation = detail?.documentatie;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="mb-4 text-sm font-semibold text-cyan-800 underline underline-offset-4"
          onClick={goBack}
        >
          Back to discovery
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">legal technology detail</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">{technologyName}</h1>
              <p className="mt-2 text-sm text-slate-600">Dedicated documentation page with media and legal-technology sections.</p>
            </div>
            <div className="grid gap-2 text-xs text-slate-700">
              {detail?.technologietype && (
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-semibold text-cyan-900 ring-1 ring-cyan-200">
                  {detail.technologietype}
                </span>
              )}
              {detail?.gebruiksstatus && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800 ring-1 ring-slate-300">
                  {detail.gebruiksstatus}
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm font-medium text-slate-800">Active technology: {technologyName}</p>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Documentation views">
            <button
              type="button"
              role="tab"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                documentationView === 'media' ? 'bg-cyan-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
              aria-selected={documentationView === 'media'}
              onClick={() => setDocumentationView('media')}
            >
              Media documentation
            </button>
            <button
              type="button"
              role="tab"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                documentationView === 'technology' ? 'bg-cyan-700 text-white' : 'border border-slate-300 bg-white text-slate-700'
              }`}
              aria-selected={documentationView === 'technology'}
              onClick={() => setDocumentationView('technology')}
            >
              Legal technology documentation
            </button>
          </div>

          {documentationView === 'media' && (
            <article className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Workspace documentation">
              <h2 className="text-base font-semibold">Media documentation area</h2>
              <button
                type="button"
                className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                onClick={() => requestMediaDocumentation(technologyId)}
                disabled={!technologyId || mediaLoading}
              >
                Retry media documentation
              </button>

              {mediaLoading && <p className="mt-3 text-sm text-slate-600">Loading media documentation...</p>}
              {!mediaLoading && mediaError && (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="status">
                  <strong>{mediaError.message}</strong>
                  <p>Source: {mediaError.source}</p>
                  <p>Correlation ID: {mediaError.correlationId}</p>
                </div>
              )}
              {!mediaLoading && !mediaError && mediaDocumentation && (
                <>
                  <p className="mt-3 text-sm text-slate-600">Source: {mediaDocumentation.source}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{mediaDocumentation.content}</pre>
                </>
              )}
            </article>
          )}

          {documentationView === 'technology' && (
            <section className="mt-4 grid gap-3" aria-live="polite">
              <h2 className="text-base font-semibold">Legal technology documentation</h2>
              {technologyDocumentation?.beoogdGebruik && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">Beoogd gebruik</h3>
                  <p className="mt-1 text-sm text-slate-700">{technologyDocumentation.beoogdGebruik}</p>
                </div>
              )}
              {technologyDocumentation?.toegevoegdeWaarde && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">Toegevoegde waarde</h3>
                  <p className="mt-1 text-sm text-slate-700">{technologyDocumentation.toegevoegdeWaarde}</p>
                </div>
              )}
              {technologyDocumentation?.onderdelen && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">Onderdelen</h3>
                  <p className="mt-1 text-sm text-slate-700">{technologyDocumentation.onderdelen}</p>
                </div>
              )}
              {technologyDocumentation?.ontwikkelingEnBeheer && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold">Ontwikkeling &amp; beheer</h3>
                  <p className="mt-1 text-sm text-slate-700">{technologyDocumentation.ontwikkelingEnBeheer}</p>
                </div>
              )}
              {!technologyDocumentation && (
                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Legal technology documentation content">
                  <p>No legal technology documentation fields are available for this item.</p>
                </article>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
