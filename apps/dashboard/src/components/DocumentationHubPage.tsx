import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { apiFetch } from '../utils/api';

type DocumentationSection = {
  id: string;
  title: string;
  content: string;
  source: string;
  updated_at: string;
  group_id: string;
  group_title: string;
  source_label: string;
};

type DocumentationGroup = {
  id: string;
  title: string;
  description: string;
  source_label: string;
  sections: DocumentationSection[];
};

type DocumentationHubResponse = {
  groups: DocumentationGroup[];
  sections: DocumentationSection[];
  section_count: number;
  correlation_id: string;
};

type TechnologyDocumentation = {
  technology_id: string;
  section_title: string;
  content: string;
  source: string;
  correlation_id?: string;
};

const STALE_AFTER_DAYS = 21;

function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenPattern = /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`)/g;
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const fullMatch = match[0];
    const matchOffset = match.index ?? 0;

    if (matchOffset > lastIndex) {
      nodes.push(text.slice(lastIndex, matchOffset));
    }

    if (match[2] && match[3]) {
      const href = match[3];
      const isExternal = /^https?:\/\//i.test(href);
      nodes.push(
        <a
          key={`${keyPrefix}-link-${matchIndex}`}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noreferrer' : undefined}
        >
          {match[2]}
        </a>,
      );
    } else if (match[4]) {
      nodes.push(
        <code key={`${keyPrefix}-code-${matchIndex}`}>
          {match[4]}
        </code>,
      );
    } else {
      nodes.push(fullMatch);
    }

    lastIndex = matchOffset + fullMatch.length;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function splitMarkdownBlocks(markdown: string): Array<{ type: 'text' | 'code'; lines: string[] }> {
  const blocks: Array<{ type: 'text' | 'code'; lines: string[] }> = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let currentTextLines: string[] = [];
  let currentCodeLines: string[] | null = null;

  const flushText = () => {
    if (currentTextLines.length > 0) {
      blocks.push({ type: 'text', lines: currentTextLines });
      currentTextLines = [];
    }
  };

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (currentCodeLines) {
        blocks.push({ type: 'code', lines: currentCodeLines });
        currentCodeLines = null;
      } else {
        flushText();
        currentCodeLines = [];
      }
      continue;
    }

    if (currentCodeLines) {
      currentCodeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushText();
      continue;
    }

    currentTextLines.push(line);
  }

  flushText();

  if (currentCodeLines) {
    blocks.push({ type: 'code', lines: currentCodeLines });
  }

  return blocks;
}

function isTableBlock(lines: string[]) {
  if (lines.length < 2) {
    return false;
  }

  const separator = lines[1].trim();
  return lines[0].includes('|') && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(separator);
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function renderMarkdownBlock(lines: string[], key: string) {
  if (lines.length === 1) {
    const headingMatch = lines[0].match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInlineMarkdown(headingMatch[2], `${key}-heading`);
      switch (level) {
        case 1:
          return <h1 key={key}>{content}</h1>;
        case 2:
          return <h2 key={key}>{content}</h2>;
        case 3:
          return <h3 key={key}>{content}</h3>;
        case 4:
          return <h4 key={key}>{content}</h4>;
        case 5:
          return <h5 key={key}>{content}</h5>;
        default:
          return <h6 key={key}>{content}</h6>;
      }
    }
  }

  if (isTableBlock(lines)) {
    const [headerLine, , ...bodyLines] = lines;
    const headers = parseTableRow(headerLine);
    const rows = bodyLines.map(parseTableRow);
    return (
      <table key={key}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`${key}-header-${index}`}>{renderInlineMarkdown(header, `${key}-header-${index}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${key}-row-${rowIndex}-cell-${cellIndex}`}>
                  {renderInlineMarkdown(cell, `${key}-row-${rowIndex}-cell-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (lines.every((line) => /^[-*+]\s+/.test(line))) {
    return (
      <ul key={key}>
        {lines.map((line, index) => (
          <li key={`${key}-item-${index}`}>{renderInlineMarkdown(line.replace(/^[-*+]\s+/, ''), `${key}-item-${index}`)}</li>
        ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return (
      <ol key={key}>
        {lines.map((line, index) => (
          <li key={`${key}-item-${index}`}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''), `${key}-item-${index}`)}</li>
        ))}
      </ol>
    );
  }

  if (lines.every((line) => /^>\s?/.test(line))) {
    return (
      <blockquote key={key}>
        <p>{renderInlineMarkdown(lines.map((line) => line.replace(/^>\s?/, '')).join(' '), `${key}-quote`)}</p>
      </blockquote>
    );
  }

  return <p key={key}>{renderInlineMarkdown(lines.join(' '), `${key}-paragraph`)}</p>;
}

