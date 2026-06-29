package tn.tunisietelecom.activitessociales.activitytype.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityTypeRequest {

    @NotBlank(message = "Le nom est obligatoire.")
    @Size(max = 80, message = "Le nom ne doit pas depasser 80 caracteres.")
    private String name;

    @NotBlank(message = "Le code est obligatoire.")
    @Size(max = 40, message = "Le code ne doit pas depasser 40 caracteres.")
    private String code;

    @Size(max = 500, message = "La description ne doit pas depasser 500 caracteres.")
    private String description;

    @Size(max = 60, message = "L'icone ne doit pas depasser 60 caracteres.")
    private String icon;

    @Builder.Default
    private boolean active = true;

    @NotNull(message = "Le schema des champs est obligatoire.")
    private Map<String, FieldSchema> customFieldsSchema;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FieldSchema {
        @NotBlank(message = "Le libelle du champ est obligatoire.")
        private String label;

        @NotBlank(message = "Le type du champ est obligatoire.")
        private String type;

        @Builder.Default
        private boolean required = false;

        private String placeholder;
        private Object defaultValue;
        private java.util.List<String> options;
        private Integer min;
        private Integer max;
    }
}
