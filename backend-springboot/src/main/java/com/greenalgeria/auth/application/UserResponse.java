package com.greenalgeria.auth.application;

import com.greenalgeria.auth.domain.User;
import java.time.OffsetDateTime;

public record UserResponse(
        String id,
        String name,
        String email,
        Boolean emailVerified,
        String image,
        String role,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getEmailVerified(),
                user.getImage(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
