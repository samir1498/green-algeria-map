package com.greenalgeria.auth.domain;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

/** Stores time-limited tokens for email verification and password reset. */
@Entity
@Table(name = "auth_tokens")
public class AuthToken {

    public enum Type {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private String token;

    @Column(nullable = false)
    private OffsetDateTime expiresAt;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    protected AuthToken() {}

    public AuthToken(String id, String userId, Type type, String token, OffsetDateTime expiresAt) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public Type getType() {
        return type;
    }

    public String getToken() {
        return token;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(OffsetDateTime.now());
    }
}
