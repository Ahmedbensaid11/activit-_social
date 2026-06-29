package tn.tunisietelecom.activitessociales.rbac.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.tunisietelecom.activitessociales.rbac.entity.UserCustomRole;
import java.util.List;

public interface UserCustomRoleRepository extends JpaRepository<UserCustomRole, Long> {
    List<UserCustomRole> findByUserId(Long userId);
    void deleteByUserIdAndRoleId(Long userId, Long roleId);

    @Query("select ucr from UserCustomRole ucr join fetch ucr.role r join fetch r.permissions where ucr.user.id = :userId")
    List<UserCustomRole> findByUserIdWithPermissions(@Param("userId") Long userId);

    boolean existsByUserIdAndRoleId(Long userId, Long roleId);
}
