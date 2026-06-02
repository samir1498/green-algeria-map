package com.greenalgeria.damagereport.infrastructure;

import com.greenalgeria.damagereport.domain.DamageReport;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataDamageReportRepository extends JpaRepository<DamageReport, UUID> {
    List<DamageReport> findAllByOrderByReportedAtDesc();

    List<DamageReport> findByZoneIdOrderByReportedAtDesc(UUID zoneId);
}
