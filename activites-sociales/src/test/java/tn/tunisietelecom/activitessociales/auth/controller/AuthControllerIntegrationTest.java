package tn.tunisietelecom.activitessociales.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.audit.repository.AuditRepository;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.dto.LoginRequest;
import tn.tunisietelecom.activitessociales.auth.dto.RegisterRequest;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@MockBean(AuditRepository.class)
@MockBean(AuditService.class)
@Transactional
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        userRepository.deleteAll();

        // Register a test user
        User user = new User();
        user.setEmail("employee@tt.tn");
        user.setNom("Nom");
        user.setPrenom("Prenom");
        user.setMatricule("M123");
        user.setPassword(passwordEncoder.encode("supersecret"));
        user.setRole(User.UserRole.PERSONNEL);
        user.setIsActive(true);
        userRepository.save(user);
    }

    @Test
    public void login_success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("employee@tt.tn");
        request.setPassword("supersecret");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.role", is("PERSONNEL")))
                .andExpect(jsonPath("$.email", is("employee@tt.tn")));
    }

    @Test
    public void login_wrongPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("employee@tt.tn");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void register_success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setNom("New");
        request.setPrenom("User");
        request.setMatricule("M999");
        request.setEmail("newuser@tt.tn");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", containsString("Inscription réussie")));
    }
}
