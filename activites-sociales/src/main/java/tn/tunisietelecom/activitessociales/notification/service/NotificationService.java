package tn.tunisietelecom.activitessociales.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;
import tn.tunisietelecom.activitessociales.notification.dto.NotificationResponse;
import tn.tunisietelecom.activitessociales.notification.entity.Notification;
import tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType;
import tn.tunisietelecom.activitessociales.notification.repository.NotificationRepository;
import tn.tunisietelecom.activitessociales.notification.websocket.NotificationWebSocketHandler;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository       notificationRepository;
    private final UserRepository                 userRepository;
    private final NotificationWebSocketHandler websocketHandler;
    private final EmailService                   emailService;

    /** Send notification to a specific user (saves to DB and pushes to WebSocket) */
    @Transactional
    public NotificationResponse notifyUser(Long userId, String titre, String message, NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .titre(titre)
                .message(message)
                .type(type)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse res = toResponse(saved);

        // Push via WebSocket in real-time
        websocketHandler.sendToUser(user.getEmail(), res);

        return res;
    }

    /** Employee: my paginated notifications */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> myNotifications(String email, Pageable pageable) {
        User user = findUser(email);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    /** Employee: get count of unread notifications */
    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        User user = findUser(email);
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    /** Employee: mark a notification as read */
    @Transactional
    public NotificationResponse markAsRead(Long id, String email) {
        User user = findUser(email);
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable : " + id));

        if (!n.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notification introuvable pour cet utilisateur.");
        }

        n.setRead(true);
        Notification saved = notificationRepository.save(n);
        return toResponse(saved);
    }

    /** Employee: mark all notifications as read */
    @Transactional
    public void markAllAsRead(String email) {
        User user = findUser(email);
        // Using pageable loop to update to avoid massive memory load, or simple JPQL update
        // We will fetch unread ones and update them
        List<Notification> unread = notificationRepository.findAll().stream()
                .filter(n -> n.getUser().getId().equals(user.getId()) && !n.isRead())
                .toList();

        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    /** Admin: broadcast announcement to all active users */
    @Transactional
    public void broadcastAnnouncement(String titre, String message, String adminEmail) {
        List<User> activeUsers = userRepository.findByIsActiveTrue();

        for (User user : activeUsers) {
            Notification notification = Notification.builder()
                    .user(user)
                    .titre(titre)
                    .message(message)
                    .type(NotificationType.INFO)
                    .build();

            Notification saved = notificationRepository.save(notification);

            // Push WS notification
            websocketHandler.sendToUser(user.getEmail(), toResponse(saved));

            // Send email notification in the background
            emailService.sendBroadcastEmail(user.getEmail(), user.getFullName(), titre, message);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + email));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
