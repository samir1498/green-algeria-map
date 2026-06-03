package com.greenalgeria.damagereport.application.query;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class GetAllDamageReportsHandler {

    private final DamageReportRepository damageReportRepository;

    public GetAllDamageReportsHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public List<DamageReportResponse> handle(GetDamageReportsQuery query) {
        var reports = query.zoneId() != null
                ? damageReportRepository.findByZoneIdOrderByReportedAtDesc(query.zoneId())
                : damageReportRepository.findAllByOrderByReportedAtDesc();
        return reports.stream().map(DamageReportResponse::from).toList();
    }
}
