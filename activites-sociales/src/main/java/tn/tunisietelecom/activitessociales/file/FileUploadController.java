package tn.tunisietelecom.activitessociales.file;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@Tag(name = "Uploads", description = "Upload des fichiers applicatifs")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /** Admin only — activity cover/gallery photos */
    @PostMapping("/api/admin/uploads/activity-photo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Uploader une photo pour une activite")
    public ResponseEntity<FileUploadResponse> uploadActivityPhoto(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileStorageService.saveActivityPhoto(file));
    }

    /** All authenticated employees — ticket justification document (PDF/image) */
    @PostMapping("/api/uploads/ticket-document")
    @Operation(summary = "Uploader un justificatif pour une demande de ticket")
    public ResponseEntity<FileUploadResponse> uploadTicketDocument(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileStorageService.saveTicketDocument(file));
    }
}
