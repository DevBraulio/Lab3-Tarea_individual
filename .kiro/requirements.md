# Requirements Document

## Introduction

Esta aplicación web permite a los usuarios consultar el pronóstico del clima de cualquier ciudad del mundo. El usuario ingresa el nombre de una ciudad, la aplicación la convierte a coordenadas geográficas mediante la API de geocodificación de Open-Meteo, y luego consulta el pronóstico del clima usando dichas coordenadas. Los resultados muestran temperatura, humedad y precipitaciones.

## Glossary

- **App**: La aplicación web de pronóstico del clima.
- **User**: La persona que interactúa con la aplicación a través del navegador.
- **City_Input**: El campo de texto donde el usuario ingresa el nombre de la ciudad.
- **Geocoding_API**: El servicio de geocodificación de Open-Meteo (`https://geocoding-api.open-meteo.com/v1/search`) que convierte nombres de ciudades en coordenadas geográficas.
- **Weather_API**: El servicio de pronóstico del clima de Open-Meteo (`https://api.open-meteo.com/v1/forecast`) que retorna datos meteorológicos a partir de coordenadas geográficas.
- **Coordinates**: La latitud y longitud geográfica de una ciudad devueltas por la Geocoding_API.
- **Forecast**: El conjunto de datos meteorológicos (temperatura, humedad y precipitaciones) retornados por la Weather_API.
- **Forecast_Display**: El componente de la interfaz que muestra el Forecast al usuario.
- **Error_Display**: El componente de la interfaz que muestra mensajes de error al usuario.

---

## Requirements

### Requirement 1: Entrada del nombre de ciudad

**User Story:** Como usuario, quiero ingresar el nombre de una ciudad en un campo de texto, para poder consultar el pronóstico del clima de esa ciudad.

#### Acceptance Criteria

1. THE App SHALL mostrar un campo de texto (City_Input) y un botón de búsqueda en la pantalla principal al iniciar la aplicación, siendo estos los únicos controles de entrada disponibles.
2. WHEN el usuario escribe en el City_Input, THE App SHALL aceptar letras (incluyendo acentos y diacríticos), espacios, guiones y puntos, con un máximo de 100 caracteres.
3. WHEN el usuario envía el formulario con el City_Input vacío o compuesto únicamente de espacios en blanco, THE Error_Display SHALL mostrar el mensaje "Por favor, ingresa el nombre de una ciudad".
4. WHEN el usuario envía el formulario, THE App SHALL eliminar los espacios en blanco al inicio y al final del valor del City_Input; si el valor resultante está vacío, THE Error_Display SHALL mostrar el mensaje de error correspondiente sin realizar ninguna petición a la Geocoding_API.
5. WHEN el usuario presiona la tecla Enter mientras el City_Input está enfocado, THE App SHALL enviar el formulario con el mismo comportamiento que al hacer clic en el botón de búsqueda.

---

### Requirement 2: Geocodificación de la ciudad

**User Story:** Como usuario, quiero que la aplicación convierta automáticamente el nombre de la ciudad a coordenadas geográficas, para que no tenga que buscar latitud y longitud manualmente.

#### Acceptance Criteria

1. WHEN el usuario envía el formulario con un nombre de ciudad que contiene entre 1 y 100 caracteres no blancos, THE App SHALL realizar una petición a la Geocoding_API usando el nombre de ciudad como parámetro de búsqueda.
2. WHEN la Geocoding_API retorna al menos un resultado, THE App SHALL usar las Coordinates del primer resultado para consultar la Weather_API.
3. IF la Geocoding_API retorna una lista de resultados vacía, THEN THE Error_Display SHALL mostrar un mensaje de error indicando que la ciudad no fue encontrada y solicitando al usuario que verifique el nombre.
4. IF la petición a la Geocoding_API falla por un error de red o por un error del servidor de la Geocoding_API, THEN THE Error_Display SHALL mostrar un mensaje de error indicando que el servicio de geocodificación no está disponible y solicitando al usuario que reintente más tarde.
5. WHEN el App realiza una petición a la Geocoding_API, THE App SHALL limitar la respuesta a un único resultado.
6. IF el usuario envía el formulario con un nombre de ciudad vacío o compuesto únicamente de espacios en blanco, THEN THE Error_Display SHALL mostrar un mensaje de error indicando que el nombre de la ciudad es requerido, sin realizar ninguna petición a la Geocoding_API.

---

### Requirement 3: Consulta del pronóstico del clima

