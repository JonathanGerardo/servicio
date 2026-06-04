package com.example.BackendServicio.controllers;

import com.example.BackendServicio.models.request.LoginRequest;
import com.example.BackendServicio.models.request.RegisterRequest;
import com.example.BackendServicio.models.request.ResendCodeRequest;
import com.example.BackendServicio.models.request.VerifyCodeRequest;
import com.example.BackendServicio.models.response.AuthResponse;
import com.example.BackendServicio.models.response.MessageResponse;
import com.example.BackendServicio.servicios.AuthService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/access")
@RequiredArgsConstructor
public class AccessController {

    private final AuthService authService;
    
    @PostMapping(value = "login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping(value = "register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping(value = "verify")
    public ResponseEntity<AuthResponse> verify(@Valid @RequestBody VerifyCodeRequest request) {
        return ResponseEntity.ok(authService.verifyCode(request));
    }

    @PostMapping(value = "resend-code")
    public ResponseEntity<MessageResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return ResponseEntity.ok(authService.resendVerificationCode(request));
    }
}