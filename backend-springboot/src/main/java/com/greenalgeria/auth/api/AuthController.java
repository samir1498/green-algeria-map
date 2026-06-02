package com.greenalgeria.auth.api;

import com.greenalgeria.auth.application.AuthService;
import com.greenalgeria.auth.application.SignUpRequest;
import com.greenalgeria.auth.application.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    private record SignUpResponse(UserResponse user) {}

    private record SessionResponse(UserResponse user) {}
}
