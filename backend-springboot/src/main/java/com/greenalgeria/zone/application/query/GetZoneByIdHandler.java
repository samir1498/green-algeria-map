package com.greenalgeria.zone.application.query;

import com.greenalgeria.shared.cqrs.QueryHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class GetZoneByIdHandler implements QueryHandler<GetZoneByIdQuery, Optional<ZoneResponse>> {

    private final ZoneRepository zoneRepository;

    public GetZoneByIdHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Transactional(readOnly = true)
    public Optional<ZoneResponse> handle(GetZoneByIdQuery query) {
        return zoneRepository.findById(query.id()).map(ZoneResponse::from);
    }

    @Override
    public Class<GetZoneByIdQuery> supportedQuery() {
        return GetZoneByIdQuery.class;
    }
}
