package tn.tunisietelecom.activitessociales.ticket.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;

@Data
public class TicketRequest {

    @NotNull(message = "Le type de ticket est obligatoire")
    private Ticket.TicketType typeTicket;

    @NotNull(message = "Le nombre de tickets est obligatoire")
    @Min(value = 1, message = "Minimum 1 ticket")
    @Max(value = 31, message = "Maximum 31 tickets par mois")
    private Integer nbTickets;

    /** Daily value agreed by company, e.g. "8 DT/jour" */
    @Size(max = 100)
    private String offre;

    /** URL returned by the document upload endpoint */
    @Size(max = 1000)
    private String documentPath;
}
