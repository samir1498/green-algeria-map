package com.greenalgeria.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.greenalgeria.auth.domain.AccountRepository;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@Tag("unit")
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    AccountRepository accountRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    AuthService authService;

    @Test
    void signUp_success() {
        var email = "test@example.com";
        var password = "password123";
        var name = "Test User";

        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn("encoded-hash");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(accountRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = authService.signUp(email, password, name);

        assertThat(result.email()).isEqualTo(email);
        assertThat(result.name()).isEqualTo(name);
        assertThat(result.role()).isEqualTo("volunteer");
        verify(userRepository).save(any());
        verify(accountRepository).save(any());
    }

    @Test
    void signUp_emailAlreadyExists() {
        var email = "existing@example.com";

        when(userRepository.existsByEmail(email)).thenReturn(true);

        assertThatThrownBy(() -> authService.signUp(email, "password123", "Test User"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void getSession_found() {
        var userId = "user-1";
        var user = new User(userId, "Test User", "test@example.com");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var result = authService.getSession(userId);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(userId);
        assertThat(result.name()).isEqualTo("Test User");
        assertThat(result.email()).isEqualTo("test@example.com");
    }

    @Test
    void getSession_notFound() {
        var userId = "nonexistent";

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        var result = authService.getSession(userId);

        assertThat(result).isNull();
    }
}
