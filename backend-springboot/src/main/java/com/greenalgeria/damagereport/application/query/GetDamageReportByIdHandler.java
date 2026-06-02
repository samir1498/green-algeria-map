package com.greenalgeria.damagereport.application.query;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class GetDamageReportByIdHandler {

    private final DamageReportRepository damageReportRepository;

    public GetDamageReportByIdHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public Optional<DamageReportResponse> handle(GetDamageReportByIdQuery query) {
        return damageReportRepository.findById(query.id()).map(DamageReportResponse::from);
    }
}
