# FLIGHTDELAYS®

### Descripción del proyecto y propuesta de valor

Tecnologías utilizadas:
- Lenguaje de programación: Java 21
- Lenguaje auxiliar: Python 3.11.9
- Gestor de dependencias: Apache Maven
- Base de datos: SQLite
- Mensajería asíncrona: Apache ActiveMQ
- IDE de desarrollo: IntelliJ IDEA

FlightDelays es una aplicación desarrollada en Java que permite registrar, procesar y correlacionar datos sobre retrasos de vuelos con las condiciones meteorológicas asociadas a los aeropuertos de origen y destino. El sistema se apoya en una arquitectura híbrida de persistencia que combina el uso de una base de datos relacional SQLite con un sistema de mensajería basado en ActiveMQ, lo que permite desacoplar procesos y facilitar el manejo asíncrono de eventos.

 --propuesta de valor--

### Justificación de la elección de APIs y estructura del Datamart 

### Configuración

1. Instalar el ActiveMQ en tu equipo.
2. La aplicación va con python 3.11.9 o superiores y comprobar si esta confidurado en las variables de entorno
3. Clonar el proyecto de Github en IntelliJ con la opción de **Repository URL**, pegando el link del repositorio.
4. Preparar los módulos para su funcionamiento: 
    - Ir al main de AviationStackFeeder:
        - **Argumentos en orden (salto de línea para separarlos):** 
            - Ruta absoluta de database.
            - Enlace URL de conexión TCP del broker de ActiveMQ. (Ejemplo: ```tcp://localhost:12345```)
            - Cuatro codigos IATA de aeropuertos, con los que operara el feeder. (Ejemplos: ```MAD``` ```AMS``` ```JFK``` ```ZRH```)*
            - Número indefinido, elegido por el consumidor, de apiKeys de AviationStack.*
    - Ir al main de Event-Store-Builder:
        - **Argumentos en orden (salto de línea para separarlos):** 
            - Enlace URL de conexión TCP del broker de ActiveMQ.
            - Tópicos del broker de mensajería de ActiveMQ. (Obligatoriamente deben ser: ```Flights``` y ```Weather```)*
    - Ir al main de Flight-Delay-Estimator
    - Ir al main de OpenWeatherMapFeeder:
        - **Argumentos en orden (salto de línea para separarlos):** 
            - Ruta absoluta de database.
            - Enlace URL de conexión TCP del broker de ActiveMQ.
            - Ruta relativa del archivo CSV de IATAs e ICAOs. (Debe ser obligatoriamente: ```openweathermap-feeder/src/main/resources/iata-icao.csv```)
            - Una apikey **PREMIUM** (Plan Estudiante, Professional o superior), proporcionadad por OpenWeatherMap.
            - Cuatro codigos IATA de aeropuertos, con los que operara el feeder. (Tienen que ser los mismos que se le pasen al otro feeder)*
    
    _* Separar con salto de línea_

### Tutorial de ejecución con ejemplos

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Modos de ejecución:

- **Uso del entorno de mensajería e invocación de la UI:**

    Es el modo principal de ejecución. Se realiza una conexión a un broker de mensajería (en nuestro caso ActiveMQ); para que ambos feeders puedan enviar información en formato de eventos, que consisten en mensajes inmutables que perduran a lo largo del tiempo. De esta forma, AviationStackFeeder recoge la información de vuelos activos; y al día siguiente, OpenWeatherMapFeeder suministrará los valores climáticos de los aeropuertos elegidos por el usuario en la configuración de la aplicación. La frecuencia de actualización es de 1 día para ambas APIs ().

    Todos estos eventos son almacenados en un EventStore, para llevar un historial de mensajes recibidos.

    A su vez, el Datamart concentra toda esa información que pudiera ser relevante para la propuesta de valor. Tiene la capacidad de, cargar el historico de mensajes alamacenados en el EventStore; y de recibir eventos en tiempo real, para hacer un posterior procesamiento de los eventos recibidos.

    En último lugar, el usuario podrá interactuar con la UI. (Ejemplos mostrados más abajo ↓)

    <br>

    1. Encender el broker de mensajería.
    2. Ejecutar el main de Event-Store-Builder (para el almacenamiento de eventos).
    3. Ejecutar el main de Flight-Delay-Estimator (para la carga de históricos y recepción de eventos en tiempo real, junto a la ejecución de la UI).
    4. Ejecutar el main de AviationStackFeeder (para el envio automático de información):
        
        ```FlightController controller = new FlightController(new AviationStackProvider(new AviationStackProcessor(Arrays.copyOfRange(args,6,args.length)),new FlightDeserializer(), Arrays.copyOfRange(args,2,6)), new FlightEventStore(args[1],new FlightEventSerializer(),new FlightEventMapper()), new TaskScheduler());```

        ```controller.execute();```

    5. Ejecutar el main de OpenWeatherMapFeeder:

        ```WeatherController controller = new WeatherController(new OpenWeatherMapProvider(new OpenWeatherMapProcessor(args[3]),new WeatherDeserializer(), Arrays.copyOfRange(args,4,args.length)), new WeatherEventStore(args[1],new WeatherEventMapper(),new WeatherEventSerializer()), new TaskScheduler(), new AirportToCoordinates(args[2]), new UnixUtils());```

        ```controller.execute();```
    <br><br>

