import { describe, expect, it } from 'vitest';
import { dashboardRoutes, getNavSections, getRouteConfigForPath } from './routes';

describe('dashboard route configuration', () => {
  it('provides renderable elements for visible navigation routes', () => {
    const visibleRoutes = dashboardRoutes.filter((route) => route.navVisible);

    expect(visibleRoutes.length).toBeGreaterThan(0);
    visibleRoutes.forEach((route) => {
      expect(route.element).toBeDefined();
      expect(route.redirectTo).toBeUndefined();
    });
  });

  it('keeps legacy redirects configured', () => {
    expect(dashboardRoutes.find((route) => route.path === '/tasktypes')?.redirectTo).toBe('/relations/tasks-products');
    expect(dashboardRoutes.find((route) => route.path === '/stickynotes')?.redirectTo).toBe('/governance/stickynotes');
    expect(dashboardRoutes.find((route) => route.path === '*')?.redirectTo).toBe('/');
  });

  it('derives navigation sections from route config', () => {
    const sections = getNavSections();

    expect(sections.find((section) => section.id === 'technologies')?.links.map((link) => link.to)).toEqual([
      '/',
      '/capabilities',
      '/legaltechnologies',
      '/legaltechnologies/compare',
      '/legaltechnologies/selection',
    ]);
    expect(sections.find((section) => section.id === 'relations')?.links.map((link) => link.to)).toEqual([
      '/relations/tasks-products',
      '/relations/contribution-map',
    ]);
  });

  it('resolves active sections for nested and legacy route paths', () => {
    expect(getRouteConfigForPath('/legaltechnologies/example-id').section).toBe('technologies');
    expect(getRouteConfigForPath('/documentation').section).toBe('documentation');
    expect(getRouteConfigForPath('/relations/tasks-products').section).toBe('relations');
  });
});
