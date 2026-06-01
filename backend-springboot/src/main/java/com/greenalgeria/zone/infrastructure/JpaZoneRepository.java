package com.greenalgeria.zone.infrastructure;

import com.greenalgeria.zone.domain.Zone;
import com.greenalgeria.zone.domain.ZoneRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class JpaZoneRepository implements ZoneRepository {

    private final SpringDataZoneRepository springData;

    public JpaZoneRepository(SpringDataZoneRepository springData) {
        this.springData = springData;
    }

    @Override
    public Optional<Zone> findById(UUID id) {
        return springData.findById(id);
    }

    @Override
    public List<Zone> findAllByOrderByNameAsc() {
        return springData.findAllByOrderByNameAsc();
    }

    @Override
    public Zone save(Zone zone) {
        return springData.save(zone);
    }

    @Override
    public boolean existsById(UUID id) {
        return springData.existsById(id);
    }

    @Override
    public void deleteById(UUID id) {
        springData.deleteById(id);
    }
}