- **Guardado en SQLite:**

    Almacena en una base de datos de SQLite la información proveniente de las APIs (no se hace uso del Datamart, ni del EventStore, ni de la UI; simplemente escribe en la database).

    <br>

    1. Ejecutar el main de AviationStackFeeder:

        ```FlightController controller = new FlightController(new AviationStackProvider(new AviationStackProcessor(Arrays.copyOfRange(args,6,args.length)),new FlightDeserializer(), Arrays.copyOfRange(args,2,6)), new FlightSQLStore(args[0],new SQLConnection(),new SQLModifierFlights(), new FlightModelMapper()), new TaskScheduler());```

        ```controller.execute();```

    2. Ejecutar el main de OpenWeatherMapFeeder:

        ```WeatherController controller = new WeatherController(new OpenWeatherMapProvider(new OpenWeatherMapProcessor(args[3]),new WeatherDeserializer(), Arrays.copyOfRange(args,4,args.length)), new WeatherSQLStore(args[0],new SQLModifierWeather(), new SQLConnection(), new WeatherResultMapper()), new TaskScheduler(), new AirportToCoordinates(args[2]), new UnixUtils());```

        ```controller.execute();```


### Ejemplos de uso

- AviationStackFeeder:
    - **Envio de mensajes al broker** (habiendo ejecutado el main en modo ActiveMQ, pasara lo siguiente a la hora programada):
        
        [insertar foto]

    - **Guardado de información en SQLite** (habiendo ejecutado el main en modo SQLite, ocurrira esto):

        [insertar foto]

    Esta API podría dar algún error al ejecutar debido a errores internos dentro de ella, si eso ocurre lo más recomendado es esperar al día siguiente:

    <img src="https://github.com/user-attachments/assets/c74e2079-84b4-41ef-905a-8df83070c06c" width="650">

- OpenWeatherMapFeeder:
    - **Envio de mensajes al broker**:
        
        [insertar foto]
    
    - **Guardado de información en SQLite**

        [insertar foto]

- EventStoreBuilder:

    [insertar foto]

### Tutorial de uso de la UI

El usuario puede interactuar con la CLI de la siguiente forma:

- Introduce el IATA del aeropuerto 
- Introduce si ese aeropuerto se toma como de salida o de llegada
- Elige el modelo predictivo del que quieras ver el rendimiento (disponibles: ```LinearRegression``` ```KNNRegressor``` son los modelos que mejor se adaptan teóricamente)
- Elige entre realizar otra consulta (```s```) o cerrar la interfaz (```n```). <br>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="https://github.com/user-attachments/assets/a39c9455-56ad-4aee-845d-9764f9f3d583" width="650">

El Datamart comprobará con procesos programados periódicamente cada cinco minutos para verificar la incorporación de datos en tiempo real. Adicionalmente, cada treinta minutos se activará un procedimiento de conciliación y emparejamiento de datos entre las distintas fuentes de información, con el objetivo de garantizar su integridad y coherencia.

El usuario será notificado de la ejecución de estos procesos mediante mensajes de estado generados por el sistema, los cuales reflejan el progreso y los resultados de las tareas programadas.

### Arquitecturas del sistema y aplicación


![Sistema](https://github.com/user-attachments/assets/456f992f-c6a0-4869-b70a-77a686a54f0e)


[Diagrama de clases de AviationStackFeeder](https://github.com/user-attachments/assets/1ceb072a-f6bb-495c-b5a8-9f32a0e47996)

[Diagrama de clases de EventStoreBuilder](https://github.com/user-attachments/assets/e63bfc48-98ab-44e7-bdcc-f150614669ee)

[Diagrama de clases de OpenWeatherMapFeeder](https://github.com/user-attachments/assets/646d0868-2ed6-43eb-aceb-1aa0e33c4f02)

### Principios y patrones de diseño aplicados en cada módulo

En los feeders, la arquitectura implementada sigue un diseño modular de tipo hexagonal, lo que permite una clara separación entre el núcleo de la aplicación y sus interfaces externas, como bases de datos, APIs o interfaces de usuario. Esto facilita el desacoplamiento y mejora la flexibilidad del sistema. Cada módulo está diseñado conforme al Single Responsibility Principle, SRP, asegurando que cada componente tenga un propósito bien definido. Esto mejora la mantenibilidad, facilita las pruebas y permite realizar cambios sin afectar otras partes del sistema. Además, se aplica el Open/Closed Principle (OCP), permitiendo que los módulos puedan ser extendidos con nuevas funcionalidades sin necesidad de modificar el código existente, favoreciendo así la escalabilidad y el mantenimiento del sistema. 

Ejemplos de OCP:

```
public interface FlightStore {
    public void saveFlights (FlightResponse flightResponse);
}
```
```
public interface FlightProvider {
    FlightResponse flightProvider(String airportType, String airportIata);
    String[] getPreferredAirports();
}
```

Estas interfaces permiten que se puedan añadir nuevas tecnologías al código si surgiese la necesidad; y no haría falta modificar el resto del código. Por ejemplo, una implementación de FlightStore para guardar datos en Oracle o MySQL. Esta dinámica es idéntica en el otro feeder. Asimismo, se podría introducir otra tecnología de recolección de datos que no sea mediante APIs.
