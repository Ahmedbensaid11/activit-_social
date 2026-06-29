package tn.tunisietelecom.activitessociales.audit.aspect;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tn.tunisietelecom.activitessociales.audit.annotation.Auditable;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;

import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditService auditService;

    @AfterReturning(value = "@annotation(auditable)", returning = "result")
    public void logAudit(JoinPoint joinPoint, Auditable auditable, Object result) {
        try {
            // Get IP Address from request context
            String ipAddress = "127.0.0.1";
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getRemoteAddr();
            }

            // Get logged-in user email
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String performedBy = (auth != null && auth.isAuthenticated()) ? auth.getName() : "anonymousUser";

            String action = auditable.action();
            String targetEntity = null;
            Long targetId = null;

            Map<String, Object> details = new HashMap<>();
            details.put("method", joinPoint.getSignature().getName());
            details.put("class", joinPoint.getTarget().getClass().getSimpleName());

            // Extract target Entity and ID dynamically from method return result
            if (result != null) {
                try {
                    // Try to call getId() on the result (either entity or response DTO)
                    var getIdMethod = result.getClass().getMethod("getId");
                    Object idVal = getIdMethod.invoke(result);
                    if (idVal instanceof Long) {
                        targetId = (Long) idVal;
                    }

                    targetEntity = result.getClass().getSimpleName()
                            .replace("Response", "")
                            .replace("Entity", "");
                    
                    details.put("targetEntity", targetEntity);
                    details.put("targetId", targetId);
                } catch (Exception ignored) {}
            }

            // Add arguments to details to make it rich
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                for (int i = 0; i < args.length; i++) {
                    // Avoid logging raw passwords or huge files
                    Object arg = args[i];
                    if (arg != null && !arg.getClass().getSimpleName().contains("MultipartFile")
                            && !arg.getClass().getSimpleName().contains("UserDetails")) {
                        details.put("arg" + i, arg.toString());
                    }
                }
            }

            auditService.log(action, targetEntity, targetId, performedBy, ipAddress, details);
            log.info("Audit log written dynamically: action={}, performedBy={}, ip={}", action, performedBy, ipAddress);

        } catch (Exception e) {
            log.error("Failed to execute AuditAspect: {}", e.getMessage(), e);
        }
    }
}
