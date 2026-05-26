# 📊 Base de Datos de Métricas de Juegos - CASTOR

## Descripción General

Este documento describe todas las métricas capturadas en la base de datos SQLite (`game_metrics.db`) para los juegos serios de la plataforma CASTOR. Los datos se recopilan automáticamente al finalizar cada juego y se almacenan para análisis de evolución y patrones de comportamiento.

---

## 📁 Estructura de la Base de Datos

### Tabla Principal: `game_sessions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único de la sesión |
| player_name | String(100) | Nombre del participante |
| session_name | String(100) | Nombre de la sesión (ej: "Sesión 1: Atención y Memoria") |
| game_name | String(100) | Nombre del juego jugado |
| game_level | String(50) | Nivel: basic, intermediate, advanced |
| hits | Integer | Aciertos/respuestas correctas |
| errors | Integer | Errores/respuestas incorrectas |
| score | Integer | Puntuación final |
| game_duration | Float | Duración del juego en segundos |
| avg_response_time | Float | Tiempo promedio de respuesta en ms |
| responses_detail | Text (JSON) | Detalle de cada respuesta individual |
| movement_data | Text (JSON) | Datos de movimiento (juego específico) |
| created_at | DateTime | Fecha y hora de creación |
| updated_at | DateTime | Última actualización |

---

## 🎮 Métricas por Juego

### **JUEGO 1: Atenção Ativa (Atención Activa)**

#### Descripción
Juego de reconocimiento visual donde el usuario debe identificar estímulos auditivos entre múltiples opciones visuales. Propone audios de animales, vocales o colores según el nivel.

#### Métricas Capturadas

| Métrica | Tipo | Descripción | Rango/Ejemplo |
|---------|------|-------------|---|
| **hits** | Int | Estímulos identificados correctamente | 0-∞ |
| **errors** | Int | Estímulos no identificados o mal seleccionados | 0-∞ |
| **score** | Int | Total de aciertos (igual a hits) | 0-∞ |
| **game_duration** | Float | Tiempo total de juego | 120 segundos (por diseño) |
| **avg_response_time** | Float | Tiempo promedio entre audio y click correcto | ms |

#### Datos Detallados (responses_detail)

Cada respuesta incluye:
```json
{
  "number": 1,
  "stimulus": "dog",           // Estímulo correcto
  "result": "Acierto",         // o "Error"
  "responseTime": 2340,        // ms desde que apareció el estímulo
  "selectedOption": "cat"      // (solo en errores)
}
```

#### Análisis Posible
- 📈 Evolución de velocidad de reacción entre sesiones
- 🎯 Exactitud de reconocimiento por tipo de estímulo (animales vs vocales vs colores)
- 📊 Correlación entre velocidad y precisión

---

### **JUEGO 2: Guardiões (Guardias/Recolección)**

#### Descripción
Juego de atención donde el jugador controla un personaje que debe recopilar transportes (avión, carro, tren, barco) en una pantalla desplazadora, evitando bombas que restan puntos.

#### Métricas Capturadas

| Métrica | Tipo | Descripción | Rango/Ejemplo |
|---------|------|-------------|---|
| **hits** | Int | Transportes capturados correctamente | 0-∞ |
| **errors** | Int | Bombas capturadas (cada -5 puntos) | 0-∞ |
| **score** | Int | Puntuación final (hits - errors*5) | -∞ a +∞ |
| **game_duration** | Float | Tiempo total de juego | 120 segundos |
| **movement_data** | JSON | Datos de movimiento y eventos | Ver abajo |

#### Datos de Movimiento (movement_data)

**A. Resumen de Movimiento (summary):**
```json
{
  "total_distance_traveled": 450.5,        // Píxeles recorridos
  "left_zone_time": 35.2,                  // Segundos (zone: 0-400px)
  "center_zone_time": 52.8,                // Segundos (zone: 400-800px)
  "right_zone_time": 32.0,                 // Segundos (zone: 800px+)
  "left_zone_percent": 29.3,               // % del tiempo
  "center_zone_percent": 44.0,             // % del tiempo
  "right_zone_percent": 26.7,              // % del tiempo
  "avg_reaction_speed": 4.2,               // px/s promedio
  "max_speed_reached": 8.5,                // px/s máximo
  "acceleration_changes": 23,              // # de cambios de velocidad
  "static_time_percent": 15.5              // % tiempo sin movimiento
}
```

