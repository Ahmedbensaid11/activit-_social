package tn.tunisietelecom.activitessociales.audit.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.tunisietelecom.activitessociales.audit.entity.AuditLog;

import java.time.LocalDateTime;

@Repository
public interface AuditRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findByPerformedBy(String performedBy, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByActionAndPerformedBy(String action, String performedBy, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);
}
