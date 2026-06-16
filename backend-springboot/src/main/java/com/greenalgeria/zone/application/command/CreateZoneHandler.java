package com.greenalgeria.zone.application.command;

import com.greenalgeria.shared.cqrs.CommandHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.Coordinates;
import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import com.greenalgeria.zone.domain.event.ZoneCreatedEvent;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class CreateZoneHandler implements CommandHandler<CreateZoneCommand, ZoneResponse> {

    private final ZoneRepository zoneRepository;
    private final ApplicationEventPublisher eventPublisher;

    public CreateZoneHandler(ZoneRepository zoneRepository, ApplicationEventPublisher eventPublisher) {
        this.zoneRepository = zoneRepository;
        this.eventPublisher = eventPublisher;
    }

    @CacheEvict("zones")
    public ZoneResponse handle(CreateZoneCommand command) {
        var request = command.request();
        var zone = new Zone(request.name(), request.type(), new Coordinates(request.lat(), request.lng()));
        if (request.targetCount() != null) zone.setTargetCount(request.targetCount());
        if (request.currentCount() != null) zone.setCurrentCount(request.currentCount());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.organizerContact() != null) zone.setOrganizerContact(request.organizerContact());
        if (request.treeSpecies() != null) zone.setTreeSpecies(request.treeSpecies());
        var saved = zoneRepository.save(zone);
        eventPublisher.publishEvent(new ZoneCreatedEvent(saved.getId()));
        return ZoneResponse.from(saved);
    }

    @Override
    public Class<CreateZoneCommand> supportedCommand() {
        return CreateZoneCommand.class;
    }
}
