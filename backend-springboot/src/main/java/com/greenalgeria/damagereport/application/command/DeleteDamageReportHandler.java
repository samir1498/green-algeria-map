package com.greenalgeria.damagereport.application.command;

import com.greenalgeria.damagereport.application.*;
import com.greenalgeria.damagereport.domain.DamageReportRepository;
import com.greenalgeria.shared.exception.NotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Transactional
public class DeleteDamageReportHandler {

    private final DamageReportRepository damageReportRepository;

    public DeleteDamageReportHandler(DamageReportRepository damageReportRepository) {
        this.damageReportRepository = damageReportRepository;
    }

    public void handle(DeleteDamageReportCommand command) {
        if (!damageReportRepository.existsById(command.id())) {
            throw new NotFoundException("Damage report not found");
        }
        damageReportRepository.deleteById(command.id());
    }
}
