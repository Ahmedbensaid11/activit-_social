package tn.tunisietelecom.activitessociales.activity.dto;

import lombok.*;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.activitytype.dto.ActivityTypeResponse;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {
    private Long id;
    private ActivityTypeResponse activityType;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime registrationDeadline;
    private Integer capacityMax;
    private String coverPhotoUrl;
    private Activity.ActivityStatus status;
    private Map<String, Object> customFieldValues;
    private List<String> galleryPhotoUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
