export interface BackendConfig {
  port: number;
  apiPrefix: string;
  healthUrl: string;
  profile: string;
  dbName: string;
  containerName: string;
}

export interface ScenarioConfig {
  vus: number;
  rampDuration: string;
  holdDuration: string;
}

export interface DefaultsConfig {
  cpus: number;
  memory: string;
  repeats: number;
  warmup: number;
}

export interface ProfileConfig {
  repeats?: number;
  warmup?: number;
  cpus?: number;
  memory?: string;
  skipWarmup?: boolean;
  scenarios?: Record<string, Partial<ScenarioConfig>>;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface InfrastructureConfig {
  dbContainerName: string;
  storageContainerName: string;
  objectStorageEndpoint: string;
  objectStorageBucket: string;
  objectStorageAccessKey: string;
  objectStorageSecretKey: string;
}

export interface BenchConfig {
  defaults: DefaultsConfig;
  database: DatabaseConfig;
  infrastructure: InfrastructureConfig;
  backends: Record<string, BackendConfig>;
  scenarios: Record<string, ScenarioConfig>;
  profiles?: Record<string, ProfileConfig>;
}

export interface RunOptions {
  backends: string[];
  scenarios: string[];
  cpus: number;
  memory: string;
  repeats: number;
  warmup: number;
  vus?: number;
  rampDuration?: string;
  holdDuration?: string;
  output?: string;
  skipWarmup: boolean;
  dryRun: boolean;
  profile?: string;
  scenarioOverrides?: Record<string, Partial<ScenarioConfig>>;
}

export interface K6Metric {
  avg?: number;
  med?: number;
  min?: number;
  max?: number;
  "p(90)"?: number;
  "p(95)"?: number;
  value?: number;
  rate?: number;
  count?: number;
  passes?: number;
  fails?: number;
}

export interface K6Summary {
  metrics: Record<string, K6Metric>;
}

export interface AggregatedMetric {
  avgMedian: number;
  p95Median: number;
  failRateAvg: number;
  rateMedian: number;
  countTotal: number;
  runs: number;
}

export interface AggregatedSummary {
  backend: string;
  scenario: string;
  runs: number;
  metrics: Record<string, AggregatedMetric>;
}