**User Story:** Como usuario, quiero que la aplicación consulte automáticamente el pronóstico del clima usando las coordenadas de la ciudad, para obtener datos meteorológicos precisos.

#### Acceptance Criteria

1. WHEN las Coordinates están disponibles, THE App SHALL realizar una petición a la Weather_API incluyendo latitud, longitud, temperatura, humedad relativa y precipitación en un plazo máximo de 10 segundos.
2. WHEN la Weather_API retorna una respuesta exitosa, THE App SHALL extraer los valores de temperatura en grados Celsius, humedad relativa como porcentaje entre 0 y 100, y precipitación en milímetros del objeto `current` de la respuesta.
3. WHILE la petición a la Weather_API está en curso, THE App SHALL mostrar un indicador visual de carga hasta recibir respuesta o alcanzar el tiempo límite de 10 segundos.
4. IF la petición a la Weather_API falla por un error de red, THEN THE Error_Display SHALL mostrar un mensaje indicando que no fue posible obtener el pronóstico y que el usuario puede intentarlo más tarde.
5. IF la Weather_API retorna un código de error HTTP (4xx o 5xx), THEN THE Error_Display SHALL mostrar un mensaje indicando que el servicio de clima no está disponible en ese momento.
6. IF la petición a la Weather_API no recibe respuesta dentro de 10 segundos, THEN THE App SHALL cancelar la petición y THE Error_Display SHALL mostrar un mensaje indicando que el servicio tardó demasiado en responder.

---

### Requirement 4: Visualización del pronóstico

**User Story:** Como usuario, quiero ver el pronóstico del clima de la ciudad consultada con temperatura, humedad y precipitaciones, para tomar decisiones informadas sobre mis actividades.

#### Acceptance Criteria

1. IF la Weather_API retorna una respuesta exitosa, THEN THE Forecast_Display SHALL mostrar el nombre de la ciudad consultada.
2. IF la Weather_API retorna una respuesta exitosa, THEN THE Forecast_Display SHALL mostrar la temperatura en grados Celsius con precisión de un decimal y la unidad de medida visible (°C), con valores en el rango de -99.9°C a 99.9°C.
3. IF la Weather_API retorna una respuesta exitosa, THEN THE Forecast_Display SHALL mostrar la humedad relativa como un valor entero en el rango de 0% a 100% con la unidad de medida visible (%).
4. IF la Weather_API retorna una respuesta exitosa, THEN THE Forecast_Display SHALL mostrar las precipitaciones en milímetros con precisión de un decimal y la unidad de medida visible (mm), con valores en el rango de 0.0 mm a 999.9 mm.
5. IF la Weather_API retorna una respuesta exitosa pero uno o más campos de datos (temperatura, humedad o precipitaciones) no están disponibles en la respuesta, THEN THE Forecast_Display SHALL mostrar un indicador textual de dato no disponible en lugar del valor ausente.
6. WHILE una petición a la Geocoding_API o a la Weather_API está en progreso, THE App SHALL mostrar un indicador de carga que ocupe un área mínima de 24×24 píxeles y permanezca visible hasta que la petición concluya.
7. WHEN se inicia una nueva búsqueda, THE App SHALL ocultar cualquier Forecast_Display o Error_Display previo antes de mostrar el indicador de carga.

---

### Requirement 5: Manejo de errores de respuesta inesperada

**User Story:** Como usuario, quiero recibir mensajes claros cuando algo falla, para saber qué ocurrió y poder intentarlo nuevamente.

#### Acceptance Criteria

1. IF la respuesta de la Geocoding_API no contiene el campo `results` o dicho campo es nulo, THEN THE Error_Display SHALL mostrar un mensaje de error indicando que la respuesta del servicio de geocodificación fue inesperada.
2. IF la respuesta de la Weather_API no contiene el campo `current` o dicho campo es nulo, THEN THE Error_Display SHALL mostrar un mensaje de error indicando que la respuesta del servicio de clima fue inesperada.
3. WHEN THE Error_Display muestra un mensaje, THE App SHALL ocultar el Forecast_Display en el mismo ciclo de renderizado, en un plazo máximo de 100 ms.
4. WHEN THE Forecast_Display muestra datos, THE App SHALL ocultar el Error_Display en el mismo ciclo de renderizado, en un plazo máximo de 100 ms.
5. WHEN THE Error_Display muestra un mensaje de error, THE App SHALL mantener el City_Input habilitado y enfocado para que el usuario pueda corregir su búsqueda y reintentar sin necesidad de recargar la página.
