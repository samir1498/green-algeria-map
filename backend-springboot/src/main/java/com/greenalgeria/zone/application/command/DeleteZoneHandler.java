package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.exception.NotFoundException;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class DeleteZoneHandler {

    private final ZoneRepository zoneRepository;

    public DeleteZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public void handle(DeleteZoneCommand command) {
        if (!zoneRepository.existsById(command.id())) {
            throw new NotFoundException("Zone not found");
        }
        zoneRepository.deleteById(command.id());
    }
}
