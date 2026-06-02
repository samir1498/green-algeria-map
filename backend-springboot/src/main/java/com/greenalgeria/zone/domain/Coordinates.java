package com.greenalgeria.zone.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.Objects;

@Embeddable
public class Coordinates {

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    protected Coordinates() {}

    public Coordinates(Double lat, Double lng) {
        if (lat == null || lng == null) {
            throw new IllegalArgumentException("Latitude and longitude must not be null");
        }
        if (lat.isNaN() || lng.isNaN()) {
            throw new IllegalArgumentException("Latitude and longitude must not be NaN");
        }
        if (lat < -90 || lat > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        this.lat = lat;
        this.lng = lng;
    }

    public Double getLat() {
        return lat;
    }

    public Double getLng() {
        return lng;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Coordinates that = (Coordinates) o;
        return Double.compare(that.lat, lat) == 0 && Double.compare(that.lng, lng) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(lat, lng);
    }
}