**B. Eventos Principales (events):**
```json
[
  {
    "timestamp": 2.5,                      // Segundos desde inicio
    "event_type": "first_movement",        // o collision_hit/error/speed_peak/game_end
    "position_x": 350,                     // Posición en pixel
    "zone": "left",                        // left/center/right
    "speed": 2.1,                          // px/s actual
    "object_type": "airplane",             // (solo si collision)
    "score": 1                             // Puntuación en ese momento
  }
]
```

**C. Snapshots (cada 5 segundos):**
```json
[
  {
    "timestamp": 5.0,
    "position_x": 400,
    "zone": "center",
    "speed": 3.5,
    "score": 2,
    "hits": 2,
    "errors": 0
  }
]
```

#### Análisis Posible
- 🚀 Evolución de velocidad de reacción
- 🗺️ Preferencias de zonas (¿dónde se siente cómodo el jugador?)
- ⚡ Patrones de aceleración (¿mejora con entrenamiento?)
- 🎯 Correlación entre velocidad y aciertos
- 📊 Consistencia de movimientos entre sesiones

---

### **JUEGO 3: Memória Mágica (Memory/Parejas)**

#### Descripción
Juego clásico de memoria donde el usuario debe encontrar parejas de cartas idénticas. Las cartas están volteadas y debe recordar su ubicación.

#### Métricas Capturadas

| Métrica | Tipo | Descripción | Fórmula/Rango |
|---------|------|-------------|---|
| **hits** | Int | Pares encontrados correctamente | 0 a totalPares |
| **errors** | Int | Intentos fallidos (2 cartas ≠) | 0-∞ |
| **score** | Int | Puntuación = pares encontrados | 0 a totalPares |
| **game_duration** | Float | Tiempo total en segundos | segundos |
| **first_card_time** | Float | Tiempo hasta primer flip | segundos |
| **efficiency** | Float | Porcentaje de acierto | hits/(hits+errors)*100 |
| **avg_attempts_per_pair** | Float | Intentos promedio por par | (hits+errors)/hits |
| **avg_search_time** | Float | Tiempo promedio por par | duración/hits |
| **cards_viewed** | Int | Cartas únicas inspeccionadas | 0 a totalCartas |
| **best_streak** | Int | Pares consecutivos sin error | 0-∞ |

#### Datos Detallados (movement_data)

**Tiempos por cada par:**
```json
{
  "pair_times": [
    {
      "pair_number": 1,
      "cards": ["dog", "dog"],
      "time_to_find": 12.5,       // Segundos para encontrar este par
      "attempts": 3,               // Intentos para encontrar
      "was_error": false
    },
    {
      "pair_number": 2,
      "cards": ["cat", "cat"],
      "time_to_find": 8.2,
      "attempts": 2,
      "was_error": true
    }
  ],
  "first_card_viewed": {
    "card": "dog",
    "time": 1.2                    // Segundos para hacer primer flip
  },
  "cards_viewed_list": ["dog", "cat", "bird", ...],  // Orden de exploración
  "win_streaks": [3, 2, 1, 4]     // Rachas de aciertos consecutivos
}
```

#### Análisis Posible
- 🧠 Mejora de memoria a lo largo de sesiones
- ⏱️ Eficiencia: ¿mejoran la estrategia?
- 📈 Velocidad de búsqueda por par
- 🎯 Consistencia en encontrar parejas
- 📊 Patrón de exploración (¿sistémático o aleatorio?)
- 🔥 Confianza (¿mejora racha con éxitos?)

---

### **JUEGO 4: Planejamiento (Categorización)**

#### Descripción
Juego de categorización donde el usuario debe clasificar elementos en categorías correctas mediante arrastrar y soltar. El usuario debe agrupar objetos (frutas, animales, vehículos, etc.) en sus respectivas categorías.

#### Métricas Capturadas

