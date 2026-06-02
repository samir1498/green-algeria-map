package com.greenalgeria.damagereport.domain;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

public enum DamageReportStatus {
    reported,
    verified,
    resolved;

    private static final Map<DamageReportStatus, Set<DamageReportStatus>> TRANSITIONS =
            new EnumMap<>(DamageReportStatus.class);

    static {
        TRANSITIONS.put(reported, Set.of(verified));
        TRANSITIONS.put(verified, Set.of(resolved));
        TRANSITIONS.put(resolved, Set.of());
    }

    public boolean canTransitionTo(DamageReportStatus target) {
        return TRANSITIONS.get(this).contains(target);
    }
}
