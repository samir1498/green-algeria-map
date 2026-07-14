package com.greenalgeria.auth.api;

import com.greenalgeria.auth.application.AuthService;
import com.greenalgeria.auth.application.LoginRequest;
import com.greenalgeria.auth.application.SignUpRequest;
import com.greenalgeria.auth.application.SocialAuthService;
import com.greenalgeria.auth.application.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    private final AuthService authService;
    private final SocialAuthService socialAuthService;
    private final AuthenticationManager authenticationManager;

    public AuthController(
            AuthService authService, SocialAuthService socialAuthService, AuthenticationManager authenticationManager) {
        this.authService = authService;
        this.socialAuthService = socialAuthService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/sign-up/email")
    @Operation(summary = "Sign up with email")
    public ResponseEntity<SignUpResponse> signUp(
            @Valid @RequestBody SignUpRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        UserResponse user = authService.signUp(request.email(), request.password(), request.name());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                user.id(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.role().toUpperCase()))));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return ResponseEntity.status(HttpStatus.CREATED).body(new SignUpResponse(user));
    }

    @PostMapping("/send-verification-email")
    @Operation(summary = "Send email verification link")
    public ResponseEntity<?> sendVerificationEmail(@Valid @RequestBody EmailRequest request) {
        authService.sendVerificationEmail(request.email());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with token (API)")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody TokenRequest request) {
        try {
            authService.verifyEmail(request.token());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email with token (redirect)")
    public void verifyEmailRedirect(
            @RequestParam String token, @RequestParam(required = false) String redirect, HttpServletResponse response)
            throws IOException {
        try {
            authService.verifyEmail(token);
            String target = redirect != null ? redirect : "http://localhost:3000/auth/verify-email?verified=true";
            response.sendRedirect(target);
        } catch (IllegalArgumentException e) {
            response.sendRedirect("http://localhost:3000/auth/verify-email?verified=false");
        }
    }

    @PostMapping("/request-password-reset")
    @Operation(summary = "Request password reset link")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody EmailRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.token(), request.password());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/get-session")
    @Operation(summary = "Get current user session")
    public ResponseEntity<?> getSession(Principal principal) {
        if (principal == null) {
            return ResponseEntity.ok(new SessionResponse(null));
        }
        UserResponse user = authService.getSession(principal.getName());
        return ResponseEntity.ok(new SessionResponse(user));
    }

    @PostMapping("/sign-in/social")
    @Operation(summary = "Sign in with social provider")
    public ResponseEntity<?> signInSocial(@Valid @RequestBody SocialSignInRequest request) {
        try {
            String url = socialAuthService.getAuthorizeUrl(request.provider());
            return ResponseEntity.ok(Map.of("url", url, "redirect", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/oauth2/callback/{provider}")
    @Operation(summary = "OAuth2 callback from provider")
    public void oauth2Callback(
            @PathVariable String provider,
            @RequestParam String code,
            @RequestParam(required = false) String state,
            HttpServletResponse response)
            throws IOException {
        try {
            String redirectUrl = socialAuthService.handleCallback(provider, code);
            response.sendRedirect(redirectUrl);
        } catch (Exception e) {
            response.sendRedirect("http://localhost:3000/auth/login?oauth=error");
        }
    }

    @PostMapping("/sign-in/email")
    @Operation(summary = "Sign in with email (JSON)")
    public ResponseEntity<?> signIn(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        var token = UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password());
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(token);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        UserResponse user = authService.getSession(auth.getName());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
        }

        return ResponseEntity.ok(Map.of("user", user));
    }

    private record SignUpResponse(UserResponse user) {}

    private record SessionResponse(UserResponse user) {}

    private record EmailRequest(String email) {}

    private record TokenRequest(String token) {}

    private record ResetPasswordRequest(String token, String password) {}

    private record SocialSignInRequest(String provider) {}
}
