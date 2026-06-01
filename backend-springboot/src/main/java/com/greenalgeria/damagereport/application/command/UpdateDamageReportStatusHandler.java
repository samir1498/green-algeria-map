package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.shared.cqrs.CommandHandler;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UpdateDamageReportStatusHandler
        implements CommandHandler<UpdateDamageReportStatusCommand, DamageReportResponse> {

    private final DamageReportRepository damageReportRepository;

    public UpdateDamageReportStatusHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    @Override
    public DamageReportResponse handle(UpdateDamageReportStatusCommand command) {
        var report = damageReportRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found"));
        report.setStatus(command.status());
        return DamageReportResponse.from(damageReportRepository.save(report));
    }

    @Override
    public Class<UpdateDamageReportStatusCommand> supportedCommand() {
        return UpdateDamageReportStatusCommand.class;
    }
}
