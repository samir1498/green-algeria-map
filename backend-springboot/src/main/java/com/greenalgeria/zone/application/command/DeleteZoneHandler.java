package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class DeleteZoneHandler implements CommandHandler<DeleteZoneCommand, Void> {

    private final ZoneRepository zoneRepository;

    public DeleteZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Override
    public Void handle(DeleteZoneCommand command) {
        if (!zoneRepository.existsById(command.id())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found");
        }
        zoneRepository.deleteById(command.id());
        return null;
    }

    @Override
    public Class<DeleteZoneCommand> supportedCommand() {
        return DeleteZoneCommand.class;
    }
}
