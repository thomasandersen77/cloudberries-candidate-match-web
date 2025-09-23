package no.cloudberries.candidatematch.service.consultants

import no.cloudberries.candidatematch.domain.consultant.Consultant
import no.cloudberries.candidatematch.domain.consultant.Cv
import no.cloudberries.candidatematch.infrastructure.adapters.toEntity
import no.cloudberries.candidatematch.infrastructure.entities.ConsultantEntity
import no.cloudberries.candidatematch.infrastructure.entities.consultant.*
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import no.cloudberries.candidatematch.infrastructure.repositories.consultant.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ConsultantPersistenceService(
    private val consultantRepository: ConsultantRepository,
    private val consultantCvRepository: ConsultantCvRepository,
    private val keyQualificationRepo: CvKeyQualificationRepository,
    private val educationRepo: CvEducationRepository,
    private val workExpRepo: CvWorkExperienceRepository,
    private val projExpRepo: CvProjectExperienceRepository,
    private val projRoleRepo: CvProjectExperienceRoleRepository,
    private val projSkillRepo: CvProjectExperienceSkillRepository,
    private val certRepo: CvCertificationRepository,
    private val courseRepo: CvCourseRepository,
    private val langRepo: CvLanguageRepository,
    private val skillCatRepo: CvSkillCategoryRepository,
    private val skillInCatRepo: CvSkillInCategoryRepository,
    private val attachmentRepo: CvAttachmentRepository,
) {

    @Transactional
    fun persistConsultantWithCv(consultant: Consultant): PersistResult {
        // Persist consultant core
        val savedConsultant = consultantRepository.save(consultant.toEntity())
        // Persist CV header
        val cvRow = consultantCvRepository.save(
            ConsultantCvEntity(
                consultantId = savedConsultant.id!!,
                versionTag = consultant.cv.id,
                qualityScore = consultant.cv.qualityScore,
                active = true,
            )
        )
        // Persist details
        persistCvDetails(cvRow.id!!, consultant.cv)
        return PersistResult(savedConsultant, cvRow)
    }

    private fun toYmString(y: java.time.YearMonth?): String? = y?.toString()

    private fun persistCvDetails(cvId: Long, cv: Cv) {
        // Key qualifications
        keyQualificationRepo.saveAll(cv.keyQualifications.map { k ->
            CvKeyQualificationEntity(
                cvId = cvId,
                label = k.label,
                description = k.description,
            )
        })
        // Education
        educationRepo.saveAll(cv.educations.map { e ->
            CvEducationEntity(
                cvId = cvId,
                degree = e.degree,
                school = e.school,
                fromYearMonth = toYmString(e.period.from),
                toYearMonth = toYmString(e.period.to),
            )
        })
        // Work experience
        workExpRepo.saveAll(cv.workExperiences.map { w ->
            CvWorkExperienceEntity(
                cvId = cvId,
                employer = w.employer,
                fromYearMonth = toYmString(w.period.from),
                toYearMonth = toYmString(w.period.to),
            )
        })
        // Project experiences
        val savedProj = projExpRepo.saveAll(cv.projectExperiences.map { p ->
            CvProjectExperienceEntity(
                cvId = cvId,
                customer = p.customer,
                description = p.description,
                longDescription = p.longDescription,
                fromYearMonth = toYmString(p.period.from),
                toYearMonth = toYmString(p.period.to),
            )
        })
        // Link roles and skills to each project experience in order
        cv.projectExperiences.forEachIndexed { idx, p ->
            val pe = savedProj[idx]
            projRoleRepo.saveAll(p.roles.map { r ->
                CvProjectExperienceRoleEntity(
                    projectExperienceId = pe.id!!,
                    name = r.name,
                    description = r.description,
                )
            })
            projSkillRepo.saveAll(p.skillsUsed.map { s ->
                CvProjectExperienceSkillEntity(
                    projectExperienceId = pe.id!!,
                    skill = s.name,
                )
            })
        }
        // Certifications
        certRepo.saveAll(cv.certifications.map { c ->
            CvCertificationEntity(
                cvId = cvId,
                name = c.name,
                year = c.year?.value,
            )
        })
        // Courses
        courseRepo.saveAll(cv.courses.map { c ->
            CvCourseEntity(
                cvId = cvId,
                name = c.name,
                organizer = c.organizer,
                year = c.year?.value,
            )
        })
        // Languages
        langRepo.saveAll(cv.languages.map { l ->
            CvLanguageEntity(
                cvId = cvId,
                name = l.name,
                level = l.level,
            )
        })
        // Skill categories + skills in category
        val savedCats = skillCatRepo.saveAll(cv.skillCategories.map { sc ->
            CvSkillCategoryEntity(
                cvId = cvId,
                name = sc.name,
            )
        })
        cv.skillCategories.forEachIndexed { idx, sc ->
            val cat = savedCats[idx]
            skillInCatRepo.saveAll(sc.skills.map { s ->
                CvSkillInCategoryEntity(
                    skillCategoryId = cat.id!!,
                    name = s.name,
                    durationYears = s.durationInYears,
                )
            })
        }
        // Attachments (none for now)
    }

    data class PersistResult(
        val consultant: ConsultantEntity,
        val cvHeader: ConsultantCvEntity,
    )
}
