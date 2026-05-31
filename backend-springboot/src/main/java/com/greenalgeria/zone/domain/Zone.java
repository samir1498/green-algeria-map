package com.greenalgeria.zone.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "zones")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneStatus status = ZoneStatus.planned;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    private Integer targetCount;

    private Integer currentCount;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String organizerContact;

    private String treeSpecies;

    private Integer volunteerCount = 0;

    @Column(columnDefinition = "TEXT")
    private String photos;

    protected Zone() {}

    public Zone(String name, ZoneType type, Double lat, Double lng) {
        this.name = name;
        this.type = type;
        this.lat = lat;
        this.lng = lng;
    }

    public void advanceStatus() {
        this.status = this.status.next();
    }

    public void incrementVolunteers() {
        this.volunteerCount = this.volunteerCount != null ? this.volunteerCount + 1 : 1;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ZoneType getType() {
        return type;
    }

    public void setType(ZoneType type) {
        this.type = type;
    }

    public ZoneStatus getStatus() {
        return status;
    }

    public void setStatus(ZoneStatus status) {
        this.status = status;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Integer getTargetCount() {
        return targetCount;
    }

    public void setTargetCount(Integer targetCount) {
        this.targetCount = targetCount;
    }

    public Integer getCurrentCount() {
        return currentCount;
    }

    public void setCurrentCount(Integer currentCount) {
        this.currentCount = currentCount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOrganizerContact() {
        return organizerContact;
    }

    public void setOrganizerContact(String organizerContact) {
        this.organizerContact = organizerContact;
    }

    public String getTreeSpecies() {
        return treeSpecies;
    }

    public void setTreeSpecies(String treeSpecies) {
        this.treeSpecies = treeSpecies;
    }

    public Integer getVolunteerCount() {
        return volunteerCount;
    }

    public String getPhotos() {
        return photos;
    }

    public void setPhotos(String photos) {
        this.photos = photos;
    }
}
