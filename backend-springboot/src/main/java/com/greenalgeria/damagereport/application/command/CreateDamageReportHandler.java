package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.shared.cqrs.CommandHandler;
import org.springframework.stereotype.Component;

@Component
public class CreateDamageReportHandler implements CommandHandler<CreateDamageReportCommand, DamageReportResponse> {

    private final DamageReportRepository damageReportRepository;

    public CreateDamageReportHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    @Override
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
        return DamageReportResponse.from(damageReportRepository.save(report));
    }

    @Override
    public Class<CreateDamageReportCommand> supportedCommand() {
        return CreateDamageReportCommand.class;
    }
}
