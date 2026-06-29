package tn.tunisietelecom.activitessociales.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.tunisietelecom.activitessociales.rbac.entity.Permission;
import java.util.List;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByCategory(String category);
    boolean existsByCode(String code);
}