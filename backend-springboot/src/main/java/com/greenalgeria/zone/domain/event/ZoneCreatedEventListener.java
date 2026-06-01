package com.greenalgeria.zone.domain.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
class ZoneCreatedEventListener {

    private static final Logger log = LoggerFactory.getLogger(ZoneCreatedEventListener.class);

    @EventListener
    void on(ZoneCreatedEvent event) {
        log.info("Zone created: id={}, name={}, type={}", event.zoneId(), event.name(), event.type());
    }
}
