package com.example.BackendServicio.servicios;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.BackendServicio.entidades.Role;
import com.example.BackendServicio.entidades.UserEntity;
import com.example.BackendServicio.excepciones.ConflictException;
import com.example.BackendServicio.excepciones.ForbiddenOperationException;
import com.example.BackendServicio.excepciones.ResourceNotFoundException;
import com.example.BackendServicio.jwt.JwtService;
import com.example.BackendServicio.models.request.LoginRequest;
import com.example.BackendServicio.models.request.RegisterRequest;
import com.example.BackendServicio.models.request.VerifyCodeRequest;
import com.example.BackendServicio.models.request.ResendCodeRequest;
import com.example.BackendServicio.models.response.AuthResponse;
import com.example.BackendServicio.models.response.MessageResponse;
import com.example.BackendServicio.repositorios.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername().trim().toLowerCase(),
                request.getPassword()
            )
        );

        UserDetails user = userRepository.findByUsername(request.getUsername().trim().toLowerCase())
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        String token = jwtService.getToken(user);

        return AuthResponse.builder()
            .token(token)
            .build();
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String username = request.getUsername().trim().toLowerCase();

        var existingUser = userRepository.findByUsername(username);

        if (existingUser.isPresent()) {
            UserEntity user = existingUser.get();

            if (Boolean.TRUE.equals(user.getVerified())) {
                throw new ConflictException("El correo ya está registrado");
            }

            user.setNombre(request.getNombre().trim());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            assignVerificationCode(user);

            userRepository.save(user);
            emailService.sendVerificationCode(user.getUsername(), user.getVerificationCode());

            return MessageResponse.builder()
                .message("Ya existía un registro pendiente. Enviamos un nuevo código a tu correo.")
                .build();
        }

        UserEntity user = UserEntity.builder()
            .nombre(request.getNombre().trim())
            .username(username)
            .password(passwordEncoder.encode(request.getPassword()))
            .role(Role.USER)
            .verified(false)
            .build();

        assignVerificationCode(user);

        userRepository.save(user);
        emailService.sendVerificationCode(user.getUsername(), user.getVerificationCode());

        return MessageResponse.builder()
            .message("Registro iniciado. Revisa tu correo para verificar la cuenta.")
            .build();
    }

    @Transactional
    public AuthResponse verifyCode(VerifyCodeRequest request) {
        String username = request.getUsername().trim().toLowerCase();
        String code = request.getCode().trim();

        UserEntity user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (Boolean.TRUE.equals(user.getVerified())) {
            return AuthResponse.builder()
                .token(jwtService.getToken(user))
                .build();
        }

        if (user.getVerificationCodeExpiresAt() == null ||
            user.getVerificationCodeExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ForbiddenOperationException("El código expiró. Solicita uno nuevo.");
        }

        if (user.getVerificationCode() == null ||
            !user.getVerificationCode().equals(code)) {
            throw new ForbiddenOperationException("Código de verificación inválido");
        }

        user.setVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiresAt(null);

        userRepository.save(user);

        return AuthResponse.builder()
            .token(jwtService.getToken(user))
            .build();
    }

    @Transactional
    public MessageResponse resendVerificationCode(ResendCodeRequest request) {
        String username = request.getUsername().trim().toLowerCase();

        UserEntity user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        if (Boolean.TRUE.equals(user.getVerified())) {
            throw new ConflictException("La cuenta ya está verificada. Inicia sesión.");
        }

        assignVerificationCode(user);

        userRepository.save(user);
        emailService.sendVerificationCode(user.getUsername(), user.getVerificationCode());

        return MessageResponse.builder()
            .message("Se envió un nuevo código de verificación a tu correo.")
            .build();
    }

    private void assignVerificationCode(UserEntity user) {
        user.setVerificationCode(generateVerificationCode());
        user.setVerificationCodeExpiresAt(LocalDateTime.now().plusMinutes(10));
        user.setVerified(false);
    }

    private String generateVerificationCode() {
        int number = secureRandom.nextInt(1_000_000);
        return String.format("%06d", number);
    }
}