package tn.tunisietelecom.activitessociales.registration.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QrValidationRequest {
    @NotBlank(message = "Le contenu QR est obligatoire.")
    private String qrContent;
}
