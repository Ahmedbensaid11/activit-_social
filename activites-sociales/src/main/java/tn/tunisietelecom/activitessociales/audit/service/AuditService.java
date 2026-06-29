package tn.tunisietelecom.activitessociales.audit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.audit.entity.AuditLog;
import tn.tunisietelecom.activitessociales.audit.repository.AuditRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;

    @Async
    public void log(String action, String targetEntity, Long targetId,
                    String performedBy, String ipAddress, Map<String, Object> details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .performedBy(performedBy)
                    .ipAddress(ipAddress)
                    .details(details)
                    .build();
            auditRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    /** Overloaded method for backward-compatibility with String message parameters */
    @Async
    public void log(String action, String targetEntity, Long targetId,
                    String performedBy, String ipAddress, String message) {
        Map<String, Object> map = new HashMap<>();
        map.put("message", message != null ? message : "");
        log(action, targetEntity, targetId, performedBy, ipAddress, map);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> searchLogs(String action, String performedBy, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        // We will build dynamic queries using MongoRepository or template if needed.
        // Let's implement custom checks:
        if (action != null && !action.isBlank() && performedBy != null && !performedBy.isBlank()) {
            return auditRepository.findByActionAndPerformedBy(action, performedBy, pageable);
        }
        if (action != null && !action.isBlank()) {
            return auditRepository.findByAction(action, pageable);
        }
        if (performedBy != null && !performedBy.isBlank()) {
            return auditRepository.findByPerformedBy(performedBy, pageable);
        }
        if (start != null && end != null) {
            return auditRepository.findByTimestampBetween(start, end, pageable);
        }
        return auditRepository.findAll(pageable);
    }
}
