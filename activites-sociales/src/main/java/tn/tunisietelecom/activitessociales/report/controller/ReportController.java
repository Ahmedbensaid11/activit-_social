package tn.tunisietelecom.activitessociales.report.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.report.service.ReportExcelService;
import tn.tunisietelecom.activitessociales.report.service.ReportPdfService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Rapports", description = "Export PDF et Excel des données")
public class ReportController {

    private final ReportPdfService   pdfService;
    private final ReportExcelService excelService;

    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    @GetMapping("/pdf")
    @Operation(summary = "Télécharger le rapport PDF")
    public ResponseEntity<byte[]> pdf(
            @RequestParam(defaultValue = "REGISTRATION") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(required = false) String status) {

        byte[] bytes = pdfService.generateReport(type, dateDebut, dateFin, status);

        String filename = "rapport-" + type.toLowerCase() + "-" + LocalDate.now().format(FILE_DATE) + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(bytes);
    }

    @GetMapping("/excel")
    @Operation(summary = "Télécharger le rapport Excel")
    public ResponseEntity<byte[]> excel(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(required = false) String status) {

        byte[] bytes = excelService.generateReport(type, dateDebut, dateFin, status);

        String filename = "rapport-social-" + LocalDate.now().format(FILE_DATE) + ".xlsx";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(bytes);
    }
}
