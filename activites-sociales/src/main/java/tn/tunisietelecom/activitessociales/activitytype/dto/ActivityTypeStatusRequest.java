package tn.tunisietelecom.activitessociales.activitytype.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityTypeStatusRequest {
    @NotNull(message = "Le statut est obligatoire.")
    private Boolean active;
}
