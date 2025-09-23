package no.cloudberries.candidatematch.service.consultants

import no.cloudberries.candidatematch.controllers.consultants.*
import no.cloudberries.candidatematch.infrastructure.entities.consultant.*
import no.cloudberries.candidatematch.infrastructure.repositories.ConsultantRepository
import no.cloudberries.candidatematch.infrastructure.repositories.consultant.*
import org.springframework.stereotype.Service

@Service
class ConsultantWithCvService(
    private val consultantRepository: ConsultantRepository,
    private val consultantCvRepository: ConsultantCvRepository,
    private val cvKeyQualificationRepository: CvKeyQualificationRepository,
    private val cvEducationRepository: CvEducationRepository,
    private val cvWorkExperienceRepository: CvWorkExperienceRepository,
    private val cvProjectExperienceRepository: CvProjectExperienceRepository,
    private val cvProjectExperienceRoleRepository: CvProjectExperienceRoleRepository,
    private val cvProjectExperienceSkillRepository: CvProjectExperienceSkillRepository,
    private val cvCertificationRepository: CvCertificationRepository,
    private val cvCourseRepository: CvCourseRepository,
    private val cvLanguageRepository: CvLanguageRepository,
    private val cvSkillCategoryRepository: CvSkillCategoryRepository,
    private val cvSkillInCategoryRepository: CvSkillInCategoryRepository,
    private val cvAttachmentRepository: CvAttachmentRepository,
) {

    fun getAllConsultantsWithCvs(onlyActiveCv: Boolean = false): List<ConsultantWithCvDto> {
        val flats = consultantRepository.findAllFlat()
        if (flats.isEmpty()) return emptyList()
        val ids: List<Long> = flats.map { it.getId() }
        val skillRows: List<no.cloudberries.candidatematch.infrastructure.repositories.ConsultantSkillRow> = consultantRepository.findSkillsByConsultantIds(ids)
        val skills: Map<Long, List<String>> = skillRows.groupBy({ row -> row.getConsultantId() }, { row -> row.getSkill()?.name })
            .mapValues { entry -> entry.value.filterNotNull().sorted() }
        return assembleForFlat(flats, skills, onlyActiveCv)
    }

    fun getConsultantsWithCvsPaged(pageable: org.springframework.data.domain.Pageable, onlyActiveCv: Boolean = false): org.springframework.data.domain.Page<ConsultantWithCvDto> {
        val page = consultantRepository.findAllFlat(pageable)
        if (page.isEmpty) {
            return org.springframework.data.domain.PageImpl(emptyList(), pageable, 0)
        }
        val ids: List<Long> = page.content.map { it.getId() }
        val skillRows: List<no.cloudberries.candidatematch.infrastructure.repositories.ConsultantSkillRow> = consultantRepository.findSkillsByConsultantIds(ids)
        val skills: Map<Long, List<String>> = skillRows.groupBy({ row -> row.getConsultantId() }, { row -> row.getSkill()?.name })
            .mapValues { entry -> entry.value.filterNotNull().sorted() }
        val dtos = assembleForFlat(page.content, skills, onlyActiveCv)
        return org.springframework.data.domain.PageImpl(dtos, pageable, page.totalElements)
    }

    private fun assembleForFlat(
        flats: List<no.cloudberries.candidatematch.infrastructure.repositories.ConsultantFlatView>,
        skillsByConsultant: Map<Long, List<String>>,
        onlyActiveCv: Boolean,
    ): List<ConsultantWithCvDto> {
        val consultantIds: List<Long> = flats.map { it.getId() }
        val cvs = if (onlyActiveCv) {
            consultantCvRepository.findByConsultantIdInAndActiveTrue(consultantIds)
        } else {
            consultantCvRepository.findByConsultantIdIn(consultantIds)
        }
        if (cvs.isEmpty()) {
            return flats.map { f ->
                ConsultantWithCvDto(
                    id = f.getId(),
                    userId = f.getUserId(),
                    name = f.getName(),
                    cvId = f.getCvId(),
                    skills = skillsByConsultant[f.getId()] ?: emptyList(),
                    cvs = emptyList()
                )
            }
        }

        val cvIds = cvs.mapNotNull { it.id }

        // Fetch all per-cv groups in batch
        val keyQualificationsByCv = cvKeyQualificationRepository.findByCvIdIn(cvIds)
            .groupBy { it.cvId }
        val educationByCv = cvEducationRepository.findByCvIdIn(cvIds).groupBy { it.cvId }
        val workExpByCv = cvWorkExperienceRepository.findByCvIdIn(cvIds).groupBy { it.cvId }
        val projExp = cvProjectExperienceRepository.findByCvIdIn(cvIds)
        val projExpByCv = projExp.groupBy { it.cvId }
        val projExpIds = projExp.mapNotNull { it.id }
        val rolesByProj = cvProjectExperienceRoleRepository.findByProjectExperienceIdIn(projExpIds)
            .groupBy { it.projectExperienceId }
        val skillsByProj = cvProjectExperienceSkillRepository.findByProjectExperienceIdIn(projExpIds)
            .groupBy { it.projectExperienceId }

        val certsByCv = cvCertificationRepository.findByCvIdIn(cvIds).groupBy { it.cvId }
        val coursesByCv = cvCourseRepository.findByCvIdIn(cvIds).groupBy { it.cvId }
        val languagesByCv = cvLanguageRepository.findByCvIdIn(cvIds).groupBy { it.cvId }
        val skillCats = cvSkillCategoryRepository.findByCvIdIn(cvIds)
        val skillCatsByCv = skillCats.groupBy { it.cvId }
        val skillCatIds = skillCats.mapNotNull { it.id }
        val skillInCatByCat = cvSkillInCategoryRepository.findBySkillCategoryIdIn(skillCatIds)
            .groupBy { it.skillCategoryId }
        val attachmentsByCv = cvAttachmentRepository.findByCvIdIn(cvIds).groupBy { it.cvId }

        val cvsByConsultant = cvs.groupBy { it.consultantId }

        return flats.map { f ->
            val consultantCvs = cvsByConsultant[f.getId()] ?: emptyList()
            ConsultantWithCvDto(
                id = f.getId(),
                userId = f.getUserId(),
                name = f.getName(),
                cvId = f.getCvId(),
                skills = skillsByConsultant[f.getId()] ?: emptyList(),
                cvs = consultantCvs.map { cv ->
                    ConsultantCvDto(
                        id = cv.id,
                        versionTag = cv.versionTag,
                        qualityScore = cv.qualityScore,
                        active = cv.active,
                        keyQualifications = keyQualificationsByCv[cv.id]  ?.map { it.toDto() } ?: emptyList(),
                        education = educationByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                        workExperience = workExpByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                        projectExperience = (projExpByCv[cv.id] ?: emptyList()).map { pe ->
                            ProjectExperienceDto(
                                customer = pe.customer,
                                description = pe.description,
                                longDescription = pe.longDescription,
                                fromYearMonth = pe.fromYearMonth,
                                toYearMonth = pe.toYearMonth,
                                roles = (rolesByProj[pe.id] ?: emptyList()).map { it.toDto() },
                                skills = (skillsByProj[pe.id] ?: emptyList()).mapNotNull { it.skill }
                            )
                        },
                        certifications = certsByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                        courses = coursesByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                        languages = languagesByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                        skillCategories = (skillCatsByCv[cv.id] ?: emptyList()).map { cat ->
                            SkillCategoryDto(
                                name = cat.name,
                                skills = (skillInCatByCat[cat.id] ?: emptyList()).map { it.toDto() }
                            )
                        },
                        attachments = attachmentsByCv[cv.id] ?.map { it.toDto() } ?: emptyList(),
                    )
                }
            )
        }
    }
}

