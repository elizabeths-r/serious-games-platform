const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const feedback = document.getElementById('feedback');
const startButton = document.getElementById('startButton');
const timeDisplay = document.getElementById('time'); 
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
let isPaused = false;

// ====== MÉTRICAS DEL JUEGO ======
let gameMetrics = {
    playerName: 'Unknown',
    sessionName: 'Unknown',
    level: 'basic',
    startTime: null,
    endTime: null,
    hits: 0,          // Transportes cogidos
    errors: 0,        // Bombas cogidas
    score: 0,
    responses: []     // Cada colisión registrada
};

// ====== DATOS DE MOVIMIENTO ======
let movementData = {
    summary: {
        total_distance_traveled: 0,
        left_zone_time: 0,
        center_zone_time: 0,
        right_zone_time: 0,
        left_preference_percent: 0,
        center_preference_percent: 0,
        right_preference_percent: 0,
        avg_reaction_speed: 0,
        max_speed_reached: 0,
        acceleration_changes: 0,
        static_time_percent: 0
    },
    events: [],  // Eventos principales
    snapshots: [] // Snapshot cada 5 segundos
};

let lastPlayerX = 0;
let lastPlayerY = 0;
let lastRecordedTime = 0;
let lastZone = 'center';
let maxSpeed = 0;
let speedReadings = [];
let previousSpeed = 0;
let accelerationChangeCount = 0;
let gameStartTime = 0;
let frameCount = 0;
let staticFrames = 0;
let lastSnapshotTime = 0;


canvas.width = 800;
canvas.height = 600;

let gameInterval;
let timeInterval;
let score = 0;
let timeRemaining = 120; // Tiempo del juego en segundos
let attentionObjects = [];
let objectSpeed = 1; // Aumenta la velocidad de los objetos

// Posición inicial del jugador
let playerX = canvas.width / 2;
const playerY = canvas.height - 105;
const playerWidth = 120;
const playerHeight = 120;

//const playerSpeed = 15; // Aumenta la velocidad del jugador
let isDragging = false;
let offsetX = 0;

// Eventos de arrastre del jugador (mouse y touch)
canvas.addEventListener("mousedown", startDrag);
canvas.addEventListener("touchstart", startDrag);

canvas.addEventListener("mousemove", dragPlayer);
canvas.addEventListener("touchmove", dragPlayer);

canvas.addEventListener("mouseup", endDrag);
canvas.addEventListener("touchend", endDrag);

// Carga la imagen para los objetos y el jugador
const playerImage = new Image();
playerImage.src = '/static/images/transports/children.png'; // Ruta a la imagen del jugador


// Carga las imágenes para los objetos
const objectImages = [
    '/static/images/transports/airplane.png',
    '/static/images/transports/car.png',
    '/static/images/transports/train.png',
    '/static/images/transports/bomb.png',
    '/static/images/transports/ship.png'
];

const loadedObjectImages = [];

objectImages.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        loadedObjectImages.push(img);
    };
});

const urlParams = new URLSearchParams(window.location.search);
let level = urlParams.get('level') || 'basic';
let playerName = urlParams.get('name') || 'Jugador_' + Date.now();
let sessionName = urlParams.get('sessionName') || 'Unknown Session';

console.log(level)

// Asignar datos a las métricas
gameMetrics.playerName = playerName;
gameMetrics.sessionName = sessionName;
gameMetrics.level = level;

startButton.addEventListener('click', startGame);

// ===========================
// Funciones de arrastre
// ===========================
function startDrag(e) {
    e.preventDefault();
    let pos = getPointerPos(e);

    if (
        pos.x >= playerX &&
        pos.x <= playerX + playerWidth &&
        pos.y >= playerY &&
        pos.y <= playerY + playerHeight
    ) {
        isDragging = true;
        offsetX = pos.x - playerX;
    }
}

function dragPlayer(e) {
    if (!isDragging) return;
    e.preventDefault();
    let pos = getPointerPos(e);
    playerX = pos.x - offsetX;
    playerX = Math.max(0, Math.min(canvas.width - playerWidth, playerX)); // Limitar dentro del canvas
}

function endDrag(e) {
    isDragging = false;
}

function getPointerPos(e) {
    let rect = canvas.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}



