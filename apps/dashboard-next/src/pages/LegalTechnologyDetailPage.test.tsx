import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LegalTechnologyDetailPage from './LegalTechnologyDetailPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderDetailPage(initialPath = '/legaltechnologies/alpha--v--1.0') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Discovery home</div>} />
        <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LegalTechnologyDetailPage', () => {
  it('shows media and legal technology documentation tabs and toggles content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

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

        if (url.includes('/api/legaltechnologies/alpha--v--1.0')) {
          return {
            ok: true,
            json: async () => ({
              id: 'alpha--v--1.0',
              naam: 'Alpha Counsel',
              documentatie: {
                beoogdGebruik: 'Alpha beoogd gebruik',
                toegevoegdeWaarde: 'Alpha toegevoegde waarde',
              },
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    renderDetailPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: /alpha counsel/i })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: /media documentation/i })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(screen.getByText(/alpha documentation body/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: /legal technology documentation/i }));
    expect(screen.getByRole('tab', { name: /legal technology documentation/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: /beoogd gebruik/i })).toBeInTheDocument();
    expect(screen.getByText(/alpha beoogd gebruik/i)).toBeInTheDocument();
  });

  it('renders media fallback with source and correlation id on documentation failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/legaltechnologies/beta--v--1.0/documentation')) {
          return {
            ok: false,
            status: 404,
            headers: {
              get: (name: string) => (name.toLowerCase() === 'x-correlation-id' ? 'corr-doc-missing' : null),
            },
            json: async () => ({
              message: 'Documentation section not found',
              source: 'media/legal-technologies.md',
              correlation_id: 'corr-doc-missing',
            }),
          };
        }

        if (url.includes('/api/legaltechnologies/beta--v--1.0')) {
          return {
            ok: true,
            json: async () => ({
              id: 'beta--v--1.0',
              naam: 'Beta Rules',
              documentatie: {},
            }),
          };
        }

        return { ok: false, status: 404, json: async () => ({}) };
      }),
    );

    renderDetailPage('/legaltechnologies/beta--v--1.0');

    await waitFor(() => expect(screen.getByRole('heading', { name: /beta rules/i })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/documentation unavailable/i)).toBeInTheDocument());
    expect(screen.getByText(/source: media\/legal-technologies.md/i)).toBeInTheDocument();
    expect(screen.getByText(/correlation id: corr-doc-missing/i)).toBeInTheDocument();
  });
});
