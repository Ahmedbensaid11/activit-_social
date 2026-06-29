package tn.tunisietelecom.activitessociales.dashboard.dto;

import lombok.*;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Map<String, Long> activitiesByType;
    private Map<String, Long> inscriptionsByStatus;
    private Map<String, Long> ticketsByStatus;
    private long totalActivities;
    private long totalInscriptions;
    private long totalTickets;
    private double globalApprovalRate; // percentage 0-100
}
