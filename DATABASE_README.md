# 📊 Sistema de Base de Datos de Métricas de Juegos

## Descripción
Este sistema almacena y gestiona todas las métricas de los juegos que los jugadores juegan, incluyendo:
- Nombre del participante
- Sesión
- Juego
- Nivel
- Aciertos, errores, puntuación
- Duración del juego
- Tiempo medio de respuesta
- Detalle de cada respuesta

---

## 📁 Archivos creados

### 1. **models.py**
Define la estructura de la base de datos con SQLAlchemy:
- Tabla `GameSession` con todos los campos necesarios
- Métodos para convertir a diccionario, guardar y obtener respuestas en JSON

### 2. **web_interface_portuguese.py** (modificado)
- Importa los modelos de BD
- Inicializa la BD SQLite (`game_metrics.db`)
- Crea dos endpoints:
  - `POST /save_game_metrics` - Guardar métricas
  - `GET /get_game_metrics` - Obtener métricas

### 3. **game_Chile.js** (modificado)
- Envía automáticamente las métricas al servidor cuando termina un juego
- Hace una llamada AJAX a `/save_game_metrics` con todos los datos

### 4. **query_metrics.py**
Script de utilidad para consultar y exportar datos

### 5. **requirements.txt**
Dependencias necesarias

---

## 🚀 Instalación y configuración

### Paso 1: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 2: Ejecutar el servidor Flask
Tu servidor Flask ya está configurado. Solo ejecuta:
```bash
python web_interface_portuguese.py
```

La base de datos se creará automáticamente en:
```
c:\...\Text_Interface\game_metrics.db
```

### Paso 3: Usar el sistema
1. Abre el navegador: `http://localhost:[puerto]/game_menu`
2. Selecciona sesión → Ingresa nombre → Juega
3. Al terminar, las métricas se guardan automáticamente en la BD

---

## 📊 Consultar los datos

### Opción A: Herramienta interactiva
```bash
python query_metrics.py
```
Esto abre un menú con opciones para:
- Ver todas las métricas
- Exportar a CSV/JSON
- Ver métricas de un jugador específico
- Ver estadísticas generales
- Limpiar datos

### Opción B: Línea de comandos
```bash
# Ver todas las métricas
python query_metrics.py show

# Exportar a CSV
python query_metrics.py csv

# Exportar a JSON
python query_metrics.py json game_metrics.json

# Ver métricas de un jugador
python query_metrics.py player "Juan"

# Ver estadísticas
python query_metrics.py stats

# Limpiar base de datos
python query_metrics.py clear
```

### Opción C: API REST
Hacer GET request a:
```
http://localhost:[puerto]/get_game_metrics
```

Con parámetros opcionales:
```
http://localhost:[puerto]/get_game_metrics?player_name=Juan&game_name=Atenção Ativa
```

---

## 🗄️ Estructura de la Base de Datos

### Tabla: game_sessions
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único |
| player_name | String | Nombre del jugador |
| session_name | String | Nombre de la sesión |
| game_name | String | Nombre del juego |
| game_level | String | Nivel jugado |
| hits | Integer | Aciertos |
| errors | Integer | Errores |
| score | Integer | Puntuación |
| game_duration | Float | Duración en segundos |
| avg_response_time | Float | Tiempo promedio en ms |
| responses_detail | Text (JSON) | Detalle de cada respuesta |
| created_at | DateTime | Fecha/hora de creación |
| updated_at | DateTime | Última actualización |

---

## 📝 Ejemplo de datos guardados

```json
{
  "id": 1,
  "player_name": "Juan",
  "session_name": "Sesión 1",
  "game_name": "Atenção Ativa",
  "game_level": "basic",
  "hits": 15,
  "errors": 2,
  "score": 15,
  "game_duration": 120.5,
  "avg_response_time": 2340.0,
  "responses_detail": [
    {
      "number": 1,
      "stimulus": "dog",
      "result": "Acierto",
      "responseTime": 2100
    },
    {
      "number": 2,
      "stimulus": "cat",
      "result": "Error",
      "responseTime": 3500
    }
  ],
  "created_at": "2026-02-27T10:30:45",
  "updated_at": "2026-02-27T10:30:45"
}
```

---

## 🔧 Troubleshooting

### Problema: "ModuleNotFoundError: No module named 'models'"
**Solución:** Asegúrate de que `models.py` está en el mismo directorio que `web_interface_portuguese.py`

### Problema: "Database is locked"
**Solución:** Cierra todas las conexiones a la BD. Si usas SQLite, solo una puede escribir a la vez.

### Problema: No se guardan las métricas
**Solución:** 
1. Abre la consola del navegador (F12) y verifica que `/save_game_metrics` responde
2. Revisa los logs del servidor Flask
3. Asegúrate de que el JS se cargó correctamente (sin errores de sintaxis)

---

## 🎯 Próximos pasos

Si necesitas:
- **Crear un dashboard visual:** Te ayudaré a hacer uno con Flask/HTML
- **Integrar otros juegos:** Solo modifica `game_name` en el JavaScript de cada juego
- **Exportar a Excel:** Usa `pd.ExcelWriter()` en `query_metrics.py`
- **Hacer backup:** Copia el archivo `game_metrics.db`

---

## 📞 Soporte
Si tienes preguntas o errores, chequea:
1. Que SQLAlchemy esté instalado: `pip list | grep SQLAlchemy`
2. Que Flask esté corriendo sin errores
3. Que el `game_metrics.db` existe en la carpeta del proyecto
