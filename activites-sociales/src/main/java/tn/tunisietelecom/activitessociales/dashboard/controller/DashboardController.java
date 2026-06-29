package tn.tunisietelecom.activitessociales.dashboard.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.dashboard.dto.*;
import tn.tunisietelecom.activitessociales.dashboard.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Dashboard", description = "KPIs, graphiques et compteurs de l'administration")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Statistiques globales (KPI cards)")
    public ResponseEntity<DashboardStatsResponse> stats() {
        return ResponseEntity.ok(dashboardService.stats());
    }

    @GetMapping("/charts")
    @Operation(summary = "Données pour les graphiques Recharts")
    public ResponseEntity<DashboardChartsResponse> charts() {
        return ResponseEntity.ok(dashboardService.charts());
    }

    @GetMapping("/pending")
    @Operation(summary = "Compteurs de demandes en attente (badges)")
    public ResponseEntity<DashboardPendingResponse> pending() {
        return ResponseEntity.ok(dashboardService.pending());
    }
}
