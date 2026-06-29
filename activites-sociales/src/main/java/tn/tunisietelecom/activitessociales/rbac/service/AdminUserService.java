package tn.tunisietelecom.activitessociales.rbac.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;
import tn.tunisietelecom.activitessociales.rbac.dto.*;
import tn.tunisietelecom.activitessociales.rbac.entity.*;
import tn.tunisietelecom.activitessociales.rbac.repository.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final CustomRoleRepository roleRepository;
    private final UserCustomRoleRepository userRoleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> list(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            users = userRepository.findAll(pageable);
            List<User> filtered = users.stream()
                    .filter(u -> u.getEmail().toLowerCase().contains(q)
                            || u.getNom().toLowerCase().contains(q)
                            || u.getPrenom().toLowerCase().contains(q)
                            || u.getMatricule().toLowerCase().contains(q))
                    .collect(Collectors.toList());
            users = new PageImpl<>(filtered, pageable, filtered.size());
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getById(Long id) {
        return toResponse(findUser(id));
    }

    @Transactional
    public AdminUserResponse create(AdminCreateUserRequest req) {
        if (userRepository.existsByEmail(req.getEmail()))
            throw new BadRequestException("Un compte avec cet email existe déjà.");
        if (userRepository.existsByMatricule(req.getMatricule()))
            throw new BadRequestException("Ce matricule est déjà utilisé.");

        User user = User.builder()
                .matricule(req.getMatricule())
                .nom(req.getNom())
                .prenom(req.getPrenom())
                .email(req.getEmail())
                .telephone(req.getTelephone())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .isActive(true) // admin-created accounts are active immediately
                .build();
        user = userRepository.save(user);

        if (req.getCustomRoleIds() != null) {
            assignRoles(user, req.getCustomRoleIds());
        }

        if (req.isSendActivationEmail()) {
            emailService.sendAdminCreatedAccountEmail(
                    user.getEmail(), user.getFullName(), req.getPassword());
        }

        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse update(Long id, AdminUpdateUserRequest req) {
        User user = findUser(id);
        user.setNom(req.getNom());
        user.setPrenom(req.getPrenom());
        user.setTelephone(req.getTelephone());
        user.setRole(req.getRole());
        user.setActive(req.isActive());
        userRepository.save(user);

        // Re-assign custom roles
        userRoleRepository.deleteAll(userRoleRepository.findByUserId(id));
        if (req.getCustomRoleIds() != null) {
            assignRoles(user, req.getCustomRoleIds());
        }

        return toResponse(user);
    }

    @Transactional
    public void toggleActive(Long id, boolean active) {
        User user = findUser(id);
        user.setActive(active);
        userRepository.save(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = findUser(id);
        userRoleRepository.deleteAll(userRoleRepository.findByUserId(id));
        userRepository.delete(user);
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private void assignRoles(User user, Set<Long> roleIds) {
        for (Long roleId : roleIds) {
            CustomRole role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Rôle introuvable: " + roleId));
            if (!userRoleRepository.existsByUserIdAndRoleId(user.getId(), roleId)) {
                userRoleRepository.save(UserCustomRole.builder().user(user).role(role).build());
            }
        }
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
    }

    public AdminUserResponse toResponse(User user) {
        List<UserCustomRole> assignments = userRoleRepository.findByUserIdWithPermissions(user.getId());
        Set<CustomRoleResponse> roles = assignments.stream()
                .map(a -> toRoleResponse(a.getRole()))
                .collect(Collectors.toSet());
        Set<String> allPerms = roles.stream()
                .flatMap(r -> r.getPermissions().stream().map(PermissionDto::getCode))
                .collect(Collectors.toSet());

        return AdminUserResponse.builder()
                .id(user.getId())
                .matricule(user.getMatricule())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .active(user.isActive())
                .photoUrl(user.getPhotoUrl())
                .customRoles(roles)
                .allPermissions(allPerms)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private CustomRoleResponse toRoleResponse(CustomRole r) {
        Set<PermissionDto> perms = r.getPermissions().stream()
                .map(p -> PermissionDto.builder()
                        .id(p.getId()).code(p.getCode()).label(p.getLabel())
                        .description(p.getDescription()).category(p.getCategory()).build())
                .collect(Collectors.toSet());
        return CustomRoleResponse.builder()
                .id(r.getId()).name(r.getName()).description(r.getDescription())
                .color(r.getColor()).active(r.isActive()).permissions(perms)
                .createdAt(r.getCreatedAt()).updatedAt(r.getUpdatedAt()).build();
    }
}