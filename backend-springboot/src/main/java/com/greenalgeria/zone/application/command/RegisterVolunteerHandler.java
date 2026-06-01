package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RegisterVolunteerHandler implements CommandHandler<RegisterVolunteerCommand, Void> {

    private final ZoneRepository zoneRepository;

    public RegisterVolunteerHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Override
    public Void handle(RegisterVolunteerCommand command) {
        var zone = zoneRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        zone.incrementVolunteers();
        zoneRepository.save(zone);
        return null;
    }

    @Override
    public Class<RegisterVolunteerCommand> supportedCommand() {
        return RegisterVolunteerCommand.class;
    }
}
