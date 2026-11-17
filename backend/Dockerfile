# Imagen de la API HuertoHogar (multi-stage: compila con JDK y ejecuta solo con JRE).

# ---------- 1) Compilación ----------
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Primero solo lo necesario para descargar dependencias: Docker cachea esta capa
# y no vuelve a descargar todo si solo cambia el código.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q -DskipTests package

# ---------- 2) Ejecución ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# Usuario sin privilegios: la app no corre como root dentro del contenedor.
RUN useradd --system --uid 1001 spring
USER spring

COPY --from=build /app/target/huertohogar-api.jar app.jar

# Memoria acotada para una EC2 pequeña (se puede cambiar con la variable JAVA_OPTS).
ENV JAVA_OPTS="-Xms256m -Xmx512m"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
