package no.cloudberries.candidatematch.domain.candidate

enum class Skill(val displayName: String) {
    JAVASCRIPT("JavaScript"),
    JAVA("Java"),
    KOTLIN("Kotlin"),
    PYTHON("Python"),

    // ... other skills
    REACT("React"),
    REACT_NATIVE("React Native"),
    ANGULAR("Angular"),
    GIT("Git"),
    SQL("SQL"),
    MSSQL("MS SQL"),
    POSTGRESQL("PostgreSQL"),
    NO_SQL("NoSQL"),
    CASSANDRA("Cassandra"),
    SPRING("Spring"),
    BACKEND("Backend"),
    ;

    companion object {
        fun fromString(value: String?): Skill? {
            if (value.isNullOrBlank()) return null
            
            // First try exact match
            return try {
                valueOf(value.uppercase())
            } catch (e: IllegalArgumentException) {
                // Try case-insensitive match
                entries.find {
                    it.name.equals(value, ignoreCase = true) || 
                    it.displayName.equals(value, ignoreCase = true) 
                }
            }
        }
    }
}
