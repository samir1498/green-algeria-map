package com.greenalgeria.damagereport.application;

import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DamageReportService {

    private final DamageReportRepository damageReportRepository;

    public DamageReportService(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public List<DamageReportResponse> getAll(UUID zoneId) {
        List<DamageReport> reports = zoneId != null
                ? damageReportRepository.findByZoneIdOrderByReportedAtDesc(zoneId)
                : damageReportRepository.findAllByOrderByReportedAtDesc();
        return reports.stream().map(DamageReportResponse::from).toList();
    }

    public Optional<DamageReportResponse> getById(UUID id) {
        return damageReportRepository.findById(id).map(DamageReportResponse::from);
    }
}
