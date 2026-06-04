package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.shared.exception.NotFoundException;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class DeleteZoneHandler implements CommandHandler<DeleteZoneCommand, Void> {

    private final ZoneRepository zoneRepository;

    public DeleteZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public Void handle(DeleteZoneCommand command) {
        if (!zoneRepository.existsById(command.id())) {
            throw new NotFoundException("Zone not found");
        }
        zoneRepository.deleteById(command.id());
        return null;
    }

    @Override
    public Class<DeleteZoneCommand> supportedCommand() {
        return DeleteZoneCommand.class;
    }
}
