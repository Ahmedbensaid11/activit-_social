package tn.tunisietelecom.activitessociales.activitytype;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;
import tn.tunisietelecom.activitessociales.activitytype.repository.ActivityTypeRepository;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ActivityTypeSeeder implements CommandLineRunner {

    private final ActivityTypeRepository repository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) throws Exception {
        seed("SPORT", "Sport", "Activites sportives avec controle d'age et places disponibles.", "Dumbbell",
                Map.of(
                        "type_sport", field("Type de sport", "text", true),
                        "age_min", field("Age minimum", "number", true),
                        "age_max", field("Age maximum", "number", true),
                        "niveau", select("Niveau", false, List.of("DEBUTANT", "INTERMEDIAIRE", "AVANCE"))
                ));

        seed("EXCURSION", "Excursion", "Sorties et voyages pour les employes et leurs familles.", "MapPinned",
                Map.of(
                        "destination", field("Destination", "text", true),
                        "date_depart", field("Date de depart", "date", true),
                        "date_retour", field("Date de retour", "date", true),
                        "type_chambre", select("Type de chambre", true, List.of("SIMPLE", "DOUBLE", "TRIPLE")),
                        "nb_personnes", field("Nombre de personnes", "number", true),
                        "prix", field("Prix", "number", true)
                ));

        seed("HOTEL", "Hotel", "Sejours hotel et offres partenaires.", "Hotel",
                Map.of(
                        "nom_hotel", field("Nom de l'hotel", "text", true),
                        "ville", field("Ville", "text", true),
                        "pension", select("Pension", true, List.of("PETIT_DEJEUNER", "DEMI_PENSION", "PENSION_COMPLETE"))
                ));

        seed("CINEMA", "Cinema", "Billets cinema et sorties culturelles.", "Clapperboard",
                Map.of(
                        "film", field("Film", "text", true),
                        "salle", field("Salle", "text", true),
                        "date_projection", field("Date de projection", "date", true)
                ));
    }

    private void seed(String code, String name, String description, String icon, Map<String, Object> schema) throws Exception {
        if (repository.existsByCodeIgnoreCase(code)) {
            return;
        }
        repository.save(ActivityType.builder()
                .code(code)
                .name(name)
                .description(description)
                .icon(icon)
                .active(true)
                .customFieldsSchema(objectMapper.writeValueAsString(schema))
                .build());
    }

    private Map<String, Object> field(String label, String type, boolean required) {
        return new LinkedHashMap<>(Map.of("label", label, "type", type, "required", required));
    }

    private Map<String, Object> select(String label, boolean required, List<String> options) {
        Map<String, Object> field = field(label, "select", required);
        field.put("options", options);
        return field;
    }
}
