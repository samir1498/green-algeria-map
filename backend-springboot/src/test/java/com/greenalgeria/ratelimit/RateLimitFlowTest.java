package com.greenalgeria.ratelimit;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.shared.IntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@TestPropertySource(properties = "app.rate-limit.enabled=true")
class RateLimitFlowTest extends IntegrationTest {

    @Test
    void signUp_enforcesRateLimit() throws Exception {
        for (int i = 0; i < 5; i++) {
            var email = "ratelimit-" + UUID.randomUUID() + "@test.com";
            mockMvc.perform(post("/api/auth/sign-up/email")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"%s","password":"password123","name":"User %d"}
                                    """.formatted(email, i)))
                    .andExpect(status().isCreated());
        }

        var email = "ratelimit-exceeded-" + UUID.randomUUID() + "@test.com";
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","name":"Exceeded"}
                                """.formatted(email)))
                .andExpect(status().is(429));
    }
}
