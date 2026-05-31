package com.greenalgeria.zone.application;

import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ZoneService {

    private final ZoneRepository zoneRepository;

    public ZoneService(ZoneRepository zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    public List<ZoneResponse> getAll() {
        return zoneRepository.findAllByOrderByNameAsc().stream()
            .map(ZoneResponse::from)
            .toList();
    }

    public Optional<ZoneResponse> getById(UUID id) {
        return zoneRepository.findById(id).map(ZoneResponse::from);
    }
}