| Métrica | Tipo | Descripción | Rango/Ejemplo |
|---------|------|-------------|---|
| **hits** | Int | Elementos categorizados correctamente | 0-∞ |
| **errors** | Int | Elementos colocados en categoría incorrecta | 0-∞ |
| **score** | Int | Total de elementos correctos | 0-∞ |
| **game_duration** | Float | Tiempo total de juego | segundos |
| **avg_response_time** | Float | Tiempo promedio de categorización por elemento | ms |

#### Datos Detallados (movement_data)

**Tiempos de categorización:**
```json
{
  "categorizationTimes": [
    {
      "item": "apple",
      "category": "frutas",
      "timeMs": 2626,              // Tiempo en ms desde inicio del juego
      "correct": true
    },
    {
      "item": "car",
      "category": "animales",
      "timeMs": 5340,
      "correct": false
    },
    {
      "item": "banana",
      "category": "frutas",
      "timeMs": 7120,
      "correct": true
    }
  ]
}
```

#### Análisis Posible
- ⏱️ Velocidad de toma de decisiones en categorización
- 🎯 Precisión en clasificación (hits vs errors)
- 📈 Mejora de velocidad entre sesiones
- 📊 Items que generan más confusión
- 🧠 Consistencia en aplicación de criterios de clasificación
- 🔍 Correlación entre velocidad y precisión

---

## 📊 Ejemplos de Datos Guardados

### Juego 1 (Atención Activa)
```json
{
  "player_name": "Juan",
  "session_name": "Sesión 1: Atención y Memoria",
  "game_name": "Atenção Ativa",
  "game_level": "basic",
  "hits": 15,
  "errors": 2,
  "score": 15,
  "game_duration": 120.5,
  "avg_response_time": 2340,
  "responses_detail": [
    {"number": 1, "stimulus": "dog", "result": "Acierto", "responseTime": 2100},
    {"number": 2, "stimulus": "cat", "result": "Error", "responseTime": 3500}
  ],
  "created_at": "2026-03-31T10:30:45"
}
```

### Juego 2 (Guardianes)
```json
{
  "player_name": "Juan",
  "session_name": "Sesión 1: Atención y Memoria",
  "game_name": "Guardiões",
  "game_level": "intermediate",
  "hits": 25,
  "errors": 3,
  "score": 10,
  "game_duration": 120.3,
  "movement_data": {
    "summary": {
      "total_distance_traveled": 5598.6,
      "left_zone_time": 19.7,
      "center_zone_time": 97.6,
      "right_zone_time": 2.6,
      "avg_reaction_speed": 46.5,
      "max_speed_reached": 128.3,
      "acceleration_changes": 85,
      "static_time_percent": 0.0
    },
    "events": [...],
    "snapshots": [...]
  }
}
```

### Juego 3 (Memória Mágica)
```json
{
  "player_name": "Juan",
  "session_name": "Sesión 1: Atención y Memoria",
  "game_name": "Memória Mágica",
  "game_level": "basic",
  "hits": 8,
  "errors": 5,
  "score": 8,
  "game_duration": 180.5,
  "movement_data": {
    "efficiency": 61.5,
    "avg_attempts_per_pair": 1.625,
    "avg_search_time": 22.6,
    "first_card_time": 1.2,
    "cards_viewed": 10,
    "best_streak": 3,
    "pair_times": [
      {"pair_number": 1, "time_to_find": 12.5, "attempts": 3},
      {"pair_number": 2, "time_to_find": 8.2, "attempts": 1}
    ]
  }
}
```

### Juego 4 (Planejamiento)
```json
{
  "player_name": "Juan",
  "session_name": "Sesión 1: Atención y Memoria",
  "game_name": "Planejamiento",
  "game_level": "basic",
  "hits": 12,
  "errors": 3,
  "score": 12,
  "game_duration": 85.2,
  "avg_response_time": 6150,
  "movement_data": {
    "categorizationTimes": [
      {"item": "apple", "category": "frutas", "timeMs": 2626, "correct": true},
      {"item": "car", "category": "animales", "timeMs": 5340, "correct": false},
      {"item": "banana", "category": "frutas", "timeMs": 7120, "correct": true},
      {"item": "dog", "category": "animales", "timeMs": 9850, "correct": true}
    ]
  }
}
```

