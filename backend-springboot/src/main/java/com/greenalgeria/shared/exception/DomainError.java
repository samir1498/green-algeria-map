package com.greenalgeria.shared.exception;

public abstract class DomainError extends RuntimeException {

    private final String category;

    protected DomainError(String message, String category) {
        super(message);
        this.category = category;
    }

    public String getCategory() {
        return category;
    }
}
