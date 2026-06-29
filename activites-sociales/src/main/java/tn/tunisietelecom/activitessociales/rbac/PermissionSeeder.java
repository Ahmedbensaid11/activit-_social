package tn.tunisietelecom.activitessociales.rbac;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tn.tunisietelecom.activitessociales.rbac.entity.Permission;
import tn.tunisietelecom.activitessociales.rbac.repository.PermissionRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
@Order(1)
public class PermissionSeeder implements CommandLineRunner {

    private final PermissionRepository repo;

    @Override
    public void run(String... args) {
        seed("VIEW_DASHBOARD",           "Voir le tableau de bord",          "Accès au dashboard KPIs et graphiques",                    "Tableau de bord");
        seed("MANAGE_ACTIVITIES",        "Gérer les activités",              "Créer, modifier, supprimer des activités",                 "Activités");
        seed("VIEW_ACTIVITIES",          "Consulter les activités",          "Voir le catalogue des activités",                          "Activités");
        seed("MANAGE_ACTIVITY_TYPES",    "Gérer les types d'activités",      "Configurer les types et formulaires dynamiques",           "Activités");
        seed("VIEW_REGISTRATIONS",       "Voir les inscriptions",            "Consulter toutes les inscriptions",                        "Inscriptions");
        seed("APPROVE_REGISTRATIONS",    "Approuver des inscriptions",       "Approuver ou rejeter des demandes d'inscription",          "Inscriptions");
        seed("VALIDATE_QR",              "Valider les QR Codes",             "Scanner et valider les présences par QR Code",             "Inscriptions");
        seed("VIEW_TICKETS",             "Voir les tickets Pluxee",          "Consulter toutes les demandes de tickets",                 "Tickets");
        seed("APPROVE_TICKETS",          "Approuver des tickets",            "Approuver ou rejeter des demandes de tickets Pluxee",      "Tickets");
        seed("DELETE_TICKETS",           "Supprimer des tickets",            "Supprimer définitivement des tickets",                     "Tickets");
        seed("VIEW_REPORTS",             "Voir les rapports",                "Télécharger les rapports PDF et Excel",                    "Rapports");
        seed("VIEW_AUDIT_LOGS",          "Voir le journal d'audit",          "Consulter l'historique complet des actions",               "Audit");
        seed("MANAGE_USERS",             "Gérer les utilisateurs",           "Créer, modifier, activer/désactiver des comptes",          "Utilisateurs");
        seed("MANAGE_ROLES",             "Gérer les rôles",                  "Créer et configurer des rôles personnalisés",              "Utilisateurs");
        seed("SEND_NOTIFICATIONS",       "Envoyer des notifications",        "Diffuser des annonces à tous les employés",                "Notifications");
        seed("VIEW_NOTIFICATIONS",       "Voir ses notifications",           "Consulter ses propres notifications",                      "Notifications");
    }

    private void seed(String code, String label, String description, String category) {
        if (!repo.existsByCode(code)) {
            repo.save(Permission.builder()
                    .code(code)
                    .label(label)
                    .description(description)
                    .category(category)
                    .build());
        }
    }
}