---

## 🔍 Cómo Consultar los Datos

### Opción 1: Herramienta Interactiva
```bash
python query_metrics.py
```

Menú con opciones:
- Ver todas las métricas
- Exportar a CSV/JSON
- Ver métricas de un jugador
- Ver estadísticas generales

### Opción 2: Línea de Comandos
```bash
# Ver todos los datos
python query_metrics.py show

# Exportar a CSV
python query_metrics.py csv game_metrics.csv

# Exportar a JSON
python query_metrics.py json game_metrics.json

# Ver datos de un jugador
python query_metrics.py player "Juan"

# Ver estadísticas generales
python query_metrics.py stats
```

### Opción 3: API REST
```bash
# Todos los juegos
GET http://localhost:5000/get_game_metrics

# Filtrar por jugador
GET http://localhost:5000/get_game_metrics?player_name=Juan

# Filtrar por juego
GET http://localhost:5000/get_game_metrics?game_name=Atenção%20Ativa

# Filtrar por sesión
GET http://localhost:5000/get_game_metrics?session_name=Sesión%201
```

---

## 📈 Análisis para Tesis

### Preguntas que Puedes Responder

**Juego 1 - Atención Activa:**
- ¿Mejora la velocidad de reacción con la práctica?
- ¿Hay diferencia entre niveles (básico vs avanzado)?
- ¿Qué tipo de estímulo (animales/vocales/colores) es más fácil?

**Juego 2 - Guardianes:**
- ¿Cambia el patrón de movimiento del jugador a lo largo de sesiones?
- ¿Hay preferencia por zonas (izquierda/centro/derecha)?
- ¿La velocidad de reacción correlaciona con precisión?
- ¿Se fatiga el jugador (reduce velocidad al final)?

**Juego 3 - Memória Mágica:**
- ¿Mejora la memoria de sesión en sesión?
- ¿Se desarrolla una estrategia sistemática?
- ¿Aumenta la eficiencia (menos intentos)?
- ¿La racha de aciertos influye en confianza?

### Análisis Comparativos
- 📊 Comparar evolución entre participantes
- 🔄 Ver si el entrenamiento en Juego 1 facilita Juego 2
- 🧠 Correlación entre atención y memoria
- 📈 Trajectory de mejora en cada juego

---

## 🔧 Backup y Gestión

### Hacer Backup de la BD
```bash
# Copiar archivo
copy game_metrics.db game_metrics_backup_2026-03-31.db
```

### Limpiar la BD (advertencia ⚠️)
```bash
python query_metrics.py clear
```

### Reconstruir la BD
```bash
# Elimina la vieja
rm game_metrics.db

# Reinicia Flask (recrea automáticamente)
python web_interface_portuguese.py
```

---

## 📝 Diccionario de Términos

| Término | Definición |
|---------|-----------|
| **Hits** | Respuestas/acciones correctas |
| **Errors** | Respuestas/acciones incorrectas |
| **Score** | Puntuación final del juego |
| **Efficiency** | Porcentaje de precisión (aciertos/(aciertos+errores)) |
| **Response Time** | Tiempo entre estímulo y respuesta |
| **Best Streak** | Máximo número de aciertos consecutivos |
| **Cartas Vistas** | Número de tarjetas diferentes exploradas |
| **Game Duration** | Tiempo total de juego |

---

## 🚀 Próximas Fases

- [x] Implementar métricas en Juego 4 (Planejamiento)
- [x] Implementar métricas en Juego 5 (Detetive de Emociones)
- [ ] Crear dashboard visual
- [ ] Exportar reportes por participante
- [ ] Análisis estadístico automatizado

---

**Última actualización:** 6 de Abril de 2026
**Juegos cubiertos:** 5 (Atención Activa, Guardianes, Memória Mágica, Planejamiento, Detetive de Emociones)
**Estado:** Activo y recolectando datos ✅

---

## **JUEGO 5: Detetive de Emociones (Detective de Emociones)**

#### Descripción
Juego de reconocimiento emocional donde el usuario identifica emociones en videos (nivel básico), situaciones narradas (nivel medio), o proporciona reacciones apropiadas a situaciones emocionales (nivel avanzado).

