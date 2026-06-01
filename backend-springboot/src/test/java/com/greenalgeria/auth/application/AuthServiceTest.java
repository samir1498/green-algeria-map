package com.greenalgeria.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.greenalgeria.shared.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class AuthServiceTest extends IntegrationTest {

    @Autowired
    AuthService authService;

    @Test
    void signUp_success() {
        var result = authService.signUp("test@example.com", "password123", "Test User");

        assertThat(result.email()).isEqualTo("test@example.com");
        assertThat(result.name()).isEqualTo("Test User");
        assertThat(result.role()).isEqualTo("volunteer");
    }

    @Test
    void signUp_emailAlreadyExists() {
        authService.signUp("existing@example.com", "password123", "Test User");

        assertThatThrownBy(() -> authService.signUp("existing@example.com", "password123", "Test User"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void getSession_found() {
        var user = authService.signUp("session@example.com", "password123", "Session User");

        var result = authService.getSession(user.id());

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(user.id());
        assertThat(result.name()).isEqualTo("Session User");
        assertThat(result.email()).isEqualTo("session@example.com");
    }

    @Test
    void getSession_notFound() {
        var result = authService.getSession("nonexistent");

        assertThat(result).isNull();
    }
}
