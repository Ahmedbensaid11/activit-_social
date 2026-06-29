package tn.tunisietelecom.activitessociales.activity.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityRequest {

    @NotNull(message = "Le type d'activite est obligatoire.")
    private Long activityTypeId;

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(max = 120, message = "Le titre ne doit pas depasser 120 caracteres.")
    private String title;

    @Size(max = 800, message = "La description ne doit pas depasser 800 caracteres.")
    private String description;

    @Size(max = 160, message = "Le lieu ne doit pas depasser 160 caracteres.")
    private String location;

    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime registrationDeadline;

    @Min(value = 1, message = "La capacite doit etre superieure a zero.")
    private Integer capacityMax;

    @Size(max = 1000, message = "L'URL de couverture ne doit pas depasser 1000 caracteres.")
    private String coverPhotoUrl;

    @NotNull(message = "Le statut est obligatoire.")
    private Activity.ActivityStatus status;

    @Builder.Default
    private Map<String, Object> customFieldValues = new LinkedHashMap<>();

    @Builder.Default
    private List<String> galleryPhotoUrls = new ArrayList<>();
}
