package tn.tunisietelecom.activitessociales.report.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportPdfService {

    private final EntityManager em;

    private static final DeviceRgb TT_BLUE   = new DeviceRgb(0, 91, 171);
    private static final DeviceRgb LIGHT_GREY = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb HEADER_BG  = new DeviceRgb(30, 64, 175);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);
    private static final DateTimeFormatter DT_FMT   = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.FRENCH);

    @Transactional(readOnly = true)
    public byte[] generateReport(String type, LocalDate dateDebut, LocalDate dateFin, String status) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter   writer   = new PdfWriter(baos);
            PdfDocument pdfDoc   = new PdfDocument(writer);
            Document    document = new Document(pdfDoc, PageSize.A4.rotate()); // Landscape for wide tables
            document.setMargins(60, 36, 60, 36);

            // ── Header / Footer event handler ──
            pdfDoc.addEventHandler(PdfDocumentEvent.END_PAGE,
                    new HeaderFooterHandler(document, logoBytes(), type, dateDebut, dateFin));

            // ── Cover block ──
            addCoverHeader(document, type, dateDebut, dateFin);

            // ── Data ──
            boolean isRegistration = "REGISTRATION".equalsIgnoreCase(type);
            if (isRegistration) {
                List<Registration> rows = fetchRegistrations(dateDebut, dateFin, status);
                addRegistrationTable(document, rows);
            } else {
                List<Ticket> rows = fetchTickets(dateDebut, dateFin, status);
                addTicketTable(document, rows);
            }

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("PDF generation failed", e);
            throw new IllegalStateException("Impossible de générer le rapport PDF.", e);
        }
    }

    // ── Cover header ──────────────────────────────────────────────────────

    private void addCoverHeader(Document doc, String type, LocalDate dateDebut, LocalDate dateFin) throws IOException {
        // Logo
        byte[] logoData = logoBytes();
        if (logoData != null) {
            Image logo = new Image(ImageDataFactory.create(logoData));
            logo.setWidth(80).setHorizontalAlignment(HorizontalAlignment.LEFT);
            doc.add(logo);
        }

        // Title
        String typeLabel = "REGISTRATION".equalsIgnoreCase(type) ? "Inscriptions aux Activités" : "Tickets Pluxee";
        Paragraph title = new Paragraph("Rapport — " + typeLabel)
                .setFontSize(18)
                .setBold()
                .setFontColor(TT_BLUE)
                .setMarginTop(10);
        doc.add(title);

        // Subtitle
        String period = buildPeriodLabel(dateDebut, dateFin);
        doc.add(new Paragraph("Tunisie Telecom · Gestion des Activités Sociales · " + period)
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setMarginBottom(20));

        // Horizontal divider
        doc.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1f))
                .setMarginBottom(16));
    }

    // ── Registration table ────────────────────────────────────────────────

    private void addRegistrationTable(Document doc, List<Registration> rows) {
        if (rows.isEmpty()) {
            doc.add(new Paragraph("Aucune inscription ne correspond aux critères sélectionnés.")
                    .setFontColor(ColorConstants.GRAY).setItalic().setMarginTop(20));
            return;
        }

        float[] widths = {40, 120, 80, 160, 90, 80};
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();

        // Header row
        String[] headers = {"#", "Employé", "Matricule", "Activité", "Date inscription", "Statut"};
        for (String h : headers) {
            table.addHeaderCell(
                    new Cell().add(new Paragraph(h).setBold().setFontSize(9).setFontColor(ColorConstants.WHITE))
                            .setBackgroundColor(HEADER_BG)
                            .setPadding(6)
                            .setBorder(Border.NO_BORDER));
        }

        // Data rows
        boolean odd = true;
        for (Registration r : rows) {
            DeviceRgb rowBg = odd ? LIGHT_GREY : new DeviceRgb(255, 255, 255);
            odd = !odd;
            addCell(table, String.valueOf(r.getId()), 8, rowBg);
            addCell(table, r.getUser().getFullName(), 9, rowBg);
            addCell(table, r.getUser().getMatricule(), 9, rowBg);
            addCell(table, r.getActivity().getTitle(), 9, rowBg);
            addCell(table, r.getRegisteredAt() != null ? r.getRegisteredAt().format(DT_FMT) : "-", 9, rowBg);
            addStatusCell(table, r.getStatus().name(), rowBg);
        }

        // Summary row
        table.addFooterCell(new Cell(1, 6)
                .add(new Paragraph("Total : " + rows.size() + " inscription(s)").setBold().setFontSize(9))
                .setBackgroundColor(new DeviceRgb(226, 232, 240))
                .setBorder(Border.NO_BORDER).setPadding(6));

        doc.add(table);
    }

    // ── Ticket table ──────────────────────────────────────────────────────

    private void addTicketTable(Document doc, List<Ticket> rows) {
        if (rows.isEmpty()) {
            doc.add(new Paragraph("Aucun ticket ne correspond aux critères sélectionnés.")
                    .setFontColor(ColorConstants.GRAY).setItalic().setMarginTop(20));
            return;
        }

        float[] widths = {40, 120, 80, 140, 60, 60, 80};
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();

        String[] headers = {"#", "Employé", "Matricule", "Ticket", "Nb jours", "Offre", "Statut"};
        for (String h : headers) {
            table.addHeaderCell(
                    new Cell().add(new Paragraph(h).setBold().setFontSize(9).setFontColor(ColorConstants.WHITE))
                            .setBackgroundColor(HEADER_BG)
                            .setPadding(6)
                            .setBorder(Border.NO_BORDER));
        }

        boolean odd = true;
        for (Ticket t : rows) {
            DeviceRgb rowBg = odd ? LIGHT_GREY : new DeviceRgb(255, 255, 255);
            odd = !odd;
            addCell(table, String.valueOf(t.getId()), 8, rowBg);
            addCell(table, t.getUser().getFullName(), 9, rowBg);
            addCell(table, t.getUser().getMatricule(), 9, rowBg);
            addCell(table, t.getNom(), 9, rowBg);
            addCell(table, String.valueOf(t.getNbTickets()), 9, rowBg);
            addCell(table, t.getOffre() != null ? t.getOffre() : "-", 9, rowBg);
            addStatusCell(table, t.getStatus().name(), rowBg);
        }

        table.addFooterCell(new Cell(1, 7)
                .add(new Paragraph("Total : " + rows.size() + " ticket(s)").setBold().setFontSize(9))
                .setBackgroundColor(new DeviceRgb(226, 232, 240))
                .setBorder(Border.NO_BORDER).setPadding(6));

        doc.add(table);
    }

    // ── Queries ───────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Registration> fetchRegistrations(LocalDate dateDebut, LocalDate dateFin, String status) {
        StringBuilder jpql = new StringBuilder(
                "select r from Registration r join fetch r.user join fetch r.activity where 1=1");
        Map<String, Object> params = new HashMap<>();
        if (dateDebut != null) { jpql.append(" and r.registeredAt >= :start"); params.put("start", dateDebut.atStartOfDay()); }
        if (dateFin   != null) { jpql.append(" and r.registeredAt < :end");   params.put("end",   dateFin.plusDays(1).atStartOfDay()); }
        if (status != null && !status.isBlank()) { jpql.append(" and r.status = :status"); params.put("status", Registration.RegistrationStatus.valueOf(status.toUpperCase())); }
        jpql.append(" order by r.registeredAt desc");

        var q = em.createQuery(jpql.toString(), Registration.class);
        params.forEach(q::setParameter);
        return q.getResultList();
    }

    @SuppressWarnings("unchecked")
    private List<Ticket> fetchTickets(LocalDate dateDebut, LocalDate dateFin, String status) {
        StringBuilder jpql = new StringBuilder(
                "select t from Ticket t join fetch t.user where 1=1");
        Map<String, Object> params = new HashMap<>();
        if (dateDebut != null) { jpql.append(" and t.createdAt >= :start"); params.put("start", dateDebut.atStartOfDay()); }
        if (dateFin   != null) { jpql.append(" and t.createdAt < :end");   params.put("end",   dateFin.plusDays(1).atStartOfDay()); }
        if (status != null && !status.isBlank()) { jpql.append(" and t.status = :status"); params.put("status", Ticket.TicketStatus.valueOf(status.toUpperCase())); }
        jpql.append(" order by t.createdAt desc");

        var q = em.createQuery(jpql.toString(), Ticket.class);
        params.forEach(q::setParameter);
        return q.getResultList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void addCell(Table table, String text, float fontSize, DeviceRgb bg) {
        table.addCell(new Cell()
                .add(new Paragraph(text).setFontSize(fontSize))
                .setBackgroundColor(bg)
                .setPadding(5)
                .setBorder(Border.NO_BORDER));
    }

    private void addStatusCell(Table table, String status, DeviceRgb rowBg) {
        DeviceRgb color = switch (status) {
            case "APPROVED" -> new DeviceRgb(21, 128, 61);
            case "REJECTED" -> new DeviceRgb(185, 28, 28);
            default         -> new DeviceRgb(146, 64, 14);
        };
        String label = switch (status) {
            case "APPROVED" -> "Approuvé";
            case "REJECTED" -> "Rejeté";
            default         -> "En attente";
        };
        table.addCell(new Cell()
                .add(new Paragraph(label).setFontSize(8).setBold().setFontColor(color))
                .setBackgroundColor(rowBg)
                .setPadding(5)
                .setBorder(Border.NO_BORDER));
    }

    private String buildPeriodLabel(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut == null && dateFin == null) return "Toutes périodes";
        if (dateDebut != null && dateFin != null)
            return "Du " + dateDebut.format(DATE_FMT) + " au " + dateFin.format(DATE_FMT);
        if (dateDebut != null) return "À partir du " + dateDebut.format(DATE_FMT);
        return "Jusqu'au " + dateFin.format(DATE_FMT);
    }

    private byte[] logoBytes() {
        try {
            return new ClassPathResource("images/tt.png").getInputStream().readAllBytes();
        } catch (IOException e) {
            log.warn("Logo tt.png not found in resources/images/");
            return null;
        }
    }

    // ── Header / Footer handler ───────────────────────────────────────────

    private record HeaderFooterHandler(
            Document document,
            byte[] logo,
            String type,
            LocalDate dateDebut,
            LocalDate dateFin
    ) implements IEventHandler {

        private static final DateTimeFormatter GEN_FMT =
                DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.FRENCH);

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdfDoc = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            int pageNum = pdfDoc.getPageNumber(page);
            int totalPages = pdfDoc.getNumberOfPages();

            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdfDoc);
            Rectangle pageSize = page.getPageSize();

            // Footer line
            canvas.setLineWidth(0.5f)
                    .setStrokeColorRgb(0.8f, 0.8f, 0.8f)
                    .moveTo(36, 40)
                    .lineTo(pageSize.getWidth() - 36, 40)
                    .stroke();

            // Footer text
            try (var canvasDoc = new com.itextpdf.layout.Canvas(canvas, pageSize)) {
                canvasDoc.showTextAligned(
                        new Paragraph("Page " + pageNum + " / " + totalPages + " — Document Confidentiel — Tunisie Telecom")
                                .setFontSize(7).setFontColor(ColorConstants.GRAY),
                        pageSize.getWidth() / 2, 28, TextAlignment.CENTER);

                String genDate = "Généré le " + LocalDateTime.now().format(GEN_FMT);
                canvasDoc.showTextAligned(
                        new Paragraph(genDate).setFontSize(7).setFontColor(ColorConstants.GRAY),
                        pageSize.getWidth() - 36, 28, TextAlignment.RIGHT);
            }

            canvas.release();
        }
    }
}
