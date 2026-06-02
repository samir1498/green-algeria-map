package com.greenalgeria.zone.application.query;

import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class GetZoneByIdHandler {

    private final ZoneRepository zoneRepository;

    public GetZoneByIdHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public Optional<ZoneResponse> handle(GetZoneByIdQuery query) {
        return zoneRepository.findById(query.id()).map(ZoneResponse::from);
    }
}
