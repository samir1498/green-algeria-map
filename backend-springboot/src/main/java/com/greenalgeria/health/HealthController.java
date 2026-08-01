package com.greenalgeria.health;

import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/api/live")
    public Map<String, Object> live() {
        return Map.of("status", "ok", "timestamp", Instant.now().toString());
    }

    @GetMapping("/api/ready")
    public Map<String, Object> ready() {
        return Map.of("status", "ok", "timestamp", Instant.now().toString());
    }
}
