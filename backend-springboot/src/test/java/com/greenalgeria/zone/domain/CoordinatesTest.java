package com.greenalgeria.zone.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("unit")
class CoordinatesTest {

    @Test
    void validLatLng() {
        var coords = new Coordinates(36.5, 3.0);
        assertThat(coords.getLat()).isEqualTo(36.5);
        assertThat(coords.getLng()).isEqualTo(3.0);
    }

    @Test
    void boundaryLat90() {
        var coords = new Coordinates(90.0, 0.0);
        assertThat(coords.getLat()).isEqualTo(90.0);
    }

    @Test
    void boundaryLatNegative90() {
        var coords = new Coordinates(-90.0, 0.0);
        assertThat(coords.getLat()).isEqualTo(-90.0);
    }

    @Test
    void boundaryLng180() {
        var coords = new Coordinates(0.0, 180.0);
        assertThat(coords.getLng()).isEqualTo(180.0);
    }

    @Test
    void boundaryLngNegative180() {
        var coords = new Coordinates(0.0, -180.0);
        assertThat(coords.getLng()).isEqualTo(-180.0);
    }

    @Test
    void latTooHigh() {
        assertThatThrownBy(() -> new Coordinates(90.1, 0.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude");
    }

    @Test
    void latTooLow() {
        assertThatThrownBy(() -> new Coordinates(-90.1, 0.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude");
    }

    @Test
    void lngTooHigh() {
        assertThatThrownBy(() -> new Coordinates(0.0, 180.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Longitude");
    }

    @Test
    void lngTooLow() {
        assertThatThrownBy(() -> new Coordinates(0.0, -180.1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Longitude");
    }

    @Test
    void nullLat() {
        assertThatThrownBy(() -> new Coordinates(null, 0.0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Latitude");
    }

    @Test
    void nullLng() {
        assertThatThrownBy(() -> new Coordinates(0.0, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("longitude");
    }
}
