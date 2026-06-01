package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Component;

@Component
public class CreateZoneHandler implements CommandHandler<CreateZoneCommand, ZoneResponse> {

    private final ZoneRepository zoneRepository;

    public CreateZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Override
    public ZoneResponse handle(CreateZoneCommand command) {
        var request = command.request();
        var zone = new Zone(request.name(), request.type(), request.lat(), request.lng());
        if (request.status() != null) zone.setStatus(request.status());
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        return ZoneResponse.from(zoneRepository.save(zone));
    }

    @Override
    public Class<CreateZoneCommand> supportedCommand() {
        return CreateZoneCommand.class;
    }
}
