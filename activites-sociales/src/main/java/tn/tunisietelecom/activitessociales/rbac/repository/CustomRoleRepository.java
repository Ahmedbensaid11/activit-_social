package tn.tunisietelecom.activitessociales.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.tunisietelecom.activitessociales.rbac.entity.CustomRole;
import java.util.List;

public interface CustomRoleRepository extends JpaRepository<CustomRole, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<CustomRole> findByActiveTrue();
}