function startGame() {
    // Registrar hora de inicio
    gameMetrics.startTime = Date.now();
    gameMetrics.hits = 0;
    gameMetrics.errors = 0;
    gameMetrics.score = 0;
    gameMetrics.responses = [];
    
    // Reinicializar variables de movimiento
    gameStartTime = Date.now();
    frameCount = 0;
    staticFrames = 0;
    speedReadings = [];
    lastPlayerX = playerX;
    lastPlayerY = playerY;
    movementData = {
        summary: {
            total_distance_traveled: 0,
            left_zone_time: 0,
            center_zone_time: 0,
            right_zone_time: 0,
            left_zone_time_percent: 0,
            center_zone_time_percent: 0,
            right_zone_time_percent: 0,
            total_zone_time: 0,
            avg_reaction_speed: 0,
            max_speed_reached: 0,
            acceleration_changes: 0,
            static_time_percent: 0
        },
        events: [],
        snapshots: []
    };
    lastSnapshotTime = Date.now();
    
    timeRemaining = 120; // Reinicia el tiempo al iniciar el juego
    objectSpeed = 1; // Velocidad base
    // Ajustes basados en el nivel
    if (level === 'intermediate') {
        timeRemaining = 120;
        objectSpeed = 2.5; // Velocidad intermedia
    } else if (level === 'advanced') {
        timeRemaining = 120; // Tiempo menor para nivel avanzado
        objectSpeed = 4; // Aumenta la velocidad de los objetos
    }
    if (!isPaused) {
        score = 0;
        attentionObjects = [];
        feedback.textContent = '';
        clearInterval(gameInterval);
        clearInterval(timeInterval);
        gameInterval = setInterval(gameLoop, 1000 / 60);
        timeInterval = setInterval(updateTime, 1000); // Actualiza el tiempo cada segundo
    }
}


function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateObjects();
    drawObjects();
    drawPlayer();
    trackMovement(); // Rastrear movimiento del jugador
    checkCollisions();
    if (timeRemaining <= 0) {
        endGame();
    }
}

function objectsOverlap(newObj, existingObjects) {
    const margin = 20; // Margen de espaciado entre objetos
    for (let obj of existingObjects) {
        if (
            newObj.x < obj.x + obj.width + margin &&
            newObj.x + newObj.width + margin > obj.x &&
            newObj.y < obj.y + obj.height + margin &&
            newObj.y + newObj.height + margin > obj.y
        ) {
            return true;
        }
    }
    return false;
}

function updateObjects() {
    if (isPaused) return;

    if (Math.random() < 0.01) {
        let imageIndex;
        let transportProbability = 0.8; // Probabilidad base para transportes
        let transportCount = 2; // Cantidad de transportes
        
        // Ajustes según el nivel
        if (level === 'intermediate') {
            transportProbability = 0.85; // 85% transportes en nivel intermedio
            transportCount = 3; // 3 transportes: avión, carro, tren
        } else if (level === 'advanced') {
            transportProbability = 0.75; // 75% transportes en nivel avanzado
            transportCount = 4; // 3 transportes
        }
        
        if (Math.random() < transportProbability) {
            // Selecciona un transporte aleatorio
            imageIndex = Math.floor(Math.random() * transportCount);
        } else {
            // Selecciona bomba
            imageIndex = transportCount; // Índice de la bomba
        }
        const selectedImage = loadedObjectImages[imageIndex];
        
        // Intenta crear un objeto que no se superponga con otros
        let newObj;
        let attempts = 0;
        do {
            newObj = {
                x: Math.random() * (canvas.width - 50),
                y: 0,
                width: 70,
                height: 70,
                image: selectedImage
            };
            attempts++;
        } while (objectsOverlap(newObj, attentionObjects) && attempts < 5);
        
        // Si después de 5 intentos no encuentra espacio, lo crea de todas formas
        if (attempts === 5 || !objectsOverlap(newObj, attentionObjects)) {
            attentionObjects.push(newObj);
        }
    }
    attentionObjects.forEach(obj => {
        obj.y += objectSpeed;
    });
    attentionObjects = attentionObjects.filter(obj => obj.y < canvas.height);
}

function drawObjects() {
    attentionObjects.forEach(obj => {
        // Dibuja la imagen en lugar de un rectángulo
        ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
    });
}

function drawPlayer() {
    // Dibuja la imagen del jugador
    ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
}

