package com.greenalgeria.zone.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Tag("unit")
class ZoneTest {

    private static Zone createPlantingZone() {
        return new Zone("Test Zone", ZoneType.planting, new Coordinates(36.5, 3.0));
    }

    @Test
    void create() {
        var zone = createPlantingZone();

        assertThat(zone.getName()).isEqualTo("Test Zone");
        assertThat(zone.getType()).isEqualTo(ZoneType.planting);
        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.planned);
        assertThat(zone.getLat()).isEqualTo(36.5);
        assertThat(zone.getLng()).isEqualTo(3.0);
        assertThat(zone.getVolunteerCount()).isZero();
        assertThat(zone.getId()).isNotNull();
    }

    @Test
    void rename() {
        var zone = createPlantingZone();

        zone.rename("New Name");

        assertThat(zone.getName()).isEqualTo("New Name");
    }

    @Test
    void reposition() {
        var zone = createPlantingZone();

        zone.reposition(new Coordinates(1.0, 2.0));

        assertThat(zone.getLat()).isEqualTo(1.0);
        assertThat(zone.getLng()).isEqualTo(2.0);
    }

    @Test
    void markInProgress() {
        var zone = createPlantingZone();

        zone.markInProgress();

        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.in_progress);
    }

    @Test
    void markInProgress_fromNonPlanned() {
        var zone = createPlantingZone();
        zone.markInProgress();

        assertThatThrownBy(zone::markInProgress)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("planned");
    }

    @Test
    void markComplete() {
        var zone = createPlantingZone();
        zone.markInProgress();

        zone.markComplete();

        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.completed);
    }

    @Test
    void markComplete_beforeInProgress() {
        var zone = createPlantingZone();

        assertThatThrownBy(zone::markComplete)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("in-progress");
    }

    @Test
    void markComplete_fromCompleted() {
        var zone = createPlantingZone();
        zone.markInProgress();
        zone.markComplete();

        assertThatThrownBy(zone::markComplete)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("in-progress");
    }

    @Test
    void advanceStatus() {
        var zone = createPlantingZone();

        zone.advanceStatus();
        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.in_progress);

        zone.advanceStatus();
        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.completed);
    }

    @Test
    void advanceStatus_alreadyCompleted() {
        var zone = createPlantingZone();
        zone.advanceStatus();
        zone.advanceStatus();

        assertThatThrownBy(zone::advanceStatus)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("completed");
    }

    @Test
    void updateProgress_completesWhenTargetReached() {
        var zone = createPlantingZone();
        zone.setTargetCount(10);
        zone.markInProgress();

        zone.updateProgress(10);

        assertThat(zone.getStatus()).isEqualTo(ZoneStatus.completed);
        assertThat(zone.getCurrentCount()).isEqualTo(10);
    }

    @Test
    void updateProgress_negative() {
        var zone = createPlantingZone();

        assertThatThrownBy(() -> zone.updateProgress(-1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }

    @Test
    void incrementVolunteers() {
        var zone = createPlantingZone();

        zone.incrementVolunteers();

        assertThat(zone.getVolunteerCount()).isEqualTo(1);
    }

    @Test
    void incrementVolunteers_multiple() {
        var zone = createPlantingZone();

        zone.incrementVolunteers();
        zone.incrementVolunteers();
        zone.incrementVolunteers();

        assertThat(zone.getVolunteerCount()).isEqualTo(3);
    }

    @Test
    void addPhoto() {
        var zone = createPlantingZone();

        zone.addPhoto("https://example.com/photo.jpg");

        assertThat(zone.getPhotosList()).containsExactly("https://example.com/photo.jpg");
    }

    @Test
    void addPhoto_skipsDuplicate() {
        var zone = createPlantingZone();
        zone.addPhoto("https://example.com/photo.jpg");

        zone.addPhoto("https://example.com/photo.jpg");

        assertThat(zone.getPhotosList()).hasSize(1);
    }

    @Test
    void addPhoto_skipsNonHttpUrl() {
        var zone = createPlantingZone();

        zone.addPhoto("ftp://bad.com/photo.jpg");

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void addPhoto_skipsBlank() {
        var zone = createPlantingZone();

        zone.addPhoto("");

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void addPhoto_skipsNull() {
        var zone = createPlantingZone();

        zone.addPhoto(null);

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void addPhoto_multiple() {
        var zone = createPlantingZone();

        zone.addPhoto("https://example.com/a.jpg");
        zone.addPhoto("https://example.com/b.jpg");

        assertThat(zone.getPhotosList()).hasSize(2);
    }

    @Test
    void removePhoto() {
        var zone = createPlantingZone();
        zone.addPhoto("https://example.com/photo.jpg");

        zone.removePhoto("https://example.com/photo.jpg");

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void removePhoto_notFound() {
        var zone = createPlantingZone();

        zone.removePhoto("https://example.com/nonexistent.jpg");

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void getPhotosList_emptyByDefault() {
        var zone = createPlantingZone();

        assertThat(zone.getPhotosList()).isEmpty();
    }

    @Test
    void photosViaCommaSeparated() {
        var zone = createPlantingZone();
        zone.addPhoto("https://example.com/a.jpg");
        zone.addPhoto("https://example.com/b.jpg");

        assertThat(zone.getPhotos()).isEqualTo("https://example.com/a.jpg,https://example.com/b.jpg");
    }
}
