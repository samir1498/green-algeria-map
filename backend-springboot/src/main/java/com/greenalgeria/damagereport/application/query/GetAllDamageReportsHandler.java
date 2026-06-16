package com.greenalgeria.damagereport.application.query;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.shared.cqrs.QueryHandler;
import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
public class GetAllDamageReportsHandler implements QueryHandler<GetDamageReportsQuery, List<DamageReportResponse>> {

    private final DamageReportRepository damageReportRepository;

    public GetAllDamageReportsHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    @Cacheable("damageReports")
    public List<DamageReportResponse> handle(GetDamageReportsQuery query) {
        var reports = query.zoneId() != null
                ? damageReportRepository.findByZoneIdOrderByReportedAtDesc(query.zoneId())
                : damageReportRepository.findAllByOrderByReportedAtDesc();
        return reports.stream().map(DamageReportResponse::from).toList();
    }

    @Override
    public Class<GetDamageReportsQuery> supportedQuery() {
        return GetDamageReportsQuery.class;
    }
}
