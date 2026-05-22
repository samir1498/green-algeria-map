/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'circular dependencies can cause build issues and make the code harder to reason about',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'orphan modules that are not imported by anything',
      from: { orphan: true, pathNot: '^src/routes/.*\\.tsx$' },
      to: {},
    },
    {
      name: 'api-not-to-higher-layers',
      severity: 'error',
      comment:
        'api/ is the bottom layer and must not import hooks, components, routes, or services',
      from: { path: '^src/api/' },
      to: { path: '^(src/hooks/|src/components/|src/routes/|src/services/)' },
    },
    {
      name: 'components-not-to-api',
      severity: 'error',
      comment: 'components must use TanStack Query hooks, not call api/ directly',
      from: { path: '^src/components/' },
      to: { path: '^src/api/' },
    },
    {
      name: 'routes-not-to-api',
      severity: 'error',
      comment: 'routes must use TanStack Query hooks, not call api/ directly',
      from: { path: '^src/routes/' },
      to: { path: '^src/api/' },
    },
    {
      name: 'hooks-not-to-components',
      severity: 'error',
      comment: 'hooks must not import from components to stay reusable',
      from: { path: '^src/hooks/' },
      to: {
        path: '^src/components/',
        pathNot: '^src/components/[^/]+/(helpers?\\.tsx?|demo-.+\\.ts)$',
      },
    },
    {
      name: 'services-not-to-hooks-components-routes',
      severity: 'error',
      comment:
        'services are infrastructure and must not depend on React-specific or page-level code',
      from: { path: '^src/services/' },
      to: { path: '^(src/hooks/|src/components/|src/routes/)' },
    },
  ],
  options: {
    doNotFollow: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'] },
    includeOnly: '^src',
    exclude: {
      path: 'routeTree\\.gen',
    },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          modules: [
            {
              criteria: { source: '^src/components/map' },
              attributes: { color: '#22c55e', shape: 'box' },
            },
            {
              criteria: { source: '^src/components/ui' },
              attributes: { color: '#3b82f6', shape: 'box' },
            },
            { criteria: { source: '^src/routes' }, attributes: { color: '#f59e0b', shape: 'box' } },
            { criteria: { source: '^src/lib' }, attributes: { color: '#a855f7', shape: 'box' } },
          ],
        },
      },
    },
  },
}
