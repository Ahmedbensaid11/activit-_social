package tn.tunisietelecom.activitessociales.activity.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByActivityTypeId(Long activityTypeId);
    List<Activity> findByStatus(Activity.ActivityStatus status);
}
