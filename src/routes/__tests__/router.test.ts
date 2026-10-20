import { describe, it, expect } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { router } from '../router';
import { EVERYDAY_MODULES, SUPERUSER_MODULES } from '../../pages/modules';

const pathsOf = (routes: RouteObject[]): string[] =>
  routes.flatMap(route => [route.path, ...pathsOf(route.children ?? [])]).filter((p): p is string => Boolean(p));

describe('router', () => {
  /**
   * The CV score basis page was linked from the superuser page and routed in App.tsx, an old route
   * table nothing rendered (since removed); the link opened the catch-all «Gå til forsiden». Every
   * module the dashboard and the superuser page link to must have a route in the router main.tsx uses.
   */
  it('has a route for every module the dashboard and the superuser page link to', () => {
    const paths = pathsOf(router.routes);

    for (const module of [...EVERYDAY_MODULES, ...SUPERUSER_MODULES]) {
      expect(paths, module.to).toContain(module.to);
    }
  });
});
