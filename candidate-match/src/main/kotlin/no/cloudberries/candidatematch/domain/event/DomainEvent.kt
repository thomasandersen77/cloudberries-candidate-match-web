package no.cloudberries.candidatematch.domain.event

import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Component
import java.time.Instant


interface DomainEvent {
    val occurredOn: Instant
}

interface DomainEventPublisher {
    fun publish(event: DomainEvent)
    fun publishAll(events: Collection<DomainEvent>)
}

@Component
class DomainEventPublisherImpl(
    private val applicationEventPublisher: ApplicationEventPublisher
) : DomainEventPublisher {

    override fun publish(event: DomainEvent) {
        applicationEventPublisher.publishEvent(event)
    }

    override fun publishAll(events: Collection<DomainEvent>) {
        events.forEach { publish(it) }
    }
}