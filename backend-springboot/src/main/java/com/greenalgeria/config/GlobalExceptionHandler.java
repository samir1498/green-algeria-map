package com.greenalgeria.config;

import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(
            ResponseStatusException ex, HttpServletRequest request) {
        var body = new LinkedHashMap<String, Object>();
        body.put("statusCode", ex.getStatusCode().value());
        body.put(
                "error",
                ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString());
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
                .toList();
        var body = new LinkedHashMap<String, Object>();
        body.put("statusCode", 400);
        body.put("error", "Validation failed");
        body.put("errors", errors);
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("path", request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        var body = new LinkedHashMap<String, Object>();
        body.put("statusCode", 400);
        body.put("error", ex.getMessage());
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("path", request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        var body = new LinkedHashMap<String, Object>();
        body.put("statusCode", 400);
        body.put("error", "Malformed request body");
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("path", request.getRequestURI());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled {} at {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
        var body = new LinkedHashMap<String, Object>();
        body.put("statusCode", 500);
        body.put("error", "An unexpected error occurred");
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("path", request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
