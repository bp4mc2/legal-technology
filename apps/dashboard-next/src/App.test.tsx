import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.pushState({}, '', '/');
});

type ApiTech = {
  id: string;
  naam: string;
  omschrijving: string;
  gebruiksstatus: string;
  technologietype?: string;
};

const sampleTechs: ApiTech[] = [
  {
    id: 'alpha--v--1.0',
    naam: 'Alpha Counsel',
    omschrijving: 'Research and drafting support',
    gebruiksstatus: 'In gebruik',
    technologietype: 'Tool',
  },
  {
    id: 'beta--v--1.0',
    naam: 'Beta Rules',
    omschrijving: 'Rules modelling assistant',
    gebruiksstatus: 'Voorstel',
    technologietype: 'Methode',
  },
  {
    id: 'gamma--v--2.0',
    naam: 'Gamma Lex',
    omschrijving: 'Evidence mapping workspace',
    gebruiksstatus: 'In gebruik',
    technologietype: 'Standaard',
  },
  {
    id: 'delta--v--1.0',
    naam: 'Delta Bridge',
    omschrijving: 'Document discovery pipeline',
    gebruiksstatus: 'In gebruik',
    technologietype: 'Tool',
  },
  {
    id: 'epsilon--v--1.0',
    naam: 'Epsilon Audit',
    omschrijving: 'Governance logging helper',
    gebruiksstatus: 'Work in progress',
    technologietype: 'Tool',
  },
];

function stubFetchWith(data: ApiTech[]) {
  const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/legaltechnologies/alpha--v--1.0') && !url.includes('/documentation')) {
      return {
        ok: true,
        json: async () => ({
          id: 'alpha--v--1.0',
          naam: 'Alpha Counsel',
          technologietype: 'Tool',
          gebruiksstatus: 'In gebruik',
          documentatie: {
            beoogdGebruik: 'Alpha beoogd gebruik',
            toegevoegdeWaarde: 'Alpha toegevoegde waarde',
          },
        }),
      };
    }

    if (url.includes('/api/legaltechnologies/alpha--v--1.0/documentation')) {
      return {
        ok: true,
        json: async () => ({
          technology_id: 'alpha--v--1.0',
          source: 'media/legal-technologies.md#alpha-counsel',
          section_title: 'Alpha Counsel',
          content: 'Alpha documentation body',
          correlation_id: 'corr-doc-success',
        }),
      };
    }

    if (url.includes('/api/legaltechnologies/enumerations')) {
      return {
        ok: true,
        json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
      };
    }

    if (url.includes('/api/legaltechnologies/search?q=')) {
      const query = decodeURIComponent(url.split('q=')[1] ?? '').toLowerCase();
      const filtered = data.filter(
        (item) => item.naam.toLowerCase().includes(query) || item.omschrijving.toLowerCase().includes(query),
      );
      return {
        ok: true,
        json: async () => filtered,
      };
    }

    if (url.includes('/api/legaltechnologies')) {
      return {
        ok: true,
        json: async () => data,
      };
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({}),
    };
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function deferredResponse() {
  // eslint-disable-next-line no-unused-vars
  let resolveResponse: ((value: unknown) => void) | null = null;
  const responsePromise = new Promise<unknown>((resolve) => {
    resolveResponse = resolve;
  });

  return {
    responsePromise,
    resolveResponse: resolveResponse!,
  };
}

describe('technology discovery and route navigation', () => {
  it('loads technologies and enforces max 4 compare candidates', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    const buttons = screen.getAllByRole('button', { name: /add to compare/i });
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    fireEvent.click(buttons[3]);

    expect(screen.getByText(/compare selection: 4\/4/i)).toBeInTheDocument();

    fireEvent.click(buttons[4]);
    expect(screen.getByText(/you can compare up to 4 technologies/i)).toBeInTheDocument();
  });

  it('supports removing candidates from compare set', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);

    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /remove from compare/i }));

    expect(screen.getByText(/compare selection: 0\/4/i)).toBeInTheDocument();
    expect(screen.getByText(/select at least 2 technologies/i)).toBeInTheDocument();
  });

  it('renders empty state and recovery action when no results match', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/gamma lex/i).length).toBeGreaterThan(0));

    fireEvent.change(screen.getByLabelText(/search technologies/i), { target: { value: 'zzzzz' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText(/no technologies matched the active filters/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
  });

  it('shows an error state when discovery request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByText(/could not load technologies/i)).toBeInTheDocument());
    expect(screen.getByText(/API error: 500/)).toBeInTheDocument();
  });

  it('keeps latest search results when an older request resolves later', async () => {
    const firstListRequest = deferredResponse();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/legaltechnologies/enumerations')) {
          return {
            ok: true,
            json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel'] }],
          };
        }

        if (url.includes('/api/legaltechnologies/search?q=zzzzz')) {
          return {
            ok: true,
            json: async () => [],
          };
        }

        if (url.includes('/api/legaltechnologies')) {
          return firstListRequest.responsePromise;
        }

        return {
          ok: false,
          status: 404,
          json: async () => ({}),
        };
      }),
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/search technologies/i), { target: { value: 'zzzzz' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(screen.getByText(/no technologies matched the active filters/i)).toBeInTheDocument());

    firstListRequest.resolveResponse({
      ok: true,
      json: async () => sampleTechs,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByText(/no technologies matched the active filters/i)).toBeInTheDocument();
    expect(screen.queryByText(/alpha counsel/i)).not.toBeInTheDocument();
  });

  it('navigates to dedicated detail page from result card action', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /view documentation/i })[0]);

    await waitFor(() => expect(screen.getByRole('heading', { name: /alpha counsel/i })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: /media documentation/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders detail page from direct route', async () => {
    stubFetchWith(sampleTechs);
    window.history.pushState({}, '', '/legaltechnologies/alpha--v--1.0');

    render(<App />);

    await waitFor(() => expect(screen.getByRole('heading', { name: /alpha counsel/i })).toBeInTheDocument());
    expect(screen.getByText(/active technology: alpha counsel/i)).toBeInTheDocument();
  });
});
