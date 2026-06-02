package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.exception.NotFoundException;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class RegisterVolunteerHandler {

    private final ZoneRepository zoneRepository;

    public RegisterVolunteerHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public void handle(RegisterVolunteerCommand command) {
        var zone = zoneRepository.findById(command.id()).orElseThrow(() -> new NotFoundException("Zone not found"));
        zone.incrementVolunteers();
        zoneRepository.save(zone);
    }
}
