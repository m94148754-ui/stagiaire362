package com.internship.management.controller;

import com.internship.management.dto.ApiResponse;
import com.internship.management.dto.MessageCode;
import com.internship.management.dto.UserDTO;
import com.internship.management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUserProfile(Authentication authentication) {
        try {
            String email = authentication.getName();
            UserDTO user = userService.getUserByEmail(email);
            return ResponseEntity.ok(ApiResponse.success(MessageCode.USER_FOUND.name(), user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            Authentication authentication,
            @RequestBody UserDTO updateRequest) {
        try {
            String email = authentication.getName();
            UserDTO updatedUser = userService.updateUserProfile(email, updateRequest);
            return ResponseEntity.ok(ApiResponse.success(MessageCode.USER_UPDATED.name(), updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        try {
            String email = authentication.getName();
            String avatarPath = userService.uploadAvatar(email, file);
            return ResponseEntity.ok(ApiResponse.success(MessageCode.AVATAR_UPLOADED.name(), avatarPath));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
