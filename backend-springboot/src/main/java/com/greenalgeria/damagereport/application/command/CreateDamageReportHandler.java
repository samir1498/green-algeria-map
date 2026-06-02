package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import org.springframework.stereotype.Component;

@Component
public class CreateDamageReportHandler {

    private final DamageReportRepository damageReportRepository;

    public CreateDamageReportHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public DamageReportResponse handle(CreateDamageReportCommand command) {
        var request = command.request();
        var report = new DamageReport(
                request.zoneId(),
                request.type(),
                request.severity(),
                request.lat(),
                request.lng(),
                request.description(),
                request.reportedBy());
        var saved = damageReportRepository.save(report);
        return DamageReportResponse.from(saved);
    }
}
