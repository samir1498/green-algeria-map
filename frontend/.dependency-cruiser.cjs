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
      comment: 'api/ is the bottom layer and must not import hooks, components, or routes',
      from: { path: '^src/features/[^/]+/api/' },
      to: {
        path: '^src/(features/[^/]+/hooks/|features/[^/]+/components/|shared/hooks/|shared/components/|routes/)',
      },
    },
    {
      name: 'components-not-to-api',
      severity: 'error',
      comment: 'components must use TanStack Query hooks, not call api/ directly',
      from: { path: '^src/(features/[^/]+/components/|shared/components/)' },
      to: { path: '^src/features/[^/]+/api/' },
    },
    {
      name: 'routes-not-to-api',
      severity: 'error',
      comment: 'routes must use TanStack Query hooks, not call api/ directly',
      from: { path: '^src/routes/' },
      to: {
        path: '^src/features/[^/]+/api/',
        pathNot: '^src/features/auth/api/',
      },
    },
    {
      name: 'hooks-not-to-components',
      severity: 'error',
      comment: 'hooks must not import from components to stay reusable',
      from: { path: '^src/(features/[^/]+/hooks/|shared/hooks/)' },
      to: {
        path: '^src/(features/[^/]+/components/|shared/components/)',
        pathNot: '^src/features/map/components/(helpers?\\.tsx?|demo-.+\\.ts)$',
      },
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
              criteria: { source: '^src/features/map/components' },
              attributes: { color: '#22c55e', shape: 'box' },
            },
            {
              criteria: { source: '^src/shared/components/ui' },
              attributes: { color: '#3b82f6', shape: 'box' },
            },
            { criteria: { source: '^src/routes' }, attributes: { color: '#f59e0b', shape: 'box' } },
            {
              criteria: { source: '^src/shared/lib' },
              attributes: { color: '#a855f7', shape: 'box' },
            },
          ],
        },
      },
    },
  },
}
