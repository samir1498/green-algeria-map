package com.greenalgeria.zone.application.query;

import com.greenalgeria.shared.cqrs.QueryHandler;
import com.greenalgeria.zone.application.*;
import com.greenalgeria.zone.domain.ZoneRepository;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class GetAllZonesHandler implements QueryHandler<GetAllZonesQuery, List<ZoneResponse>> {

    private final ZoneRepository zoneRepository;

    public GetAllZonesHandler(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    @Transactional(readOnly = true)
    public List<ZoneResponse> handle(GetAllZonesQuery query) {
        return zoneRepository.findAllByOrderByNameAsc().stream()
                .map(ZoneResponse::from)
                .toList();
    }

    @Override
    public Class<GetAllZonesQuery> supportedQuery() {
        return GetAllZonesQuery.class;
    }
}
