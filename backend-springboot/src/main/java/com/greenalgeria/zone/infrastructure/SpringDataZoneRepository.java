package com.greenalgeria.zone.infrastructure;

import com.greenalgeria.zone.domain.Zone;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataZoneRepository extends JpaRepository<Zone, UUID> {
    java.util.List<Zone> findAllByOrderByNameAsc();
}
