package com.greenalgeria.auth.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.shared.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class AuthControllerTest extends IntegrationTest {

    @Test
    void signUp_returns201() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","password":"password123","name":"Test User"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.name").value("Test User"));
    }

    @Test
    void signUp_returns400_whenEmailMissing() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"password":"password123","name":"Test User"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signUp_returns400_whenPasswordTooShort() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","password":"ab","name":"Test User"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void signUp_returns400_whenDuplicateEmail() throws Exception {
        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"existing@example.com","password":"password123","name":"First"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"existing@example.com","password":"password123","name":"Second"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void getSession_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/get-session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }

    @Test
    void getSession_authenticated() throws Exception {
        var userId = signUpAndGetUserId();

        mockMvc.perform(get("/api/auth/get-session").with(user(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value(userId))
                .andExpect(jsonPath("$.user.name").value("Auth User"));
    }
}
