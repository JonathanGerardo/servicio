package com.example.BackendServicio.excepciones;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}