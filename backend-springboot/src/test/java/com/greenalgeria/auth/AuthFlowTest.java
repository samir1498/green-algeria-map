package com.greenalgeria.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.greenalgeria.email.application.EmailService;
import com.greenalgeria.shared.IntegrationTest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class AuthFlowTest extends IntegrationTest {

    // Mocked so no real Brevo call is made (the real bean throws when the API
    // key is blank) and so we can capture the generated email body to extract
    // the verification / reset token, mirroring the black-box flow the NestJS
    // and Go integration tests exercise.
    @MockitoBean
    EmailService emailService;

    private static final Pattern TOKEN = Pattern.compile("token=([0-9a-fA-F-]{36})");

    private String signUp(String email) throws Exception {
        return mockMvc.perform(post("/api/auth/sign-up/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","name":"Flow User"}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }

    private String captureToken(String subjectFragment) {
        ArgumentCaptor<String> html = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(anyString(), contains(subjectFragment), html.capture());
        Matcher m = TOKEN.matcher(html.getValue());
        assertThat(m.find()).as("token should be present in email body").isTrue();
        return m.group(1);
    }

    @Test
    void emailVerification_marksUserVerifiedAndAllowsSignIn() throws Exception {
        String email = "verify-flow@example.com";
        signUp(email);

        // Signup triggers the verification email; capture its token.
        String token = captureToken("Verify your email");

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // The verified account can still sign in.
        mockMvc.perform(post("/api/auth/sign-in/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void verifyEmail_rejectsInvalidToken() throws Exception {
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"not-a-real-token"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendVerificationEmail_resendsLink() throws Exception {
        String email = "resend-flow@example.com";
        signUp(email);
        clearInvocations(emailService);

        mockMvc.perform(post("/api/auth/send-verification-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // A fresh verification email was dispatched.
        verify(emailService).send(eq(email), contains("Verify your email"), anyString());
    }

    @Test
    void passwordReset_updatesPasswordEndToEnd() throws Exception {
        String email = "reset-flow@example.com";
        signUp(email);
        clearInvocations(emailService);

        mockMvc.perform(post("/api/auth/request-password-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk());

        String token = captureToken("Reset your password");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","password":"brandNewPass456"}
                                """.formatted(token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // New password works.
        mockMvc.perform(post("/api/auth/sign-in/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"brandNewPass456"}
                                """.formatted(email)))
                .andExpect(status().isOk());

        // Old password no longer works.
        mockMvc.perform(post("/api/auth/sign-in/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void resetPassword_rejectsInvalidToken() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"not-a-real-token","password":"whatever123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void requestPasswordReset_unknownEmail_returnsOkWithoutSendingEmail() throws Exception {
        mockMvc.perform(post("/api/auth/request-password-reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com"}
                                """))
                .andExpect(status().isOk());

        verify(emailService, never()).send(anyString(), anyString(), anyString());
    }

    @Test
    void socialSignIn_google_returnsAuthorizeUrl() throws Exception {
        mockMvc.perform(post("/api/auth/sign-in/social")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"provider":"google"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirect").value(true))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("accounts.google.com")));
    }

    @Test
    void socialSignIn_github_returnsAuthorizeUrl() throws Exception {
        mockMvc.perform(post("/api/auth/sign-in/social")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"provider":"github"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirect").value(true))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("github.com")));
    }

    @Test
    void socialSignIn_rejectsUnsupportedProvider() throws Exception {
        mockMvc.perform(post("/api/auth/sign-in/social")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"provider":"twitter"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
