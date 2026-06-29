package tn.tunisietelecom.activitessociales.notification.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tn.tunisietelecom.activitessociales.auth.service.JwtService;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    // Mapping of Email/Username -> Set of active WebSocket sessions
    private static final Map<String, Set<WebSocketSession>> USER_SESSIONS = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String email = extractEmailFromUri(session.getUri());
        if (email == null) {
            log.warn("WebSocket connection rejected: Missing or invalid token.");
            closeSession(session, CloseStatus.BAD_DATA);
            return;
        }

        USER_SESSIONS.computeIfAbsent(email, k -> Collections.synchronizedSet(new LinkedHashSet<>())).add(session);
        log.info("WebSocket connection established for user: {}. Active sessions: {}", email, USER_SESSIONS.get(email).size());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String email = extractEmailFromUri(session.getUri());
        if (email != null) {
            Set<WebSocketSession> sessions = USER_SESSIONS.get(email);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    USER_SESSIONS.remove(email);
                }
            }
            log.info("WebSocket connection closed for user: {}.", email);
        }
    }

    /** Push a real-time notification to a specific user */
    public void sendToUser(String email, Object payload) {
        Set<WebSocketSession> sessions = USER_SESSIONS.get(email);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(payload);
            TextMessage message = new TextMessage(json);
            
            // Broadcast to all active sessions of this user (in case they have multiple tabs open)
            synchronized (sessions) {
                for (WebSocketSession session : sessions) {
                    if (session.isOpen()) {
                        try {
                            session.sendMessage(message);
                        } catch (IOException e) {
                            log.error("Failed to send WS message to session ID: {}", session.getId(), e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize WebSocket payload for user: {}", email, e);
        }
    }

    /** Push a real-time notification to ALL active users (Broadcast) */
    public void broadcast(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            TextMessage message = new TextMessage(json);

            for (Set<WebSocketSession> sessions : USER_SESSIONS.values()) {
                synchronized (sessions) {
                    for (WebSocketSession session : sessions) {
                        if (session.isOpen()) {
                            try {
                                session.sendMessage(message);
                            } catch (IOException e) {
                                log.error("Failed to broadcast WS message to session ID: {}", session.getId(), e);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to serialize broadcast WS payload", e);
        }
    }

    // ── Helper methods ────────────────────────────────────────────────────

    private String extractEmailFromUri(URI uri) {
        if (uri == null || uri.getQuery() == null) return null;
        
        // Find "token=" param in the URL query string: ws://localhost:9090/ws?token=xxxx
        return Arrays.stream(uri.getQuery().split("&"))
                .filter(param -> param.startsWith("token="))
                .map(param -> param.substring(6))
                .findFirst()
                .map(token -> {
                    try {
                        if (!jwtService.isTokenExpired(token)) {
                            return jwtService.extractEmail(token);
                        }
                    } catch (Exception e) {
                        log.warn("Invalid JWT token passed to WebSocket handshake: {}", e.getMessage());
                    }
                    return null;
                })
                .orElse(null);
    }

    private void closeSession(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {}
    }
}
