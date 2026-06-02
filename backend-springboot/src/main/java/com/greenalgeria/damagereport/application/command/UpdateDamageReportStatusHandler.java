package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
@Transactional
public class UpdateDamageReportStatusHandler {

    private final DamageReportRepository damageReportRepository;

    public UpdateDamageReportStatusHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public DamageReportResponse handle(UpdateDamageReportStatusCommand command) {
        var report = damageReportRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found"));
        switch (command.status()) {
            case verified -> report.verify();
            case resolved -> report.resolve();
            default -> {}
        }
        return DamageReportResponse.from(damageReportRepository.save(report));
    }
}
