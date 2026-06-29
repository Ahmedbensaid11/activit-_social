package tn.tunisietelecom.activitessociales.file;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Set<String> ALLOWED_DOC_TYPES   = Set.of("application/pdf", "image/jpeg", "image/png", "image/webp");

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg",       ".jpg",
            "image/png",        ".png",
            "image/webp",       ".webp",
            "image/gif",        ".gif",
            "application/pdf",  ".pdf"
    );

    @Value("${app.upload.dir:uploads/}")
    private String uploadDir;

    // ── Activity photo ────────────────────────────────────────────────────

    public FileUploadResponse saveActivityPhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Veuillez choisir une image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BadRequestException("Format image non supporte. Utilisez JPG, PNG, WEBP ou GIF.");
        }

        String fileName = UUID.randomUUID() + EXTENSIONS.get(contentType);
        Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("activities");
        Path targetPath = targetDirectory.resolve(fileName).normalize();

        if (!targetPath.startsWith(targetDirectory)) {
            throw new BadRequestException("Nom de fichier invalide.");
        }

        try {
            Files.createDirectories(targetDirectory);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Impossible d'enregistrer l'image.");
        }

        return new FileUploadResponse(
                fileName,
                "/uploads/activities/" + fileName,
                file.getSize(),
                contentType
        );
    }

    // ── Profile photo ───────────────────────────────────────────────────────

    public FileUploadResponse saveProfilePhoto(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Veuillez choisir une image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new BadRequestException("Format image non supporté. Utilisez JPG, PNG, WEBP ou GIF.");
        }

        if (file.getSize() > 2L * 1024 * 1024) {
            throw new BadRequestException("Image trop volumineuse. Maximum 2 Mo.");
        }

        String fileName = UUID.randomUUID() + EXTENSIONS.get(contentType);
        Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("profiles");
        Path targetPath = targetDirectory.resolve(fileName).normalize();

        if (!targetPath.startsWith(targetDirectory)) {
            throw new BadRequestException("Nom de fichier invalide.");
        }

        try {
            Files.createDirectories(targetDirectory);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Impossible d'enregistrer l'image.");
        }

        return new FileUploadResponse(
                fileName,
                "/uploads/profiles/" + fileName,
                file.getSize(),
                contentType
        );
    }

    public void deleteByUrl(String url) {
        if (url == null || url.isBlank() || !url.startsWith("/uploads/")) {
            return;
        }
        String relativePath = url.substring("/uploads/".length());
        Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(relativePath).normalize();
        Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        if (filePath.startsWith(uploadRoot)) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
                // Best-effort cleanup
            }
        }
    }

    // ── Ticket justification document ─────────────────────────────────────

    public FileUploadResponse saveTicketDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Veuillez choisir un document.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_DOC_TYPES.contains(contentType)) {
            throw new BadRequestException("Format non supporté. Utilisez PDF, JPG, PNG ou WEBP.");
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            throw new BadRequestException("Document trop volumineux. Maximum 10 Mo.");
        }

        String fileName = UUID.randomUUID() + EXTENSIONS.get(contentType);
        Path targetDirectory = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("tickets");
        Path targetPath = targetDirectory.resolve(fileName).normalize();

        if (!targetPath.startsWith(targetDirectory)) {
            throw new BadRequestException("Nom de fichier invalide.");
        }

        try {
            Files.createDirectories(targetDirectory);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Impossible d'enregistrer le document.");
        }

        return new FileUploadResponse(
                fileName,
                "/uploads/tickets/" + fileName,
                file.getSize(),
                contentType
        );
    }
}
