package com.greenalgeria.zone.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ZoneRepository {
    Optional<Zone> findById(UUID id);

    List<Zone> findAllByOrderByNameAsc();

    Zone save(Zone zone);

    boolean existsById(UUID id);

    void deleteById(UUID id);
}
