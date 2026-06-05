package com.greenalgeria.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@ConditionalOnProperty(name = "app.rate-limit.enabled", havingValue = "true")
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        var annotation = handlerMethod.getMethodAnnotation(RateLimit.class);
        Bandwidth limit;
        String key;

        if (annotation != null) {
            limit = Bandwidth.builder()
                    .capacity(annotation.capacity())
                    .refillGreedy(annotation.refill(), Duration.ofNanos(annotation.unit().toNanos(annotation.period())))
                    .build();
            key = request.getRemoteAddr();
        } else {
            var path = request.getRequestURI();
            var method = request.getMethod();
            if (path.contains("/api/auth/sign-in") || path.contains("/api/auth/sign-up")) {
                limit = Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build();
            } else if (method.equals("POST") || method.equals("PATCH") || method.equals("DELETE")) {
                limit = Bandwidth.builder().capacity(30).refillGreedy(30, Duration.ofMinutes(1)).build();
            } else if (method.equals("GET")) {
                limit = Bandwidth.builder().capacity(100).refillGreedy(100, Duration.ofMinutes(1)).build();
            } else {
                return true;
            }
            key = request.getRemoteAddr();
        }

        var bucket = buckets.computeIfAbsent(key + ":" + request.getRequestURI(), k -> Bucket.builder().addLimit(limit).build());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            return true;
        }

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(429);
        response.getWriter().write("{\"error\":\"Too Many Requests\"}");
        return false;
    }
}
