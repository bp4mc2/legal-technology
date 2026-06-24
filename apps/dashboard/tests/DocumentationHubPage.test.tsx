import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-markdown', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('remark-gfm', () => ({
  default: () => undefined,
}));

import DocumentationHubPage from '../src/components/DocumentationHubPage';

type MockResponseShape = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function jsonResponse(payload: unknown): MockResponseShape {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

describe('DocumentationHubPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('loads grouped documentation, honors deep-link params, and switches rendered markdown sections', async () => {
    window.localStorage.setItem('lt-user-role', 'Viewer');
    window.localStorage.setItem('lt-actor-id', 'dashboard-reader');

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const requestUrl = String(input);
      if (requestUrl.includes('/api/legaltechnologies/documentation/hub')) {
        return jsonResponse({
          groups: [
            {
              id: 'generated',
              title: 'Gegenereerde documentatie',
              description: 'Build-uitvoer',
              source_label: 'ReSpec gegenereerd',
              sections: [
                {
                  id: 'catalogus-overzicht',
                  title: 'Catalogus-overzicht',
                  content: '## Catalogus\n\nConcreet catalogusfragment.',
                  source: 'build/docs/includes/catalogus-overzicht.md',
                  updated_at: '2026-06-02T08:00:00Z',
                  group_id: 'generated',
                  group_title: 'Gegenereerde documentatie',
                  source_label: 'ReSpec gegenereerd',
                },
              ],
            },
            {
              id: 'curated',
              title: 'Handmatige documentatie',
              description: 'Docs-map',
              source_label: 'Curated docs',
              sections: [
                {
                  id: 'meta-model',
                  title: 'Meta-model',
                  content: '## Meta-model\n\nDit document beschrijft de curated context.',
                  source: 'docs/meta-model.md',
                  updated_at: '2026-06-02T08:05:00Z',
                  group_id: 'curated',
                  group_title: 'Handmatige documentatie',
                  source_label: 'Curated docs',
                },
              ],
            },
          ],
          sections: [
            {
              id: 'catalogus-overzicht',
              title: 'Catalogus-overzicht',
              content: '## Catalogus\n\nConcreet catalogusfragment.',
              source: 'build/docs/includes/catalogus-overzicht.md',
              updated_at: '2026-06-02T08:00:00Z',
              group_id: 'generated',
              group_title: 'Gegenereerde documentatie',
              source_label: 'ReSpec gegenereerd',
            },
            {
              id: 'meta-model',
              title: 'Meta-model',
              content: '## Meta-model\n\nDit document beschrijft de curated context.',
              source: 'docs/meta-model.md',
              updated_at: '2026-06-02T08:05:00Z',
              group_id: 'curated',
              group_title: 'Handmatige documentatie',
              source_label: 'Curated docs',
            },
          ],
          section_count: 2,
          correlation_id: 'corr-1',
        }) as unknown as Response;
      }

      return jsonResponse({
        technology_id: 'tech-1',
        section_title: 'Alpha Counsel',
        content: 'Technologiespecifieke tekst.',
        source: 'build/docs/includes/catalogus-details.md#alpha-counsel',
        correlation_id: 'corr-2',
      }) as unknown as Response;
    });

    render(
      <MemoryRouter initialEntries={['/documentation?section=meta-model&technology=tech-1']}>
        <DocumentationHubPage />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'Documentatiehub' });
    expect(await screen.findByRole('button', { name: /Catalogus/i })).toBeDefined();
    expect(screen.getByText(/Dit document beschrijft de curated context./i)).toBeDefined();
    expect(screen.getByText(/Technologiespecifieke tekst./i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Catalogus/i }));
    expect(screen.getByText(/Concreet catalogusfragment./i)).toBeDefined();

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('X-User-Role')).toBe('Viewer');
    expect(headers.get('X-Actor-Id')).toBe('dashboard-reader');
  });
});