import { describe, expect, it } from 'vitest';
import { buildCompareMatrixRows, MISSING_VALUE_LABEL } from './compareMatrix';

describe('buildCompareMatrixRows', () => {
  it('keeps a stable field ordering', () => {
    const rows = buildCompareMatrixRows([{ gebruiksstatus: 'In gebruik' }, { gebruiksstatus: 'In gebruik' }]);

    expect(rows.map((row) => row.key)).toEqual([
      'status',
      'licentievorm',
      'versie',
      'technologietype',
      'beoogde_gebruikers',
      'geboden_functionaliteit',
      'taaktypen',
    ]);
  });

  it('normalizes missing values consistently', () => {
    const rows = buildCompareMatrixRows([{ gebruiksstatus: '' }, {}]);
    const statusRow = rows.find((row) => row.key === 'status');

    expect(statusRow?.values).toEqual([MISSING_VALUE_LABEL, MISSING_VALUE_LABEL]);
    expect(statusRow?.hasDiff).toBe(false);
  });

  it('marks rows with visible differences and flags differing cells', () => {
    const rows = buildCompareMatrixRows([
      {
        gebruiksstatus: 'In gebruik',
        licentievorm: 'Open source',
      },
      {
        gebruiksstatus: 'Voorstel',
        licentievorm: 'Open source',
      },
      {
        gebruiksstatus: 'In gebruik',
        licentievorm: 'Open source',
      },
    ]);

    const statusRow = rows.find((row) => row.key === 'status');
    const licenseRow = rows.find((row) => row.key === 'licentievorm');

    expect(statusRow?.hasDiff).toBe(true);
    expect(statusRow?.diffMask).toEqual([false, true, false]);
    expect(licenseRow?.hasDiff).toBe(false);
    expect(licenseRow?.diffMask).toEqual([false, false, false]);
  });

  it('treats configured text fields as case-insensitive for diff detection', () => {
    const rows = buildCompareMatrixRows([
      {
        gebruiksstatus: 'In Gebruik',
        licentievorm: 'Open Source',
        technologietype: 'Kennisbank',
      },
      {
        gebruiksstatus: 'in gebruik',
        licentievorm: 'open source',
        technologietype: 'kennisbank',
      },
    ]);

    const statusRow = rows.find((row) => row.key === 'status');
    const licenseRow = rows.find((row) => row.key === 'licentievorm');
    const typeRow = rows.find((row) => row.key === 'technologietype');

    expect(statusRow?.hasDiff).toBe(false);
    expect(licenseRow?.hasDiff).toBe(false);
    expect(typeRow?.hasDiff).toBe(false);
  });

  it('uses version-aware numeric comparison for version values', () => {
    const rows = buildCompareMatrixRows([
      { versienummer: '1.0.0' },
      { versienummer: '1' },
      { versienummer: '1.0' },
      { versienummer: '2.0.0' },
    ]);

    const versionRow = rows.find((row) => row.key === 'versie');

    expect(versionRow?.hasDiff).toBe(true);
    expect(versionRow?.diffMask).toEqual([false, false, false, true]);
  });

  it('normalizes list fields case-insensitively before comparing', () => {
    const rows = buildCompareMatrixRows([
      {
        beoogde_gebruikers: ['Juristen', 'Beleidsmakers'],
      },
      {
        beoogde_gebruikers: ['beleidsmakers', 'juristen'],
      },
    ]);

    const usersRow = rows.find((row) => row.key === 'beoogde_gebruikers');
    expect(usersRow?.hasDiff).toBe(false);
  });
});
