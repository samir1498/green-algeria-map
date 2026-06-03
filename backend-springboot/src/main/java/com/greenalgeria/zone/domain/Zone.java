package com.greenalgeria.zone.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "zones")
public class Zone {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ZoneStatus status = ZoneStatus.planned;

    private Coordinates coordinates;

    private Integer targetCount;

    private Integer currentCount;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String organizerContact;

    private String treeSpecies;

    private Integer volunteerCount = 0;

    @ElementCollection
    @CollectionTable(name = "zone_photos", joinColumns = @JoinColumn(name = "zone_id"))
    @Column(name = "photos", columnDefinition = "TEXT")
    private List<String> photos = new ArrayList<>();

    protected Zone() {}

    public Zone(String name, ZoneType type, Coordinates coordinates) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.type = type;
        this.coordinates = coordinates;
    }

    public void rename(String name) {
        this.name = name;
    }

    public void reposition(Coordinates coordinates) {
        this.coordinates = coordinates;
    }

    public void markInProgress() {
        if (this.status != ZoneStatus.planned) {
            throw new IllegalStateException("Only planned zones can be marked in progress");
        }
        this.status = ZoneStatus.in_progress;
    }

    public void markComplete() {
        if (this.status != ZoneStatus.in_progress) {
            throw new IllegalStateException("Only in-progress zones can be completed");
        }
        this.status = ZoneStatus.completed;
    }

    public void updateProgress(Integer count) {
        if (count != null && count < 0) {
            throw new IllegalArgumentException("Progress count cannot be negative");
        }
        this.currentCount = count;
        if (this.currentCount != null && this.targetCount != null && this.currentCount >= this.targetCount) {
            this.status = ZoneStatus.completed;
        }
    }

    public void incrementVolunteers() {
        this.volunteerCount = this.volunteerCount != null ? this.volunteerCount + 1 : 1;
    }

    public void addPhoto(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) return;
        if (!photoUrl.startsWith("http://") && !photoUrl.startsWith("https://")) return;
        if (this.photos.contains(photoUrl)) return;
        this.photos.add(photoUrl);
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
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

    public Coordinates getCoordinates() {
        return coordinates;
    }

    public Double getLat() {
        return coordinates != null ? coordinates.getLat() : null;
    }

    public Double getLng() {
        return coordinates != null ? coordinates.getLng() : null;
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

    public List<String> getPhotos() {
        return photos;
    }
}
