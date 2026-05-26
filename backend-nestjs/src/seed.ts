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
  organizerContact?: string;
  treeSpecies?: string;
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
    organizerContact: 'Fatima Ouali — fatima.ouali@greenalgeria.dz',
    treeSpecies: 'Cedrus atlantica',
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
    treeSpecies: 'Pinus halepensis',
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
    treeSpecies: 'Quercus suber',
  },
  {
    name: 'Bejaia Coast Cleanup',
    type: 'trash',
    status: 'in-progress',
    lat: 36.7509,
    lng: 5.0859,
    description: 'Beach and coastal trash collection point.',
    organizerContact: 'Karim Bensaid — karim.bensaid@greenalgeria.dz',
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
    treeSpecies: 'Acacia tortilis',
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
    treeSpecies: 'Olea europaea',
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
    organizerContact: 'Said Amrani — said.amrani@greenalgeria.dz',
    treeSpecies: 'Quercus suber',
  },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ZoneOrmEntity);

  let created = 0;
  let updated = 0;
  for (const data of demoZones) {
    const existing = await repo.findOne({ where: { name: data.name } });
    if (existing) {
      if (data.treeSpecies && existing.treeSpecies !== data.treeSpecies) {
        await repo.update(existing.id, { treeSpecies: data.treeSpecies });
        console.log(`  UPD  ${data.name} → treeSpecies: ${data.treeSpecies}`);
        updated++;
      } else {
        console.log(`  OK   ${data.name}`);
      }
      continue;
    }
    await repo.save(repo.create(data));
    console.log(`  NEW  ${data.name}`);
    created++;
  }

  await AppDataSource.destroy();
  console.log(
    `\nSeeded ${created} new zones, updated ${updated} existing zones.`,
  );
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
