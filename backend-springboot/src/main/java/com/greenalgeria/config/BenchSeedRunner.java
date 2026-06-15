package com.greenalgeria.config;

import com.greenalgeria.zone.domain.Coordinates;
import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneStatus;
import com.greenalgeria.zone.domain.ZoneType;
import com.greenalgeria.zone.infrastructure.SpringDataZoneRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class BenchSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BenchSeedRunner.class);

    private final SpringDataZoneRepository zoneRepo;

    public BenchSeedRunner(SpringDataZoneRepository zoneRepo) {
        this.zoneRepo = zoneRepo;
    }

    @Override
    public void run(ApplicationArguments args) {
        var existing = zoneRepo.findAll();
        int created = 0;
        for (var entry : SEED_ZONES) {
            if (existing.stream().anyMatch(z -> z.getName().equals(entry.name))) {
                continue;
            }
            Zone zone = new Zone(entry.name, entry.type, new Coordinates(entry.lat, entry.lng));
            zone.setTargetCount(entry.targetCount);
            zone.setCurrentCount(entry.currentCount);
            zone.setDescription(entry.description);
            zone.setOrganizerContact(entry.organizerContact);
            zone.setTreeSpecies(entry.treeSpecies);
            applyStatus(zone, entry.status, entry.currentCount, entry.targetCount);
            zoneRepo.save(zone);
            created++;
        }
        if (created > 0) {
            log.info("Seeded {} demo zones", created);
        }
    }

    private static void applyStatus(Zone zone, ZoneStatus desired, Integer currentCount, Integer targetCount) {
        if (desired == ZoneStatus.planned) return;
        zone.markInProgress();
        if (desired == ZoneStatus.completed) {
            zone.markComplete();
        }
    }

    private record SeedZone(
            String name,
            ZoneType type,
            ZoneStatus status,
            double lat,
            double lng,
            Integer targetCount,
            Integer currentCount,
            String description,
            String organizerContact,
            String treeSpecies) {}

    private static final List<SeedZone> SEED_ZONES = List.of(
            new SeedZone(
                    "Chrea National Park",
                    ZoneType.planting,
                    ZoneStatus.in_progress,
                    36.4424,
                    2.8695,
                    5000,
                    1200,
                    "Reforestation of cedar forests destroyed by wildfires.",
                    "Fatima Ouali — fatima.ouali@greenalgeria.dz",
                    "Cedrus atlantica"),
            new SeedZone(
                    "Tlemcen National Park",
                    ZoneType.planting,
                    ZoneStatus.planned,
                    34.8386,
                    -1.2939,
                    3000,
                    0,
                    "Restoring Mediterranean pine and oak ecosystems.",
                    null,
                    "Pinus halepensis"),
            new SeedZone(
                    "El Kala National Park",
                    ZoneType.planting,
                    ZoneStatus.completed,
                    36.8794,
                    8.4389,
                    8000,
                    8000,
                    "Completed cork oak and wetland reforestation.",
                    null,
                    "Quercus suber"),
            new SeedZone(
                    "Bejaia Coast Cleanup",
                    ZoneType.trash,
                    ZoneStatus.in_progress,
                    36.7509,
                    5.0859,
                    null,
                    null,
                    "Beach and coastal trash collection point.",
                    "Karim Bensaid — karim.bensaid@greenalgeria.dz",
                    null),
            new SeedZone(
                    "Oran Bay Cleanup",
                    ZoneType.trash,
                    ZoneStatus.planned,
                    35.7043,
                    -0.6401,
                    null,
                    null,
                    "Organized cleanup of Oran coastline.",
                    null,
                    null),
            new SeedZone(
                    "Djurdjura Cleanup",
                    ZoneType.cleanup,
                    ZoneStatus.in_progress,
                    36.4333,
                    4.25,
                    null,
                    null,
                    "Mountain trail cleanup and maintenance.",
                    null,
                    null),
            new SeedZone(
                    "Hoggar Mountains Planting",
                    ZoneType.planting,
                    ZoneStatus.planned,
                    23.2872,
                    5.6358,
                    2000,
                    0,
                    "Acacia and drought-resistant tree planting in the Sahara.",
                    null,
                    "Acacia tortilis"),
            new SeedZone(
                    "Mila Olive Grove",
                    ZoneType.planting,
                    ZoneStatus.in_progress,
                    36.4514,
                    6.2644,
                    1500,
                    600,
                    "Community olive tree planting project.",
                    null,
                    "Olea europaea"),
            new SeedZone(
                    "Annaba Dunes Cleanup",
                    ZoneType.trash,
                    ZoneStatus.completed,
                    36.9139,
                    7.7639,
                    null,
                    null,
                    "Completed dune and beach cleanup operation.",
                    null,
                    null),
            new SeedZone(
                    "Tizi Ouzou Reforestation",
                    ZoneType.planting,
                    ZoneStatus.in_progress,
                    36.7167,
                    4.05,
                    4000,
                    1500,
                    "Mixed oak and pine reforestation in Kabylie region.",
                    "Said Amrani — said.amrani@greenalgeria.dz",
                    "Quercus suber"));
}
