package com.greenalgeria.damagereport.domain;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DamageReportRepository extends JpaRepository<DamageReport, UUID> {
    List<DamageReport> findAllByOrderByReportedAtDesc();

    List<DamageReport> findByZoneIdOrderByReportedAtDesc(UUID zoneId);
}
