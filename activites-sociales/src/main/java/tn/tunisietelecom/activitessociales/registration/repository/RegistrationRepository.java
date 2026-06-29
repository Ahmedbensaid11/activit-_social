package tn.tunisietelecom.activitessociales.registration.repository;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;

import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    boolean existsByUserIdAndActivityId(Long userId, Long activityId);
    Optional<Registration> findByUserIdAndActivityId(Long userId, Long activityId);
    Page<Registration> findByUserId(Long userId, Pageable pageable);

    @Query("""
            select r from Registration r
            join fetch r.user
            join fetch r.activity a
            join fetch a.activityType
            where r.id = :id
            """)
    Optional<Registration> findByIdWithDetails(@Param("id") Long id);

    Page<Registration> findByActivityId(Long activityId, Pageable pageable);
    Page<Registration> findByStatus(Registration.RegistrationStatus status, Pageable pageable);
    Page<Registration> findByActivityIdAndStatus(Long activityId, Registration.RegistrationStatus status, Pageable pageable);

    /**
     * Sum of seat_count for a given activity + status (replaces simple count).
     * This correctly handles family groups taking multiple seats.
     */
    @Query("select coalesce(sum(r.seatCount), 0) from Registration r where r.activity.id = :activityId and r.status = :status")
    long sumSeatsByActivityIdAndStatus(@Param("activityId") Long activityId, @Param("status") Registration.RegistrationStatus status);

    /**
     * Number of seats already approved — used for the "places restantes" display.
     */
    @Query("select coalesce(sum(r.seatCount), 0) from Registration r where r.activity.id = :activityId and r.status <> 'REJECTED'")
    long sumReservedSeats(@Param("activityId") Long activityId);

    @Query("""
            select r from Registration r
            where (:activityId is null or r.activity.id = :activityId)
              and (:status is null or r.status = :status)
              and (:employee is null or lower(r.user.email) like lower(concat('%', :employee, '%'))
                   or lower(r.user.nom) like lower(concat('%', :employee, '%'))
                   or lower(r.user.prenom) like lower(concat('%', :employee, '%'))
                   or lower(r.user.matricule) like lower(concat('%', :employee, '%')))
            """)
    Page<Registration> searchAdmin(
            @Param("activityId") Long activityId,
            @Param("status") Registration.RegistrationStatus status,
            @Param("employee") String employee,
            Pageable pageable
    );
}