package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UpdateZoneHandler implements CommandHandler<UpdateZoneCommand, ZoneResponse> {

    private final ZoneRepository zoneRepository;

    public UpdateZoneHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Override
    public ZoneResponse handle(UpdateZoneCommand command) {
        var zone = zoneRepository
                .findById(command.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Zone not found"));
        var request = command.request();
        if (request.name() != null) zone.setName(request.name());
        if (request.type() != null) zone.setType(request.type());
        if (request.status() != null) zone.setStatus(request.status());
        if (request.lat() != null) zone.setLat(request.lat());
        if (request.lng() != null) zone.setLng(request.lng());
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        return ZoneResponse.from(zoneRepository.save(zone));
    }

    @Override
    public Class<UpdateZoneCommand> supportedCommand() {
        return UpdateZoneCommand.class;
    }
}
