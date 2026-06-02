package com.greenalgeria.storage.api;

import com.greenalgeria.storage.application.UploadZonePhotoCommand;
import com.greenalgeria.storage.application.UploadZonePhotoHandler;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/storage")
public class StorageController {

    private final UploadZonePhotoHandler uploadZonePhotoHandler;

    public StorageController(UploadZonePhotoHandler uploadZonePhotoHandler) {
        this.uploadZonePhotoHandler = uploadZonePhotoHandler;
    }

    @PostMapping("/zones/{id}/photo")
    public ResponseEntity<Map<String, String>> uploadZonePhoto(
            @PathVariable UUID id, @RequestParam("file") MultipartFile file) throws IOException {
        var photoUrl = uploadZonePhotoHandler.handle(
                new UploadZonePhotoCommand(id, file.getBytes(), file.getOriginalFilename(), file.getContentType()));
        return ResponseEntity.ok(Map.of("photoUrl", photoUrl));
    }
}
