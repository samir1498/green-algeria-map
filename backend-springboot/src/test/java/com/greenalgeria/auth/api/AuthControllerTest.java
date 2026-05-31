package com.greenalgeria.auth.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.auth.application.AuthService;
import com.greenalgeria.auth.application.UserResponse;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@Tag("unit")
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AuthService authService;

    @Test
    void signUp_returns200() throws Exception {
        var response =
                new UserResponse("user-1", "Test User", "test@example.com", false, null, "volunteer", null, null);
        when(authService.signUp(any(), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"test@example.com","password":"password123","name":"Test User"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value("user-1"))
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
        when(authService.signUp(any(), any(), any()))
                .thenThrow(new IllegalArgumentException("Email already registered"));

        mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"existing@example.com","password":"password123","name":"Test User"}
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
        var response =
                new UserResponse("user-1", "Test User", "test@example.com", false, null, "volunteer", null, null);
        when(authService.getSession("user-1")).thenReturn(response);

        mockMvc.perform(get("/api/auth/get-session").with(request -> {
                    request.setUserPrincipal(() -> "user-1");
                    return request;
                }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.id").value("user-1"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));
    }

    @Test
    void getSession_authenticated_userNotFound() throws Exception {
        when(authService.getSession("nonexistent")).thenReturn(null);

        mockMvc.perform(get("/api/auth/get-session").with(request -> {
                    request.setUserPrincipal(() -> "nonexistent");
                    return request;
                }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist());
    }
}