#### Niveles
- **Básico:** Observar video de emoción y seleccionar la emoción correcta entre 4 opciones
- **Medio:** Leer descripción de situación e identificar la emoción del personaje
- **Avanzado:** Identificar emoción + elegir la mejor reacción psicosocial

#### Métricas Capturadas

| Métrica | Tipo | Descripción | Rango/Ejemplo |
|---------|------|-------------|---|
| **hits** | Int | Emociones identificadas correctamente | 0-∞ |
| **errors** | Int | Emociones no identificadas o mal seleccionadas | 0-∞ |
| **score** | Int | Total de aciertos de emociones | 0-∞ |
| **game_duration** | Float | Tiempo total de juego | 120 segundos |
| **avg_response_time** | Float | Tiempo promedio de respuesta en ms | ms |
| **emotionAccuracy** | JSON | Precisión (%) por tipo de emoción | {"Feliz": 100, "Triste": 80} |
| **reactionAccuracy** | JSON | Precisión (%) en reacciones (nivel avanzado) | {"Feliz": 100, "Triste": 66} |

#### Datos Detallados (responses_detail)

Cada respuesta incluye:
```json
{
  "emotion": "Feliz",              // Emoción correcta
  "selectedEmotion": "Feliz",      // Emoción seleccionada
  "isCorrect": true,
  "responseTime": 2340,            // ms desde presentación
  "timestamp": "2026-04-06T14:30:45Z"
}
```

#### Datos de Reacción (reactionAccuracy - solo nivel avanzado)

```json
{
  "Feliz": 100,        // % de precisión en reacciones a "Feliz"
  "Triste": 75,        // % de precisión en reacciones a "Triste"
  "Enojado": 50,
  "Sorprendido": 100
}
```

#### Ejemplo Completo de Datos Guardados

**Nivel Básico:**
```json
{
  "player_name": "María",
  "session_name": "Sesión 3: Emociones",
  "game_name": "Detetive de Emociones",
  "game_level": "basic",
  "hits": 12,
  "errors": 3,
  "score": 12,
  "game_duration": 120.2,
  "avg_response_time": 2850,
  "emotionAccuracy": {
    "Feliz": 100,
    "Triste": 66,
    "Enojado": 100,
    "Sorprendido": 33
  },
  "responses_detail": [
    {
      "emotion": "Feliz",
      "selectedEmotion": "Feliz",
      "isCorrect": true,
      "responseTime": 2340,
      "timestamp": "2026-04-06T14:30:46Z"
    },
    {
      "emotion": "Triste",
      "selectedEmotion": "Enojado",
      "isCorrect": false,
      "responseTime": 3100,
      "timestamp": "2026-04-06T14:30:50Z"
    }
  ]
}
```

**Nivel Avanzado (con reacciones):**
```json
{
  "player_name": "Carlos",
  "game_level": "advanced",
  "hits": 8,
  "errors": 2,
  "score": 8,
  "avg_response_time": 3200,
  "emotionAccuracy": {
    "Feliz": 100,
    "Triste": 100,
    "Enojado": 0,
    "Sorprendido": 100
  },
  "reactionAccuracy": {
    "Feliz": 100,      // "Jugar juntos" = correcto
    "Triste": 50,      // 50% de reacciones correctas
    "Enojado": 0,      // Todas las reacciones incorrectas
    "Sorprendido": 100
  }
}
```

#### Análisis Posible
- 🎯 ¿Mejora el reconocimiento emocional con práctica?
- 📈 ¿Qué emoción es más fácil/difícil de identificar?
- ⏱️ ¿Disminuye el tiempo de respuesta entre sesiones?
- 🧠 ¿Cambia la precisión en reacciones prosociales (nivel avanzado)?
- 📊 Comparación: reconocimiento vs reacción
- 🎭 ¿Hay sesgo hacia emociones positivas o negativas?

#### Correlaciones Esperadas
- Video (básico) > Situación narrada (medio) > Reacción (avanzado) en complejidad
- Mayor seguridad emocional → Mayor accuracy
- Práctica → Reducción de tiempo de respuesta
- Precisión en emociones → Precisión en reacciones (esperado)