import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import LegalTechnologyDetailPage from './pages/LegalTechnologyDetailPage';
import { apiFetch } from './utils/api';

type LegalTechnology = {
  id: string;
  naam: string;
  omschrijving: string;
  gebruiksstatus?: string;
  technologietype?: string;
};

type EnumerationGroup = {
  name: string;
  values: string[];
};

const MIN_COMPARE = 2;
const MAX_COMPARE = 4;

const asText = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const normalizeTechnology = (value: unknown): LegalTechnology | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asText(record.id).trim();
  if (!id) {
    return null;
  }

  return {
    id,
    naam: asText(record.naam, 'Unknown technology'),
    omschrijving: asText(record.omschrijving, 'No description provided.'),
    gebruiksstatus: asText(record.gebruiksstatus),
    technologietype: asText(record.technologietype),
  };
};

function DiscoveryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LegalTechnology[]>([]);
  const [knownItems, setKnownItems] = useState<Record<string, LegalTechnology>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [submittedSearch, setSubmittedSearch] = useState('');
  const latestRequestId = useRef(0);
  const activeAbortController = useRef<AbortController | null>(null);

  const hydrateKnownItems = (technologies: LegalTechnology[]) => {
    setKnownItems((previous) => {
      const next = { ...previous };
      technologies.forEach((technology) => {
        if (technology.id) {
          next[technology.id] = technology;
        }
      });
      return next;
    });
  };

  const loadEnumerations = async () => {
    try {
      const groups = await apiFetch<EnumerationGroup[]>('/api/legaltechnologies/enumerations');
      const statuses = groups.find((group) => group.name === 'Gebruiksstatussen')?.values ?? [];
      setStatusOptions(statuses.filter(Boolean));
    } catch {
      setStatusOptions([]);
    }
  };

  const loadTechnologies = async (query: string, requestId: number, signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = query
        ? `/api/legaltechnologies/search?q=${encodeURIComponent(query)}`
        : '/api/legaltechnologies';
      const rawData = await apiFetch<unknown>(endpoint, { signal });
      if (requestId !== latestRequestId.current) {
        return;
      }

      if (!Array.isArray(rawData)) {
        throw new Error('API error: invalid response format');
      }

      const deduped = new Map<string, LegalTechnology>();
      rawData.forEach((entry) => {
        const normalized = normalizeTechnology(entry);
        if (normalized && !deduped.has(normalized.id)) {
          deduped.set(normalized.id, normalized);
        }
      });

      const nextItems = [...deduped.values()];
      setItems(nextItems);
      hydrateKnownItems(nextItems);
    } catch (caughtError) {
      if (signal.aborted || requestId !== latestRequestId.current) {
        return;
      }
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown API error';
      setError(message);
      setItems([]);
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  };

  const requestTechnologies = (query: string) => {
    activeAbortController.current?.abort();
    const controller = new AbortController();
    activeAbortController.current = controller;
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    void loadTechnologies(query, requestId, controller.signal);
  };

  useEffect(() => {
    void loadEnumerations();
    requestTechnologies('');

    return () => {
      activeAbortController.current?.abort();
    };
  }, []);

  const visibleItems = useMemo(() => {
    if (!statusFilter) {
      return items;
    }
    return items.filter((item) => (item.gebruiksstatus ?? '') === statusFilter);
  }, [items, statusFilter]);

  const compareSelection = useMemo(
    () => compareIds.map((id) => knownItems[id]).filter((item): item is LegalTechnology => Boolean(item)),
    [compareIds, knownItems],
  );

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    setSubmittedSearch(query);
    requestTechnologies(query);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSubmittedSearch('');
    setHint(null);
    requestTechnologies('');
  };

  const broadenCriteria = () => {
    const trimmedSearch = search.trim();
    if (trimmedSearch.length <= 2) {
      setHint('Search is already broad. Try clearing the status filter.');
      return;
    }
    const broader = trimmedSearch.slice(0, Math.max(2, Math.floor(trimmedSearch.length / 2))).trim();
    setSearch(broader);
    setSubmittedSearch(broader);
    requestTechnologies(broader);
  };

  const addToCompare = (id: string) => {
    setCompareIds((previous) => {
      if (previous.includes(id)) {
        return previous;
      }
      if (previous.length >= MAX_COMPARE) {
        setHint('You can compare up to 4 technologies in v1. Remove one first.');
        return previous;
      }
      setHint(null);
      return [...previous, id];
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareIds((previous) => previous.filter((value) => value !== id));
    setHint(null);
  };

  const openTechnologyDocumentation = (technologyId: string) => {
    navigate(`/legaltechnologies/${encodeURIComponent(technologyId)}`);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header role="banner" className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">dashboard-next</p>
            <h1 className="text-2xl font-semibold text-slate-900">Juridische Technologie Dashboard</h1>
          </div>
          <nav aria-label="Hoofd navigatie" className="flex flex-wrap gap-2 text-sm">
            <a href="#overzicht" className="rounded-full bg-cyan-100 px-3 py-1.5 font-medium text-cyan-800">
              Overzicht
            </a>
            <a
              href="#technologie-ontdekken"
              className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-300"
            >
              Juridische technologieen
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section id="overzicht" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Overzicht</h2>
            <strong className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold">
              Compare selection: {compareIds.length}/{MAX_COMPARE}
            </strong>
          </div>
          {compareIds.length < MIN_COMPARE ? (
            <p className="mt-3 text-sm text-rose-700">Select at least 2 technologies to form a valid compare set.</p>
          ) : (
            <p className="mt-3 text-sm text-emerald-700">Compare set is within the valid v1 range (2 to 4).</p>
          )}
          {hint && <p className="mt-2 text-sm text-amber-700">{hint}</p>}
          <p className="mt-3 text-sm text-slate-600">
            Discover legal technologies and select candidates for compare. The compare set supports 2 to 4 technologies.
          </p>
        </section>

        <section id="technologie-ontdekken" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Technologie ontdekken</h2>

          <form className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]" onSubmit={onSearchSubmit}>
            <label htmlFor="search-technologies" className="sr-only">
              Search technologies
            </label>
            <input
              id="search-technologies"
              type="search"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-cyan-200 placeholder:text-slate-400 focus:ring"
              placeholder="Search technologies"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-cyan-200 focus:ring"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              Search
            </button>
          </form>

          {loading && <p className="mt-4 text-sm text-slate-600">Loading technologies...</p>}
          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
              <strong>Could not load technologies.</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && visibleItems.length === 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" role="status" aria-live="polite">
              <p>No technologies matched the active filters.</p>
              {submittedSearch && <p className="mt-1 text-slate-600">Last search: {submittedSearch}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700"
                  onClick={broadenCriteria}
                >
                  Broaden criteria
                </button>
              </div>
            </div>
          )}

          {!loading && !error && visibleItems.length > 0 && (
            <ul className="mt-4 grid gap-3" aria-label="Technology results">
              {visibleItems.map((item) => {
                const selected = compareIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-start"
                  >
                    <div>
                      <strong className="text-base text-slate-900">{item.naam}</strong>
                      <p className="mt-1 text-sm text-slate-700">{item.omschrijving}</p>
                      <small className="text-xs text-cyan-800">
                        {item.gebruiksstatus || 'Unknown status'}
                        {item.technologietype ? ` - ${item.technologietype}` : ''}
                      </small>
                    </div>
                    <div className="grid gap-2 md:justify-items-end">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-900"
                        onClick={() => openTechnologyDocumentation(item.id)}
                      >
                        View documentation
                      </button>
                      {selected ? (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          onClick={() => removeFromCompare(item.id)}
                        >
                          Remove from compare
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          onClick={() => addToCompare(item.id)}
                        >
                          Add to compare
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {compareSelection.length > 0 && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
              <h3 className="font-semibold">Current compare candidates</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {compareSelection.map((item) => (
                  <li key={item.id}>{item.naam}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DiscoveryPage />} />
        <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
