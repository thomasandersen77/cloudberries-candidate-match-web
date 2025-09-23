package no.cloudberries.candidatematch.controllers.consultants

import no.cloudberries.candidatematch.service.consultants.SyncConsultantService
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/consultants/sync")
class ConsultantSyncController(
    private val syncService: SyncConsultantService,
) {
    data class SyncResponse(val total: Int, val succeeded: Int, val failed: Int)

    @PostMapping("/run")
    fun syncAll(): SyncResponse {
        val res = syncService.syncAll()
        return SyncResponse(res.total, res.succeeded, res.failed)
    }

    @PostMapping("/{userId}/{cvId}")
    fun syncOne(@PathVariable userId: String, @PathVariable cvId: String): SyncResponse {
        val res = syncService.syncOne(userId)
        return SyncResponse(res.total, res.succeeded, res.failed)
    }
}
