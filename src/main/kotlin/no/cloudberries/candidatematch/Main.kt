package no.cloudberries.candidatematch

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class Main

fun main(args: Array<String>) {
    val context = SpringApplication.run(Main::class.java, *args)
    val beanNames = context.beanDefinitionNames
    for (beanName in beanNames) {
        println(beanName)
    }
}
