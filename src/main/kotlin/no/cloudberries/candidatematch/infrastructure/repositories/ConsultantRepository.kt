package no.cloudberries.candidatematch.infrastructure.repositories

import no.cloudberries.candidatematch.infrastructure.entities.ConsultantEntity
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.jpa.repository.QueryHints
import org.springframework.stereotype.Repository
import jakarta.persistence.QueryHint
import org.springframework.data.repository.query.Param
import no.cloudberries.candidatematch.domain.candidate.Skill
import no.cloudberries.candidatematch.service.skills.ConsultantSkillReader

@Repository
interface ConsultantRepository : JpaRepository<ConsultantEntity, Long>, ConsultantSkillReader {
    fun findByUserId(userId: String): ConsultantEntity?
    fun findByNameContainingIgnoreCase(name: String, pageable: Pageable): Page<ConsultantEntity>

    // Flat projections to avoid instantiating entities (no-arg constructor not required)
    @Query("select c.id as id, c.userId as userId, c.name as name, c.cvId as cvId from ConsultantEntity c")
    fun findAllFlat(): List<ConsultantFlatView>

    @Query(
        value = "select c.id as id, c.userId as userId, c.name as name, c.cvId as cvId from ConsultantEntity c",
        countQuery = "select count(c) from ConsultantEntity c"
    )
    fun findAllFlat(pageable: Pageable): Page<ConsultantFlatView>

    @Query("select c.id as consultantId, s as skill from ConsultantEntity c left join c.skills s where c.id in :ids")
    fun findSkillsByConsultantIds(@Param("ids") ids: Collection<Long>): List<ConsultantSkillRow>

    // --- ConsultantSkillReader implementation ---
    @Query(
        "select new no.cloudberries.candidatematch.service.skills.SkillAggregateRow(" +
            " cast(s as string), c.userId, c.name, c.cvId) " +
            "from ConsultantEntity c join c.skills s"
    )
    override fun findAllSkillAggregates(): List<no.cloudberries.candidatematch.service.skills.SkillAggregateRow>

    @Query(
        "select new no.cloudberries.candidatematch.service.skills.SkillAggregateRow(" +
            " cast(s as string), c.userId, c.name, c.cvId) " +
            "from ConsultantEntity c join c.skills s " +
            "where (:skills is null or s in :skills)"
    )
    override fun findSkillAggregates(
        @Param("skills") skills: Collection<no.cloudberries.candidatematch.domain.candidate.Skill>?
    ): List<no.cloudberries.candidatematch.service.skills.SkillAggregateRow>
}

// Projection types
interface ConsultantFlatView {
    fun getId(): Long
    fun getUserId(): String
    fun getName(): String
    fun getCvId(): String
}
interface ConsultantSkillRow {
    fun getConsultantId(): Long
    fun getSkill(): Skill?
}
