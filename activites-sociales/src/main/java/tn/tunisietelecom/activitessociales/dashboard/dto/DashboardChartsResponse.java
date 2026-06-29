package tn.tunisietelecom.activitessociales.dashboard.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardChartsResponse {

    /** Last 12 months registration counts for BarChart */
    private List<MonthCount> registrationsByMonth;

    /** Activity type distribution for PieChart */
    private List<TypeCount> breakdownByType;

    /** Top 5 most popular activities */
    private List<ActivityCount> topActivities;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class MonthCount {
        private String month;   // e.g. "Juin 2026"
        private long count;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class TypeCount {
        private String name;
        private long value;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ActivityCount {
        private String title;
        private long count;
    }
}
