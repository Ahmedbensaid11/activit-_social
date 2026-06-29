package tn.tunisietelecom.activitessociales.registration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RejectRegistrationRequest {
    @NotBlank(message = "Le motif de rejet est obligatoire.")
    @Size(max = 500, message = "Le motif de rejet ne doit pas depasser 500 caracteres.")
    private String motifRejet;
}
