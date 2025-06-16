package no.cloudberries.candidatematch.domain.customer

class Customer(
    val name: String,
) {
    val projects: MutableList<Project> = mutableListOf()

    fun addProject(project: Project) {
        projects.add(project)
    }



}