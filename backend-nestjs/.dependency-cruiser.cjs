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
      from: { orphan: true, pathNot: ['^src/migrations/', '^src/data-source\\.ts$', '^src/seed\\.ts$', '^src/auth\\.ts$'] },
      to: {},
    },
    {
      name: 'domain-not-to-higher-layers',
      severity: 'error',
      comment: 'domain layer must not import application, infrastructure, or dto',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: {
        path: [
          '^src/modules/[^/]+/application/',
          '^src/modules/[^/]+/infrastructure/',
          '^src/modules/[^/]+/dto/',
        ],
      },
    },
    {
      name: 'infrastructure-not-to-application',
      severity: 'error',
      comment: 'infrastructure must not import application',
      from: { path: '^src/modules/[^/]+/infrastructure/' },
      to: { path: '^src/modules/[^/]+/application/' },
    },
  ],
  options: {
    doNotFollow: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'] },
    includeOnly: '^src',
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'default'],
    },
  },
}
