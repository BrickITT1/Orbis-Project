FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY backend/target/backend.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]