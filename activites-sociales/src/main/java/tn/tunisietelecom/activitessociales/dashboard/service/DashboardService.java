package tn.tunisietelecom.activitessociales.dashboard.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.dashboard.dto.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EntityManager em;

    // ── Stats (KPI cards) ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardStatsResponse stats() {

        // Activities by type
        @SuppressWarnings("unchecked")
        List<Object[]> actByType = em.createQuery(
                "select at.name, count(a) from Activity a join a.activityType at group by at.name"
        ).getResultList();
        Map<String, Long> activitiesByType = toMap(actByType);

        // Registrations by status
        @SuppressWarnings("unchecked")
        List<Object[]> regByStatus = em.createQuery(
                "select r.status, count(r) from Registration r group by r.status"
        ).getResultList();
        Map<String, Long> inscriptionsByStatus = new LinkedHashMap<>();
        for (Object[] row : regByStatus) {
            inscriptionsByStatus.put(row[0].toString(), (Long) row[1]);
        }

        // Tickets by status
        @SuppressWarnings("unchecked")
        List<Object[]> tickByStatus = em.createQuery(
                "select t.status, count(t) from Ticket t group by t.status"
        ).getResultList();
        Map<String, Long> ticketsByStatus = new LinkedHashMap<>();
        for (Object[] row : tickByStatus) {
            ticketsByStatus.put(row[0].toString(), (Long) row[1]);
        }

        // Totals
        long totalActivities   = sum(activitiesByType);
        long totalInscriptions = sum(inscriptionsByStatus);
        long totalTickets      = sum(ticketsByStatus);

        // Global approval rate = approved / (approved + rejected) * 100
        long approved = inscriptionsByStatus.getOrDefault("APPROVED", 0L);
        long rejected = inscriptionsByStatus.getOrDefault("REJECTED", 0L);
        double rate = (approved + rejected) > 0
                ? (approved * 100.0) / (approved + rejected)
                : 0.0;

        return DashboardStatsResponse.builder()
                .activitiesByType(activitiesByType)
                .inscriptionsByStatus(inscriptionsByStatus)
                .ticketsByStatus(ticketsByStatus)
                .totalActivities(totalActivities)
                .totalInscriptions(totalInscriptions)
                .totalTickets(totalTickets)
                .globalApprovalRate(Math.round(rate * 10.0) / 10.0)
                .build();
    }

    // ── Charts ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardChartsResponse charts() {

        // ── 1. Registrations by month (last 12 months) ──
        LocalDateTime since = LocalDateTime.now().minusMonths(11)
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);

        @SuppressWarnings("unchecked")
        List<LocalDateTime> dates = em.createQuery(
                "select r.registeredAt from Registration r where r.registeredAt >= :since order by r.registeredAt"
        ).setParameter("since", since).getResultList();

        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM yyyy", Locale.FRENCH);
        Map<String, Long> byMonth = new LinkedHashMap<>();

        // Pre-fill 12 slots so months with 0 appear
        LocalDateTime cursor = since;
        for (int i = 0; i < 12; i++) {
            byMonth.put(cursor.format(labelFmt), 0L);
            cursor = cursor.plusMonths(1);
        }
        for (LocalDateTime d : dates) {
            String key = d.format(labelFmt);
            byMonth.merge(key, 1L, Long::sum);
        }

        List<DashboardChartsResponse.MonthCount> registrationsByMonth = byMonth.entrySet().stream()
                .map(e -> new DashboardChartsResponse.MonthCount(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        // ── 2. Breakdown by activity type ──
        @SuppressWarnings("unchecked")
        List<Object[]> typeRows = em.createQuery(
                "select at.name, count(r) from Registration r join r.activity a join a.activityType at group by at.name order by count(r) desc"
        ).getResultList();

        List<DashboardChartsResponse.TypeCount> breakdownByType = typeRows.stream()
                .map(r -> new DashboardChartsResponse.TypeCount((String) r[0], (Long) r[1]))
                .collect(Collectors.toList());

        // ── 3. Top 5 activities ──
        @SuppressWarnings("unchecked")
        List<Object[]> topRows = em.createQuery(
                "select a.title, count(r) from Registration r join r.activity a group by a.id, a.title order by count(r) desc"
        ).setMaxResults(5).getResultList();

        List<DashboardChartsResponse.ActivityCount> topActivities = topRows.stream()
                .map(r -> new DashboardChartsResponse.ActivityCount((String) r[0], (Long) r[1]))
                .collect(Collectors.toList());

        return DashboardChartsResponse.builder()
                .registrationsByMonth(registrationsByMonth)
                .breakdownByType(breakdownByType)
                .topActivities(topActivities)
                .build();
    }

    // ── Pending counts ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardPendingResponse pending() {
        Long pendingReg  = singleCount("select count(r) from Registration r where r.status = 'PENDING'");
        Long pendingTick = singleCount("select count(t) from Ticket t where t.status = 'PENDING'");
        long pr = pendingReg  != null ? pendingReg  : 0L;
        long pt = pendingTick != null ? pendingTick : 0L;
        return DashboardPendingResponse.builder()
                .pendingRegistrations(pr)
                .pendingTickets(pt)
                .totalPending(pr + pt)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            map.put((String) row[0], (Long) row[1]);
        }
        return map;
    }

    private long sum(Map<String, Long> map) {
        return map.values().stream().mapToLong(Long::longValue).sum();
    }

    @SuppressWarnings("unchecked")
    private Long singleCount(String jpql) {
        List<Long> result = em.createQuery(jpql).getResultList();
        return result.isEmpty() ? 0L : result.get(0);
    }
}
