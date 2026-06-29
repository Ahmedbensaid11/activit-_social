package tn.tunisietelecom.activitessociales.audit.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    private String id;

    @Indexed
    private String action;

    @Indexed
    private String performedBy;

    private String targetEntity;
    private Long targetId;

    @Indexed
    private String ipAddress;

    private Object details;

    @Indexed
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
