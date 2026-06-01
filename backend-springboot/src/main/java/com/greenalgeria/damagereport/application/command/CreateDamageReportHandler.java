package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.damagereport.domain.event.DamageReportCreatedEvent;
import com.greenalgeria.shared.cqrs.CommandHandler;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class CreateDamageReportHandler implements CommandHandler<CreateDamageReportCommand, DamageReportResponse> {

    private final DamageReportRepository damageReportRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CreateDamageReportHandler(
            DamageReportRepository damageReportRepository, ApplicationEventPublisher eventPublisher) {
        this.damageReportRepository = damageReportRepository;
        this.eventPublisher = eventPublisher;
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
        var saved = damageReportRepository.save(report);
        eventPublisher.publishEvent(new DamageReportCreatedEvent(saved.getId(), saved.getZoneId(), saved.getType()));
        return DamageReportResponse.from(saved);
    }

    @Override
    public Class<CreateDamageReportCommand> supportedCommand() {
        return CreateDamageReportCommand.class;
    }
}
