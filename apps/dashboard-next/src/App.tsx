import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import LegalTechnologyCatalogDetailsPage from './pages/LegalTechnologyCatalogDetailsPage';
import LegalTechnologyDetailPage from './pages/LegalTechnologyDetailPage';
import { ApiError, apiFetch } from './utils/api';

type LegalTechnology = {
  id: string;
  naam: string;
  omschrijving: string;
  gebruiksstatus?: string;
  technologietype?: string;
  proposal_required?: boolean;
  can_mutate_directly?: boolean;
};

type EnumerationGroup = {
  name: string;
  values: string[];
};

type ErrorPanelState = {
  message: string;
  recovery?: string;
  correlationId?: string;
};

type DocumentationPanelState = {
  technologyId: string;
  technologyName: string;
  sectionTitle: string;
  content: string;
  source: string;
  correlationId?: string;
};

type ProductOption = {
  id: string;
  iri: string;
  label: string;
};

type ProductTraceabilityRelation = {
  task_id: string;
  task_iri: string;
  task_label: string;
  predicate: string;
  relation_kind: 'input' | 'output';
};

type ProductTraceability = {
  product: ProductOption;
  relations: {
    input: ProductTraceabilityRelation[];
    output: ProductTraceabilityRelation[];
  };
};

type ContributionEvidenceLink = {
  title?: string;
  location?: string;
  reference?: string;
};

type ProductContributionTechnology = {
  id: string;
  iri: string;
  label: string;
  evidence_links: ContributionEvidenceLink[];
};

type ProductContributionTaskNode = {
  task_id: string;
  task_iri: string;
  task_label: string;
  predicate: string;
  relation_kind: 'input' | 'output';
  missing_node: boolean;
  missing_reason?: string;
  technologies: ProductContributionTechnology[];
};

type ProductContributionChain = {
  product: ProductOption;
  chains: {
    input: ProductContributionTaskNode[];
    output: ProductContributionTaskNode[];
  };
  partial_data: boolean;
};

type RailTab = 'documentatie' | 'opmerkingen' | 'governance';
type SidebarSection =
  | 'technologies'
  | 'compare'
  | 'selection'
  | 'proposals'
  | 'comments'
  | 'audit'
  | 'relations-tasks'
  | 'relations-contribution';
type UserRole = 'Proposer' | 'Moderator' | 'Admin';
type RailComment = {
  id: string;
  technologyId: string;
  contextSource: string;
  author: string;
  text: string;
  status: 'open' | 'resolved';
};

const MIN_COMPARE = 2;
const MAX_COMPARE = 4;
const PRODUCT_TRACEABILITY_EMPTY_STATE_DEADLINE_MS = 2000;
const CURRENT_USER_ROLE: UserRole = 'Proposer';

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
    proposal_required: typeof record.proposal_required === 'boolean' ? record.proposal_required : undefined,
    can_mutate_directly: typeof record.can_mutate_directly === 'boolean' ? record.can_mutate_directly : undefined,
  };
};

const normalizeProduct = (value: unknown): ProductOption | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asText(record.id).trim();
  const iri = asText(record.iri).trim();
  if (!id || !iri) {
    return null;
  }

  return {
    id,
    iri,
    label: asText(record.label, id),
  };
};

const normalizeTraceabilityRelation = (value: unknown): ProductTraceabilityRelation | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const relationKind = asText(record.relation_kind);
  if (relationKind !== 'input' && relationKind !== 'output') {
    return null;
  }

  const taskIri = asText(record.task_iri).trim();
  if (!taskIri) {
    return null;
  }

  return {
    task_id: asText(record.task_id).trim() || taskIri,
    task_iri: taskIri,
    task_label: asText(record.task_label, taskIri),
    predicate: asText(record.predicate),
    relation_kind: relationKind,
  };
};

const normalizeTraceability = (value: unknown): ProductTraceability | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const product = normalizeProduct(record.product);
  const relationsRecord = record.relations as Record<string, unknown> | undefined;
  if (!product || !relationsRecord) {
    return null;
  }

  const input = Array.isArray(relationsRecord.input)
    ? relationsRecord.input
        .map((entry) => normalizeTraceabilityRelation(entry))
        .filter((entry): entry is ProductTraceabilityRelation => Boolean(entry && entry.relation_kind === 'input'))
    : [];
  const output = Array.isArray(relationsRecord.output)
    ? relationsRecord.output
        .map((entry) => normalizeTraceabilityRelation(entry))
        .filter((entry): entry is ProductTraceabilityRelation => Boolean(entry && entry.relation_kind === 'output'))
    : [];

  return {
    product,
    relations: {
      input,
      output,
    },
  };
};

const normalizeEvidenceLink = (value: unknown): ContributionEvidenceLink | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const title = asText(record.title).trim();
  const location = asText(record.location).trim();
  const reference = asText(record.reference).trim();
  if (!title && !location && !reference) {
    return null;
  }
  return {
    title: title || undefined,
    location: location || undefined,
    reference: reference || undefined,
  };
};

const normalizeContributionTechnology = (value: unknown): ProductContributionTechnology | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = asText(record.id).trim();
  const iri = asText(record.iri).trim();
  if (!id || !iri) {
    return null;
  }

  const evidenceLinks = Array.isArray(record.evidence_links)
    ? record.evidence_links
        .map((entry) => normalizeEvidenceLink(entry))
        .filter((entry): entry is ContributionEvidenceLink => Boolean(entry))
    : [];

  return {
    id,
    iri,
    label: asText(record.label, id),
    evidence_links: evidenceLinks,
  };
};

const normalizeContributionTaskNode = (value: unknown): ProductContributionTaskNode | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const relationKind = asText(record.relation_kind);
  if (relationKind !== 'input' && relationKind !== 'output') {
    return null;
  }

  const taskIri = asText(record.task_iri).trim();
  if (!taskIri) {
    return null;
  }

  const technologies = Array.isArray(record.technologies)
    ? record.technologies
        .map((entry) => normalizeContributionTechnology(entry))
        .filter((entry): entry is ProductContributionTechnology => Boolean(entry))
    : [];

  return {
    task_id: asText(record.task_id).trim() || taskIri,
    task_iri: taskIri,
    task_label: asText(record.task_label, taskIri),
    predicate: asText(record.predicate),
    relation_kind: relationKind,
    missing_node: Boolean(record.missing_node),
    missing_reason: asText(record.missing_reason).trim() || undefined,
    technologies,
  };
};

