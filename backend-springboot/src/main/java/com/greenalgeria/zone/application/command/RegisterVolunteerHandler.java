package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.shared.exception.NotFoundException;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class RegisterVolunteerHandler implements CommandHandler<RegisterVolunteerCommand, Void> {

    private final ZoneRepository zoneRepository;

    public RegisterVolunteerHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public Void handle(RegisterVolunteerCommand command) {
        var zone = zoneRepository.findById(command.id()).orElseThrow(() -> new NotFoundException("Zone not found"));
        zone.incrementVolunteers();
        zoneRepository.save(zone);
        return null;
    }

    @Override
    public Class<RegisterVolunteerCommand> supportedCommand() {
        return RegisterVolunteerCommand.class;
    }
}
