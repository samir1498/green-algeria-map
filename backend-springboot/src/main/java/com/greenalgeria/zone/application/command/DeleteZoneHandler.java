package com.greenalgeria.zone.application.command;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class DeleteZoneHandler {

    private final ZoneRepository zoneRepository;

    public DeleteZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public Void handle(DeleteZoneCommand command) {
        if (!zoneRepository.existsById(command.id())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found");
        }
        zoneRepository.deleteById(command.id());
        return null;
    }
}
