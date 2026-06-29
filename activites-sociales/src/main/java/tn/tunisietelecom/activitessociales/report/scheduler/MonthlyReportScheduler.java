package tn.tunisietelecom.activitessociales.report.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.report.service.ReportExcelService;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MonthlyReportScheduler {

    private final ReportExcelService reportExcelService;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Runs at 00:00 on the 1st day of every month
    @Scheduled(cron = "0 0 1 * * ?")
    public void sendMonthlyReport() {
        log.info("[Scheduler] Generating monthly report...");
        try {
            LocalDateTime now = LocalDateTime.now();

            // Last month: from the 1st of last month to the 1st of current month (exclusive)
            LocalDate startOfLastMonth = now.minusMonths(1)
                    .withDayOfMonth(1)
                    .toLocalDate();
            LocalDate endOfLastMonth = now.withDayOfMonth(1)
                    .toLocalDate();

            String monthLabel = startOfLastMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"));

            // Generate Excel report for last month (all types, no status filter)
            byte[] excelBytes = reportExcelService.generateReport(null, startOfLastMonth, endOfLastMonth, null);

            // Send to all ADMIN users
            List<User> admins = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equals(u.getRole() != null ? u.getRole().name() : ""))
                    .toList();

            for (User admin : admins) {
                emailService.sendMonthlyReportEmail(admin.getEmail(), excelBytes, monthLabel);
                log.info("[Scheduler] Monthly report sent to {}", admin.getEmail());
            }
        } catch (Exception e) {
            log.error("[Scheduler] Failed to send monthly report: {}", e.getMessage(), e);
        }
    }
}