private fun CvKeyQualificationEntity.toDto() = KeyQualificationDto(
    label = this.label,
    description = this.description,
)

private fun CvEducationEntity.toDto() = EducationDto(
    degree = this.degree,
    school = this.school,
    fromYearMonth = this.fromYearMonth,
    toYearMonth = this.toYearMonth,
)

private fun CvWorkExperienceEntity.toDto() = WorkExperienceDto(
    employer = this.employer,
    fromYearMonth = this.fromYearMonth,
    toYearMonth = this.toYearMonth,
)

private fun CvProjectExperienceRoleEntity.toDto() = ProjectRoleDto(
    name = this.name,
    description = this.description,
)

private fun CvCertificationEntity.toDto() = CertificationDto(
    name = this.name,
    year = this.year,
)

private fun CvCourseEntity.toDto() = CourseDto(
    name = this.name,
    organizer = this.organizer,
    year = this.year,
)

private fun CvLanguageEntity.toDto() = LanguageDto(
    name = this.name,
    level = this.level,
)

private fun CvSkillInCategoryEntity.toDto() = SkillInCategoryDto(
    name = this.name,
    durationYears = this.durationYears,
)

private fun CvAttachmentEntity.toDto() = AttachmentDto(
    fileName = this.fileName,
    url = this.url,
)
