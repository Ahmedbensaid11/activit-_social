package tn.tunisietelecom.activitessociales.activitytype.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTypeResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String icon;
    private boolean active;
    private Map<String, ActivityTypeRequest.FieldSchema> customFieldsSchema;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
