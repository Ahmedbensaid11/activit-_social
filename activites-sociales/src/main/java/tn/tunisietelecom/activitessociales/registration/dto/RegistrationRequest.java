package tn.tunisietelecom.activitessociales.registration.dto;

import lombok.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationRequest {
    @Builder.Default
    private Map<String, Object> extraData = new LinkedHashMap<>();
    private Integer seatCount;
}
