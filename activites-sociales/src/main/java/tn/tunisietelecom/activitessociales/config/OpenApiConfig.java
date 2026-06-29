package tn.tunisietelecom.activitessociales.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Activités Sociales API — Tunisie Telecom",
        version = "1.0.0",
        description = "API de gestion des activités sociales, inscriptions, tickets Pluxee et notifications pour les agents de Tunisie Telecom.",
        contact = @Contact(name = "Direction SI", email = "si@tunisietelecom.tn")
    )
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class OpenApiConfig {}
