package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UpdateDamageReportStatusHandler {

    private final DamageReportRepository damageReportRepository;

    public UpdateDamageReportStatusHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public DamageReportResponse handle(UpdateDamageReportStatusCommand command) {
        var report = damageReportRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found"));
        report.setStatus(command.status());
        return DamageReportResponse.from(damageReportRepository.save(report));
    }
}
