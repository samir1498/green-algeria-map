import { ZoneOrmEntity } from './modules/zones/infrastructure/zone.orm-entity';
import { AppDataSource } from './data-source';

interface SeedZoneData {
  name: string;
  type: 'planting' | 'trash' | 'cleanup';
  status: 'planned' | 'in-progress' | 'completed';
  lat: number;
  lng: number;
  targetCount?: number;
  currentCount?: number;
  description: string;
}

const demoZones: SeedZoneData[] = [
  {
    name: 'Chrea National Park',
    type: 'planting',
    status: 'in-progress',
    lat: 36.4424,
    lng: 2.8695,
    targetCount: 5000,
    currentCount: 1200,
    description: 'Reforestation of cedar forests destroyed by wildfires.',
  },
  {
    name: 'Tlemcen National Park',
    type: 'planting',
    status: 'planned',
    lat: 34.8386,
    lng: -1.2939,
    targetCount: 3000,
    currentCount: 0,
    description: 'Restoring Mediterranean pine and oak ecosystems.',
  },
  {
    name: 'El Kala National Park',
    type: 'planting',
    status: 'completed',
    lat: 36.8794,
    lng: 8.4389,
    targetCount: 8000,
    currentCount: 8000,
    description: 'Completed cork oak and wetland reforestation.',
  },
  {
    name: 'Bejaia Coast Cleanup',
    type: 'trash',
    status: 'in-progress',
    lat: 36.7509,
    lng: 5.0859,
    description: 'Beach and coastal trash collection point.',
  },
  {
    name: 'Oran Bay Cleanup',
    type: 'trash',
    status: 'planned',
    lat: 35.7043,
    lng: -0.6401,
    description: 'Organized cleanup of Oran coastline.',
  },
  {
    name: 'Djurdjura Cleanup',
    type: 'cleanup',
    status: 'in-progress',
    lat: 36.4333,
    lng: 4.25,
    description: 'Mountain trail cleanup and maintenance.',
  },
  {
    name: 'Hoggar Mountains Planting',
    type: 'planting',
    status: 'planned',
    lat: 23.2872,
    lng: 5.6358,
    targetCount: 2000,
    currentCount: 0,
    description: 'Acacia and drought-resistant tree planting in the Sahara.',
  },
  {
    name: 'Mila Olive Grove',
    type: 'planting',
    status: 'in-progress',
    lat: 36.4514,
    lng: 6.2644,
    targetCount: 1500,
    currentCount: 600,
    description: 'Community olive tree planting project.',
  },
  {
    name: 'Annaba Dunes Cleanup',
    type: 'trash',
    status: 'completed',
    lat: 36.9139,
    lng: 7.7639,
    description: 'Completed dune and beach cleanup operation.',
  },
  {
    name: 'Tizi Ouzou Reforestation',
    type: 'planting',
    status: 'in-progress',
    lat: 36.7167,
    lng: 4.05,
    targetCount: 4000,
    currentCount: 1500,
    description: 'Mixed oak and pine reforestation in Kabylie region.',
  },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ZoneOrmEntity);

  let count = 0;
  for (const data of demoZones) {
    const exists = await repo.exists({ where: { name: data.name } });
    if (exists) {
      console.log(`  SKIP ${data.name}`);
      continue;
    }
    await repo.save(repo.create(data));
    console.log(`  OK   ${data.name}`);
    count++;
  }

  await AppDataSource.destroy();
  console.log(
    `\nSeeded ${count} zones${count > 0 ? '' : ' (all already exist)'}.`,
  );
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