const normalizeContributionChain = (value: unknown): ProductContributionChain | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const product = normalizeProduct(record.product);
  const chainsRecord = record.chains as Record<string, unknown> | undefined;
  if (!product || !chainsRecord) {
    return null;
  }

  const input = Array.isArray(chainsRecord.input)
    ? chainsRecord.input
        .map((entry) => normalizeContributionTaskNode(entry))
        .filter((entry): entry is ProductContributionTaskNode => Boolean(entry && entry.relation_kind === 'input'))
    : [];

  const output = Array.isArray(chainsRecord.output)
    ? chainsRecord.output
        .map((entry) => normalizeContributionTaskNode(entry))
        .filter((entry): entry is ProductContributionTaskNode => Boolean(entry && entry.relation_kind === 'output'))
    : [];

  return {
    product,
    chains: {
      input,
      output,
    },
    partial_data: Boolean(record.partial_data),
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
  const [error, setError] = useState<ErrorPanelState | null>(null);
  const [documentation, setDocumentation] = useState<DocumentationPanelState | null>(null);
  const [documentationLoading, setDocumentationLoading] = useState(false);
  const [documentationError, setDocumentationError] = useState<ErrorPanelState | null>(null);
  const [productTraceabilityOpen, setProductTraceabilityOpen] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productOptionsLoading, setProductOptionsLoading] = useState(false);
  const [productTraceabilityLoading, setProductTraceabilityLoading] = useState(false);
  const [productTraceabilityError, setProductTraceabilityError] = useState<ErrorPanelState | null>(null);
  const [productTraceability, setProductTraceability] = useState<ProductTraceability | null>(null);
  const [productContributionChainLoading, setProductContributionChainLoading] = useState(false);
  const [productContributionChainError, setProductContributionChainError] = useState<ErrorPanelState | null>(null);
  const [productContributionChain, setProductContributionChain] = useState<ProductContributionChain | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [factFindVisible, setFactFindVisible] = useState(true);
  const [railTab, setRailTab] = useState<RailTab>('documentatie');
  const [activeTechnologyId, setActiveTechnologyId] = useState<string | null>(null);
  const [lastContextUpdateLabel, setLastContextUpdateLabel] = useState<string | null>(null);
  const [activeSidebarSection, setActiveSidebarSection] = useState<SidebarSection>('technologies');
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByTechnology, setCommentsByTechnology] = useState<Record<string, RailComment[]>>({});
  const latestRequestId = useRef(0);
  const activeAbortController = useRef<AbortController | null>(null);
  const latestProductTraceabilityRequestId = useRef(0);
  const activeProductTraceabilityAbortController = useRef<AbortController | null>(null);
  const latestProductContributionRequestId = useRef(0);
  const activeProductContributionAbortController = useRef<AbortController | null>(null);
  const latestProductListRequestId = useRef(0);
  const activeProductListAbortController = useRef<AbortController | null>(null);
  const latestDocumentationRequestId = useRef(0);
  const activeDocumentationAbortController = useRef<AbortController | null>(null);
  const productTraceabilityDeadlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearProductTraceabilityDeadlineTimer = () => {
    if (productTraceabilityDeadlineTimer.current) {
      clearTimeout(productTraceabilityDeadlineTimer.current);
      productTraceabilityDeadlineTimer.current = null;
    }
  };

  const buildEmptyTraceabilityFallback = (product: ProductOption | null): ProductTraceability | null => {
    if (!product) {
      return null;
    }

    return {
      product,
      relations: {
        input: [],
        output: [],
      },
    };
  };

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
      if (caughtError instanceof ApiError && caughtError.status === 403) {
        setError({
          message: caughtError.message,
          recovery: 'Try an allowed action, continue with read-only tasks, or contact a moderator for help.',
          correlationId: caughtError.correlationId,
        });
      } else {
        const message = caughtError instanceof Error ? caughtError.message : 'Unknown API error';
        setError({ message });
      }
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
      activeDocumentationAbortController.current?.abort();
      activeProductTraceabilityAbortController.current?.abort();
      activeProductContributionAbortController.current?.abort();
      activeProductListAbortController.current?.abort();
      clearProductTraceabilityDeadlineTimer();
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

  const activeTechnology = useMemo(() => {
    if (activeTechnologyId && knownItems[activeTechnologyId]) {
      return knownItems[activeTechnologyId];
    }
    return visibleItems[0] ?? null;
  }, [activeTechnologyId, knownItems, visibleItems]);

  const canModerateRailActions = CURRENT_USER_ROLE === 'Moderator' || CURRENT_USER_ROLE === 'Admin';

  const workspaceFocus = useMemo(() => {
    switch (activeSidebarSection) {
      case 'compare':
        return {
          title: 'Focus: Vergelijken',
          description: 'Werk in de compare-strook en open de compare-workspace zodra er minimaal 2 technologieen zijn geselecteerd.',
        };
      case 'selection':
        return {
          title: 'Focus: Selectie',
          description: 'Beheer je huidige vergelijkselectie en houd 2-4 technologieen actief voor een geldige vergelijking.',
        };
      case 'proposals':
        return {
          title: 'Focus: Governance voorstellen',
          description: 'De context rail staat op Governance zodat je voorstellen en auditcontext direct ziet voor de actieve technologie.',
        };
      case 'comments':
        return {
          title: 'Focus: Opmerkingen',
          description: 'De context rail staat op Opmerkingen zodat je contextgebonden commentaar kunt lezen en toevoegen.',
        };
      case 'audit':
        return {
          title: 'Focus: Auditlog',
          description: 'Gebruik de Governance-tab in de context rail om recente auditgebeurtenissen te beoordelen.',
        };
      case 'relations-tasks':
        return {
          title: 'Focus: Taken -> Producten',
          description: 'De product traceability workspace opent voor taak-productrelaties met input/output-semantiek.',
        };
      case 'relations-contribution':
        return {
          title: 'Focus: Bijdragekaart',
          description: 'De relationele bijdrageketen wordt in de product traceability workspace geladen voor de geselecteerde producten.',
        };
      case 'technologies':
      default:
        return {
          title: 'Focus: Alle technologieen',
          description: 'Zoek, filter en selecteer technologieen; klik een kaart om de actieve context in de rail te sturen.',
        };
    }
  }, [activeSidebarSection]);

  useEffect(() => {
    if (!activeTechnology) {
      return;
    }

    setCommentsByTechnology((previous) => {
      if (previous[activeTechnology.id]) {
        return previous;
      }

      return {
        ...previous,
        [activeTechnology.id]: [
          {
            id: `${activeTechnology.id}-seed-comment`,
            technologyId: activeTechnology.id,
            contextSource: 'workspace-context',
            author: 'Policy observer',
            text: `Context check voor ${activeTechnology.naam}: beoordeel impact op implementatievolgorde.`,
            status: 'open',
          },
        ],
      };
    });
  }, [activeTechnology]);

  const activeComments = useMemo(() => {
    if (!activeTechnology) {
      return [];
    }
    return commentsByTechnology[activeTechnology.id] ?? [];
  }, [activeTechnology, commentsByTechnology]);

  const pendingProposals = useMemo(() => {
    if (!activeTechnology) {
      return [];
    }

    return [
      {
        id: `${activeTechnology.id}-proposal-status`,
        title: `${activeTechnology.naam} statuswijziging`,
        summary: (activeTechnology.proposal_required ?? true)
          ? 'Voorstel vereist voordat mutatie wordt doorgevoerd.'
          : 'Directe mutatie toegestaan, finale controle door governance vereist.',
      },
    ];
  }, [activeTechnology]);

  const recentAuditEntries = useMemo(() => {
    if (!activeTechnology) {
      return [];
    }

    return [
      {
        id: `${activeTechnology.id}-audit-1`,
        at: 'Vandaag 09:12',
        text: `Context op ${activeTechnology.naam} gesynchroniseerd met compare-workspace.`,
      },
      {
        id: `${activeTechnology.id}-audit-2`,
        at: 'Vandaag 08:45',
        text: 'Laatste governance-check uitgevoerd op proposal policy-uitkomst.',
      },
    ];
  }, [activeTechnology]);

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

  const openTechnologyDetails = (technologyId: string) => {
    navigate(`/legaltechnologies/${encodeURIComponent(technologyId)}`);
  };

  const activateTechnologyContext = (
    technology: LegalTechnology,
    options?: { loadDocumentation?: boolean; nextRailTab?: RailTab },
  ) => {
    setActiveTechnologyId(technology.id);
    setLastContextUpdateLabel(new Date().toLocaleTimeString());
    if (options?.nextRailTab) {
      setRailTab(options.nextRailTab);
    }
    if (options?.loadDocumentation) {
      requestTechnologyDocumentation(technology);
    }
  };

  const navigateShellSection = (section: SidebarSection, options?: { targetId?: string; railTab?: RailTab; openTraceability?: boolean }) => {
    setActiveSidebarSection(section);
    if (options?.railTab) {
      setRailTab(options.railTab);
    }
    if (options?.openTraceability) {
      void openProductTraceability();
      return;
    }
    if (options?.targetId) {
      const targetElement = document.getElementById(options.targetId);
      targetElement?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  };

  const changeRailTab = (nextTab: RailTab) => {
    setRailTab(nextTab);
    if (nextTab === 'opmerkingen') {
      setActiveSidebarSection('comments');
      return;
    }
    if (nextTab === 'governance') {
      setActiveSidebarSection('proposals');
      return;
    }
    setActiveSidebarSection('technologies');
  };

  const addContextComment = () => {
    if (!activeTechnology) {
      return;
    }

    const trimmed = commentDraft.trim();
    if (!trimmed) {
      return;
    }

    const comment: RailComment = {
      id: `${activeTechnology.id}-${Date.now()}`,
      technologyId: activeTechnology.id,
      contextSource: documentation?.technologyId === activeTechnology.id ? documentation.source : 'workspace-context',
      author: CURRENT_USER_ROLE,
      text: trimmed,
      status: 'open',
    };

    setCommentsByTechnology((previous) => {
      const current = previous[activeTechnology.id] ?? [];
      return {
        ...previous,
        [activeTechnology.id]: [comment, ...current],
      };
    });
    setCommentDraft('');
  };

  const resolveComment = (commentId: string) => {
    if (!activeTechnology || !canModerateRailActions) {
      return;
    }

    setCommentsByTechnology((previous) => {
      const current = previous[activeTechnology.id] ?? [];
      return {
        ...previous,
        [activeTechnology.id]: current.map((comment) => (
          comment.id === commentId ? { ...comment, status: 'resolved' } : comment
        )),
      };
    });
  };

  const loadTechnologyDocumentation = async (technology: LegalTechnology, requestId: number, signal: AbortSignal) => {
    if (requestId !== latestDocumentationRequestId.current) {
      return;
    }
    setDocumentationLoading(true);
    setDocumentationError(null);

    try {
      const payload = await apiFetch<{
        technology_id: string;
        section_title?: string;
        content?: string;
        source?: string;
        correlation_id?: string;
      }>(`/api/legaltechnologies/${encodeURIComponent(technology.id)}/documentation`, { signal });

      if (signal.aborted || requestId !== latestDocumentationRequestId.current) {
        return;
      }

      setDocumentation({
        technologyId: payload.technology_id || technology.id,
        technologyName: technology.naam,
        sectionTitle: payload.section_title || technology.naam,
        content: payload.content || '',
        source: payload.source || 'media/legal-technologies.md',
        correlationId: payload.correlation_id,
      });
    } catch (caughtError) {
      if (signal.aborted || requestId !== latestDocumentationRequestId.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setDocumentationError({
          message: caughtError.message,
          recovery: 'Try again, pick another technology, or open catalog details for broader context.',
          correlationId: caughtError.correlationId,
        });
      } else {
        setDocumentationError({
          message: caughtError instanceof Error ? caughtError.message : 'Could not load documentation.',
        });
      }
    } finally {
      if (requestId === latestDocumentationRequestId.current) {
        setDocumentationLoading(false);
      }
    }
  };

  const requestTechnologyDocumentation = (technology: LegalTechnology) => {
    activeDocumentationAbortController.current?.abort();
    const controller = new AbortController();
    activeDocumentationAbortController.current = controller;
    latestDocumentationRequestId.current += 1;
    const requestId = latestDocumentationRequestId.current;
    void loadTechnologyDocumentation(technology, requestId, controller.signal);
  };

  const openCatalogDetails = () => {
    navigate('/catalog-details');
  };

  const loadProductTraceability = async (
    productId: string,
    requestId: number,
    signal: AbortSignal,
    fallbackProduct: ProductOption | null,
  ) => {
    if (!productId) {
      setProductTraceability(null);
      setProductTraceabilityLoading(false);
      return;
    }

    setProductTraceabilityLoading(true);
    setProductTraceabilityError(null);
    clearProductTraceabilityDeadlineTimer();
    productTraceabilityDeadlineTimer.current = setTimeout(() => {
      if (signal.aborted || requestId !== latestProductTraceabilityRequestId.current) {
        return;
      }
      const fallback = buildEmptyTraceabilityFallback(fallbackProduct);
      if (fallback) {
        setProductTraceability(fallback);
        setProductTraceabilityLoading(false);
      }
    }, PRODUCT_TRACEABILITY_EMPTY_STATE_DEADLINE_MS);

    try {
      const payload = await apiFetch<unknown>(`/api/products/${encodeURIComponent(productId)}/traceability`, { signal });
      if (signal.aborted || requestId !== latestProductTraceabilityRequestId.current) {
        return;
      }
      const normalized = normalizeTraceability(payload);
      if (!normalized) {
        throw new Error('API error: invalid product traceability response');
      }
      setProductTraceability(normalized);
    } catch (caughtError) {
      if (signal.aborted || requestId !== latestProductTraceabilityRequestId.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setProductTraceabilityError({
          message: caughtError.message,
          recovery: 'Try another product or return to the compare workspace.',
          correlationId: caughtError.correlationId,
        });
      } else {
        setProductTraceabilityError({
          message: caughtError instanceof Error ? caughtError.message : 'Could not load product traceability.',
          recovery: 'Try another product or return to the compare workspace.',
        });
      }
      setProductTraceability(null);
    } finally {
      if (requestId === latestProductTraceabilityRequestId.current) {
        clearProductTraceabilityDeadlineTimer();
        setProductTraceabilityLoading(false);
      }
    }
  };

  const requestProductTraceability = (productId: string, fallbackProduct: ProductOption | null) => {
    activeProductTraceabilityAbortController.current?.abort();
    clearProductTraceabilityDeadlineTimer();
    const controller = new AbortController();
    activeProductTraceabilityAbortController.current = controller;
    latestProductTraceabilityRequestId.current += 1;
    const requestId = latestProductTraceabilityRequestId.current;
    void loadProductTraceability(productId, requestId, controller.signal, fallbackProduct);
  };

  const loadProductContributionChain = async (productId: string, requestId: number, signal: AbortSignal) => {
    if (!productId) {
      setProductContributionChain(null);
      setProductContributionChainLoading(false);
      return;
    }

    setProductContributionChainLoading(true);
    setProductContributionChainError(null);

    try {
      const payload = await apiFetch<unknown>(`/api/products/${encodeURIComponent(productId)}/contribution-chain`, { signal });
      if (signal.aborted || requestId !== latestProductContributionRequestId.current) {
        return;
      }
      const normalized = normalizeContributionChain(payload);
      if (!normalized) {
        throw new Error('API error: invalid contribution chain response');
      }
      setProductContributionChain(normalized);
    } catch (caughtError) {
      if (signal.aborted || requestId !== latestProductContributionRequestId.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setProductContributionChainError({
          message: caughtError.message,
          recovery: 'Retry contribution traversal or keep working in the current workspace.',
          correlationId: caughtError.correlationId,
        });
      } else {
        setProductContributionChainError({
          message: caughtError instanceof Error ? caughtError.message : 'Could not load contribution chain.',
          recovery: 'Retry contribution traversal or keep working in the current workspace.',
        });
      }
      setProductContributionChain(null);
    } finally {
      if (requestId === latestProductContributionRequestId.current) {
        setProductContributionChainLoading(false);
      }
    }
  };

  const requestProductContributionChain = (productId: string) => {
    activeProductContributionAbortController.current?.abort();
    const controller = new AbortController();
    activeProductContributionAbortController.current = controller;
    latestProductContributionRequestId.current += 1;
    const requestId = latestProductContributionRequestId.current;
    void loadProductContributionChain(productId, requestId, controller.signal);
  };

  const openProductTraceability = async () => {
    setProductTraceabilityOpen(true);
    setProductOptionsLoading(true);
    setProductTraceabilityError(null);
    activeProductListAbortController.current?.abort();
    const controller = new AbortController();
    activeProductListAbortController.current = controller;
    latestProductListRequestId.current += 1;
    const requestId = latestProductListRequestId.current;

    try {
      const payload = await apiFetch<unknown>('/api/products', { signal: controller.signal });
      if (controller.signal.aborted || requestId !== latestProductListRequestId.current) {
        return;
      }
      if (!Array.isArray(payload)) {
        throw new Error('API error: invalid product list response');
      }

      const normalizedProducts = payload
        .map((entry) => normalizeProduct(entry))
        .filter((entry): entry is ProductOption => Boolean(entry));

      setProductOptions(normalizedProducts);

      const nextSelectedProductId = normalizedProducts.find((product) => product.id === selectedProductId)?.id
        ?? normalizedProducts[0]?.id
        ?? '';

      setSelectedProductId(nextSelectedProductId);

      if (nextSelectedProductId) {
        const fallbackProduct = normalizedProducts.find((product) => product.id === nextSelectedProductId) ?? null;
        requestProductTraceability(nextSelectedProductId, fallbackProduct);
        requestProductContributionChain(nextSelectedProductId);
      } else {
        activeProductTraceabilityAbortController.current?.abort();
        activeProductContributionAbortController.current?.abort();
        clearProductTraceabilityDeadlineTimer();
        setProductTraceability(null);
        setProductContributionChain(null);
      }
    } catch (caughtError) {
      if (controller.signal.aborted || requestId !== latestProductListRequestId.current) {
        return;
      }
      if (caughtError instanceof ApiError) {
        setProductTraceabilityError({
          message: caughtError.message,
          recovery: 'Return to the compare workspace or try again later.',
          correlationId: caughtError.correlationId,
        });
      } else {
        setProductTraceabilityError({
          message: caughtError instanceof Error ? caughtError.message : 'Could not load products.',
          recovery: 'Return to the compare workspace or try again later.',
        });
      }
      setProductOptions([]);
      setProductTraceability(null);
      setProductContributionChain(null);
    } finally {
      if (requestId === latestProductListRequestId.current) {
        setProductOptionsLoading(false);
      }
    }
  };

  const closeProductTraceability = () => {
    activeProductListAbortController.current?.abort();
    latestProductListRequestId.current += 1;
    activeProductTraceabilityAbortController.current?.abort();
    activeProductContributionAbortController.current?.abort();
    clearProductTraceabilityDeadlineTimer();
    setProductOptionsLoading(false);
    setProductTraceabilityLoading(false);
    setProductContributionChainLoading(false);
    setProductTraceabilityOpen(false);
    setProductTraceabilityError(null);
    setProductContributionChainError(null);
    setProductContributionChain(null);
    setActiveSidebarSection('technologies');
  };

  const onProductSelectionChange = async (productId: string) => {
    setSelectedProductId(productId);
    const fallbackProduct = productOptions.find((product) => product.id === productId) ?? null;
    requestProductTraceability(productId, fallbackProduct);
    requestProductContributionChain(productId);
  };

  const retryProductContributionChain = () => {
    if (!selectedProductId) {
      return;
    }
    requestProductContributionChain(selectedProductId);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header role="banner" className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">dashboard-next</p>
            <h1 className="text-2xl font-semibold text-slate-900">Juridische Technologie Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1">Rol: {CURRENT_USER_ROLE}</span>
            <button
              type="button"
              className="rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-cyan-900"
              onClick={() => setFactFindVisible(true)}
            >
              Fact-find
            </button>
            <button type="button" className="rounded-full bg-cyan-700 px-2.5 py-1 text-white">
              + Voorstel
            </button>
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
            <button
              type="button"
              className="rounded-full bg-white px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-300"
              onClick={openCatalogDetails}
            >
              Catalogusdetails
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[180px_minmax(0,1fr)_220px] lg:items-start lg:px-8">
        <aside aria-label="Workspace sidebar" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Technologies</h2>
          <nav className="mt-2 space-y-1 text-sm text-slate-700" aria-label="Technologies navigation">
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'technologies'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'technologies' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('technologies', { targetId: 'technologie-ontdekken' })}
            >
              <span>Alle technologieen</span>
              <span className="text-xs text-slate-500">Lijst</span>
            </button>
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'compare'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'compare' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('compare', { targetId: 'compare-selection' })}
            >
              <span>Vergelijken</span>
              <span className="text-xs text-slate-500">Sticky bar</span>
            </button>
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'selection'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'selection' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('selection', { targetId: 'compare-selection' })}
            >
              <span>Selectie</span>
              <span className="text-xs text-slate-500">Chips</span>
            </button>
          </nav>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">Governance</h2>
          <nav className="mt-2 space-y-1 text-sm text-slate-700" aria-label="Governance navigation">
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'proposals'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'proposals' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('proposals', { railTab: 'governance', targetId: 'context-rail' })}
            >
              <span>Voorstellen</span>
              <span className="text-xs text-slate-500">Rail</span>
            </button>
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'comments'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'comments' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('comments', { railTab: 'opmerkingen', targetId: 'context-rail' })}
            >
              <span>Opmerkingen</span>
              <span className="text-xs text-slate-500">Rail</span>
            </button>
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'audit'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'audit' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('audit', { railTab: 'governance', targetId: 'context-rail' })}
            >
              <span>Auditlog</span>
              <span className="text-xs text-slate-500">Rail</span>
            </button>
          </nav>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">Relations</h2>
          <nav className="mt-2 space-y-1 text-sm text-slate-700" aria-label="Relations navigation">
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'relations-tasks'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'relations-tasks' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('relations-tasks', { openTraceability: true })}
            >
              <span>Taken → Producten</span>
              <span className="text-xs text-slate-500">Open</span>
            </button>
            <button
              type="button"
              aria-pressed={activeSidebarSection === 'relations-contribution'}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${activeSidebarSection === 'relations-contribution' ? 'bg-cyan-50 text-cyan-900 ring-1 ring-cyan-200' : 'hover:bg-slate-50'}`}
              onClick={() => navigateShellSection('relations-contribution', { openTraceability: true })}
            >
              <span>Bijdragekaart</span>
              <span className="text-xs text-slate-500">Open</span>
            </button>
          </nav>
        </aside>

        <div className="space-y-4">
        <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm" aria-label="Workspace focus">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-cyan-900">{workspaceFocus.title}</h2>
          <p className="mt-1 text-sm text-cyan-900">{workspaceFocus.description}</p>
        </section>
        <section id="overzicht" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Overzicht</h2>
            <strong className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold">
              Compare selection: {compareIds.length}/{MAX_COMPARE}
            </strong>
          </div>
          {factFindVisible && (
            <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900" role="status">
              <div className="flex items-center justify-between gap-2">
                <p>
                  Fact-find is beschikbaar voor snelle evidence-verkenning vanuit Overzicht.
                </p>
                <button
                  type="button"
                  className="rounded-lg border border-cyan-300 bg-white px-2 py-1 text-xs font-medium text-cyan-900"
                  onClick={() => setFactFindVisible(false)}
                >
                  Verbergen
                </button>
              </div>
            </div>
          )}
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
              <p>{error.message}</p>
              {error.recovery && <p className="mt-1">{error.recovery}</p>}
              {error.correlationId && <p className="mt-1">Reference: {error.correlationId}</p>}
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
                const proposalRequired = item.proposal_required ?? true;
                const canMutateDirectly = item.can_mutate_directly ?? false;
                const contextIsActive = activeTechnology?.id === item.id;
                const openCommentCount = (commentsByTechnology[item.id] ?? []).filter((comment) => comment.status !== 'resolved').length;
                return (
                  <li
                    key={item.id}
                    className={`grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto] md:items-start ${contextIsActive ? 'border-cyan-400 bg-cyan-50/40 ring-1 ring-cyan-200' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <div>
                      <button
                        type="button"
                        className="text-left text-base font-semibold text-slate-900 underline decoration-cyan-300 underline-offset-4"
                        onClick={() => activateTechnologyContext(item)}
                      >
                        {item.naam}
                      </button>
                      <p className="mt-1 text-sm text-slate-700">{item.omschrijving}</p>
                      {proposalRequired ? (
                        <span className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                          Voorstel vereist
                        </span>
                      ) : canMutateDirectly ? (
                        <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200">
                          Directe mutatie role-gated
                        </span>
                      ) : null}
                      <small className="text-xs text-cyan-800">
                        {item.gebruiksstatus || 'Unknown status'}
                        {item.technologietype ? ` - ${item.technologietype}` : ''}
                      </small>
                      {contextIsActive && (
                        <p className="mt-2 text-xs font-semibold text-cyan-800">Actieve context in rail</p>
                      )}
                    </div>
                    <div className="grid gap-2 md:justify-items-end">
                      <button
                        type="button"
                        className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-900"
                        onClick={(event) => {
                          event.stopPropagation();
                          activateTechnologyContext(item, { loadDocumentation: true, nextRailTab: 'documentatie' });
                        }}
                      >
                        View documentation
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          openTechnologyDetails(item.id);
                        }}
                      >
                        Bekijk details
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          activateTechnologyContext(item, { nextRailTab: 'opmerkingen' });
                        }}
                      >
                        Opmerkingen ({openCommentCount})
                      </button>
                      {selected ? (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFromCompare(item.id);
                          }}
                        >
                          Remove from compare
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCompare(item.id);
                          }}
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

          {productTraceabilityOpen && (
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">Product traceability workspace</h3>
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                  onClick={closeProductTraceability}
                >
                  Back to compare workspace
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,20rem)_1fr] md:items-start">
                <div>
                  <label htmlFor="product-traceability-select" className="text-sm font-medium text-slate-700">
                    Choose product
                  </label>
                  <select
                    id="product-traceability-select"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-cyan-200 focus:ring"
                    value={selectedProductId}
                    disabled={productOptionsLoading || productOptions.length === 0}
                    onChange={(event) => {
                      void onProductSelectionChange(event.target.value);
                    }}
                  >
                    {productOptions.length === 0 ? (
                      <option value="">No products available</option>
                    ) : (
                      productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.label}
                        </option>
                      ))
                    )}
                  </select>
                  {productOptionsLoading && <p className="mt-2 text-sm text-slate-600">Loading products...</p>}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {productTraceabilityLoading && <p className="text-sm text-slate-600">Loading product traceability...</p>}

                  {!productTraceabilityLoading && productTraceabilityError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                      <strong>Could not load product traceability.</strong>
                      <p>{productTraceabilityError.message}</p>
                      {productTraceabilityError.recovery && <p className="mt-1">{productTraceabilityError.recovery}</p>}
                      {productTraceabilityError.correlationId && (
                        <p className="mt-1">Reference: {productTraceabilityError.correlationId}</p>
                      )}
                    </div>
                  )}

                  {!productTraceabilityLoading && !productTraceabilityError && !productTraceability && (
                    <div className="text-sm text-slate-700">
                      <p>No products are available for traceability yet.</p>
                    </div>
                  )}

                  {!productTraceabilityLoading && !productTraceabilityError && productTraceability && (
                    <div className="space-y-4 text-sm text-slate-700">
                      <div>
                        <p className="font-semibold text-slate-900">{productTraceability.product.label}</p>
                        <p className="text-xs text-slate-500">Product IRI: {productTraceability.product.iri}</p>
                      </div>

                      {productTraceability.relations.input.length === 0 && productTraceability.relations.output.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-4" role="status">
                          <p>No task relations are linked to this product yet.</p>
                          <p className="mt-1 text-slate-600">
                            Return to the compare workspace to keep working without losing your selected technologies.
                          </p>
                          <button
                            type="button"
                            className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700"
                            onClick={closeProductTraceability}
                          >
                            Back to compare workspace
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                          <section className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="font-semibold text-slate-900">Input relations</h4>
                            {productTraceability.relations.input.length === 0 ? (
                              <p className="mt-2 text-slate-600">No input relations found for this product.</p>
                            ) : (
                              <ul className="mt-3 space-y-3">
                                {productTraceability.relations.input.map((relation) => (
                                  <li key={`${relation.relation_kind}-${relation.task_iri}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">{relation.task_label}</p>
                                    <p className="mt-1 text-xs text-slate-500">Task IRI: {relation.task_iri}</p>
                                    <p className="mt-1 text-xs text-slate-500">Predicate: {relation.predicate}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </section>

                          <section className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="font-semibold text-slate-900">Output relations</h4>
                            {productTraceability.relations.output.length === 0 ? (
                              <p className="mt-2 text-slate-600">No output relations found for this product.</p>
                            ) : (
                              <ul className="mt-3 space-y-3">
                                {productTraceability.relations.output.map((relation) => (
                                  <li key={`${relation.relation_kind}-${relation.task_iri}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">{relation.task_label}</p>
                                    <p className="mt-1 text-xs text-slate-500">Task IRI: {relation.task_iri}</p>
                                    <p className="mt-1 text-xs text-slate-500">Predicate: {relation.predicate}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </section>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-semibold text-slate-900">Technology contribution chain</h4>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        onClick={retryProductContributionChain}
                        disabled={!selectedProductId || productContributionChainLoading}
                      >
                        Retry contribution traversal
                      </button>
                    </div>

                    {productContributionChainLoading && <p className="mt-3 text-sm text-slate-600">Loading contribution chain...</p>}

                    {!productContributionChainLoading && productContributionChainError && (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                        <strong>Could not load contribution chain.</strong>
                        <p>{productContributionChainError.message}</p>
                        {productContributionChainError.recovery && <p className="mt-1">{productContributionChainError.recovery}</p>}
                        {productContributionChainError.correlationId && (
                          <p className="mt-1">Reference: {productContributionChainError.correlationId}</p>
                        )}
                      </div>
                    )}

                    {!productContributionChainLoading && !productContributionChainError && !productContributionChain && (
                      <p className="mt-3 text-sm text-slate-600">No contribution chain is available for the selected product.</p>
                    )}

                    {!productContributionChainLoading && !productContributionChainError && productContributionChain && (
                      <div className="mt-3 space-y-4 text-sm text-slate-700">
                        {productContributionChain.partial_data && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3" role="status">
                            <p className="font-medium text-amber-900">Partial contribution data detected.</p>
                            <p className="mt-1 text-amber-800">
                              Some contribution nodes are missing. You can retry traversal without losing compare context.
                            </p>
                          </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-2">
                          {(['input', 'output'] as const).map((relationKind) => (
                            <section key={relationKind} className="rounded-lg border border-slate-200 bg-white p-4">
                              <h5 className="font-semibold text-slate-900">
                                {relationKind === 'input' ? 'Input contribution paths' : 'Output contribution paths'}
                              </h5>

                              {productContributionChain.chains[relationKind].length === 0 ? (
                                <p className="mt-2 text-slate-600">No {relationKind} contribution nodes found.</p>
                              ) : (
                                <ul className="mt-3 space-y-3">
                                  {productContributionChain.chains[relationKind].map((node) => (
                                    <li key={`${relationKind}-${node.task_iri}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                      <p className="font-medium text-slate-900">{node.task_label}</p>
                                      <p className="mt-1 text-xs text-slate-500">Task IRI: {node.task_iri}</p>

                                      {node.missing_node ? (
                                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                                          <p>{node.missing_reason || 'Contribution node data is missing for this task.'}</p>
                                        </div>
                                      ) : (
                                        <ul className="mt-2 space-y-2">
                                          {node.technologies.map((technology) => (
                                            <li key={`${node.task_iri}-${technology.iri}`} className="rounded-md border border-slate-200 bg-white p-2">
                                              <p className="font-medium text-slate-900">{technology.label}</p>
                                              <p className="mt-1 text-xs text-slate-500">Technology IRI: {technology.iri}</p>
                                              {technology.evidence_links.length > 0 ? (
                                                <ul className="mt-2 list-disc pl-5 text-xs text-slate-700">
                                                  {technology.evidence_links.map((evidenceLink, index) => (
                                                    <li key={`${technology.iri}-evidence-${index}`}>
                                                      {evidenceLink.location ? (
                                                        <a
                                                          href={evidenceLink.location}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="text-cyan-700 underline"
                                                        >
                                                          {evidenceLink.title || evidenceLink.location}
                                                        </a>
                                                      ) : (
                                                        <span>{evidenceLink.title || 'Evidence reference'}</span>
                                                      )}
                                                      {evidenceLink.reference ? ` (${evidenceLink.reference})` : ''}
                                                    </li>
                                                  ))}
                                                </ul>
                                              ) : (
                                                <p className="mt-1 text-xs text-slate-500">No evidence links available for this node.</p>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </section>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {(documentationLoading || documentationError || documentation) && (
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4" aria-live="polite">
              <h3 className="font-semibold">Documentation in workspace</h3>

              {documentationLoading && <p className="mt-2 text-sm text-slate-600">Loading documentation...</p>}

              {!documentationLoading && documentationError && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                  <strong>Could not load documentation.</strong>
                  <p>{documentationError.message}</p>
                  {documentationError.recovery && <p className="mt-1">{documentationError.recovery}</p>}
                  {documentationError.correlationId && <p className="mt-1">Reference: {documentationError.correlationId}</p>}
                </div>
              )}

              {!documentationLoading && documentation && (
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <p className="font-medium">{documentation.sectionTitle || documentation.technologyName}</p>
                  <p className="text-xs text-slate-500">Source: {documentation.source}</p>
                  {documentation.correlationId && <p className="text-xs text-slate-500">Correlation ID: {documentation.correlationId}</p>}
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    {documentation.content || 'No content available for this technology.'}
                  </pre>
                </div>
              )}
            </section>
          )}

          <section
            id="compare-selection"
            aria-label="Persistente compare bar"
            className="sticky bottom-2 z-10 rounded-2xl border border-slate-300 bg-white/95 p-3 shadow-lg backdrop-blur"
          >
            {compareSelection.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {compareSelection.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                    {item.naam}
                    <button
                      type="button"
                      aria-label={`Verwijder ${item.naam} uit vergelijking`}
                      className="rounded-full bg-white px-1.5 text-cyan-900"
                      onClick={() => removeFromCompare(item.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {compareSelection.length < MAX_COMPARE && (
                  <span className="inline-flex rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-600">
                    + Voeg toe (max 4)
                  </span>
                )}
                <button
                  type="button"
                  className="ml-auto rounded-lg bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void openProductTraceability();
                  }}
                  disabled={compareSelection.length < MIN_COMPARE}
                >
                  Vergelijk selectie
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-900">Geen vergelijking geselecteerd</p>
                  <p className="text-xs">Kies 2 tot 4 technologieën om de compare workspace te openen.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-cyan-700 px-3 py-1.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void openProductTraceability();
                  }}
                  disabled
                >
                  Vergelijk selectie
                </button>
              </div>
            )}
          </section>
        </section>

        </div>

        <aside id="context-rail" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Context rail">
          <h2 className="text-sm font-semibold text-slate-900">Context rail</h2>
          <p className="mt-1 text-xs text-slate-500">Follows the selected technology and keeps documentation, comments, and governance separate.</p>
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
            <p>Contextbron: laatst aangeklikte technologiekaart (click-gedreven).</p>
            <p>Laatste contextwissel: {lastContextUpdateLabel ?? 'Nog niet ingesteld'}</p>
          </div>
          <div aria-label="Context tabs" className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-xs">
            <button
              type="button"
              aria-pressed={railTab === 'documentatie'}
              className={`rounded-md px-2 py-1 ${railTab === 'documentatie' ? 'bg-white font-semibold text-slate-900' : 'text-slate-600'}`}
              onClick={() => changeRailTab('documentatie')}
            >
              Documentatie
            </button>
            <button
              type="button"
              aria-pressed={railTab === 'opmerkingen'}
              className={`rounded-md px-2 py-1 ${railTab === 'opmerkingen' ? 'bg-white font-semibold text-slate-900' : 'text-slate-600'}`}
              onClick={() => changeRailTab('opmerkingen')}
            >
              Opmerkingen
            </button>
            <button
              type="button"
              aria-pressed={railTab === 'governance'}
              className={`rounded-md px-2 py-1 ${railTab === 'governance' ? 'bg-white font-semibold text-slate-900' : 'text-slate-600'}`}
              onClick={() => changeRailTab('governance')}
            >
              Governance
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" aria-live="polite">
            <p className="font-medium text-slate-900">Actieve technologie</p>
            <p>{activeTechnology?.naam ?? 'Nog geen actieve technologie geselecteerd'}</p>
            <p className="mt-1 text-xs text-slate-500">Dit paneel volgt de actieve technologie; wissel tabs zonder selectie te verliezen.</p>
            {railTab === 'documentatie' && (
              <div className="mt-3 space-y-3">
                <section className="rounded-lg border border-slate-200 bg-white p-3" aria-label="Technologiedocumentatie">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technologiedocumentatie</p>
                  {documentationLoading && <p className="mt-2 text-xs text-slate-600">Loading documentation...</p>}
                  {!documentationLoading && documentationError && (
                    <p className="mt-2 text-xs text-rose-700">{documentationError.message}</p>
                  )}
                  {!documentationLoading && !documentationError && documentation && documentation.technologyId === activeTechnology?.id && (
                    <>
                      <p className="mt-2 text-xs text-slate-500">Bron: {documentation.source}</p>
                      <p className="mt-1 text-xs text-slate-700 line-clamp-4">{documentation.content || 'Geen technologiedocumentatie gevonden.'}</p>
                    </>
                  )}
                  {!documentationLoading && !documentationError && (!documentation || documentation.technologyId !== activeTechnology?.id) && (
                    <p className="mt-2 text-xs text-slate-600">Selecteer "View documentation" om technologiedocumentatie te laden.</p>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3" aria-label="Mediadocumentatie">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mediadocumentatie</p>
                  <p className="mt-2 text-xs text-slate-500">Bron: media/legal-technologies.md</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {activeTechnology
                      ? `Samenvatting voor ${activeTechnology.naam}: gebruik deze sectie als generieke media-context naast technologie-specifieke documentatie.`
                      : 'Selecteer eerst een actieve technologie voor media-context.'}
                  </p>
                </section>
              </div>
            )}

            {railTab === 'opmerkingen' && (
              <div className="mt-3 space-y-3" aria-label="Contextopmerkingen">
                <p className="text-xs text-slate-600">Opmerkingen blijven gekoppeld aan de actieve technologie en documentatiecontext.</p>
                <ul className="space-y-2">
                  {activeComments.map((comment) => (
                    <li key={comment.id} className="rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-xs font-semibold text-slate-900">{comment.author}</p>
                      <p className="mt-1 text-xs text-slate-700">{comment.text}</p>
                      <p className="mt-1 text-[11px] text-slate-500">Context: {comment.contextSource}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">Status: {comment.status}</span>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-60"
                          disabled={!canModerateRailActions || comment.status === 'resolved'}
                          onClick={() => resolveComment(comment.id)}
                        >
                          Markeer als resolved
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <label className="block text-xs font-medium text-slate-700" htmlFor="rail-comment-input">
                  Voeg contextopmerking toe
                </label>
                <textarea
                  id="rail-comment-input"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                />
                <button
                  type="button"
                  className="rounded-md border border-cyan-300 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-900"
                  onClick={addContextComment}
                  disabled={!activeTechnology}
                >
                  Opslaan opmerking
                </button>
                {!canModerateRailActions && (
                  <p className="text-[11px] text-amber-700">Statusovergangen zijn role-gated voor Moderator/Admin.</p>
                )}
              </div>
            )}

            {railTab === 'governance' && (
              <div className="mt-3 space-y-3" aria-label="Governancecontext">
                <section className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Openstaande voorstellen</p>
                  {pendingProposals.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-600">Geen voorstellen voor de huidige context.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {pendingProposals.map((proposal) => (
                        <li key={proposal.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                          <p className="text-xs font-medium text-slate-900">{proposal.title}</p>
                          <p className="mt-1 text-xs text-slate-700">{proposal.summary}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 disabled:opacity-60"
                              disabled={!canModerateRailActions}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-800 disabled:opacity-60"
                              disabled={!canModerateRailActions}
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recente audit entries</p>
                  <ul className="mt-2 space-y-2">
                    {recentAuditEntries.map((entry) => (
                      <li key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[11px] text-slate-500">{entry.at}</p>
                        <p className="text-xs text-slate-700">{entry.text}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                {!canModerateRailActions && (
                  <p className="text-[11px] text-amber-700">Approve/reject acties zijn role-gated voor Moderator/Admin.</p>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<DiscoveryPage />} />
        <Route path="/legaltechnologies/:id" element={<LegalTechnologyDetailPage />} />
        <Route path="/catalog-details" element={<LegalTechnologyCatalogDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
