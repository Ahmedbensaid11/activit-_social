package tn.tunisietelecom.activitessociales.registration.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.*;
import java.time.format.DateTimeFormatter;

@Service
public class TicketService {

    private static final int WIDTH = 1000;
    private static final int HEIGHT = 520;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    public ByteArrayResource generateTicket(Registration registration) {
        try {
            BufferedImage ticket = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = ticket.createGraphics();
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

            // Background
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, WIDTH, HEIGHT);

            // Header bar
            graphics.setColor(new Color(0, 91, 171));
            graphics.fillRect(0, 0, WIDTH, 88);
            graphics.setColor(Color.WHITE);
            graphics.setFont(new Font("Arial", Font.BOLD, 30));
            graphics.drawString("Ticket d'inscription", 40, 42);
            graphics.setFont(new Font("Arial", Font.PLAIN, 16));
            graphics.drawString("Gestion des Activites Sociales - Tunisie Telecom", 40, 68);

            // Activity title
            graphics.setColor(new Color(15, 23, 42));
            graphics.setFont(new Font("Arial", Font.BOLD, 24));
            graphics.drawString(truncate(registration.getActivity().getTitle(), 38), 40, 135);

            // Details (left column)
            graphics.setFont(new Font("Arial", Font.PLAIN, 16));
            int y = 180;
            y = drawLine(graphics, "Employe", registration.getUser().getFullName(), y);
            y = drawLine(graphics, "Matricule", registration.getUser().getMatricule(), y);
            y = drawLine(graphics, "Email", registration.getUser().getEmail(), y);
            y = drawLine(graphics, "Telephone", valueOrDash(registration.getUser().getTelephone()), y);
            y += 14;
            y = drawLine(graphics, "Type", resolveActivityTypeName(registration), y);
            y = drawLine(graphics, "Lieu", valueOrDash(registration.getActivity().getLocation()), y);
            y = drawLine(graphics, "Date debut",
                    registration.getActivity().getStartsAt() == null ? "-" : registration.getActivity().getStartsAt().format(DATE_FORMAT), y);
            y = drawLine(graphics, "Date fin",
                    registration.getActivity().getEndsAt() == null ? "-" : registration.getActivity().getEndsAt().format(DATE_FORMAT), y);
            y = drawLine(graphics, "Statut inscription", registration.getStatus().name(), y);

            // QR panel (right column)
            graphics.setColor(new Color(226, 232, 240));
            graphics.fillRoundRect(650, 126, 300, 300, 18, 18);
            graphics.setColor(Color.WHITE);
            graphics.fillRoundRect(665, 141, 270, 270, 12, 12);

            BufferedImage qr = loadQrCode(registration);
            graphics.drawImage(qr, 685, 161, 230, 230, null);

            graphics.setColor(new Color(71, 85, 105));
            graphics.setFont(new Font("Arial", Font.PLAIN, 14));
            graphics.drawString("QR Code de validation", 725, 450);
            graphics.drawString("ID inscription: " + registration.getId(), 725, 472);

            // Footer
            graphics.setColor(new Color(148, 163, 184));
            graphics.drawLine(40, 485, 960, 485);
            graphics.setFont(new Font("Arial", Font.PLAIN, 12));
            graphics.drawString("Document personnel - a presenter lors de la validation de presence.", 40, 508);
            graphics.dispose();

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(ticket, "PNG", output);
            return new ByteArrayResource(output.toByteArray());
        } catch (Exception e) {
            throw new IllegalStateException("Impossible de generer le ticket.", e);
        }
    }

    private String resolveActivityTypeName(Registration registration) {
        ActivityType type = registration.getActivity().getActivityType();
        if (type == null) {
            return "-";
        }
        if (type.getName() != null && !type.getName().isBlank()) {
            return type.getName();
        }
        return valueOrDash(type.getCode());
    }

    private int drawLine(Graphics2D graphics, String label, String value, int y) {
        graphics.setColor(new Color(71, 85, 105));
        graphics.setFont(new Font("Arial", Font.BOLD, 15));
        graphics.drawString(label + " :", 40, y);
        graphics.setColor(new Color(15, 23, 42));
        graphics.setFont(new Font("Arial", Font.PLAIN, 16));
        graphics.drawString(truncate(valueOrDash(value), 52), 190, y);
        return y + 34;
    }

    private BufferedImage loadQrCode(Registration registration) throws Exception {
        String qrPath = registration.getQrCodePath();
        if (qrPath == null || qrPath.isBlank()) {
            throw new IllegalStateException("QR Code introuvable pour cette inscription.");
        }

        String relative = qrPath.startsWith("/uploads/")
                ? qrPath.substring("/uploads/".length())
                : qrPath.replaceFirst("^uploads/", "");

        Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(relative).normalize();
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();

        if (!filePath.startsWith(uploadRoot) || !Files.exists(filePath)) {
            throw new IllegalStateException("Fichier QR Code introuvable: " + filePath);
        }

        return ImageIO.read(filePath.toFile());
    }

    private String truncate(String value, int maxChars) {
        if (value == null || value.length() <= maxChars) {
            return valueOrDash(value);
        }
        return value.substring(0, maxChars - 3) + "...";
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
