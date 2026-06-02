package com.greenalgeria.damagereport.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DamageReportRepository {
    Optional<DamageReport> findById(UUID id);

    List<DamageReport> findAllByOrderByReportedAtDesc();

    List<DamageReport> findByZoneIdOrderByReportedAtDesc(UUID zoneId);

    DamageReport save(DamageReport damageReport);

    boolean existsById(UUID id);

    void deleteById(UUID id);
}
