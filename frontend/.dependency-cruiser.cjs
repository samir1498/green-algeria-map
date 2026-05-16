/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'circular dependencies can cause build issues and make the code harder to reason about',
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
            { criteria: { source: '^src/components/map' }, attributes: { color: '#22c55e', shape: 'box' } },
            { criteria: { source: '^src/components/ui' }, attributes: { color: '#3b82f6', shape: 'box' } },
            { criteria: { source: '^src/routes' }, attributes: { color: '#f59e0b', shape: 'box' } },
            { criteria: { source: '^src/lib' }, attributes: { color: '#a855f7', shape: 'box' } },
          ],
        },
      },
    },
  },
}
