package com.greenalgeria.zone.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ZoneRepository extends JpaRepository<Zone, UUID> {
    List<Zone> findAllByOrderByNameAsc();
}
