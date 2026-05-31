package com.greenalgeria.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.shared.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class AuthFlowTest extends IntegrationTest {

    @Test
    void signUpAndGetSession() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","password":"password123","name":"Test User"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.name").value("Test User"));
    }

    @Test
    void getSessionWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/auth/get-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }

    @Test
    void rejectsDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"dupe@example.com","password":"password123","name":"First"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"dupe@example.com","password":"password123","name":"Second"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void rejectsInvalidSignUp() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"bad","password":"ab","name":""}
                                """))
                .andExpect(status().isBadRequest());
    }
}
