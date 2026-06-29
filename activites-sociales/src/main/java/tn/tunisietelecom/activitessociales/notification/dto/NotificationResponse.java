package tn.tunisietelecom.activitessociales.notification.dto;

import lombok.*;
import tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String titre;
    private String message;
    private NotificationType type;
    private boolean isRead;
    private LocalDateTime createdAt;
}
