package com.greenalgeria.damagereport.infrastructure;

import com.greenalgeria.damagereport.domain.DamageReport;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class JpaDamageReportRepository implements DamageReportRepository {

    private final SpringDataDamageReportRepository springData;

    public JpaDamageReportRepository(SpringDataDamageReportRepository springData) {
        this.springData = springData;
    }

    @Override
    public Optional<DamageReport> findById(UUID id) {
        return springData.findById(id);
    }

    @Override
    public List<DamageReport> findAllByOrderByReportedAtDesc() {
        return springData.findAllByOrderByReportedAtDesc();
    }

    @Override
    public List<DamageReport> findByZoneIdOrderByReportedAtDesc(UUID zoneId) {
        return springData.findByZoneIdOrderByReportedAtDesc(zoneId);
    }

    @Override
    public DamageReport save(DamageReport damageReport) {
        return springData.save(damageReport);
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
