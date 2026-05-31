package com.greenalgeria.damagereport.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DamageReportRepository extends JpaRepository<DamageReport, UUID> {
    List<DamageReport> findAllByOrderByReportedAtDesc();
    List<DamageReport> findByZoneIdOrderByReportedAtDesc(UUID zoneId);
}
