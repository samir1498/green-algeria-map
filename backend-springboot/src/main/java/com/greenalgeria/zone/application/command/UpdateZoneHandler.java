package com.greenalgeria.zone.application.command;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.Coordinates;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
@Transactional
public class UpdateZoneHandler {

    private final ZoneRepository zoneRepository;

    public UpdateZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public ZoneResponse handle(UpdateZoneCommand command) {
        var zone = zoneRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        var request = command.request();
        if (request.name() != null) zone.rename(request.name());
        if (request.type() != null) zone.setType(request.type());
        if (request.status() != null) {
            switch (request.status()) {
                case in_progress -> zone.markInProgress();
                case completed -> zone.markComplete();
                default -> {}
            }
        }
        if (request.lat() != null && request.lng() != null) {
            zone.reposition(new Coordinates(request.lat(), request.lng()));
        }
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        return ZoneResponse.from(zoneRepository.save(zone));
    }
}
