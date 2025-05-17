# FLIGHTDELAYS®

### Descripción del proyecto y propuesta de valor

Este proyecto relaciona los retrasos de los vuelos tanto en los aeropuertos de llegada como los aeropuertos de salida, con los climas en dichos aeropuertos. 

### Justificación de la elección de APIs y estructura del Datamart

### Configuración

1. Clonar el proyecto de Github en IntelliJ con la opción de **Repository URL**, pegando el link del repositorio.
2. Preparar los módulos para su funcionamiento: 
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



### Tutorial de uso de la UI

El usuario puede interactuar con la CLI de la siguiente forma:

- Introduce el IATA del aeropuerto 
- Introduce si ese aeropuerto se toma como de salida o de llegada
- Elige el modelo predictivo del que quieras ver el rendimiento (disponibles: ```LinearRegression``` ```KNNRegressor``` son los modelos que mejor se adaptan teóricamente)
- Elige entre realizar otra consulta (```s```) o cerrar la interfaz (```n```). <br>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<img src="https://github.com/user-attachments/assets/a39c9455-56ad-4aee-845d-9764f9f3d583" width="650">

El Datamart comprobará con procesos programados periódicamente cada cinco minutos para verificar la incorporación de datos en tiempo real. Adicionalmente, cada treinta minutos se activará un procedimiento de conciliación y emparejamiento de datos entre las distintas fuentes de información, con el objetivo de garantizar su integridad y coherencia.

El usuario será notificado de la ejecución de estos procesos mediante mensajes de estado generados por el sistema, los cuales reflejan el progreso y los resultados de las tareas programadas.



