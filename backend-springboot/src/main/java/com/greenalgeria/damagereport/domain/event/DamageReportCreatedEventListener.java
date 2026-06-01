package com.greenalgeria.damagereport.domain.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
class DamageReportCreatedEventListener {

    private static final Logger log = LoggerFactory.getLogger(DamageReportCreatedEventListener.class);

    @EventListener
    void on(DamageReportCreatedEvent event) {
        log.info("Damage report created: id={}, zoneId={}, type={}", event.reportId(), event.zoneId(), event.type());
    }
}
