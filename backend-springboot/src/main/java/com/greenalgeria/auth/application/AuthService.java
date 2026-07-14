package com.greenalgeria.auth.application;

import com.greenalgeria.auth.domain.Account;
import com.greenalgeria.auth.domain.AccountRepository;
import com.greenalgeria.auth.domain.AuthToken;
import com.greenalgeria.auth.domain.AuthTokenRepository;
import com.greenalgeria.auth.domain.User;
import com.greenalgeria.auth.domain.UserRepository;
import com.greenalgeria.email.application.EmailService;
import com.greenalgeria.email.application.EmailTemplate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AuthTokenRepository authTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private final String clientUrl;
    private final String baseUrl;
    private final long tokenTtlMinutes;

    public AuthService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            AuthTokenRepository authTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.client-url:http://localhost:3000}") String clientUrl,
            @Value("${server.base-url:http://localhost:8081}") String baseUrl,
            @Value("${app.token-ttl-minutes:60}") long tokenTtlMinutes) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.authTokenRepository = authTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.clientUrl = clientUrl;
        this.baseUrl = baseUrl;
        this.tokenTtlMinutes = tokenTtlMinutes;
    }

    public UserResponse signUp(String email, String password, String name) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String userId = UUID.randomUUID().toString();
        User user = new User(userId, name, email);
        user = userRepository.save(user);

        Account account = new Account(UUID.randomUUID().toString(), userId, email, passwordEncoder.encode(password));
        accountRepository.save(account);

        try {
            sendVerificationEmail(user);
        } catch (Exception e) {
            log.warn("Failed to send verification email for user {}: {}", user.getEmail(), e.getMessage());
        }

        return UserResponse.from(user);
    }

    public void sendVerificationEmail(User user) {
        String token = UUID.randomUUID().toString();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(tokenTtlMinutes);
        authTokenRepository.save(new AuthToken(
                UUID.randomUUID().toString(), user.getId(), AuthToken.Type.EMAIL_VERIFICATION, token, expiresAt));

        String url = baseUrl + "/api/auth/verify-email?token=" + token + "&redirect=" + clientUrl
                + "/auth/verify-email?verified=true";
        emailService.send(
                user.getEmail(),
                "Verify your email — Green Algeria Map",
                EmailTemplate.verification(user.getName(), url));
    }

    public void sendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found"));
        sendVerificationEmail(user);
    }

    public void verifyEmail(String token) {
        AuthToken authToken = authTokenRepository
                .findByTokenAndType(token, AuthToken.Type.EMAIL_VERIFICATION)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));
        if (authToken.isExpired()) {
            authTokenRepository.delete(authToken);
            throw new IllegalArgumentException("Invalid or expired verification token");
        }
        User user = userRepository.findById(authToken.getUserId()).orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);
        authTokenRepository.delete(authToken);
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }
        String token = UUID.randomUUID().toString();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(tokenTtlMinutes);
        authTokenRepository.save(new AuthToken(
                UUID.randomUUID().toString(), user.getId(), AuthToken.Type.PASSWORD_RESET, token, expiresAt));

        String url = clientUrl + "/auth/reset-password?token=" + token;
        emailService.send(
                user.getEmail(),
                "Reset your password — Green Algeria Map",
                EmailTemplate.passwordReset(user.getName(), url));
    }

    public void resetPassword(String token, String newPassword) {
        AuthToken authToken = authTokenRepository
                .findByTokenAndType(token, AuthToken.Type.PASSWORD_RESET)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        if (authToken.isExpired()) {
            authTokenRepository.delete(authToken);
            throw new IllegalArgumentException("Invalid or expired reset token");
        }
        User user = userRepository.findById(authToken.getUserId()).orElseThrow();
        Account account = accountRepository
                .findByUserIdAndProviderId(user.getId(), "email")
                .orElseThrow();
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        authTokenRepository.delete(authToken);
    }

    public UserResponse getSession(String userId) {
        return userRepository.findById(userId).map(UserResponse::from).orElse(null);
    }
}
