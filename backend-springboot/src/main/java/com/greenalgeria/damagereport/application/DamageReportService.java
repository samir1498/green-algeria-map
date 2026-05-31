package com.greenalgeria.damagereport.application;

import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.damagereport.domain.DamageReportStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    @Transactional
    public DamageReportResponse create(CreateDamageReportRequest request) {
        var report = new DamageReport(
                request.zoneId(),
                request.type(),
                request.severity(),
                request.lat(),
                request.lng(),
                request.description(),
                request.reportedBy());
        return DamageReportResponse.from(damageReportRepository.save(report));
    }

    @Transactional
    public DamageReportResponse updateStatus(UUID id, DamageReportStatus status) {
        var report = damageReportRepository
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found"));
        report.setStatus(status);
        return DamageReportResponse.from(damageReportRepository.save(report));
    }

    @Transactional
    public void delete(UUID id) {
        if (!damageReportRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found");
        }
        damageReportRepository.deleteById(id);
    }
}
