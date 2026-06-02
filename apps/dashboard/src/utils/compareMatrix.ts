export const MISSING_VALUE_LABEL = 'Niet opgegeven';

type TasktypeEntry = {
  taaktype?: string;
};

export type CompareMatrixItem = {
  gebruiksstatus?: string;
  licentievorm?: string;
  versienummer?: string;
  technologietype?: string;
  beoogde_gebruikers?: string[];
  geboden_functionaliteit?: string[];
  geschikt_voor_taak?: TasktypeEntry[];
};

export type CompareMatrixRow = {
  key: string;
  label: string;
  values: string[];
  hasDiff: boolean;
  diffMask: boolean[];
};

type ScalarMode = 'text' | 'number' | 'version';

type NormalizedValue = {
  display: string;
  compare: string;
};

const normalizeCase = (value: string, caseInsensitive?: boolean) => {
  return caseInsensitive ? value.toLocaleLowerCase() : value;
};

const normalizeNumberString = (value: string) => {
  const candidate = value.replace(',', '.');
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(candidate)) {
    return null;
  }

  const parsed = Number(candidate);
  return Number.isNaN(parsed) ? null : String(parsed);
};

const normalizeVersionString = (value: string) => {
  const candidate = value.replace(/^v/i, '').trim();
  if (!/^\d+(?:\.\d+)*$/.test(candidate)) {
    return null;
  }

  const segments = candidate.split('.').map((segment) => String(Number(segment)));
  while (segments.length > 1 && segments[segments.length - 1] === '0') {
    segments.pop();
  }

  return segments.join('.');
};

const normalizeScalar = (value: string | undefined, options?: { mode?: ScalarMode; caseInsensitive?: boolean }): NormalizedValue => {
  const normalized = (value || '').trim();
  if (!normalized) {
    return { display: MISSING_VALUE_LABEL, compare: MISSING_VALUE_LABEL };
  }

  const mode = options?.mode || 'text';
  const caseInsensitive = options?.caseInsensitive;

  if (mode === 'number') {
    const numeric = normalizeNumberString(normalized);
    return {
      display: normalized,
      compare: numeric || normalizeCase(normalized, caseInsensitive),
    };
  }

  if (mode === 'version') {
    const version = normalizeVersionString(normalized);
    return {
      display: normalized,
      compare: version || normalizeCase(normalized, caseInsensitive),
    };
  }

  return {
    display: normalized,
    compare: normalizeCase(normalized, caseInsensitive),
  };
};

const normalizeList = (values: string[] | undefined, options?: { caseInsensitive?: boolean }): NormalizedValue => {
  const map = new Map<string, string>();

  (values || []).forEach((value) => {
    const normalized = (value || '').trim();
    if (!normalized) {
      return;
    }

    const compare = normalizeCase(normalized, options?.caseInsensitive);
    if (!map.has(compare)) {
      map.set(compare, normalized);
    }
  });

  if (map.size === 0) {
    return { display: MISSING_VALUE_LABEL, compare: MISSING_VALUE_LABEL };
  }

  const displayValues = Array.from(map.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  const compareValues = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  return {
    display: displayValues.join(', '),
    compare: compareValues.join('|'),
  };
};

const normalizeTasktypes = (entries?: TasktypeEntry[]): NormalizedValue => {
  return normalizeList(
    (entries || []).map((entry) => entry.taaktype || ''),
    { caseInsensitive: true },
  );
};

const detectDiffMask = (values: string[]) => {
  const frequency = new Map<string, number>();
  values.forEach((value) => {
    frequency.set(value, (frequency.get(value) || 0) + 1);
  });

  const reference = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || values[0] || MISSING_VALUE_LABEL;

  return values.map((value) => value !== reference);
};

export const buildCompareMatrixRows = (items: Array<CompareMatrixItem | undefined>): CompareMatrixRow[] => {
  const rows: Array<{ key: string; label: string; values: string[]; compareValues: string[] }> = [
    {
      key: 'status',
      label: 'Status',
      values: items.map((item) => normalizeScalar(item?.gebruiksstatus, { caseInsensitive: true }).display),
      compareValues: items.map((item) => normalizeScalar(item?.gebruiksstatus, { caseInsensitive: true }).compare),
    },
    {
      key: 'licentievorm',
      label: 'Licentievorm',
      values: items.map((item) => normalizeScalar(item?.licentievorm, { caseInsensitive: true }).display),
      compareValues: items.map((item) => normalizeScalar(item?.licentievorm, { caseInsensitive: true }).compare),
    },
    {
      key: 'versie',
      label: 'Versie',
      values: items.map((item) => normalizeScalar(item?.versienummer, { mode: 'version' }).display),
      compareValues: items.map((item) => normalizeScalar(item?.versienummer, { mode: 'version' }).compare),
    },
    {
      key: 'technologietype',
      label: 'Technologietype',
      values: items.map((item) => normalizeScalar(item?.technologietype, { caseInsensitive: true }).display),
      compareValues: items.map((item) => normalizeScalar(item?.technologietype, { caseInsensitive: true }).compare),
    },
    {
      key: 'beoogde_gebruikers',
      label: 'Beoogde gebruikers',
      values: items.map((item) => normalizeList(item?.beoogde_gebruikers, { caseInsensitive: true }).display),
      compareValues: items.map((item) => normalizeList(item?.beoogde_gebruikers, { caseInsensitive: true }).compare),
    },
    {
      key: 'geboden_functionaliteit',
      label: 'Geboden functionaliteit',
      values: items.map((item) => normalizeList(item?.geboden_functionaliteit, { caseInsensitive: true }).display),
      compareValues: items.map((item) => normalizeList(item?.geboden_functionaliteit, { caseInsensitive: true }).compare),
    },
    {
      key: 'taaktypen',
      label: 'Taaktypen',
      values: items.map((item) => normalizeTasktypes(item?.geschikt_voor_taak).display),
      compareValues: items.map((item) => normalizeTasktypes(item?.geschikt_voor_taak).compare),
    },
  ];

  return rows.map((row) => {
    const hasDiff = new Set(row.compareValues).size > 1;
    return {
      key: row.key,
      label: row.label,
      values: row.values,
      hasDiff,
      diffMask: hasDiff ? detectDiffMask(row.compareValues) : row.values.map(() => false),
    };
  });
};
