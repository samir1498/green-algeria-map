package com.greenalgeria.zone.application.command;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RegisterVolunteerHandler {

    private final ZoneRepository zoneRepository;

    public RegisterVolunteerHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public Void handle(RegisterVolunteerCommand command) {
        var zone = zoneRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        zone.incrementVolunteers();
        zoneRepository.save(zone);
        return null;
    }
}
