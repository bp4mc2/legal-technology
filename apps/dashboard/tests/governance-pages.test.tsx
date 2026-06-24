import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ProposalsPage from '../src/components/ProposalsPage';
import CommentsPage from '../src/components/CommentsPage';
import AuditLogPage from '../src/components/AuditLogPage';
import StickyNotesPanel from '../src/components/StickyNotesPanel';
import { ActiveTechnologyProvider, useActiveTechnology } from '../src/components/ActiveTechnologyContext';

function renderWithProviders(node: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ActiveTechnologyProvider>{node}</ActiveTechnologyProvider>
    </MemoryRouter>
  );
}

const CONTEXT_TECH = {
  id: 'tech-ctx-1',
  iri: 'https://data.bp4mc2.org/id/lto/legaltech/tech-ctx-1/v/1.0',
  naam: 'Context Tech',
};

const ContextBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setActiveTechnology } = useActiveTechnology();

  React.useEffect(() => {
    setActiveTechnology(CONTEXT_TECH);
    return () => setActiveTechnology(null);
  }, [setActiveTechnology]);

  return <>{children}</>;
};

function renderWithActiveContext(node: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ActiveTechnologyProvider>
        <ContextBootstrap>{node}</ContextBootstrap>
      </ActiveTechnologyProvider>
    </MemoryRouter>
  );
}

type MockResponseShape = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function jsonResponse(payload: unknown): MockResponseShape {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

beforeEach(() => {
  window.localStorage.setItem('lt-user-role', 'Moderator');
  window.localStorage.setItem('lt-actor-id', 'dashboard-user-1');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('Governance pages', () => {
  it('renders proposals with permission-driven action states', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse([
        {
          id: 'vst-001',
          title: 'Nieuw voorstel',
          description: 'Beschrijving van het voorstel',
          entityType: 'Technologie',
          entityLabel: 'LegalKM',
          entityId: 'legalkm--v--1.0',
          status: 'In behandeling',
          submittedBy: 'dashboard-user-1',
          submittedAt: '2026-06-02',
          reason: null,
        },
      ]) as unknown as Response
    )
    .mockResolvedValueOnce(
      jsonResponse({
        role: 'Moderator',
        actions: {
          'proposal.create': true,
          'proposal.approve': true,
          'proposal.reject': false,
          'proposal.withdraw': false,
          'comment.create': true,
          'comment.update_status': true,
          'comment.escalate': true,
          'audit.read': true,
        },
      }) as unknown as Response
    );

    renderWithProviders(<ProposalsPage />);

    const approveButton = await screen.findByRole('button', { name: 'Goedkeuren' });
    const rejectButton = await screen.findByRole('button', { name: 'Afwijzen' });

    expect((approveButton as HTMLButtonElement).disabled).toBe(false);
    expect((rejectButton as HTMLButtonElement).disabled).toBe(true);

    const firstRequestHeaders = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(firstRequestHeaders.get('X-User-Role')).toBe('Moderator');
    expect(firstRequestHeaders.get('X-Actor-Id')).toBe('dashboard-user-1');
  });

  it('shows a request error on comments page when API returns non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        {
          ok: false,
          status: 500,
          json: async () => ({}),
          text: async () => '',
        } as unknown as Response
      )
      .mockResolvedValueOnce(
        jsonResponse({
          role: 'Moderator',
          actions: {
            'comment.create': true,
            'comment.update_status': true,
            'comment.escalate': true,
            'proposal.create': true,
            'proposal.approve': true,
            'proposal.reject': true,
            'proposal.withdraw': true,
            'audit.read': true,
          },
        }) as unknown as Response
      );

    renderWithProviders(<CommentsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent || '').toContain('API error: 500');
  });

  it('shows empty-state messaging on audit log page for empty API data', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(jsonResponse([]) as unknown as Response);

    renderWithProviders(<AuditLogPage />);

    const heading = await screen.findByRole('heading', { name: 'Auditlog' });
    expect(heading).toBeDefined();

    const emptyMessage = await screen.findByText(
      'Geen auditregels gevonden die voldoen aan de filters.'
    );
    expect(emptyMessage).toBeDefined();
  });

  it('adds entityId context filter to comments requests when active technology exists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const requestUrl = String(input);
      if (requestUrl.includes('/api/governance/permissions')) {
        return jsonResponse({
          role: 'Moderator',
          actions: {
            'comment.create': true,
            'comment.update_status': true,
            'comment.escalate': true,
            'proposal.create': true,
            'proposal.approve': true,
            'proposal.reject': true,
            'proposal.withdraw': true,
            'audit.read': true,
          },
        }) as unknown as Response;
      }
      return jsonResponse([]) as unknown as Response;
    });

    renderWithActiveContext(<CommentsPage />);
    await screen.findByRole('heading', { name: 'Opmerkingen' });

    await waitFor(() => {
      const commentCalls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((url) => url.includes('/api/governance/comments'));
      expect(commentCalls.some((url) => url.includes('entityId=tech-ctx-1'))).toBe(true);
    });
  });

  it('adds entityId context filter to audit requests when active technology exists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse([]) as unknown as Response);

    renderWithActiveContext(<AuditLogPage />);
    await screen.findByRole('heading', { name: 'Auditlog' });

    await waitFor(() => {
      const auditCalls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((url) => url.includes('/api/governance/audit-log'));
      expect(auditCalls.some((url) => url.includes('entityId=tech-ctx-1'))).toBe(true);
    });
  });

  it('adds technologyUri context filter to sticky notes requests when active technology exists', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const requestUrl = String(input);
      if (requestUrl.includes('/api/legaltechnologies/enumerations/StickyNoteStatussen')) {
        return jsonResponse({ name: 'StickyNoteStatussen', values: [] }) as unknown as Response;
      }
      if (requestUrl.includes('/api/stickynotes')) {
        return jsonResponse([]) as unknown as Response;
      }
      return jsonResponse([]) as unknown as Response;
    });

    renderWithActiveContext(<StickyNotesPanel />);
    await waitFor(() => {
      const notesCalls = fetchMock.mock.calls
        .map((call) => String(call[0]))
        .filter((url) => url.includes('/api/stickynotes'));
      expect(
        notesCalls.some(
          (url) =>
            url.includes('/api/stickynotes?technologyUri=')
            && url.includes(encodeURIComponent(CONTEXT_TECH.iri))
        )
      ).toBe(true);
    });
  });
});
