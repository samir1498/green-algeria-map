package com.greenalgeria.archunit;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(
    packages = "com.greenalgeria",
    importOptions = ImportOption.DoNotIncludeTests.class
)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domain_must_not_depend_on_higher_layers =
        noClasses()
            .that().resideInAnyPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..application..", "..infrastructure..", "..api..");

    @ArchTest
    static final ArchRule infrastructure_must_not_depend_on_application =
        noClasses()
            .that().resideInAnyPackage("..infrastructure..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..application..");

    @ArchTest
    static final ArchRule no_circular_dependencies =
        slices()
            .matching("com.greenalgeria.(*)..")
            .should().beFreeOfCycles();
}
