import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  vi.useRealTimers();
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
  proposal_required?: boolean;
  can_mutate_directly?: boolean;
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
    proposal_required: false,
    can_mutate_directly: true,
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
          content: 'Alpha beoogd gebruik\n\nAlpha documentation body',
          correlation_id: 'corr-doc-success',
        }),
      };
    }

    if (url.includes('/api/legaltechnologies/documentation/catalog')) {
      return {
        ok: true,
        json: async () => ({
          title: 'Juridische technologie catalogus',
          source: 'media/legal-technologies.md',
          section_count: 2,
          content:
            '# Overzicht\n\nKorte intro\n\n# Technologieen\n\n<section id="alpha-counsel">\n## Alpha Counsel\n\nAlpha details\n</section>\n\n<section id="beta-rules">\n## Beta Rules\n\nBeta details\n</section>',
          correlation_id: 'corr-catalog-success',
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
  it('renders the three-column workspace shell with sidebar, main overview, and context rail', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    expect(screen.getByLabelText(/workspace sidebar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/context rail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/persistente compare bar/i)).toBeInTheDocument();
    expect(screen.getByText(/geen vergelijking geselecteerd/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /overzicht/i })).toBeInTheDocument();
    expect(screen.getByText(/fact-find is beschikbaar voor snelle evidence-verkenning vanuit overzicht/i)).toBeInTheDocument();
  });

  it('uses the left sidebar as real shell navigation and preserves context while switching sections', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    const sidebar = screen.getByLabelText(/workspace sidebar/i);
    const opmerkingenNavButton = within(sidebar).getByRole('button', { name: /opmerkingen/i });
    const voorstellenNavButton = within(sidebar).getByRole('button', { name: /voorstellen/i });

    fireEvent.click(opmerkingenNavButton);
    expect(opmerkingenNavButton).toHaveAttribute('aria-pressed', 'true');
    const contextRail = screen.getByLabelText(/context rail/i);
    expect(within(contextRail).getByRole('button', { name: /^opmerkingen$/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(voorstellenNavButton);
    expect(voorstellenNavButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(contextRail).getByRole('button', { name: /^governance$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/compare selection: 0\/4/i)).toBeInTheDocument();
  });

  it('keeps a sticky compare strip visible for 1-4 selected technologies and gates compare action at 2+', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);

    const compareStrip = screen.getByLabelText(/persistente compare bar/i);
    expect(compareStrip).toBeInTheDocument();
    expect(screen.getByText(/\+ voeg toe \(max 4\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vergelijk selectie/i })).toBeDisabled();

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
    expect(screen.getByRole('button', { name: /vergelijk selectie/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /verwijder alpha counsel uit vergelijking/i }));
    expect(screen.getByRole('button', { name: /vergelijk selectie/i })).toBeDisabled();
  });

  it('shows card-level governance indicators based on protection status', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    expect(screen.getAllByText(/voorstel vereist/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/directe mutatie role-gated/i)).toBeInTheDocument();
  });

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

  it('shows non-technical denied feedback and keeps compare context', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=blocked')) {
        return {
          ok: false,
          status: 403,
          headers: {
            get: (name: string) => (name.toLowerCase() === 'x-correlation-id' ? 'corr-ui-denied' : null),
          },
          json: async () => ({
            message: 'You do not have permission for this action. Try an allowed action or contact a moderator.',
            correlation_id: 'corr-ui-denied',
          }),
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search technologies/i), { target: { value: 'blocked' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => expect(screen.getByText(/could not load technologies/i)).toBeInTheDocument());
    expect(screen.getByText(/you do not have permission for this action/i)).toBeInTheDocument();
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0);
  });

  it('loads in-dashboard documentation and preserves compare context', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /view documentation/i })[0]);

    await waitFor(() => expect(screen.getByText(/documentation in workspace/i)).toBeInTheDocument());
    expect(screen.getByText(/source: media\/legal-technologies\.md#alpha-counsel/i)).toBeInTheDocument();
    expect(screen.getByText(/correlation id: corr-doc-success/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alpha documentation body/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();
  });

  it('keeps previous documentation context when a later documentation request fails', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
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

      if (url.includes('/api/legaltechnologies/beta--v--1.0/documentation')) {
        return {
          ok: false,
          status: 503,
          headers: {
            get: (name: string) => (name.toLowerCase() === 'x-correlation-id' ? 'corr-doc-fail' : null),
          },
          json: async () => ({
            message: 'Generated documentation source is unavailable',
            source: 'media/legal-technologies.md',
            correlation_id: 'corr-doc-fail',
          }),
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /view documentation/i })[0]);
    await waitFor(() => expect(screen.getAllByText(/alpha documentation body/i).length).toBeGreaterThan(0), { timeout: 3000 });

    fireEvent.click(screen.getAllByRole('button', { name: /view documentation/i })[1]);

    await waitFor(() => expect(screen.getByText(/could not load documentation/i)).toBeInTheDocument());
    expect(screen.getAllByText(/generated documentation source is unavailable/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/alpha documentation body/i).length).toBeGreaterThan(0);
  });

  it('keeps active technology context stable when switching rail tabs and preserves compare selection', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByText(/^beta rules$/i));
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);

    const contextRail = screen.getByLabelText(/context rail/i);
    expect(within(contextRail).getByText(/^actieve technologie$/i)).toBeInTheDocument();
    expect(within(contextRail).getByText(/^beta rules$/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();

    fireEvent.click(within(contextRail).getByRole('button', { name: /^opmerkingen$/i }));
    expect(within(contextRail).getByText(/^beta rules$/i, { selector: 'p' })).toBeInTheDocument();

    fireEvent.click(within(contextRail).getByRole('button', { name: /^governance$/i }));
    expect(within(contextRail).getByText(/^beta rules$/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();
  });

  it('separates technology documentation and media documentation in the context rail', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /view documentation/i })[0]);

    await waitFor(() => expect(screen.getByLabelText(/technologiedocumentatie/i)).toBeInTheDocument());
    const technologySection = screen.getByLabelText(/technologiedocumentatie/i);
    const mediaSection = screen.getByLabelText(/mediadocumentatie/i);

    expect(mediaSection).toBeInTheDocument();
    expect(within(technologySection).getByText(/bron: media\/legal-technologies\.md#alpha-counsel/i)).toBeInTheDocument();
    expect(within(mediaSection).getByText(/^bron: media\/legal-technologies\.md$/i)).toBeInTheDocument();
  });

  it('renders role-gated governance and comment status actions in the rail', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    const contextRail = screen.getByLabelText(/context rail/i);
    fireEvent.click(within(contextRail).getByRole('button', { name: /^governance$/i }));
    expect(screen.getByText(/openstaande voorstellen/i)).toBeInTheDocument();
    expect(screen.getByText(/recente audit entries/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reject/i })).toBeDisabled();
    expect(screen.getByText(/approve\/reject acties zijn role-gated voor moderator\/admin/i)).toBeInTheDocument();

    fireEvent.click(within(contextRail).getByRole('button', { name: /^opmerkingen$/i }));
    expect(screen.getByRole('button', { name: /markeer als resolved/i })).toBeDisabled();
    expect(screen.getByText(/statusovergangen zijn role-gated voor moderator\/admin/i)).toBeInTheDocument();
  });

  it('dismisses and reopens fact-find banner without losing active context or compare selection', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByText(/^beta rules$/i));
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /verbergen/i }));

    expect(screen.queryByText(/fact-find is beschikbaar voor snelle evidence-verkenning vanuit overzicht/i)).not.toBeInTheDocument();
    const contextRail = screen.getByLabelText(/context rail/i);
    expect(within(contextRail).getByText(/^beta rules$/i)).toBeInTheDocument();
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^fact-find$/i }));

    expect(screen.getByText(/fact-find is beschikbaar voor snelle evidence-verkenning vanuit overzicht/i)).toBeInTheDocument();
    expect(within(contextRail).getByText(/^beta rules$/i)).toBeInTheDocument();
    expect(screen.getByText(/compare selection: 1\/4/i)).toBeInTheDocument();
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
  
  it('loads product traceability in workspace and returns to compare context without losing selection', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
  
      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }
  
      if (url.includes('/api/products/regelmodel/traceability')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            relations: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                },
              ],
              output: [
                {
                  task_id: 'regelmodelopstellen',
                  task_iri: 'http://bp4mc2.org/ltt#RegelmodelOpstellen',
                  task_label: 'Regelmodel opstellen',
                  predicate: 'http://bp4mc2.org/lto#uitvoerVanTaak',
                  relation_kind: 'output',
                },
              ],
            },
          }),
        };
      }

      if (url.includes('/api/products/regelmodel/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            chains: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                  missing_node: false,
                  missing_reason: null,
                  technologies: [
                    {
                      id: 'mim--v--1.0.0',
                      iri: 'https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0.0',
                      label: 'MIM',
                      evidence_links: [],
                    },
                  ],
                },
              ],
              output: [],
            },
            partial_data: false,
          }),
        };
      }
  
      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
          ],
        };
      }
  
      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }
  
      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }
  
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });
  
    vi.stubGlobal('fetch', fetchMock);
  
    render(<App />);
  
    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
  
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
  
    expect(screen.getByText(/compare selection: 2\/4/i)).toBeInTheDocument();
  
    fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));
  
    await waitFor(() => expect(screen.getByText(/product traceability workspace/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/regelmodel opstellen/i)).toBeInTheDocument());
  
    expect(screen.getByText(/input relations/i)).toBeInTheDocument();
    expect(screen.getByText(/output relations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/http:\/\/bp4mc2.org\/ltt#RegelValideren/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/http:\/\/bp4mc2.org\/ltt#RegelmodelOpstellen/i)).toBeInTheDocument();
  
    fireEvent.click(screen.getByRole('button', { name: /back to compare workspace/i }));
  
    expect(screen.queryByText(/product traceability workspace/i)).not.toBeInTheDocument();
    expect(screen.getByText(/compare selection: 2\/4/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/beta rules/i).length).toBeGreaterThan(0);
  });

  it('shows an empty traceability state and recovers to the compare workspace', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/products/leeg-product/traceability')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'leeg-product',
              iri: 'http://bp4mc2.org/lto#LeegProduct',
              label: 'Leeg product',
            },
            relations: {
              input: [],
              output: [],
            },
          }),
        };
      }

      if (url.includes('/api/products/leeg-product/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'leeg-product',
              iri: 'http://bp4mc2.org/lto#LeegProduct',
              label: 'Leeg product',
            },
            chains: {
              input: [],
              output: [],
            },
            partial_data: false,
          }),
        };
      }

      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'leeg-product',
              iri: 'http://bp4mc2.org/lto#LeegProduct',
              label: 'Leeg product',
            },
          ],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));

    await waitFor(() => expect(screen.getByText(/no task relations are linked to this product yet/i)).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: /back to compare workspace/i })[1]);

    expect(screen.queryByText(/product traceability workspace/i)).not.toBeInTheDocument();
    expect(screen.getByText(/compare selection: 2\/4/i)).toBeInTheDocument();
  });

  it('shows empty traceability fallback within 2 seconds while traceability request is still pending', async () => {
    const traceabilityRequest = deferredResponse();

    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/products/leeg-product/traceability')) {
        return traceabilityRequest.responsePromise;
      }

      if (url.includes('/api/products/leeg-product/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'leeg-product',
              iri: 'http://bp4mc2.org/lto#LeegProduct',
              label: 'Leeg product',
            },
            chains: {
              input: [],
              output: [],
            },
            partial_data: false,
          }),
        };
      }

      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'leeg-product',
              iri: 'http://bp4mc2.org/lto#LeegProduct',
              label: 'Leeg product',
            },
          ],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    try {
      await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

      fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
      fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
      fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));

      await waitFor(() => expect(screen.getByText(/loading product traceability/i)).toBeInTheDocument());

      await waitFor(
        () => expect(screen.getByText(/no task relations are linked to this product yet/i)).toBeInTheDocument(),
        { timeout: 7000 },
      );
    } finally {
      traceabilityRequest.resolveResponse({
        ok: true,
        json: async () => ({
          product: {
            id: 'leeg-product',
            iri: 'http://bp4mc2.org/lto#LeegProduct',
            label: 'Leeg product',
          },
          relations: {
            input: [],
            output: [],
          },
        }),
      });
    }

  }, 15000);

  it('ignores stale product traceability responses when product selection changes quickly', async () => {
    const firstTraceabilityRequest = deferredResponse();

    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/products/first-product/traceability')) {
        return firstTraceabilityRequest.responsePromise;
      }

      if (url.includes('/api/products/first-product/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'first-product',
              iri: 'http://bp4mc2.org/lto#FirstProduct',
              label: 'First product',
            },
            chains: {
              input: [
                {
                  task_id: 'taak1',
                  task_iri: 'http://bp4mc2.org/ltt#Taak1',
                  task_label: 'Taak een',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                  missing_node: true,
                  missing_reason: 'No contributing technologies linked to this task.',
                  technologies: [],
                },
              ],
              output: [],
            },
            partial_data: true,
          }),
        };
      }

      if (url.includes('/api/products/second-product/traceability')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'second-product',
              iri: 'http://bp4mc2.org/lto#SecondProduct',
              label: 'Second product',
            },
            relations: {
              input: [],
              output: [
                {
                  task_id: 'taak2',
                  task_iri: 'http://bp4mc2.org/ltt#Taak2',
                  task_label: 'Taak twee',
                  predicate: 'http://bp4mc2.org/lto#uitvoerVanTaak',
                  relation_kind: 'output',
                },
              ],
            },
          }),
        };
      }

      if (url.includes('/api/products/second-product/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'second-product',
              iri: 'http://bp4mc2.org/lto#SecondProduct',
              label: 'Second product',
            },
            chains: {
              input: [],
              output: [
                {
                  task_id: 'taak2',
                  task_iri: 'http://bp4mc2.org/ltt#Taak2',
                  task_label: 'Taak twee',
                  predicate: 'http://bp4mc2.org/lto#uitvoerVanTaak',
                  relation_kind: 'output',
                  missing_node: false,
                  missing_reason: null,
                  technologies: [
                    {
                      id: 'lex--v--1.0.0',
                      iri: 'https://data.bp4mc2.org/id/lto/legaltech/lex/v/1.0.0',
                      label: 'Lex',
                      evidence_links: [],
                    },
                  ],
                },
              ],
            },
            partial_data: false,
          }),
        };
      }

      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'first-product',
              iri: 'http://bp4mc2.org/lto#FirstProduct',
              label: 'First product',
            },
            {
              id: 'second-product',
              iri: 'http://bp4mc2.org/lto#SecondProduct',
              label: 'Second product',
            },
          ],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));

    await waitFor(() => expect(screen.getByText(/product traceability workspace/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/choose product/i), { target: { value: 'second-product' } });

    await waitFor(() => expect(screen.getAllByText(/taak twee/i).length).toBeGreaterThan(0));

    firstTraceabilityRequest.resolveResponse({
      ok: true,
      json: async () => ({
        product: {
          id: 'first-product',
          iri: 'http://bp4mc2.org/lto#FirstProduct',
          label: 'First product',
        },
        relations: {
          input: [
            {
              task_id: 'taak1',
              task_iri: 'http://bp4mc2.org/ltt#Taak1',
              task_label: 'Taak een',
              predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
              relation_kind: 'input',
            },
          ],
          output: [],
        },
      }),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getAllByText(/taak twee/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/taak een/i)).not.toBeInTheDocument();
  });

  it('renders technology contribution chains with evidence links for selected product', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/products/regelmodel/traceability')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            relations: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                },
              ],
              output: [],
            },
          }),
        };
      }

      if (url.includes('/api/products/regelmodel/contribution-chain')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            chains: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                  missing_node: false,
                  missing_reason: null,
                  technologies: [
                    {
                      id: 'mim--v--1.0.0',
                      iri: 'https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0.0',
                      label: 'MIM',
                      evidence_links: [
                        {
                          title: 'MIM evidence',
                          location: 'https://example.org/mim-evidence',
                          reference: 'doc-42',
                        },
                      ],
                    },
                  ],
                },
              ],
              output: [],
            },
            partial_data: false,
          }),
        };
      }

      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
          ],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));

    await waitFor(() => expect(screen.getByText(/technology contribution chain/i)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/mim evidence/i)).toBeInTheDocument());
    expect(screen.getByText(/doc-42/i)).toBeInTheDocument();
  });

  it('marks partial contribution data and supports retry without losing compare context', async () => {
    let contributionCallCount = 0;

    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/legaltechnologies/enumerations')) {
        return {
          ok: true,
          json: async () => [{ name: 'Gebruiksstatussen', values: ['In gebruik', 'Voorstel', 'Work in progress'] }],
        };
      }

      if (url.includes('/api/products/regelmodel/traceability')) {
        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            relations: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                },
              ],
              output: [],
            },
          }),
        };
      }

      if (url.includes('/api/products/regelmodel/contribution-chain')) {
        contributionCallCount += 1;
        if (contributionCallCount === 1) {
          return {
            ok: true,
            json: async () => ({
              product: {
                id: 'regelmodel',
                iri: 'http://bp4mc2.org/lto#Regelmodel',
                label: 'Regelmodel',
              },
              chains: {
                input: [
                  {
                    task_id: 'regelvalideren',
                    task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                    task_label: 'Regel valideren',
                    predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                    relation_kind: 'input',
                    missing_node: true,
                    missing_reason: 'No contributing technologies linked to this task.',
                    technologies: [],
                  },
                ],
                output: [],
              },
              partial_data: true,
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            product: {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
            chains: {
              input: [
                {
                  task_id: 'regelvalideren',
                  task_iri: 'http://bp4mc2.org/ltt#RegelValideren',
                  task_label: 'Regel valideren',
                  predicate: 'http://bp4mc2.org/lto#inputVoorTaak',
                  relation_kind: 'input',
                  missing_node: false,
                  missing_reason: null,
                  technologies: [
                    {
                      id: 'mim--v--1.0.0',
                      iri: 'https://data.bp4mc2.org/id/lto/legaltech/mim/v/1.0.0',
                      label: 'MIM',
                      evidence_links: [],
                    },
                  ],
                },
              ],
              output: [],
            },
            partial_data: false,
          }),
        };
      }

      if (url.includes('/api/products')) {
        return {
          ok: true,
          json: async () => [
            {
              id: 'regelmodel',
              iri: 'http://bp4mc2.org/lto#Regelmodel',
              label: 'Regelmodel',
            },
          ],
        };
      }

      if (url.includes('/api/legaltechnologies/search?q=')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      if (url.includes('/api/legaltechnologies')) {
        return {
          ok: true,
          json: async () => sampleTechs,
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({}),
      };
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /add to compare/i })[1]);
    fireEvent.click(screen.getByRole('button', { name: /vergelijk selectie/i }));

    await waitFor(() => expect(screen.getByText(/partial contribution data detected/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /retry contribution traversal/i }));

    await waitFor(() => expect(screen.queryByText(/partial contribution data detected/i)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByText(/mim/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/compare selection: 2\/4/i)).toBeInTheDocument();
  });

  it('navigates to dedicated detail page from result card action', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getAllByRole('button', { name: /bekijk details/i })[0]);

    await waitFor(() => expect(screen.getAllByRole('heading', { name: /alpha counsel/i }).length).toBeGreaterThan(0));
    expect(window.location.pathname).toBe('/legaltechnologies/alpha--v--1.0');
    expect(screen.getByText(/alpha beoogd gebruik/i)).toBeInTheDocument();
  });

  it('renders detail page from direct route', async () => {
    stubFetchWith(sampleTechs);
    window.history.pushState({}, '', '/legaltechnologies/alpha--v--1.0');

    render(<App />);

    await waitFor(() => expect(screen.getAllByRole('heading', { name: /alpha counsel/i }).length).toBeGreaterThan(0));
    expect(window.location.pathname).toBe('/legaltechnologies/alpha--v--1.0');
    expect(screen.getByText(/alpha beoogd gebruik/i)).toBeInTheDocument();
  });

  it('opens catalog details page from discovery navigation', async () => {
    stubFetchWith(sampleTechs);

    render(<App />);

    await waitFor(() => expect(screen.getAllByText(/alpha counsel/i).length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /catalogusdetails/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /juridische technologie catalogus/i })).toBeInTheDocument());
    expect(screen.getByText(/browse generated details from media\/legal-technologies\.md/i)).toBeInTheDocument();
    expect(screen.getByText(/alpha details/i)).toBeInTheDocument();
  });
});
