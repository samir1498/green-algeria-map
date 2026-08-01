package com.greenalgeria.config;

import com.greenalgeria.shared.exception.DomainError;
import com.greenalgeria.shared.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private Map<String, Object> buildError(HttpStatus status, String error, String message, String category,
                                           HttpServletRequest request) {
        return Map.of(
                "statusCode", status.value(),
                "error", error,
                "message", message,
                "category", category,
                "timestamp", Instant.now().toString(),
                "path", request.getRequestURI());
    }

    private String categoryForStatus(int status) {
        if (status >= 500) return "server";
        if (status >= 400) return "validation";
        return "unknown";
    }

    private HttpServletRequest resolveRequest(WebRequest request) {
        if (request instanceof org.springframework.web.context.request.NativeWebRequest nativeWebRequest) {
            return nativeWebRequest.getNativeRequest(HttpServletRequest.class);
        }
        return null;
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        HttpServletRequest servletRequest = resolveRequest(request);
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"))
                .toList();
        Map<String, Object> body = new java.util.HashMap<>(
                buildError(HttpStatus.BAD_REQUEST, "ValidationException", "Validation failed", "validation",
                        servletRequest));
        body.put("errors", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        HttpServletRequest servletRequest = resolveRequest(request);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, "ParseException", "Malformed request body", "validation",
                        servletRequest));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(NotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildError(HttpStatus.NOT_FOUND, "NotFoundException", ex.getMessage(), "validation", request));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Object> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return ResponseEntity.status(status)
                .body(buildError(status, ex.getClass().getSimpleName(), message, categoryForStatus(status.value()),
                        request));
    }

    @ExceptionHandler(DomainError.class)
    public ResponseEntity<Object> handleDomainError(DomainError ex, HttpServletRequest request) {
        HttpStatus status = "validation".equals(ex.getCategory()) ? HttpStatus.BAD_REQUEST
                : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status)
                .body(buildError(status, ex.getClass().getSimpleName(), ex.getMessage(), ex.getCategory(), request));
    }

    @ExceptionHandler({IllegalStateException.class, IllegalArgumentException.class})
    public ResponseEntity<Object> handleBadRequest(RuntimeException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, ex.getClass().getSimpleName(), ex.getMessage(), "validation",
                        request));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled {} at {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, "InternalServerError",
                        "An unexpected error occurred", "server", request));
    }
}
