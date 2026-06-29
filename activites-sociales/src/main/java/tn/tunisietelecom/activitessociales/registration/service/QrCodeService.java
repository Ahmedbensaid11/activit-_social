package tn.tunisietelecom.activitessociales.registration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class QrCodeService {

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    private final ObjectMapper objectMapper;

    public String generateQrCode(Registration registration) {
        try {
            Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("qrcodes");
            Files.createDirectories(targetDirectory);

            String fileName = "registration-" + registration.getId() + ".png";
            Path targetPath = targetDirectory.resolve(fileName).normalize();
            if (!targetPath.startsWith(targetDirectory)) {
                throw new BadRequestException("Chemin QR invalide.");
            }

            BitMatrix matrix = new QRCodeWriter().encode(buildPayload(registration), BarcodeFormat.QR_CODE, 320, 320);
            MatrixToImageWriter.writeToPath(matrix, "PNG", targetPath);

            return "/uploads/qrcodes/" + fileName;
        } catch (Exception e) {
            throw new BadRequestException("Impossible de generer le QR Code.");
        }
    }

    public String buildPayload(Registration registration) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("registrationId", registration.getId());
        payload.put("registrationStatus", registration.getStatus().name());
        payload.put("registeredAt", registration.getRegisteredAt() == null ? null : registration.getRegisteredAt().toString());
        payload.put("validatedAt", registration.getValidatedAt() == null ? null : registration.getValidatedAt().toString());

        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", registration.getUser().getId());
        user.put("matricule", registration.getUser().getMatricule());
        user.put("nom", registration.getUser().getNom());
        user.put("prenom", registration.getUser().getPrenom());
        user.put("fullName", registration.getUser().getFullName());
        user.put("email", registration.getUser().getEmail());
        user.put("telephone", registration.getUser().getTelephone());
        user.put("role", registration.getUser().getRole().name());
        payload.put("user", user);

        Map<String, Object> activity = new LinkedHashMap<>();
        activity.put("id", registration.getActivity().getId());
        activity.put("title", registration.getActivity().getTitle());
        activity.put("typeCode", registration.getActivity().getActivityType().getCode());
        activity.put("typeName", registration.getActivity().getActivityType().getName());
        activity.put("location", registration.getActivity().getLocation());
        activity.put("startsAt", registration.getActivity().getStartsAt() == null ? null : registration.getActivity().getStartsAt().toString());
        activity.put("endsAt", registration.getActivity().getEndsAt() == null ? null : registration.getActivity().getEndsAt().toString());
        activity.put("registrationDeadline", registration.getActivity().getRegistrationDeadline() == null ? null : registration.getActivity().getRegistrationDeadline().toString());
        activity.put("capacityMax", registration.getActivity().getCapacityMax());
        activity.put("status", registration.getActivity().getStatus().name());
        payload.put("activity", activity);

        payload.put("status", registration.getStatus().name());
        payload.put("generatedAt", LocalDateTime.now().toString());

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Payload QR invalide.");
        }
    }

    public Long extractRegistrationId(String qrContent) {
        try {
            Map<String, Object> payload = objectMapper.readValue(qrContent, Map.class);
            Object id = payload.get("registrationId");
            if (id == null) {
                throw new BadRequestException("QR Code invalide.");
            }
            return Long.valueOf(String.valueOf(id));
        } catch (Exception e) {
            throw new BadRequestException("QR Code invalide.");
        }
    }
}