function renderMarkdownContent(markdown: string) {
  return splitMarkdownBlocks(markdown).map((block, index) => {
    if (block.type === 'code') {
      return (
        <pre key={`code-${index}`}>
          <code>{block.lines.join('\n')}</code>
        </pre>
      );
    }

    return renderMarkdownBlock(block.lines, `block-${index}`);
  });
}

function buildDocumentationLink(sectionId: string, technologyId?: string) {
  const params = new URLSearchParams();
  params.set('section', sectionId);
  if (technologyId) {
    params.set('technology', technologyId);
  }
  return `/documentation?${params.toString()}`;
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return 'Onbekend';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Onbekend';
  }

  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function isStale(value?: string) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const ageMs = Date.now() - parsed.getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

const DocumentationHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = React.useState<DocumentationGroup[]>([]);
  const [sections, setSections] = React.useState<DocumentationSection[]>([]);
  const [technologyDocumentation, setTechnologyDocumentation] = React.useState<TechnologyDocumentation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [technologyError, setTechnologyError] = React.useState<string | null>(null);

  const requestedSectionId = searchParams.get('section') || '';
  const technologyId = searchParams.get('technology') || '';

  React.useEffect(() => {
    let cancelled = false;

    async function loadSections() {
      setLoading(true);
      setError(null);

      try {
        const payload = await apiFetch<DocumentationHubResponse>('/api/legaltechnologies/documentation/hub');
        if (cancelled) {
          return;
        }
        setGroups(payload.groups);
        setSections(payload.sections);
      } catch (caughtError: any) {
        if (cancelled) {
          return;
        }
        setError(caughtError.message || 'Documentatie kon niet worden geladen.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSections();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    if (requestedSectionId && sections.some((section) => section.id === requestedSectionId)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('section', sections[0].id);
    if (technologyId) {
      nextParams.set('technology', technologyId);
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [requestedSectionId, searchParams, sections, setSearchParams, technologyId]);

  React.useEffect(() => {
    if (!technologyId) {
      setTechnologyDocumentation(null);
      setTechnologyError(null);
      return;
    }

    let cancelled = false;

    async function loadTechnologyDocumentation() {
      setTechnologyError(null);

      try {
        const payload = await apiFetch<TechnologyDocumentation>(`/api/legaltechnologies/${encodeURIComponent(technologyId)}/documentation`);
        if (!cancelled) {
          setTechnologyDocumentation(payload);
        }
      } catch (caughtError: any) {
        if (!cancelled) {
          setTechnologyDocumentation(null);
          setTechnologyError(caughtError.message || 'Technologiespecifieke documentatie kon niet worden geladen.');
        }
      }
    }

    loadTechnologyDocumentation();
    return () => {
      cancelled = true;
    };
  }, [technologyId]);

  const selectedSection = sections.find((section) => section.id === requestedSectionId) || sections[0] || null;
  const staleSelectedSection = selectedSection?.group_id === 'generated' && isStale(selectedSection?.updated_at);

  const handleSectionSelect = React.useCallback((sectionId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('section', sectionId);
    if (technologyId) {
      nextParams.set('technology', technologyId);
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams, technologyId]);

  return (
    <div className="lt-panel-shell lt-docs-hub">
      <div className="lt-docs-hub-header">
        <div>
          <h2 className="lt-panel-heading lt-docs-hub-title">Documentatiehub</h2>
          <p className="lt-docs-hub-intro">
            Centrale ingang voor gegenereerde media-secties en handmatige documentatie uit de docs-map, naast beheerde begrippen en organisaties.
          </p>
        </div>
        <div className="lt-docs-hub-actions" aria-label="Documentatiekoppelingen">
          <Link to={buildDocumentationLink('catalogus', technologyId || undefined)} className="lt-docs-hub-link">Open Catalogus</Link>
          <Link to="/organisations" className="lt-docs-hub-link lt-docs-hub-link--secondary">Open Organisaties</Link>
        </div>
      </div>

      <div className="lt-docs-hub-summary" aria-label="Documentatie samenvatting">
        <div className="lt-docs-hub-summary-card">
          <span className="lt-docs-hub-summary-label">Beschikbare secties</span>
          <strong className="lt-docs-hub-summary-value">{sections.length}</strong>
        </div>
        <div className="lt-docs-hub-summary-card">
          <span className="lt-docs-hub-summary-label">Bronclusters</span>
          <strong className="lt-docs-hub-summary-value">{groups.length}</strong>
        </div>
        <div className="lt-docs-hub-summary-card">
          <span className="lt-docs-hub-summary-label">Actieve bron</span>
          <strong className="lt-docs-hub-summary-value">{selectedSection?.source || 'Nog geen selectie'}</strong>
        </div>
      </div>

      {loading ? <div className="lt-docs-hub-message">Documentatie laden...</div> : null}
      {error ? (
        <div className="lt-panel-alert rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          Documentatiehub kon niet laden: {error}. Controleer de gegenereerde media-uitvoer of de curated docs-bronnen.
        </div>
      ) : null}

      {!loading && !error && sections.length === 0 ? (
        <div className="lt-panel-alert rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900" role="status">
          Er zijn nog geen documentatiefragmenten beschikbaar. Gebruik voorlopig <Link to="/definitions">Definities</Link> en controleer daarna de docs- en media-bronnen.
        </div>
      ) : null}

      {!loading && !error && sections.length > 0 && selectedSection ? (
        <div className="lt-docs-hub-grid">
          <nav className="lt-docs-hub-nav" aria-label="Documentatiesecties">
            {groups.map((group) => (
              <div key={group.id} className="lt-docs-hub-nav-group">
                <div className="lt-docs-hub-nav-group-title">{group.title}</div>
                <div className="lt-docs-hub-nav-group-copy">{group.description}</div>
                {group.sections.map((section) => {
                  const active = section.id === selectedSection.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`lt-docs-hub-nav-button${active ? ' is-active' : ''}`}
                      onClick={() => handleSectionSelect(section.id)}
                      aria-pressed={active}
                    >
                      <span className="lt-docs-hub-nav-title">{section.title}</span>
                      <span className="lt-docs-hub-nav-meta">{section.source}</span>
                      <span className="lt-docs-hub-nav-meta">Bijgewerkt: {formatUpdatedAt(section.updated_at)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <section className="lt-docs-hub-content" aria-labelledby="documentation-section-title">
            {technologyDocumentation ? (
              <div className="lt-docs-hub-focus">
                <div className="lt-docs-hub-focus-head">
                  <div>
                    <h3 className="lt-docs-hub-focus-title">Technologiespecifieke documentatie</h3>
                    <p className="lt-docs-hub-content-meta mb-0">
                      Bron: <span>{technologyDocumentation.source}</span>
                    </p>
                  </div>
                  <span className="lt-docs-hub-badge lt-docs-hub-badge--muted">Catalogusspotlight</span>
                </div>
                <div className="lt-docs-hub-focus-body">
                  <h4 className="lt-docs-hub-focus-section-title">{technologyDocumentation.section_title}</h4>
                  <div className="lt-docs-hub-markdown-content">
                    {renderMarkdownContent(technologyDocumentation.content)}
                  </div>
                </div>
              </div>
            ) : null}

            {technologyError ? (
              <div className="lt-panel-alert rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
                Technologiespecifieke documentatie kon niet worden geladen: {technologyError}
              </div>
            ) : null}

            <div className="lt-docs-hub-content-header">
              <div>
                <h3 id="documentation-section-title" className="lt-docs-hub-content-title">{selectedSection.title}</h3>
                <p className="lt-docs-hub-content-meta">
                  Bron: <span>{selectedSection.source}</span> · Bijgewerkt: <span>{formatUpdatedAt(selectedSection.updated_at)}</span>
                </p>
              </div>
              <span className="lt-docs-hub-badge">{selectedSection.source_label}</span>
            </div>

            {staleSelectedSection ? (
              <div className="lt-panel-alert rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="status">
                Deze documentatie lijkt ouder dan {STALE_AFTER_DAYS} dagen. Controleer of `tools/generate_respec.py` opnieuw moet worden uitgevoerd.
              </div>
            ) : null}

            <div className="lt-docs-hub-markdown">
              <div className="lt-docs-hub-markdown-content">
                {renderMarkdownContent(selectedSection.content)}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default DocumentationHubPage;