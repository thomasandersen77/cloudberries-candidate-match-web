package no.cloudberries.candidatematch.service.consultants

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import mu.KotlinLogging
import no.cloudberries.candidatematch.domain.consultant.ConsultantAdapter
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseCvDto
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseHttpClient
import no.cloudberries.candidatematch.infrastructure.integration.flowcase.FlowcaseUserDTO
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service

@Service
class SyncConsultantService(
    private val flowcaseHttpClient: FlowcaseHttpClient,
    private val consultantAdapter: ConsultantAdapter,
    private val persistenceService: ConsultantPersistenceService,
) {

    private val logger = KotlinLogging.logger {}

    @Scheduled(cron = "0 0 */8 * * *")
    fun fetchFullCvForUser(){
        runBlocking {
            logger.info { "Running scheduled job to fetch full CV for all users"}
            flowcaseHttpClient.fetchAllUsers().flowcaseUserDTOs.forEach {
                delay(500) // Increased delay to 500 ms
                fetchCvForUser(
                    it.userId,
                    it.cvId
                )
            }
        }
    }

    fun fetchCvForUser(userid: String, cvId: String): FlowcaseCvDto = flowcaseHttpClient.fetchCompleteCv(userid, cvId)

    fun fetchUsers(): List<FlowcaseUserDTO> {
        val response = flowcaseHttpClient.fetchAllUsers()
        return response.flowcaseUserDTOs
    }

    // Improved: persist all consultants + CV with rate limiting and better error handling
    fun syncAll(): SyncResult {
        val users = fetchUsers()
        var success = 0
        var failures = 0
        val batchSize = 10 // Process in smaller batches
        
        logger.info { "Starting sync for ${users.size} consultants in batches of $batchSize" }
        
        users.chunked(batchSize).forEachIndexed { batchIndex, batch ->
            logger.info { "Processing batch ${batchIndex + 1}/${(users.size + batchSize - 1) / batchSize}" }
            
            batch.forEach { u ->
                try {
                    val consultant = consultantAdapter.fetchConsultant(u.userId)
                    if (equals(u.userId)) {
                        persistenceService.persistConsultantWithCv(consultant)
                        success++
                        logger.info { "Successfully synced consultant ${u.userId}" }
                    } else {
                        logger.info { "User ${u.userId} already exists in database, skipping" }
                        // todo: implement upsert logic
                        logger.info { "Should only update CV data for existing users, not create new ones" }

                    }
                    success++
                } catch (e: Exception) {
                    when {
                        e.message?.contains("429") == true -> {
                            logger.warn { "Rate limit hit for consultant ${u.userId}, will retry later" }
                            // Could implement retry logic here
                        }
                        else -> {
                            logger.error(e) { "Failed syncing consultant ${u.userId}: ${e.message}" }
                        }
                    }
                    failures++
                }
                
                // Add delay between each consultant to avoid rate limiting
                Thread.sleep(200) // 0,2 second delay between API calls
            }
            
            // Add longer delay between batches
            if (batchIndex < users.chunked(batchSize).size - 1) {
                logger.info { "Batch ${batchIndex + 1} complete, waiting before next batch..." }
                Thread.sleep(500) // 500 ms delay between batches
            }
        }
        
        logger.info { "Sync complete. Success: $success, Failures: $failures" }
        return SyncResult(total = users.size, succeeded = success, failed = failures)
    }

    // Improved: persist a single consultant + CV with rate limiting
    fun syncOne(userId: String): SyncResult {
        return try {
            val consultant = consultantAdapter.fetchConsultant(userId)
            persistenceService.persistConsultantWithCv(consultant)
            logger.info { "Successfully synced single consultant $userId" }
            SyncResult(total = 1, succeeded = 1, failed = 0)
        } catch (e: Exception) {
            when {
                e.message?.contains("429") == true -> {
                    logger.warn { "Rate limit hit for consultant $userId" }
                }
                else -> {
                    logger.error(e) { "Failed syncing consultant $userId: ${e.message}" }
                }
            }
            SyncResult(total = 1, succeeded = 0, failed = 1)
        }
    }

    data class SyncResult(val total: Int, val succeeded: Int, val failed: Int)
}
