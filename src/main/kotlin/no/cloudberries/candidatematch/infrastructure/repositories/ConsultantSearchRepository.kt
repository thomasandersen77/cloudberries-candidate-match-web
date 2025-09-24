package no.cloudberries.candidatematch.infrastructure.repositories

import no.cloudberries.candidatematch.domain.consultant.RelationalSearchCriteria
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Repository

/**
 * Repository for advanced consultant search operations
 */
@Repository
class ConsultantSearchRepository(
    private val jdbcTemplate: JdbcTemplate
) {
    
    /**
     * Finds consultants using relational criteria with skills matching
     */
    fun findByRelationalCriteria(criteria: RelationalSearchCriteria, pageable: Pageable): Page<ConsultantFlatView> {
        val whereConditions = mutableListOf<String>()
        val parameters = mutableListOf<Any>()
        
        // Base query with consultant and CV data
        val baseSelect = """
            SELECT DISTINCT c.id as id, c.user_id as userId, c.name as name, c.cv_id as cvId
            FROM consultant c
            JOIN consultant_cv cc ON c.id = cc.consultant_id
        """.trimIndent()
        
        var joinClause = ""
        
        // Handle name search
        if (!criteria.name.isNullOrBlank()) {
            whereConditions.add("LOWER(c.name) LIKE LOWER(?)")
            parameters.add("%${criteria.name}%")
        }
        
        // Handle quality score filter
        if (criteria.minQualityScore != null) {
            whereConditions.add("cc.quality_score >= ?")
            parameters.add(criteria.minQualityScore)
        }
        
        // Handle active CV filter
        if (criteria.onlyActiveCv) {
            whereConditions.add("cc.active = true")
        }
        
        // Handle skills filtering - this is the complex part
        var skillCounter = 0
        
        // Skills that must ALL be present (AND condition)
        if (criteria.skillsAll.isNotEmpty()) {
            val skillsAllIds = getSkillIds(criteria.skillsAll)
            if (skillsAllIds.isNotEmpty()) {
                joinClause += """
                    JOIN consultant_skill cs_all ON c.id = cs_all.consultant_id
                """.trimIndent()
                whereConditions.add("cs_all.skill_id IN (${skillsAllIds.joinToString(",") { "?" }})")
                parameters.addAll(skillsAllIds)
                
                // Group by consultant and ensure all required skills are present
                val groupByClause = "GROUP BY c.id, c.user_id, c.name, c.cv_id, cc.quality_score, cc.active"
                val havingClause = "HAVING COUNT(DISTINCT cs_all.skill_id) >= ?"
                parameters.add(criteria.skillsAll.size)
                
                return executePagedQuery(baseSelect, joinClause, whereConditions, parameters, groupByClause, havingClause, pageable)
            }
        }
        
        // Skills where ANY can be present (OR condition)
        if (criteria.skillsAny.isNotEmpty()) {
            val skillsAnyIds = getSkillIds(criteria.skillsAny)
            if (skillsAnyIds.isNotEmpty()) {
                joinClause += """
                    JOIN consultant_skill cs_any ON c.id = cs_any.consultant_id
                """.trimIndent()
                whereConditions.add("cs_any.skill_id IN (${skillsAnyIds.joinToString(",") { "?" }})")
                parameters.addAll(skillsAnyIds)
            }
        }
        
        return executePagedQuery(baseSelect, joinClause, whereConditions, parameters, "", "", pageable)
    }
    
    /**
     * Finds consultants by semantic similarity using pgvector
     */
    fun findBySemanticSimilarity(
        embedding: DoubleArray, 
        provider: String,
        model: String,
        topK: Int,
        minQualityScore: Int? = null,
        onlyActiveCv: Boolean = false
    ): List<SemanticSearchResult> {
        
        val whereConditions = mutableListOf<String>()
        val parameters = mutableListOf<Any>()
        
        // Convert embedding to pgvector format
        val embeddingVector = embedding.joinToString(prefix = "[", postfix = "]") { it.toString() }
        
        val sql = """
            SELECT DISTINCT 
                c.id,
                c.user_id,
                c.name,
                c.cv_id,
                cc.quality_score,
                ce.embedding <-> ?::vector as distance
            FROM consultant c
            JOIN consultant_cv cc ON c.id = cc.consultant_id
            JOIN cv_embedding ce ON c.user_id = ce.user_id AND c.cv_id = ce.cv_id
            WHERE ce.provider = ? AND ce.model = ?
        """.trimIndent()
        
        parameters.add(embeddingVector)
        parameters.add(provider)
        parameters.add(model)
        
        // Add optional filters
        if (minQualityScore != null) {
            whereConditions.add("cc.quality_score >= ?")
            parameters.add(minQualityScore)
        }
        
        if (onlyActiveCv) {
            whereConditions.add("cc.active = true")
        }
        
        val finalSql = sql + 
            (if (whereConditions.isNotEmpty()) " AND " + whereConditions.joinToString(" AND ") else "") +
            " ORDER BY distance ASC LIMIT ?"
            
        parameters.add(topK)
        
        return jdbcTemplate.query(finalSql, parameters.toTypedArray()) { rs, _ ->
            SemanticSearchResult(
                id = rs.getLong("id"),
                userId = rs.getString("user_id"),
                name = rs.getString("name"),
                cvId = rs.getString("cv_id"),
                qualityScore = rs.getInt("quality_score"),
                distance = rs.getDouble("distance")
            )
        }
    }
    
    /**
     * Helper method to get skill IDs from skill names
     */
    private fun getSkillIds(skillNames: List<String>): List<Long> {
        if (skillNames.isEmpty()) return emptyList()
        
        val placeholders = skillNames.joinToString(",") { "?" }
        val sql = "SELECT id FROM skill WHERE UPPER(name) IN ($placeholders)"
        val upperCaseNames = skillNames.map { it.uppercase() }
        
        return jdbcTemplate.query(sql, upperCaseNames.toTypedArray()) { rs, _ ->
            rs.getLong("id")
        }
    }
    
    /**
     * Helper method to execute paged queries
     */
    private fun executePagedQuery(
        baseSelect: String,
        joinClause: String,
        whereConditions: List<String>,
        parameters: List<Any>,
        groupByClause: String,
        havingClause: String,
        pageable: Pageable
    ): Page<ConsultantFlatView> {
        
        val whereClause = if (whereConditions.isNotEmpty()) {
            "WHERE " + whereConditions.joinToString(" AND ")
        } else ""
        
        val orderBy = if (pageable.sort.isSorted) {
            "ORDER BY " + pageable.sort.map { "${it.property} ${it.direction}" }.joinToString(", ")
        } else {
            "ORDER BY c.name"
        }
        
        // Count query for pagination
        val countSql = """
            SELECT COUNT(*) FROM (
                $baseSelect 
                $joinClause 
                $whereClause 
                $groupByClause 
                $havingClause
            ) as counted
        """.trimIndent()
        
        val totalElements = jdbcTemplate.queryForObject(countSql, parameters.toTypedArray(), Long::class.java) ?: 0L
        
        // Data query with pagination
        val dataSql = """
            $baseSelect 
            $joinClause 
            $whereClause 
            $groupByClause 
            $havingClause 
            $orderBy 
            LIMIT ? OFFSET ?
        """.trimIndent()
        
        val dataParameters = parameters.toMutableList()
        dataParameters.add(pageable.pageSize)
        dataParameters.add(pageable.offset)
        
        val consultants: List<ConsultantFlatView> = jdbcTemplate.query(dataSql, dataParameters.toTypedArray()) { rs, _ ->
            object : ConsultantFlatView {
                override fun getId(): Long = rs.getLong("id")
                override fun getUserId(): String = rs.getString("userId")
                override fun getName(): String = rs.getString("name")
                override fun getCvId(): String = rs.getString("cvId")
            }
        } ?: emptyList()
        
        return PageImpl(consultants, pageable, totalElements)
    }
}

/**
 * Result object for semantic search
 */
data class SemanticSearchResult(
    val id: Long,
    val userId: String,
    val name: String,
    val cvId: String,
    val qualityScore: Int,
    val distance: Double
)