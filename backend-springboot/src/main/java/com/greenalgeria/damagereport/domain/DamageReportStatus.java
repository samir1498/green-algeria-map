package com.greenalgeria.damagereport.domain;

public enum DamageReportStatus {
    reported,
    verified,
    resolved;

    static {
        reported.transitions = new DamageReportStatus[] {verified};
        verified.transitions = new DamageReportStatus[] {resolved};
        resolved.transitions = new DamageReportStatus[] {};
    }

    private DamageReportStatus[] transitions;

    public boolean canTransitionTo(DamageReportStatus target) {
        for (var allowed : transitions) {
            if (allowed == target) return true;
        }
        return false;
    }
}
