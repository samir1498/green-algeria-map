package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.shared.cqrs.CommandHandler;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class DeleteDamageReportHandler implements CommandHandler<DeleteDamageReportCommand, Void> {

    private final DamageReportRepository damageReportRepository;

    public DeleteDamageReportHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    @Override
    public Void handle(DeleteDamageReportCommand command) {
        if (!damageReportRepository.existsById(command.id())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found");
        }
        damageReportRepository.deleteById(command.id());
        return null;
    }

    @Override
    public Class<DeleteDamageReportCommand> supportedCommand() {
        return DeleteDamageReportCommand.class;
    }
}
