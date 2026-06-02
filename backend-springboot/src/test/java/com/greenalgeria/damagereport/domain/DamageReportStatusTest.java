package com.greenalgeria.damagereport.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("unit")
class DamageReportStatusTest {

    @Test
    void reportedCanTransitionToVerified() {
        assertThat(DamageReportStatus.reported.canTransitionTo(DamageReportStatus.verified))
                .isTrue();
    }

    @Test
    void reportedCannotTransitionToResolved() {
        assertThat(DamageReportStatus.reported.canTransitionTo(DamageReportStatus.resolved))
                .isFalse();
    }

    @Test
    void verifiedCanTransitionToResolved() {
        assertThat(DamageReportStatus.verified.canTransitionTo(DamageReportStatus.resolved))
                .isTrue();
    }

    @Test
    void verifiedCannotTransitionToReported() {
        assertThat(DamageReportStatus.verified.canTransitionTo(DamageReportStatus.reported))
                .isFalse();
    }

    @Test
    void resolvedCannotTransitionToAny() {
        assertThat(DamageReportStatus.resolved.canTransitionTo(DamageReportStatus.reported))
                .isFalse();
        assertThat(DamageReportStatus.resolved.canTransitionTo(DamageReportStatus.verified))
                .isFalse();
        assertThat(DamageReportStatus.resolved.canTransitionTo(DamageReportStatus.resolved))
                .isFalse();
    }

    @Test
    void reportedCannotTransitionToSame() {
        assertThat(DamageReportStatus.reported.canTransitionTo(DamageReportStatus.reported))
                .isFalse();
    }

    @Test
    void initialStatusIsReported() {
        assertThat(DamageReportStatus.reported.ordinal()).isZero();
    }
}
