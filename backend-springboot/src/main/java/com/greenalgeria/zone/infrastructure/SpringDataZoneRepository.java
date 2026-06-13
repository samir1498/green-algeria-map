package com.greenalgeria.zone.infrastructure;

import com.greenalgeria.zone.domain.Zone;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataZoneRepository extends JpaRepository<Zone, UUID> {

    @EntityGraph(attributePaths = "photos")
    List<Zone> findAllByOrderByNameAsc();
}
