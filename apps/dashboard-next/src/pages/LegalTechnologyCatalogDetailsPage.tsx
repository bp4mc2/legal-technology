import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

type CatalogResponse = {
  title?: string;
  content?: string;
  source?: string;
  section_count?: number;
  correlation_id?: string;
};

type CatalogSection = {
  anchor: string;
  title: string;
  body: string;
};

const FRONT_MATTER_PATTERN = /^---\n[\s\S]*?\n---\n?/;
const SECTION_PATTERN = /<section\s+id="([^"]+)">([\s\S]*?)<\/section>/g;

const stripFrontMatter = (value: string) => value.replace(FRONT_MATTER_PATTERN, '').trim();

const extractTitle = (sectionBody: string, fallback: string) => {
  const line = sectionBody
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('## '));

  if (line) {
    return line.slice(3).trim() || fallback;
  }

  return fallback;
};

const parseCatalogSections = (markdown: string): CatalogSection[] => {
  const sections: CatalogSection[] = [];
  const matches = markdown.matchAll(SECTION_PATTERN);

  for (const match of matches) {
    const anchor = (match[1] ?? '').trim();
    const body = (match[2] ?? '').trim();
    if (!anchor || !body) {
      continue;
    }

    sections.push({
      anchor,
      title: extractTitle(body, anchor),
      body,
    });
  }

  return sections;
};

const stripLeadingSectionHeading = (value: string) => value.replace(/^##\s+.+\n+/, '').trim();

const parseOverview = (markdown: string) => {
  const headingMatch = markdown.match(/^#\s+Technologie(?:e|ë)n\s*$/m);
  const markerIndex = headingMatch ? headingMatch.index ?? -1 : -1;
  if (markerIndex === -1) {
    return markdown;
  }

  return markdown.slice(0, markerIndex).trim();
};

const isExternalLink = (href?: string) => /^https?:\/\//i.test((href ?? '').trim());

export default function LegalTechnologyCatalogDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState('Juridische technologie catalogus');
  const [source, setSource] = useState('media/legal-technologies.md');
  const [sectionCount, setSectionCount] = useState(0);
  const [correlationId, setCorrelationId] = useState('');
  const [overview, setOverview] = useState('');
  const [sections, setSections] = useState<CatalogSection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void apiFetch<CatalogResponse>('/api/legaltechnologies/documentation/catalog')
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const markdown = stripFrontMatter(payload.content ?? '');
        const parsedSections = parseCatalogSections(markdown);

        setTitle(payload.title || 'Juridische technologie catalogus');
        setSource(payload.source || 'media/legal-technologies.md');
        setSectionCount(payload.section_count ?? parsedSections.length);
        setCorrelationId(payload.correlation_id || '');
        setOverview(parseOverview(markdown));
        setSections(
          parsedSections.map((section) => ({
            ...section,
            body: stripLeadingSectionHeading(section.body),
          })),
        );
      })
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : 'Could not load generated catalog details.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!location.hash || sections.length === 0) {
      return;
    }

    const anchor = location.hash.replace('#', '');
    const target = document.getElementById(anchor);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, sections]);

  const visibleSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return sections;
    }

    return sections.filter((section) => section.title.toLowerCase().includes(query) || section.anchor.toLowerCase().includes(query));
  }, [sections, search]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          className="mb-4 text-sm font-semibold text-cyan-800 underline underline-offset-4"
          onClick={goBack}
        >
          Back
        </button>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">Browse generated details from {source}</p>
          <p className="mt-2 text-xs text-slate-500">
            Sections: {sectionCount}
            {correlationId ? ` · Correlation ID: ${correlationId}` : ''}
          </p>
        </section>

        {loading && <p className="mt-4 text-sm text-slate-600">Loading generated catalog details...</p>}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            <strong>Could not load generated catalog details.</strong>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Technologies</h2>
              <label htmlFor="catalog-section-search" className="sr-only">
                Search technologies in catalog
              </label>
              <input
                id="catalog-section-search"
                type="search"
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-cyan-200 placeholder:text-slate-400 focus:ring"
                placeholder="Search in catalog"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <ul className="mt-3 grid max-h-[60vh] gap-1 overflow-auto pr-1 text-sm">
                {visibleSections.map((section) => (
                  <li key={section.anchor}>
                    <a
                      href={`#${section.anchor}`}
                      className="block rounded-lg px-2 py-1.5 text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-900"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="grid gap-4">
              {overview && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Overview</h2>
                  <div className="mt-3 text-slate-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: (props) => <h3 className="mt-3 text-base font-semibold text-slate-900" {...props} />,
                        h2: (props) => <h4 className="mt-3 text-sm font-semibold text-slate-900" {...props} />,
                        p: (props) => <p className="mt-2 text-sm leading-6" {...props} />,
                        ul: (props) => <ul className="mt-2 list-disc pl-5 text-sm" {...props} />,
                        ol: (props) => <ol className="mt-2 list-decimal pl-5 text-sm" {...props} />,
                        li: (props) => <li className="mt-1" {...props} />,
                        a: (props) => (
                          <a
                            className="font-medium text-cyan-800 underline underline-offset-2"
                            target={isExternalLink(props.href) ? '_blank' : undefined}
                            rel={isExternalLink(props.href) ? 'noopener noreferrer' : undefined}
                            {...props}
                          />
                        ),
                        code: (props) => <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800" {...props} />,
                        table: (props) => <table className="mt-3 min-w-full border-collapse text-sm" {...props} />,
                        thead: (props) => <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500" {...props} />,
                        tbody: (props) => <tbody className="text-sm text-slate-700" {...props} />,
                        tr: (props) => <tr className="border-b border-slate-100" {...props} />,
                        th: (props) => <th className="py-2 pr-3 font-semibold" {...props} />,
                        td: (props) => <td className="py-2 pr-3 align-top" {...props} />,
                      }}
                    >
                      {overview}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {visibleSections.map((section) => (
                <section id={section.anchor} key={section.anchor} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  <div className="mt-3 text-slate-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: (props) => <h4 className="mt-3 text-base font-semibold text-slate-900" {...props} />,
                        h2: (props) => <h5 className="mt-3 text-sm font-semibold text-slate-900" {...props} />,
                        p: (props) => <p className="mt-2 text-sm leading-6" {...props} />,
                        ul: (props) => <ul className="mt-2 list-disc pl-5 text-sm" {...props} />,
                        ol: (props) => <ol className="mt-2 list-decimal pl-5 text-sm" {...props} />,
                        li: (props) => <li className="mt-1" {...props} />,
                        a: (props) => (
                          <a
                            className="font-medium text-cyan-800 underline underline-offset-2"
                            target={isExternalLink(props.href) ? '_blank' : undefined}
                            rel={isExternalLink(props.href) ? 'noopener noreferrer' : undefined}
                            {...props}
                          />
                        ),
                        code: (props) => <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-800" {...props} />,
                        table: (props) => <table className="mt-3 min-w-full border-collapse text-sm" {...props} />,
                        thead: (props) => <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500" {...props} />,
                        tbody: (props) => <tbody className="text-sm text-slate-700" {...props} />,
                        tr: (props) => <tr className="border-b border-slate-100" {...props} />,
                        th: (props) => <th className="py-2 pr-3 font-semibold" {...props} />,
                        td: (props) => <td className="py-2 pr-3 align-top" {...props} />,
                      }}
                    >
                      {section.body}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
