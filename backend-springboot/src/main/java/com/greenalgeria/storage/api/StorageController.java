package com.greenalgeria.storage.api;

import com.greenalgeria.shared.cqrs.CommandBus;
import com.greenalgeria.storage.domain.StorageService;
import com.greenalgeria.zone.application.command.AddPhotoToZoneCommand;
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

    private final StorageService storageService;
    private final CommandBus commandBus;

    public StorageController(StorageService storageService, CommandBus commandBus) {
        this.storageService = storageService;
        this.commandBus = commandBus;
    }

    @PostMapping("/zones/{id}/photo")
    public ResponseEntity<Map<String, String>> uploadZonePhoto(
            @PathVariable UUID id, @RequestParam("file") MultipartFile file) throws Exception {
        var result = storageService.uploadFile(file.getBytes(), file.getOriginalFilename(), file.getContentType());
        commandBus.execute(new AddPhotoToZoneCommand(id, result.url()));
        return ResponseEntity.ok(Map.of("photoUrl", result.url()));
    }
}
