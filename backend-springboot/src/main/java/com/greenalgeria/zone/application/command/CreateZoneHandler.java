package com.greenalgeria.zone.application.command;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.Coordinates;
import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;

@Component
public class CreateZoneHandler {

    private final ZoneRepository zoneRepository;

    public CreateZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public ZoneResponse handle(CreateZoneCommand command) {
        var request = command.request();
        var zone = new Zone(request.name(), request.type(), new Coordinates(request.lat(), request.lng()));
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        var saved = zoneRepository.save(zone);
        return ZoneResponse.from(saved);
    }
}
