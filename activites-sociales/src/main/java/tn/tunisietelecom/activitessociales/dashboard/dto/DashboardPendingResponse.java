package tn.tunisietelecom.activitessociales.dashboard.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardPendingResponse {
    private long pendingRegistrations;
    private long pendingTickets;
    private long totalPending;
}
