package com.greenalgeria.email.application;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/** Sends transactional emails via the Brevo v3 SMTP API. */
@Service
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            @Value("${brevo.api-key:}") String apiKey,
            @Value("${brevo.from-email:noreply@greenalgeria.org}") String fromEmail,
            @Value("${brevo.from-name:Green Algeria Map}") String fromName) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
    }

    public void send(String to, String subject, String html) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("brevo.api-key is not configured");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);
        headers.set("accept", "application/json");

        Map<String, Object> body =
                Map.of(
                        "sender", Map.of("name", fromName, "email", fromEmail),
                        "to", new Object[] {Map.of("email", to)},
                        "subject", subject,
                        "html", html);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", request, String.class);
    }
}