function checkCollisions() {
    attentionObjects.forEach(obj => {
        if (
            obj.x < playerX + playerWidth &&
            obj.x + obj.width > playerX &&
            obj.y < playerY + playerHeight &&
            obj.y + obj.height > playerY
        ) {
            // Determina si es transporte (avión, carro, tren, barco) o bomba basándose en la imagen
            if (obj.image.src.includes('airplane') || obj.image.src.includes('car') || obj.image.src.includes('train') || obj.image.src.includes('ship')) {
                // ACIERTO: Transporte capturado
                gameMetrics.hits++;
                score++;
                gameMetrics.responses.push({
                    type: 'hit',
                    object: obj.image.src.split('/').pop(),
                    score: score,
                    timestamp: Date.now() - gameMetrics.startTime
                });
                
                // Registrar evento de colisión exitosa
                const currentZone = getPlayerZone();
                const currentSpeed = Math.abs(playerX - lastPlayerX) * 60; // px/s
                movementData.events.push({
                    event_num: movementData.events.length + 1,
                    timestamp: (Date.now() - gameMetrics.startTime) / 1000,
                    event_type: 'collision_hit',
                    position_x: playerX,
                    zone: currentZone,
                    object_type: obj.image.src.split('/').pop().replace('.png', ''),
                    speed: parseFloat(currentSpeed.toFixed(2))
                });
                
                feedback.textContent = `Puntuación: ${score}`;
            } else if (obj.image.src.includes('bomb')) {
                // ERROR: Bomba capturada
                gameMetrics.errors++;
                score = Math.max(0, score - 5); // Resta 5 puntos, mínimo 0
                gameMetrics.responses.push({
                    type: 'error',
                    object: 'bomb',
                    score: score,
                    timestamp: Date.now() - gameMetrics.startTime
                });
                
                // Registrar evento de colisión con bomba
                const currentZone = getPlayerZone();
                const currentSpeed = Math.abs(playerX - lastPlayerX) * 60; // px/s
                movementData.events.push({
                    event_num: movementData.events.length + 1,
                    timestamp: (Date.now() - gameMetrics.startTime) / 1000,
                    event_type: 'collision_error',
                    position_x: playerX,
                    zone: currentZone,
                    object_type: 'bomb',
                    speed: parseFloat(currentSpeed.toFixed(2))
                });
                
                feedback.textContent = `Puntuación: ${score}`;
            }
            // Eliminar objeto después de colisión
            obj.y = canvas.height + 1;
        }
    });
}

// Función para determinar zona del jugador
function getPlayerZone() {
    const centerX = playerX + playerWidth / 2;
    if (centerX < canvas.width / 3) return 'left';
    if (centerX < (canvas.width * 2) / 3) return 'center';
    return 'right';
}

// Función para rastrear movimiento del jugador
function trackMovement() {
    if (isPaused) return;
    
    frameCount++;
    
    const currentTime = (Date.now() - gameMetrics.startTime) / 1000; // en segundos
    const currentZone = getPlayerZone();
    const distanceMoved = Math.abs(playerX - lastPlayerX);
    const currentSpeed = distanceMoved * 60; // aproximado en px/s
    
    // Contar frames estáticos (cuando la velocidad es muy baja)
    if (currentSpeed < 1) {
        staticFrames++;
    }
    
    // Actualizar distancia total
    movementData.summary.total_distance_traveled += distanceMoved;
    
    // Rastrear tiempo en cada zona
    if (lastRecordedTime > 0) {
        const timeDelta = currentTime - lastRecordedTime;
        if (lastZone === 'left') movementData.summary.left_zone_time += timeDelta;
        else if (lastZone === 'center') movementData.summary.center_zone_time += timeDelta;
        else if (lastZone === 'right') movementData.summary.right_zone_time += timeDelta;
    }
    
    // Actualizar tiempo total en zonas
    movementData.summary.total_zone_time += (currentTime - lastRecordedTime > 0 ? currentTime - lastRecordedTime : 0);
    
    // Rastrear velocidad máxima
    if (currentSpeed > maxSpeed) {
        maxSpeed = currentSpeed;
        movementData.summary.max_speed_reached = parseFloat(maxSpeed.toFixed(2));
        
        // Registrar evento de velocidad máxima
        movementData.events.push({
            event_num: movementData.events.length + 1,
            timestamp: currentTime,
            event_type: 'speed_peak',
            position_x: playerX,
            zone: currentZone,
            speed: parseFloat(currentSpeed.toFixed(2)),
            distance_to_nearest_object: getDistanceToNearestObject()
        });
    }
    
    // Rastrear cambios de aceleración
    if (Math.abs(currentSpeed - previousSpeed) > 2) {
        accelerationChangeCount++;
    }
    
    movementData.summary.acceleration_changes = accelerationChangeCount;
    speedReadings.push(currentSpeed);
    
    // Snapshot cada 5 segundos
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(lastRecordedTime)) {
        movementData.snapshots.push({
            timestamp: currentTime,
            position_x: playerX,
            zone: currentZone,
            speed: parseFloat(currentSpeed.toFixed(2)),
            score: score,
            hits: gameMetrics.hits,
            errors: gameMetrics.errors
        });
    }
    
    lastPlayerX = playerX;
    lastRecordedTime = currentTime;
    lastZone = currentZone;
    previousSpeed = currentSpeed;
}

