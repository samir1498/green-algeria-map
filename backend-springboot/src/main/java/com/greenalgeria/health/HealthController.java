package com.greenalgeria.health;

import java.sql.Connection;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/healthz")
    public ResponseEntity<Map<String, String>> liveness() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @GetMapping("/readyz")
    public ResponseEntity<Map<String, Object>> readiness() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(2)) {
                return ResponseEntity.ok(Map.of("status", "ok", "checks", Map.of("db", "up")));
            }
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "error", "message", e.getMessage()));
        }
        return ResponseEntity.status(503).body(Map.of("status", "error"));
    }
}
