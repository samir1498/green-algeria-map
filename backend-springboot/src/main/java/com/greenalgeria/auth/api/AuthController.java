package com.greenalgeria.auth.api;

import com.greenalgeria.auth.application.AuthService;
import com.greenalgeria.auth.application.LoginRequest;
import com.greenalgeria.auth.application.SignUpRequest;
import com.greenalgeria.auth.application.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/sign-up/email")
    @Operation(summary = "Sign up with email")
    public ResponseEntity<SignUpResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        UserResponse user = authService.signUp(request.email(), request.password(), request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(new SignUpResponse(user));
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
    public ResponseEntity<?> signIn(@Valid @RequestBody LoginRequest request) {
        var token = UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password());
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(token);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        SecurityContextHolder.getContext().setAuthentication(auth);

        var principal = (org.springframework.security.core.userdetails.User) auth.getPrincipal();
        UserResponse user = authService.getSession(principal.getUsername());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
        }

        return ResponseEntity.ok(Map.of("user", user));
    }

    private record SignUpResponse(UserResponse user) {}

    private record SessionResponse(UserResponse user) {}
}
