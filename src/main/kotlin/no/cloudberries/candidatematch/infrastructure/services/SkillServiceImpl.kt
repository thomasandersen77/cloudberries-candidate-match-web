package no.cloudberries.candidatematch.infrastructure.services

import no.cloudberries.candidatematch.domain.candidate.*
import no.cloudberries.candidatematch.infrastructure.entities.*
import no.cloudberries.candidatematch.infrastructure.repositories.*
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class SkillServiceImpl(
    private val skillRepository: SkillRepository,
    private val consultantSkillRepository: ConsultantSkillRepository,
    private val cvProjectSkillRepository: CvProjectSkillRepository,
    private val consultantRepository: ConsultantRepository
) : SkillService {

    override fun ensureSkillExists(skillName: String): Long {
        val trimmedName = skillName.trim()
        val existing = skillRepository.findByNameIgnoreCase(trimmedName)
        return existing?.id ?: skillRepository.save(SkillEntity(name = trimmedName)).id!!
    }

    @Transactional(readOnly = true)
    override fun getConsultantSkills(consultantId: Long): List<Skill> {
        val skillEntities = consultantSkillRepository.findByConsultantId(consultantId)
        val skillIds = skillEntities.map { it.skillId }
        val skillNameMap = skillRepository.findAllById(skillIds).associate { it.id!! to it.name }
        
        return skillEntities.map { skillEntity ->
            Skill(
                name = skillNameMap[skillEntity.skillId] ?: "Unknown",
                durationInYears = skillEntity.durationYears,
                acquiredInProject = skillEntity.acquiredInProject
            )
        }
    }

    override fun updateConsultantSkills(consultantId: Long, skills: List<Skill>) {
        // Remove existing skills
        consultantSkillRepository.deleteByConsultantId(consultantId)
        
        // Add new skills
        skills.forEach { skill ->
            val skillId = ensureSkillExists(skill.name)
            consultantSkillRepository.save(
                ConsultantSkillEntity(
                    consultantId = consultantId,
                    skillId = skillId,
                    durationYears = skill.durationInYears,
                    acquiredInProject = skill.acquiredInProject
                )
            )
        }
    }

    @Transactional(readOnly = true)
    override fun getProjectSkills(projectExperienceId: Long): List<Skill> {
        val projectSkillEntities = cvProjectSkillRepository.findByProjectExperienceId(projectExperienceId)
        val skillIds = projectSkillEntities.map { it.skillId }
        val skillNameMap = skillRepository.findAllById(skillIds).associate { it.id!! to it.name }
        
        return projectSkillEntities.map { projectSkill ->
            Skill(
                name = skillNameMap[projectSkill.skillId] ?: "Unknown",
                durationInYears = projectSkill.durationYears
            )
        }
    }

    override fun updateProjectSkills(projectExperienceId: Long, skills: List<Skill>) {
        // Remove existing skills
        cvProjectSkillRepository.deleteByProjectExperienceId(projectExperienceId)
        
        // Add new skills
        skills.forEach { skill ->
            val skillId = ensureSkillExists(skill.name)
            cvProjectSkillRepository.save(
                CvProjectSkillEntity(
                    projectExperienceId = projectExperienceId,
                    skillId = skillId,
                    durationYears = skill.durationInYears
                )
            )
        }
    }

    @Transactional(readOnly = true)
    override fun aggregateSkillsAcrossConsultants(skillFilters: List<String>?): List<SkillAggregate> {
        val consultantSkills = if (skillFilters.isNullOrEmpty()) {
            consultantSkillRepository.findAll()
        } else {
            val skillEntities = skillRepository.findByNameIn(skillFilters)
            val skillIds = skillEntities.mapNotNull { it.id }
            consultantSkillRepository.findAll().filter { it.skillId in skillIds }
        }
        
        val consultantIds = consultantSkills.map { it.consultantId }.distinct()
        val consultants = consultantRepository.findAllById(consultantIds)
            .associateBy { it.id!! }
        
        val skillIds = consultantSkills.map { it.skillId }.distinct()
        val skills = skillRepository.findAllById(skillIds).associateBy { it.id!! }
        
        return consultantSkills
            .groupBy { it.skillId }
            .mapNotNull { (skillId, skillEntities) ->
                val skill = skills[skillId] ?: return@mapNotNull null
                
                val consultantInfos = skillEntities.mapNotNull { skillEntity ->
                    val consultant = consultants[skillEntity.consultantId] ?: return@mapNotNull null
                    ConsultantSkillInfo(
                        userId = consultant.userId,
                        name = consultant.name,
                        cvId = consultant.cvId,
                        durationYears = skillEntity.durationYears,
                        acquiredInProject = skillEntity.acquiredInProject
                    )
                }
                
                SkillAggregate(
                    skillName = skill.name,
                    consultantCount = consultantInfos.size,
                    consultants = consultantInfos
                )
            }
            .sortedBy { it.skillName }
    }
}