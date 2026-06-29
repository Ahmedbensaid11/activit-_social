package tn.tunisietelecom.activitessociales.activitytype.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;

import java.util.Optional;

public interface ActivityTypeRepository extends JpaRepository<ActivityType, Long> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
    Optional<ActivityType> findByCodeIgnoreCase(String code);
}
