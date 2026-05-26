import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LegalTechnologyCatalogDetailsPage from './LegalTechnologyCatalogDetailsPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderCatalogPage(initialPath = '/catalog-details') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Discovery home</div>} />
        <Route path="/catalog-details" element={<LegalTechnologyCatalogDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LegalTechnologyCatalogDetailsPage', () => {
  it('loads generated catalog markdown and renders section navigation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          title: 'Juridische technologie catalogus',
          source: 'media/legal-technologies.md',
          section_count: 2,
          content:
            '---\ntitle: "Juridische technologie ontologie"\n---\n\n# Overzicht\n\n- Korte intro\n- [Naar Beta](#beta-rules)\n\n# Technologieen\n\n<section id="alpha-counsel">\n## Alpha Counsel\n\n| Kenmerk | Waarde |\n|---|---|\n| Site | [Product pagina](https://example.com/product) |\n</section>\n\n<section id="beta-rules">\n## Beta Rules\n\nBeta details\n</section>',
          correlation_id: 'corr-123',
        }),
      }),
    );

    renderCatalogPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: /juridische technologie catalogus/i })).toBeInTheDocument());

    expect(screen.getByText(/sections: 2/i)).toBeInTheDocument();
    expect(screen.getAllByRole('list').length).toBeGreaterThan(0);
    expect(screen.getByText(/korte intro/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /alpha counsel/i })).toHaveAttribute('href', '#alpha-counsel');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /product pagina/i })).toHaveAttribute('href', 'https://example.com/product');
    expect(screen.getByRole('link', { name: /naar beta/i })).toHaveAttribute('href', '#beta-rules');
    expect(screen.getByRole('link', { name: /naar beta/i })).not.toHaveAttribute('target', '_blank');
    expect(screen.getByText(/beta details/i)).toBeInTheDocument();
  });

  it('shows an error panel when generated catalog cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Generated catalog documentation not found' }),
      }),
    );

    renderCatalogPage();

    await waitFor(() => expect(screen.getByText(/could not load generated catalog details/i)).toBeInTheDocument());
    expect(screen.getByText(/generated catalog documentation not found/i)).toBeInTheDocument();
  });
});
