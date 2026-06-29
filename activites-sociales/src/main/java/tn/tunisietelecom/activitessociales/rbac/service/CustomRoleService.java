package tn.tunisietelecom.activitessociales.rbac.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;
import tn.tunisietelecom.activitessociales.rbac.dto.*;
import tn.tunisietelecom.activitessociales.rbac.entity.*;
import tn.tunisietelecom.activitessociales.rbac.repository.*;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomRoleService {

    private final CustomRoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public List<CustomRoleResponse> findAll() {
        return roleRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomRoleResponse findById(Long id) {
        return toResponse(get(id));
    }

    @Transactional(readOnly = true)
    public List<PermissionDto> allPermissions() {
        return permissionRepository.findAll().stream()
                .map(p -> PermissionDto.builder()
                        .id(p.getId()).code(p.getCode()).label(p.getLabel())
                        .description(p.getDescription()).category(p.getCategory()).build())
                .sorted(Comparator.comparing(PermissionDto::getCategory).thenComparing(PermissionDto::getLabel))
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomRoleResponse create(CustomRoleRequest req) {
        if (roleRepository.existsByNameIgnoreCase(req.getName()))
            throw new BadRequestException("Un rôle avec ce nom existe déjà.");

        Set<Permission> perms = resolvePermissions(req.getPermissionIds());
        CustomRole role = CustomRole.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .active(req.isActive())
                .permissions(perms)
                .build();
        return toResponse(roleRepository.save(role));
    }

    @Transactional
    public CustomRoleResponse update(Long id, CustomRoleRequest req) {
        if (roleRepository.existsByNameIgnoreCaseAndIdNot(req.getName(), id))
            throw new BadRequestException("Un rôle avec ce nom existe déjà.");

        CustomRole role = get(id);
        role.setName(req.getName().trim());
        role.setDescription(req.getDescription());
        role.setColor(req.getColor() != null ? req.getColor() : role.getColor());
        role.setActive(req.isActive());
        role.setPermissions(resolvePermissions(req.getPermissionIds()));
        return toResponse(roleRepository.save(role));
    }

    @Transactional
    public void delete(Long id) {
        roleRepository.delete(get(id));
    }

    private Set<Permission> resolvePermissions(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) return new HashSet<>();
        return new HashSet<>(permissionRepository.findAllById(ids));
    }

    private CustomRole get(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rôle introuvable."));
    }

    public CustomRoleResponse toResponse(CustomRole r) {
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