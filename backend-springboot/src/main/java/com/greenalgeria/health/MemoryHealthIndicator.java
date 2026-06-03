package com.greenalgeria.health;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class MemoryHealthIndicator implements HealthIndicator {

    private static final double THRESHOLD = 0.9;

    private final MemoryMXBean memoryBean;

    public MemoryHealthIndicator() {
        this.memoryBean = ManagementFactory.getMemoryMXBean();
    }

    @Override
    public Health health() {
        var heap = memoryBean.getHeapMemoryUsage();
        var used = (double) heap.getUsed();
        var max = (double) heap.getMax();
        var usage = used / max;

        if (usage > THRESHOLD) {
            return Health.down()
                    .withDetail("used", heap.getUsed())
                    .withDetail("max", heap.getMax())
                    .withDetail("usage", usage)
                    .build();
        }

        return Health.up()
                .withDetail("used", heap.getUsed())
                .withDetail("max", heap.getMax())
                .withDetail("usage", usage)
                .build();
    }
}
