package tn.tunisietelecom.activitessociales.report.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExcelService {

    private final EntityManager em;

    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter D_FMT  = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Transactional(readOnly = true)
    public byte[] generateReport(String type, LocalDate dateDebut, LocalDate dateFin, String status) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // Fetch data
            List<Registration> registrations = "REGISTRATION".equalsIgnoreCase(type) || type == null
                    ? fetchRegistrations(dateDebut, dateFin, status)
                    : List.of();
            List<Ticket> tickets = "TICKET".equalsIgnoreCase(type) || type == null
                    ? fetchTickets(dateDebut, dateFin, status)
                    : List.of();

            // Build styles
            Styles styles = new Styles(workbook);

            // ── Sheet 1: Inscriptions ──
            XSSFSheet regSheet = workbook.createSheet("Inscriptions");
            buildRegistrationSheet(regSheet, registrations, styles);

            // ── Sheet 2: Tickets ──
            XSSFSheet tickSheet = workbook.createSheet("Tickets Pluxee");
            buildTicketSheet(tickSheet, tickets, styles);

            // ── Sheet 3: Statistiques ──
            XSSFSheet statsSheet = workbook.createSheet("Statistiques");
            buildStatsSheet(statsSheet, registrations, tickets, styles, workbook);

            workbook.write(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Excel generation failed", e);
            throw new IllegalStateException("Impossible de générer le rapport Excel.", e);
        }
    }

    // ── Registration Sheet ────────────────────────────────────────────────

    private void buildRegistrationSheet(XSSFSheet sheet, List<Registration> rows, Styles s) {
        // Title row
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Rapport Inscriptions — Tunisie Telecom");
        titleCell.setCellStyle(s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

        // Header row
        Row header = sheet.createRow(2);
        String[] cols = {"ID", "Employé", "Matricule", "Activité", "Date inscription", "Statut"};
        for (int i = 0; i < cols.length; i++) {
            Cell c = header.createCell(i);
            c.setCellValue(cols[i]);
            c.setCellStyle(s.colHeader);
        }

        // Data rows
        int rowNum = 3;
        for (Registration r : rows) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(r.getId());
            row.createCell(1).setCellValue(r.getUser().getFullName());
            row.createCell(2).setCellValue(r.getUser().getMatricule());
            row.createCell(3).setCellValue(r.getActivity().getTitle());
            row.createCell(4).setCellValue(r.getRegisteredAt() != null ? r.getRegisteredAt().format(DT_FMT) : "-");
            Cell statusCell = row.createCell(5);
            statusCell.setCellValue(r.getStatus().name());
            statusCell.setCellStyle(switch (r.getStatus().name()) {
                case "APPROVED" -> s.green;
                case "REJECTED" -> s.red;
                default         -> s.orange;
            });
        }

        // Total row
        Row totalRow = sheet.createRow(rowNum + 1);
        Cell totalLabel = totalRow.createCell(0);
        totalLabel.setCellValue("Total inscriptions");
        totalLabel.setCellStyle(s.bold);
        totalRow.createCell(1).setCellValue(rows.size());

        // Auto-size columns
        for (int i = 0; i < 6; i++) sheet.autoSizeColumn(i);
    }

    // ── Ticket Sheet ──────────────────────────────────────────────────────

    private void buildTicketSheet(XSSFSheet sheet, List<Ticket> rows, Styles s) {
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Rapport Tickets Pluxee — Tunisie Telecom");
        titleCell.setCellStyle(s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

        Row header = sheet.createRow(2);
        String[] cols = {"ID", "Employé", "Matricule", "Libellé", "Nb jours", "Offre (DT/j)", "Statut"};
        for (int i = 0; i < cols.length; i++) {
            Cell c = header.createCell(i);
            c.setCellValue(cols[i]);
            c.setCellStyle(s.colHeader);
        }

        int rowNum = 3;
        for (Ticket t : rows) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(t.getId());
            row.createCell(1).setCellValue(t.getUser().getFullName());
            row.createCell(2).setCellValue(t.getUser().getMatricule());
            row.createCell(3).setCellValue(t.getNom());
            row.createCell(4).setCellValue(t.getNbTickets());

            // Parse the offer value (e.g. "8 DT/jour" -> 8.0)
            double offerVal = parseOffer(t.getOffre());
            row.createCell(5).setCellValue(offerVal);

            Cell statusCell = row.createCell(6);
            statusCell.setCellValue(t.getStatus().name());
            statusCell.setCellStyle(switch (t.getStatus().name()) {
                case "APPROVED" -> s.green;
                case "REJECTED" -> s.red;
                default         -> s.orange;
            });
        }

        // Total row with SUM formula
        if (!rows.isEmpty()) {
            int firstDataRow = 4; // 1-indexed
            int lastDataRow  = 3 + rows.size();
            Row totalRow = sheet.createRow(rowNum + 1);
            totalRow.createCell(0).setCellValue("Total jours");
            Cell sumCell = totalRow.createCell(4);
            sumCell.setCellFormula("SUM(E" + firstDataRow + ":E" + lastDataRow + ")");
            sumCell.setCellStyle(s.bold);
            totalRow.createCell(3).setCellValue("Total tickets");
            totalRow.createCell(6).setCellValue(rows.size());
        }

        for (int i = 0; i < 7; i++) sheet.autoSizeColumn(i);
    }

    // ── Stats Sheet ───────────────────────────────────────────────────────

    private void buildStatsSheet(XSSFSheet sheet, List<Registration> regs, List<Ticket> ticks,
                                 Styles s, XSSFWorkbook wb) {
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Statistiques — Tunisie Telecom");
        titleCell.setCellStyle(s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));

        int r = 2;
        r = addStatSection(sheet, s, r, "Inscriptions");

        long totalReg      = regs.size();
        long approvedReg   = regs.stream().filter(x -> x.getStatus().name().equals("APPROVED")).count();
        long pendingReg    = regs.stream().filter(x -> x.getStatus().name().equals("PENDING")).count();
        long rejectedReg   = regs.stream().filter(x -> x.getStatus().name().equals("REJECTED")).count();

        r = addStatRow(sheet, s, r, "Total inscriptions",   totalReg);
        r = addStatRow(sheet, s, r, "Approuvées",           approvedReg);
        r = addStatRow(sheet, s, r, "En attente",           pendingReg);
        r = addStatRow(sheet, s, r, "Rejetées",             rejectedReg);
        if (totalReg > 0) {
            Row rateRow = sheet.createRow(r++);
            rateRow.createCell(0).setCellValue("Taux d'approbation");
            Cell rateCell = rateRow.createCell(1);
            // Formula: =B(approvedRow)/B(totalRow) formatted as %
            int approvedRow = r - 3; // row index is 0-based but Excel is 1-based
            rateCell.setCellValue(totalReg > 0 ? Math.round((approvedReg * 100.0) / totalReg) / 100.0 : 0);
            XSSFCellStyle pctStyle = wb.createCellStyle();
            pctStyle.setDataFormat(wb.createDataFormat().getFormat("0%"));
            rateCell.setCellStyle(pctStyle);
        }

        r++;
        r = addStatSection(sheet, s, r, "Tickets Pluxee");

        long totalTick    = ticks.size();
        long approvedTick = ticks.stream().filter(x -> x.getStatus().name().equals("APPROVED")).count();
        long pendingTick  = ticks.stream().filter(x -> x.getStatus().name().equals("PENDING")).count();
        long rejectedTick = ticks.stream().filter(x -> x.getStatus().name().equals("REJECTED")).count();
        double totalDays  = ticks.stream().filter(t -> t.getStatus().name().equals("APPROVED"))
                .mapToInt(Ticket::getNbTickets).sum();
        double totalCost  = ticks.stream().filter(t -> t.getStatus().name().equals("APPROVED"))
                .mapToDouble(t -> t.getNbTickets() * parseOffer(t.getOffre())).sum();

        r = addStatRow(sheet, s, r, "Total demandes",       totalTick);
        r = addStatRow(sheet, s, r, "Approuvées",           approvedTick);
        r = addStatRow(sheet, s, r, "En attente",           pendingTick);
        r = addStatRow(sheet, s, r, "Rejetées",             rejectedTick);
        r = addStatRow(sheet, s, r, "Total jours validés",  (long) totalDays);

        Row costRow = sheet.createRow(r++);
        costRow.createCell(0).setCellValue("Montant total estimé (DT)");
        Cell costCell = costRow.createCell(1);
        costCell.setCellValue(totalCost);
        XSSFCellStyle dtStyle = wb.createCellStyle();
        dtStyle.setDataFormat(wb.createDataFormat().getFormat("#,##0.00 \"DT\""));
        costCell.setCellStyle(dtStyle);

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.setColumnWidth(0, Math.max(sheet.getColumnWidth(0), 8000));
    }

    private int addStatSection(XSSFSheet sheet, Styles s, int row, String label) {
        Row r = sheet.createRow(row);
        Cell c = r.createCell(0);
        c.setCellValue(label);
        c.setCellStyle(s.sectionHeader);
        sheet.addMergedRegion(new CellRangeAddress(row, row, 0, 2));
        return row + 1;
    }

    private int addStatRow(XSSFSheet sheet, Styles s, int row, String label, long value) {
        Row r = sheet.createRow(row);
        r.createCell(0).setCellValue(label);
        r.createCell(1).setCellValue(value);
        return row + 1;
    }

    // ── Data Queries ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<Registration> fetchRegistrations(LocalDate dateDebut, LocalDate dateFin, String status) {
        StringBuilder jpql = new StringBuilder(
                "select r from Registration r join fetch r.user join fetch r.activity where 1=1");
        Map<String, Object> params = new HashMap<>();
        if (dateDebut != null) { jpql.append(" and r.registeredAt >= :start"); params.put("start", dateDebut.atStartOfDay()); }
        if (dateFin   != null) { jpql.append(" and r.registeredAt < :end");   params.put("end",   dateFin.plusDays(1).atStartOfDay()); }
        if (status != null && !status.isBlank()) {
            try { jpql.append(" and r.status = :status"); params.put("status", Registration.RegistrationStatus.valueOf(status.toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
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
        if (status != null && !status.isBlank()) {
            try { jpql.append(" and t.status = :status"); params.put("status", Ticket.TicketStatus.valueOf(status.toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        jpql.append(" order by t.createdAt desc");
        var q = em.createQuery(jpql.toString(), Ticket.class);
        params.forEach(q::setParameter);
        return q.getResultList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private double parseOffer(String offre) {
        if (offre == null || offre.isBlank()) return 0.0;
        try {
            // e.g. "8 DT/jour" -> "8"
            return Double.parseDouble(offre.trim().split("\\s+")[0]);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    // ── Style factory ─────────────────────────────────────────────────────

    private static class Styles {
        final XSSFCellStyle title;
        final XSSFCellStyle colHeader;
        final XSSFCellStyle sectionHeader;
        final XSSFCellStyle bold;
        final XSSFCellStyle green;
        final XSSFCellStyle red;
        final XSSFCellStyle orange;

        Styles(XSSFWorkbook wb) {
            XSSFFont titleFont = wb.createFont(); titleFont.setBold(true); titleFont.setFontHeightInPoints((short)14); titleFont.setColor(new XSSFColor(new byte[]{0, (byte)91, (byte)171}, null));
            title = wb.createCellStyle(); title.setFont(titleFont);

            XSSFFont hFont = wb.createFont(); hFont.setBold(true); hFont.setFontHeightInPoints((short)10); hFont.setColor(IndexedColors.WHITE.getIndex());
            colHeader = wb.createCellStyle();
            colHeader.setFont(hFont);
            colHeader.setFillForegroundColor(new XSSFColor(new byte[]{30, 64, (byte)175}, null));
            colHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            colHeader.setBorderBottom(BorderStyle.THIN);
            colHeader.setAlignment(HorizontalAlignment.CENTER);

            XSSFFont secFont = wb.createFont(); secFont.setBold(true); secFont.setFontHeightInPoints((short)11);
            sectionHeader = wb.createCellStyle();
            sectionHeader.setFont(secFont);
            sectionHeader.setFillForegroundColor(new XSSFColor(new byte[]{(byte)226, (byte)232, (byte)240}, null));
            sectionHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            XSSFFont boldFont = wb.createFont(); boldFont.setBold(true);
            bold = wb.createCellStyle(); bold.setFont(boldFont);

            green  = statusStyle(wb, new byte[]{(byte)220, (byte)252, (byte)231});
            red    = statusStyle(wb, new byte[]{(byte)254, (byte)226, (byte)226});
            orange = statusStyle(wb, new byte[]{(byte)254, (byte)243, (byte)199});
        }

        private XSSFCellStyle statusStyle(XSSFWorkbook wb, byte[] rgb) {
            XSSFCellStyle s = wb.createCellStyle();
            s.setFillForegroundColor(new XSSFColor(rgb, null));
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            return s;
        }
    }
}
