package tn.tunisietelecom.activitessociales.activity.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.activity.dto.*;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.activity.repository.ActivityRepository;
import tn.tunisietelecom.activitessociales.activitytype.dto.*;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;
import tn.tunisietelecom.activitessociales.activitytype.repository.ActivityTypeRepository;
import tn.tunisietelecom.activitessociales.common.exception.*;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityTypeRepository activityTypeRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ActivityResponse> findAll(Long typeId, Activity.ActivityStatus status) {
        List<Activity> activities;
        if (typeId != null) {
            activities = activityRepository.findByActivityTypeId(typeId);
        } else if (status != null) {
            activities = activityRepository.findByStatus(status);
        } else {
            activities = activityRepository.findAll();
        }

        return activities.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse findById(Long id) {
        return toResponse(getActivity(id));
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "ACTIVITY_CREATE")
    public ActivityResponse create(ActivityRequest request) {
        ActivityType type = getActivityType(request.getActivityTypeId());
        validateRequest(request, type);

        Activity activity = Activity.builder()
                .activityType(type)
                .title(request.getTitle().trim())
                .description(trimToNull(request.getDescription()))
                .location(trimToNull(request.getLocation()))
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .registrationDeadline(request.getRegistrationDeadline())
                .capacityMax(request.getCapacityMax())
                .coverPhotoUrl(resolveCoverPhoto(request.getCoverPhotoUrl(), request.getGalleryPhotoUrls()))
                .status(request.getStatus())
                .customFieldValues(writeValues(request.getCustomFieldValues()))
                .galleryPhotoUrls(cleanPhotoUrls(request.getGalleryPhotoUrls()))
                .build();

        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "ACTIVITY_UPDATE")
    public ActivityResponse update(Long id, ActivityRequest request) {
        Activity activity = getActivity(id);
        ActivityType type = getActivityType(request.getActivityTypeId());
        validateRequest(request, type);

        activity.setActivityType(type);
        activity.setTitle(request.getTitle().trim());
        activity.setDescription(trimToNull(request.getDescription()));
        activity.setLocation(trimToNull(request.getLocation()));
        activity.setStartsAt(request.getStartsAt());
        activity.setEndsAt(request.getEndsAt());
        activity.setRegistrationDeadline(request.getRegistrationDeadline());
        activity.setCapacityMax(request.getCapacityMax());
        activity.setCoverPhotoUrl(resolveCoverPhoto(request.getCoverPhotoUrl(), request.getGalleryPhotoUrls()));
        activity.setStatus(request.getStatus());
        activity.setCustomFieldValues(writeValues(request.getCustomFieldValues()));
        activity.setGalleryPhotoUrls(cleanPhotoUrls(request.getGalleryPhotoUrls()));

        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "ACTIVITY_STATUS_UPDATE")
    public ActivityResponse updateStatus(Long id, Activity.ActivityStatus status) {
        Activity activity = getActivity(id);
        activity.setStatus(status);
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "ACTIVITY_DELETE")
    public void delete(Long id) {
        activityRepository.delete(getActivity(id));
    }

    private Activity getActivity(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activite introuvable."));
    }

    private ActivityType getActivityType(Long id) {
        return activityTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type d'activite introuvable."));
    }

    private void validateRequest(ActivityRequest request, ActivityType type) {
        if (request.getEndsAt() != null && request.getStartsAt() != null && request.getEndsAt().isBefore(request.getStartsAt())) {
            throw new BadRequestException("La date de fin doit etre apres la date de debut.");
        }
        if (request.getRegistrationDeadline() != null && request.getStartsAt() != null
                && request.getRegistrationDeadline().isAfter(request.getStartsAt())) {
            throw new BadRequestException("La date limite d'inscription doit etre avant le debut de l'activite.");
        }
        validateCustomValues(readSchema(type.getCustomFieldsSchema()), request.getCustomFieldValues());
    }

    private void validateCustomValues(Map<String, ActivityTypeRequest.FieldSchema> schema, Map<String, Object> values) {
        Map<String, Object> safeValues = values == null ? Map.of() : values;

        schema.forEach((key, field) -> {
            Object value = safeValues.get(key);
            if (field.isRequired() && isEmpty(value)) {
                throw new BadRequestException("Champ obligatoire manquant: " + field.getLabel());
            }
            if (isEmpty(value)) {
                return;
            }
            if (("select".equals(field.getType()) || "radio".equals(field.getType()))
                    && field.getOptions() != null
                    && !field.getOptions().contains(String.valueOf(value))) {
                throw new BadRequestException("Valeur invalide pour " + field.getLabel() + ".");
            }
            if ("number".equals(field.getType())) {
                try {
                    Double.parseDouble(String.valueOf(value));
                } catch (NumberFormatException e) {
                    throw new BadRequestException("Le champ " + field.getLabel() + " doit etre numerique.");
                }
            }
        });
    }

    private boolean isEmpty(Object value) {
        return value == null || (value instanceof String string && string.trim().isEmpty());
    }

    private List<String> cleanPhotoUrls(List<String> urls) {
        if (urls == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(urls.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .distinct()
                .toList());
    }

    private String resolveCoverPhoto(String coverPhotoUrl, List<String> galleryUrls) {
        List<String> cleanUrls = cleanPhotoUrls(galleryUrls);
        String cleanCover = trimToNull(coverPhotoUrl);
        if (cleanCover != null && cleanUrls.contains(cleanCover)) {
            return cleanCover;
        }
        return cleanUrls.isEmpty() ? null : cleanUrls.get(0);
    }

    private String writeValues(Map<String, Object> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Map.of() : values);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Valeurs dynamiques invalides.");
        }
    }

    private Map<String, Object> readValues(String values) {
        try {
            return objectMapper.readValue(values, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Valeurs dynamiques enregistrees invalides.");
        }
    }

    private Map<String, ActivityTypeRequest.FieldSchema> readSchema(String schema) {
        try {
            return objectMapper.readValue(schema, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Schema du type d'activite invalide.");
        }
    }

    private ActivityResponse toResponse(Activity activity) {
        ActivityType type = activity.getActivityType();
        return ActivityResponse.builder()
                .id(activity.getId())
                .activityType(ActivityTypeResponse.builder()
                        .id(type.getId())
                        .name(type.getName())
                        .code(type.getCode())
                        .description(type.getDescription())
                        .icon(type.getIcon())
                        .active(type.isActive())
                        .customFieldsSchema(readSchema(type.getCustomFieldsSchema()))
                        .createdAt(type.getCreatedAt())
                        .updatedAt(type.getUpdatedAt())
                        .build())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .startsAt(activity.getStartsAt())
                .endsAt(activity.getEndsAt())
                .registrationDeadline(activity.getRegistrationDeadline())
                .capacityMax(activity.getCapacityMax())
                .coverPhotoUrl(activity.getCoverPhotoUrl())
                .status(activity.getStatus())
                .customFieldValues(readValues(activity.getCustomFieldValues()))
                .galleryPhotoUrls(activity.getGalleryPhotoUrls())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
