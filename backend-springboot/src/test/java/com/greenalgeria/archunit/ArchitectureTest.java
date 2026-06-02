package com.greenalgeria.archunit;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Tag;

@Tag("arch")
@AnalyzeClasses(packages = "com.greenalgeria", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_must_not_depend_on_higher_layers = noClasses()
            .that()
            .resideInAnyPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..application..", "..infrastructure..", "..api..");

    @ArchTest
    static final ArchRule infrastructure_must_not_depend_on_application = noClasses()
            .that()
            .resideInAnyPackage("..infrastructure..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..application..");

    @ArchTest
    static final ArchRule no_circular_dependencies =
            slices().matching("com.greenalgeria.(*)..").should().beFreeOfCycles();

    @ArchTest
    static final ArchRule api_must_not_depend_on_domain = noClasses()
            .that()
            .resideInAnyPackage("..api..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..domain..")
            .ignoreDependency(
                    com.greenalgeria.storage.api.StorageController.class,
                    com.greenalgeria.storage.domain.StorageService.class);

    @ArchTest
    static final ArchRule application_must_not_depend_on_api = noClasses()
            .that()
            .resideInAnyPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..api..");

    @ArchTest
    static final ArchRule application_must_not_depend_on_infrastructure = noClasses()
            .that()
            .resideInAnyPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..");

    @ArchTest
    static final ArchRule api_must_not_depend_on_infrastructure = noClasses()
            .that()
            .resideInAnyPackage("..api..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..");
}
