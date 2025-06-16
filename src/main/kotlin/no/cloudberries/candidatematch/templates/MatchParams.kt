package no.cloudberries.candidatematch.templates

data class MatchParams(
    val cv: String,
    val request: String,
    val consultantName: String
)

fun renderTemplate(template: String, params: MatchParams): String {
    return template
        .replace("{{cv}}", params.cv)
        .replace("{{request}}", params.request)
        .replace("{{consultantName}}", params.consultantName)
}