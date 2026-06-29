package tn.tunisietelecom.activitessociales.activitytype.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.activitytype.dto.ActivityTypeRequest;
import tn.tunisietelecom.activitessociales.activitytype.dto.ActivityTypeResponse;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;
import tn.tunisietelecom.activitessociales.activitytype.repository.ActivityTypeRepository;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ActivityTypeService {

    private static final Set<String> SUPPORTED_FIELD_TYPES =
            Set.of("text", "number", "date", "select", "checkbox", "textarea", "radio");
    private static final Pattern FIELD_KEY_PATTERN = Pattern.compile("^[a-z][a-z0-9_]*$");
    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]*$");

    private final ActivityTypeRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ActivityTypeResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ActivityTypeResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    @Transactional
    public ActivityTypeResponse create(ActivityTypeRequest request) {
        normalize(request);
        validateSchema(request.getCustomFieldsSchema());
        if (repository.existsByCodeIgnoreCase(request.getCode())) {
            throw new BadRequestException("Un type d'activite avec ce code existe deja.");
        }

        ActivityType activityType = ActivityType.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase(Locale.ROOT))
                .description(trimToNull(request.getDescription()))
                .icon(trimToNull(request.getIcon()))
                .active(request.isActive())
                .customFieldsSchema(writeSchema(request.getCustomFieldsSchema()))
                .build();

        return toResponse(repository.save(activityType));
    }

    @Transactional
    public ActivityTypeResponse update(Long id, ActivityTypeRequest request) {
        normalize(request);
        validateSchema(request.getCustomFieldsSchema());
        if (repository.existsByCodeIgnoreCaseAndIdNot(request.getCode(), id)) {
            throw new BadRequestException("Un type d'activite avec ce code existe deja.");
        }

        ActivityType activityType = getEntity(id);
        activityType.setName(request.getName().trim());
        activityType.setCode(request.getCode().trim().toUpperCase(Locale.ROOT));
        activityType.setDescription(trimToNull(request.getDescription()));
        activityType.setIcon(trimToNull(request.getIcon()));
        activityType.setActive(request.isActive());
        activityType.setCustomFieldsSchema(writeSchema(request.getCustomFieldsSchema()));

        return toResponse(repository.save(activityType));
    }

    @Transactional
    public ActivityTypeResponse updateStatus(Long id, boolean active) {
        ActivityType activityType = getEntity(id);
        activityType.setActive(active);
        return toResponse(repository.save(activityType));
    }

    @Transactional
    public void delete(Long id) {
        ActivityType activityType = getEntity(id);
        repository.delete(activityType);
    }

    private ActivityType getEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type d'activite introuvable."));
    }

    private void normalize(ActivityTypeRequest request) {
        if (request.getCode() != null) {
            request.setCode(request.getCode().trim().toUpperCase(Locale.ROOT));
        }
    }

    private void validateSchema(Map<String, ActivityTypeRequest.FieldSchema> schema) {
        if (schema == null || schema.isEmpty()) {
            throw new BadRequestException("Le schema doit contenir au moins un champ.");
        }

        schema.forEach((key, field) -> {
            if (key == null || !FIELD_KEY_PATTERN.matcher(key).matches()) {
                throw new BadRequestException("Cle de champ invalide: " + key + ". Utilisez snake_case.");
            }
            if (field == null) {
                throw new BadRequestException("Configuration manquante pour le champ: " + key);
            }
            if (field.getLabel() == null || field.getLabel().trim().isEmpty()) {
                throw new BadRequestException("Libelle obligatoire pour le champ: " + key);
            }
            if (field.getType() == null || !SUPPORTED_FIELD_TYPES.contains(field.getType())) {
                throw new BadRequestException("Type de champ non supporte pour " + key + ": " + field.getType());
            }
            if (("select".equals(field.getType()) || "radio".equals(field.getType()))
                    && (field.getOptions() == null || field.getOptions().isEmpty())) {
                throw new BadRequestException("Les champs select/radio doivent contenir des options: " + key);
            }
        });
    }

    public void validateCode(String code) {
        if (code == null || !CODE_PATTERN.matcher(code).matches()) {
            throw new BadRequestException("Le code doit etre en majuscules et peut contenir lettres, chiffres et underscores.");
        }
    }

    private String writeSchema(Map<String, ActivityTypeRequest.FieldSchema> schema) {
        try {
            return objectMapper.writeValueAsString(schema);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Schema JSON invalide.");
        }
    }

    private Map<String, ActivityTypeRequest.FieldSchema> readSchema(String schema) {
        try {
            return objectMapper.readValue(schema, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Schema JSON enregistre invalide.");
        }
    }

    private ActivityTypeResponse toResponse(ActivityType activityType) {
        return ActivityTypeResponse.builder()
                .id(activityType.getId())
                .name(activityType.getName())
                .code(activityType.getCode())
                .description(activityType.getDescription())
                .icon(activityType.getIcon())
                .active(activityType.isActive())
                .customFieldsSchema(readSchema(activityType.getCustomFieldsSchema()))
                .createdAt(activityType.getCreatedAt())
                .updatedAt(activityType.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
