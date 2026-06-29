package tn.tunisietelecom.activitessociales.activity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ActivityStatusRequest {
    @NotNull(message = "Le statut est obligatoire.")
    private Activity.ActivityStatus status;
}
