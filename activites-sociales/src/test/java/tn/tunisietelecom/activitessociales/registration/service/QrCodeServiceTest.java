package tn.tunisietelecom.activitessociales.registration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class QrCodeServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    private QrCodeService qrCodeService;

    @BeforeEach
    public void setup() {
        qrCodeService = new QrCodeService(objectMapper);
        // Set properties since @Value is not loaded in unit tests
        ReflectionTestUtils.setField(qrCodeService, "uploadDir", "target/test-uploads/");
    }

    @Test
    public void testGenerateQrCode_returnsPath() throws Exception {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("Excursion");

        Registration registration = new Registration();
        registration.setId(999L);
        registration.setUser(user);
        registration.setActivity(activity);

        when(objectMapper.writeValueAsString(any())).thenReturn("{\"registrationId\":999}");

        // Act
        String qrPath = qrCodeService.generateQrCode(registration);

        // Assert
        assertNotNull(qrPath);
        assertTrue(qrPath.contains("registration-999.png"));

        // Verify the QR image actually exists on disk in target folder
        Path targetFile = Paths.get("target/test-uploads/qrcodes/registration-999.png").toAbsolutePath();
        assertTrue(Files.exists(targetFile));

        // Cleanup
        Files.deleteIfExists(targetFile);
    }
}
