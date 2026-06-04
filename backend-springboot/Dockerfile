FROM maven:3-eclipse-temurin-25-alpine AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -B -q
COPY src ./src
RUN ./mvnw package -DskipTests -B -q

FROM eclipse-temurin:25-jre-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 java && adduser --system --uid 1001 java
COPY --from=build --chown=java:java /app/target/*.jar app.jar
USER java
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]