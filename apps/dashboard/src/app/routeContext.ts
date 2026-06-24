export type ContextCard = {
  title: string;
  copy: string;
  links?: Array<{ to: string; label: string }>;
};

export type RouteContext = {
  title: string;
  subtitle: string;
  cards: ContextCard[];
};

export const documentationSectionLink = (sectionId: string, technologyId?: string) => {
  const params = new URLSearchParams();
  params.set('section', sectionId);
  if (technologyId) {
    params.set('technology', technologyId);
  }
  return `/documentation?${params.toString()}`;
};

export const routeContexts = {
  technologies: {
    title: 'Technologies',
    subtitle: 'Context op basis van de huidige technologie- of overzichtsweergave.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Context voor de geselecteerde technologie verschijnt hier.',
        links: [{ to: documentationSectionLink('catalogus'), label: 'Open Catalogus' }],
      },
      {
        title: 'Opmerkingen',
        copy: 'Recente opmerkingen en statusovergangen verschijnen hier.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Voorstellen en auditfragmenten verschijnen hier.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
  documentation: {
    title: 'Documentatie',
    subtitle: 'Gegenereerde catalogussecties en beheerde begrippen binnen een centrale documentatie-ingang.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Gebruik de documentatiehub voor catalogus, taxonomieen, organisaties, ontologie en generatieverantwoording.',
        links: [
          { to: '/definitions', label: 'Open Definities' },
          { to: '/organisations', label: 'Open Organisaties' },
        ],
      },
      {
        title: 'Opmerkingen',
        copy: 'Opmerkingen over begrippen of documentatie kunnen vanuit governance worden opgevolgd.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Gegenereerde documentatie is read-only; gebruik voorstellen voor inhoudelijke wijzigingen die besluitvorming vereisen.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
  proposals: {
    title: 'Governance: Voorstellen',
    subtitle: 'Workflow voor beoordeling en besluitvorming van voorstellen.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Koppel voorstelwijzigingen aan bron- en technologiedocumentatie.',
        links: [
          { to: documentationSectionLink('catalogus'), label: 'Open Catalogus' },
          { to: '/legaltechnologies', label: 'Open Technologieen' },
        ],
      },
      {
        title: 'Opmerkingen',
        copy: 'Gebruik opmerkingen om beoordeling en motivatie vast te leggen.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Keur voorstellen goed of af en leg besluitreden vast in auditlog.',
        links: [{ to: '/governance/audit-log', label: 'Bekijk Auditlog' }],
      },
    ],
  },
  comments: {
    title: 'Governance: Opmerkingen',
    subtitle: 'Statusgestuurde commentaarworkflow over technologieen en documentatie.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Opmerkingen verwijzen naar technologie- en mediadocumentatie.',
        links: [{ to: documentationSectionLink('catalogus'), label: 'Open Catalogus' }],
      },
      {
        title: 'Opmerkingen',
        copy: 'Volg status overgangen: Nieuw, In behandeling, Geaccepteerd, Afgewezen, Opgelost.',
      },
      {
        title: 'Governance',
        copy: 'Escalaties kunnen worden omgezet naar voorstellen voor besluitvorming.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
  stickyNotes: {
    title: 'Governance: Sticky Notes',
    subtitle: 'Zelfstandige workflow voor notities, triage en follow-up.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Gebruik bronkoppelingen wanneer sticky notes leiden tot documentatiewijzigingen.',
        links: [{ to: documentationSectionLink('catalogus'), label: 'Open Catalogus' }],
      },
      {
        title: 'Opmerkingen',
        copy: 'Notities kunnen doorstromen naar formele opmerkingen indien nodig.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Converteer open notities naar voorstellen wanneer besluitvorming vereist is.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
  auditLog: {
    title: 'Governance: Auditlog',
    subtitle: 'Chronologische mutatieregistratie voor governance-acties.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Gebruik auditregels om documentatie-impact te herleiden.',
      },
      {
        title: 'Opmerkingen',
        copy: 'Koppel auditregels aan opmerkingen en besluitvorming voor traceerbaarheid.',
      },
      {
        title: 'Governance',
        copy: 'Auditregels ondersteunen beoordeling van voorstellen en statuswijzigingen.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
  relations: {
    title: 'Verbanden',
    subtitle: 'Relaties tussen taken, producten en bijdragen binnen de keten.',
    cards: [
      {
        title: 'Documentatie',
        copy: 'Relatie-inzichten kunnen onderliggende documentatie en definities verrijken.',
        links: [{ to: documentationSectionLink('taxonomieen'), label: 'Open Taxonomieen' }],
      },
      {
        title: 'Opmerkingen',
        copy: 'Leg onduidelijke relaties vast als opmerkingen voor inhoudelijke opvolging.',
        links: [{ to: '/governance/comments', label: 'Ga naar Opmerkingen' }],
      },
      {
        title: 'Governance',
        copy: 'Escalaties op relatiekwaliteit kunnen naar voorstellen worden doorgezet.',
        links: [{ to: '/governance/proposals', label: 'Ga naar Voorstellen' }],
      },
    ],
  },
} satisfies Record<string, RouteContext>;
