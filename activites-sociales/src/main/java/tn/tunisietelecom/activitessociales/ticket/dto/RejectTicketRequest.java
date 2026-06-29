package tn.tunisietelecom.activitessociales.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectTicketRequest {

    @NotBlank(message = "Le motif de rejet est obligatoire")
    @Size(max = 500)
    private String motifRejet;
}
