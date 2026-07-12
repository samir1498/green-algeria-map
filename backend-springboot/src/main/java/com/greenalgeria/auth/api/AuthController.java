package com.greenalgeria.auth.api;

import com.greenalgeria.auth.application.AuthService;
import com.greenalgeria.auth.application.LoginRequest;
import com.greenalgeria.auth.application.SignUpRequest;
import com.greenalgeria.auth.application.UserResponse;
import com.greenalgeria.auth.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager, UserRepository userRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
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
        authService.sendVerificationEmail(
                userRepository.findByEmail(request.email()).orElseThrow(() -> new IllegalArgumentException("User not found")));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with token")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody TokenRequest request) {
        try {
            authService.verifyEmail(request.token());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
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
}