// Función para obtener distancia al objeto más cercano
function getDistanceToNearestObject() {
    let minDist = Infinity;
    const playerCenterX = playerX + playerWidth / 2;
    
    attentionObjects.forEach(obj => {
        const objCenterX = obj.x + obj.width / 2;
        const dist = Math.abs(playerCenterX - objCenterX);
        if (dist < minDist) minDist = dist;
    });
    
    return minDist === Infinity ? null : parseFloat(minDist.toFixed(2));
}

function updateTime() {
    if (isPaused) return;
    if (timeRemaining > 0) {
        timeRemaining--;
        timeDisplay.textContent = timeRemaining;
    }
    else {
        endGame();
    }
}
pauseButton.addEventListener('click', () => {
    isPaused = true;
    pauseButton.style.display = 'none';
    resumeButton.style.display = 'block';
});

resumeButton.addEventListener('click', () => {
    isPaused = false;
    pauseButton.style.display = 'block';
    resumeButton.style.display = 'none';
});
function endGame() {
    clearInterval(gameInterval);
    clearInterval(timeInterval);
    
    // Registrar hora final
    gameMetrics.endTime = Date.now();
    const gameDuration = (gameMetrics.endTime - gameMetrics.startTime) / 1000;
    
    // Guardar score final
    gameMetrics.score = score;
    
    // Llenar modal con los datos
    document.getElementById('playerName').innerText = gameMetrics.playerName;
    document.getElementById('playerLevel').innerText = gameMetrics.level;
    document.getElementById('totalScoreDisplay').innerText = score;
    document.getElementById('hitsDisplay').innerText = gameMetrics.hits;
    document.getElementById('errorsDisplay').innerText = gameMetrics.errors;
    document.getElementById('gameDurationDisplay').innerText = gameDuration.toFixed(1);
    
    // Calculate movement summary statistics
    if (movementData.summary.total_zone_time > 0) {
        movementData.summary.left_zone_time_percent = (movementData.summary.left_zone_time / movementData.summary.total_zone_time) * 100;
        movementData.summary.center_zone_time_percent = (movementData.summary.center_zone_time / movementData.summary.total_zone_time) * 100;
        movementData.summary.right_zone_time_percent = (movementData.summary.right_zone_time / movementData.summary.total_zone_time) * 100;
    }
    
    if (speedReadings.length > 0) {
        movementData.summary.avg_reaction_speed = speedReadings.reduce((a, b) => a + b, 0) / speedReadings.length;
    }
    
    if (frameCount > 0) {
        movementData.summary.static_time_percent = (staticFrames / frameCount) * 100;
    }
    
    // Add game end event
    movementData.events.push({
        timestamp: Date.now() - gameStartTime,
        type: 'game_end',
        final_score: score,
        total_distance: movementData.summary.total_distance_traveled
    });
    
    // Prepare metrics for database
    const metricsToSave = {
        playerName: gameMetrics.playerName,
        sessionName: gameMetrics.sessionName,
        gameName: 'Guardiões',
        level: gameMetrics.level,           // ✅ Agregado: necesario para validación
        gameLevel: gameMetrics.level,       // Mantenido para compatibilidad
        hits: gameMetrics.hits,
        errors: gameMetrics.errors,
        score: score,
        gameDuration: gameDuration,
        avgResponseTime: 0,
        responsesDetail: [],
        movementData: movementData
    };
    
    // Send data to server
    fetch('/save_game_metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricsToSave)
    })
    .then(response => response.json())
    .catch(error => console.error('Error saving metrics:', error));
    
    // Muestra el modal
    $('#timeUpModal').modal('show');            
    // Maneja el botón para redirigir a la página de resultados
    document.getElementById('goToResults').addEventListener('click', function() {
        window.location.href = '/results_atac?score=' + score;
    });
}
