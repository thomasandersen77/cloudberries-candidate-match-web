package no.cloudberries.candidatematch.infrastructure.repositories.consultant

import no.cloudberries.candidatematch.infrastructure.entities.consultant.*
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository interface CvKeyQualificationRepository : JpaRepository<CvKeyQualificationEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvKeyQualificationEntity>
}
@Repository interface CvEducationRepository : JpaRepository<CvEducationEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvEducationEntity>
}
@Repository interface CvWorkExperienceRepository : JpaRepository<CvWorkExperienceEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvWorkExperienceEntity>
}
@Repository interface CvProjectExperienceRepository : JpaRepository<CvProjectExperienceEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvProjectExperienceEntity>
}
@Repository interface CvProjectExperienceRoleRepository : JpaRepository<CvProjectExperienceRoleEntity, Long> {
    fun findByProjectExperienceIdIn(projectExperienceIds: Collection<Long>): List<CvProjectExperienceRoleEntity>
}
@Repository interface CvProjectExperienceSkillRepository : JpaRepository<CvProjectExperienceSkillEntity, Long> {
    fun findByProjectExperienceIdIn(projectExperienceIds: Collection<Long>): List<CvProjectExperienceSkillEntity>
}
@Repository interface CvCertificationRepository : JpaRepository<CvCertificationEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvCertificationEntity>
}
@Repository interface CvCourseRepository : JpaRepository<CvCourseEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvCourseEntity>
}
@Repository interface CvLanguageRepository : JpaRepository<CvLanguageEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvLanguageEntity>
}
@Repository interface CvSkillCategoryRepository : JpaRepository<CvSkillCategoryEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvSkillCategoryEntity>
}
@Repository interface CvSkillInCategoryRepository : JpaRepository<CvSkillInCategoryEntity, Long> {
    fun findBySkillCategoryIdIn(categoryIds: Collection<Long>): List<CvSkillInCategoryEntity>
}
@Repository interface CvAttachmentRepository : JpaRepository<CvAttachmentEntity, Long> {
    fun findByCvIdIn(cvIds: Collection<Long>): List<CvAttachmentEntity>
}
