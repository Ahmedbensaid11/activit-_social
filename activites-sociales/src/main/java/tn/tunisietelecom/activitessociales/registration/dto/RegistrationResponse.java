package tn.tunisietelecom.activitessociales.registration.dto;

import lombok.*;
import tn.tunisietelecom.activitessociales.activity.dto.ActivityResponse;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponse {
    private Long id;
    private ActivityResponse activity;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private String userMatricule;
    private Registration.RegistrationStatus status;
    private String motifRejet;
    private String qrCodePath;
    private Map<String, Object> extraData;
    private Integer seatCount;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
    private LocalDateTime validatedAt;
}