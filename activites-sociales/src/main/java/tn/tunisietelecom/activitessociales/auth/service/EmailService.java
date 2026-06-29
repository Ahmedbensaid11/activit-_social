package tn.tunisietelecom.activitessociales.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Year;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.logo-url:https://upload.wikimedia.org/wikipedia/fr/f/f9/LOGO_TT_.jpg}")
    private String logoUrl;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendActivationEmail(String to, String name, String token) {
        Context context = baseContext();
        String activationUrl = frontendUrl + "/activate-account?token=" + token;
        context.setVariable("name", name);
        context.setVariable("activationUrl", activationUrl);
        log.info("Activation link for {}: {}", to, activationUrl);
        sendEmail(to, "Activation de votre compte - Tunisie Telecom", "activation", context);
    }

    @Async
    public void sendResetPasswordEmail(String to, String name, String token) {
        Context context = baseContext();
        context.setVariable("name", name);
        context.setVariable("resetUrl", frontendUrl + "/reset-password?token=" + token);
        sendEmail(to, "Réinitialisation du mot de passe - Tunisie Telecom", "reset-password", context);
    }

    @Async
    public void sendStatusNotificationEmail(
            String to,
            String name,
            String activityTitle,
            String status,
            String reason,
            byte[] ticketPng,
            Long registrationId
    ) {
        Context context = baseContext();
        context.setVariable("name", name);
        context.setVariable("activityTitle", activityTitle);
        context.setVariable("status", status);
        context.setVariable("reason", reason);
        context.setVariable("hasTicket", ticketPng != null && ticketPng.length > 0);

        EmailAttachment attachment = null;
        if (ticketPng != null && ticketPng.length > 0 && registrationId != null) {
            attachment = EmailAttachment.file(
                    "ticket-inscription-" + registrationId + ".png",
                    ticketPng,
                    "image/png"
            );
        }

        sendEmail(to, "Mise à jour de votre inscription - Tunisie Telecom", "status-notification", context, attachment);
    }

    @Async
    public void sendTicketStatusEmail(String to, String name, String ticketNom, String status, String reason) {
        Context context = baseContext();
        context.setVariable("name", name);
        context.setVariable("ticketNom", ticketNom);
        context.setVariable("status", status);
        context.setVariable("reason", reason);
        sendEmail(to, "Mise à jour de votre demande de ticket - Tunisie Telecom", "ticket-notification", context);
    }

    @Async
    public void sendBroadcastEmail(String to, String name, String titre, String message) {
        Context context = baseContext();
        context.setVariable("name", name);
        context.setVariable("titre", titre);
        context.setVariable("message", message);
        sendEmail(to, titre + " - Annonce Tunisie Telecom", "broadcast-notification", context);
    }

    @Async
    public void sendMonthlyReportEmail(String to, byte[] excelBytes, String monthLabel) {
        Context context = baseContext();
        context.setVariable("monthLabel", monthLabel);
        EmailAttachment attachment = EmailAttachment.file(
                "rapport-mensuel-" + monthLabel + ".xlsx",
                excelBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        sendEmail(
                to,
                "Rapport Mensuel — Activités Sociales — " + monthLabel,
                "monthly-report",
                context,
                attachment
        );
    }

    private Context baseContext() {
        Context context = new Context();
        context.setVariable("portalUrl", frontendUrl);
        context.setVariable("logoUrl", logoUrl);
        context.setVariable("year", Year.now().getValue());
        return context;
    }

    private void sendEmail(String to, String subject, String template, Context context) {
        sendEmail(to, subject, template, context, null);
    }

    private void sendEmail(String to, String subject, String template, Context context, EmailAttachment attachment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);

            String html = templateEngine.process("email/" + template, context);
            helper.setText(html, true);

            if (attachment != null) {
                helper.addAttachment(attachment.filename(), attachment.resource(), attachment.contentType());
            }

            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    private record EmailAttachment(String filename, ByteArrayResource resource, String contentType) {
        static EmailAttachment file(String filename, byte[] bytes, String contentType) {
            return new EmailAttachment(filename, new ByteArrayResource(bytes), contentType);
        }
    }
}
