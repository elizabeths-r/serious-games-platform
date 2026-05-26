document.addEventListener('DOMContentLoaded', () => {
    let time = 120; // Tiempo total en segundos (igual para todos los niveles)
    let score = 0;
    let interval;
    let stimuliInterval;
    let stimuliDuration = 60000; // Duración en ms para aparecer nuevo estímulo
    let audioRepeatInterval; // Intervalo para repetir audio cada 10 segundos
    let audioRepeatCount = 0; // Contador para limitar las reproducciones de audio
    const gameArea = document.getElementById('game-area');
    const timeDisplay = document.getElementById('time');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    let isPaused = false;

    // ====== OBJETOS PARA CAPTURAR MÉTRICAS ======
    let gameMetrics = {
        playerName: 'Unknown',
        level: 'basic',
        startTime: null,
        endTime: null,
        hits: 0,
        errors: 0,
        responses: [] // Array con detalles de cada respuesta
    };

    let currentStimulusData = {
        displayTime: null,
        correctAnswer: null
    };   

    const try_again = 'sounds/tente_novamente';
    const categories = {
        'basic': {
            'animals': {
                names: ['dog', 'cat', 'rooster'],
                audio: {
                    'dog': 'sounds/animals/dog',
                    'cat': 'sounds/animals/cat',
                    'rooster': 'sounds/animals/rooster'
                },
                imagePath: '/static/images/animals/'
            },
            'vowels': {
                names: ['a', 'e', 'i', 'o', 'u'],
                audio: {
                    'a': 'sounds/vowels/a',
                    'e': 'sounds/vowels/e',
                    'i': 'sounds/vowels/i',
                    'o': 'sounds/vowels/o',
                    'u': 'sounds/vowels/u'
                },
                imagePath: '/static/images/vowels/'
            },
            'colors': {
                names: ['red', 'blue', 'yellow'],
                audio: {
                    'red': 'sounds/colors/red',
                    'blue': 'sounds/colors/blue',
                    'yellow': 'sounds/colors/yellow'
                },
                imagePath: '/static/images/colors/'
            }
        },
        'intermediate': {
            'instruments': {
                names: ['drum', 'guitar', 'maracas', 'trumpet'],
                audio: {
                    'drum': 'sounds/instruments/drum',
                    'guitar': 'sounds/instruments/guitar',
                    'maracas': 'sounds/instruments/maracas',
                    'trumpet': 'sounds/instruments/trumpet'
                },
                imagePath: '/static/images/instruments/'
            },
            'figures': {
                names: ['circle', 'kite', 'square', 'triangle'], // Puedes cambiar los estímulos si es necesario
                audio: {
                    'circle': 'sounds/figures/circle',
                    'kite': 'sounds/figures/kite',
                    'square': 'sounds/figures/square',
                    'triangle': 'sounds/figures/triangle'
                },
                imagePath: '/static/images/figures/'
            },
            'activities': {
                names: ['eating', 'laugh', 'silence', 'whistle'],
                audio: {
                    'eating': 'sounds/activities/eating',
                    'laugh': 'sounds/activities/laugh',
                    'silence': 'sounds/activities/silence',
                    'whistle': 'sounds/activities/whistle'
                },
                imagePath: '/static/images/activities/'
            }
        },
        'advanced': {
            'instruments': {
                names: ['drum', 'guitar', 'maracas', 'trumpet'],
                audio: {
                    'drum': 'sounds/instruments/drum',
                    'guitar': 'sounds/instruments/guitar',
                    'maracas': 'sounds/instruments/maracas',
                    'trumpet': 'sounds/instruments/trumpet'
                },
                imagePath: '/static/images/instruments/'
            },
            'figures': {
                names: ['circle', 'kite', 'square', 'triangle'],
                audio: {
                    'circle': 'sounds/figures/circle',
                    'kite': 'sounds/figures/kite',
                    'square': 'sounds/figures/square',
                    'triangle': 'sounds/figures/triangle'
                },
                imagePath: '/static/images/figures/'
            },
            'activities': {
                names: ['eating', 'laugh', 'silence', 'whistle'],
                audio: {
                    'eating': 'sounds/activities/eating',
                    'laugh': 'sounds/activities/laugh',
                    'silence': 'sounds/activities/silence',
                    'whistle': 'sounds/activities/whistle'
                },
                imagePath: '/static/images/activities/'
            }
        }
    };

    let currentCategory = 'animals'; // Puedes inicializar en 'animals' o en 'vowels'

    const urlParams = new URLSearchParams(window.location.search);
    let level = urlParams.get('level') || 'basic';
    let playerName = urlParams.get('name') || 'Jugador_' + Date.now();
    let sessionName = urlParams.get('sessionName') || 'Unknown Session';

    // Asignar datos iniciales a las métricas
    gameMetrics.playerName = playerName;
    gameMetrics.level = level;
    gameMetrics.sessionName = sessionName; // Guardar nombre de la sesión

    // Mostrar nombre y nivel en el HTML
    document.getElementById('playerName').innerText = playerName;
    document.getElementById('playerLevel').innerText = level;

    console.log(currentCategory)

    const imageWidth = 90; // Tamaño de las imágenes
    const imageHeight = 90;
    const minSpacing = 70; // Espacio mínimo entre imágenes

    let occupiedMap = [];
    // Función para enviar el archivo de audio al robot a través de Flask
    function sendAudioToRobot(audioFile) {
        // Convierte la ruta al formato que el robot espera (ejemplo: static/sounds -> animals/dog)
        //const robotAudioFile = audioFile.replace('/static/', '');
        robotAudioFile = audioFile
        console.log('Enviando audio al robot:', robotAudioFile) //Debugging

        fetch('/play_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audio: robotAudioFile }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Audio enviado al robot:', data);
        })
        .catch((error) => {
            console.error('Error al enviar el audio al robot:', error);
        });
    }



    function startGame() {
        // Registrar hora de inicio
        gameMetrics.startTime = Date.now();
        gameMetrics.hits = 0;
        gameMetrics.errors = 0;
        gameMetrics.responses = [];

        // Ajustes basados en el nivel - tiempo de intervalo para nuevos estímulos
        if (level === 'basic') {
            stimuliDuration = 60000; // 60 segundos entre estímulos en nivel básico
            currentCategory = 'animals';
        } else if (level === 'intermediate') {
            stimuliDuration = 45000; // 45 segundos entre estímulos en nivel intermedio
            currentCategory = 'instruments';
        } else if (level === 'advanced') {
            stimuliDuration = 30000; // 30 segundos entre estímulos en nivel avanzado
            currentCategory = 'instruments';
        }

        timeDisplay.innerText = time;

        interval = setInterval(() => {
            if (!isPaused) { // Solo actualizar si no está pausado
                if (time <= 0) {
                    clearInterval(interval);
                    clearInterval(stimuliInterval);

                    // Registrar hora final y calcular métricas
                    gameMetrics.endTime = Date.now();
                    const gameDuration = (gameMetrics.endTime - gameMetrics.startTime) / 1000;
                    
                    // Calcular tiempo promedio de respuesta
                    const avgResponseTime = gameMetrics.responses.length > 0
                        ? (gameMetrics.responses.reduce((sum, r) => sum + r.responseTime, 0) / gameMetrics.responses.length).toFixed(0)
                        : 0;
                    
                    // Calcular total de respuestas
                    const totalResponses = gameMetrics.hits + gameMetrics.errors;
                    
                    // ====== GUARDAR MÉTRICAS EN LA BASE DE DATOS ======
                    const metricsToSave = {
                        playerName: gameMetrics.playerName,
                        sessionName: gameMetrics.sessionName, // Nombre correcto de la sesión
                        gameName: 'Atenção Ativa', // Nombre del juego
                        level: level,
                        hits: gameMetrics.hits,
                        errors: gameMetrics.errors,
                        score: score,
                        gameDuration: parseFloat(gameDuration.toFixed(1)),
                        avgResponseTime: parseFloat(avgResponseTime),
                        responses: gameMetrics.responses
                    };
                    
                    // Enviar datos al servidor
                    fetch('/save_game_metrics', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(metricsToSave)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Métricas guardadas:', data);
                    })
                    .catch(error => console.error('Error al guardar métricas:', error));
                    
                    // Llenar modal con todos los datos
                    document.getElementById('playerName').innerText = gameMetrics.playerName;
                    document.getElementById('playerLevel').innerText = gameMetrics.level;
                    document.getElementById('hitsDisplay').innerText = gameMetrics.hits;
                    document.getElementById('errorsDisplay').innerText = gameMetrics.errors;
                    document.getElementById('totalScoreDisplay').innerText = score;
                    document.getElementById('gameDurationDisplay').innerText = gameDuration.toFixed(1);
                    document.getElementById('avgResponseTimeDisplay').innerText = avgResponseTime;
                    
                    // Llenar tabla de respuestas
                    const tbody = document.getElementById('responsesBody');
                    tbody.innerHTML = '';
                    gameMetrics.responses.forEach((response) => {
                        const row = tbody.insertRow();
                        row.innerHTML = `
                            <td>${response.number}</td>
                            <td>${response.stimulus}</td>
                            <td>${response.result}</td>
                            <td>${response.responseTime}</td>
                        `;
                    });
                    
                    // Muestra el modal
                    $('#timeUpModal').modal('show');
                    
                    // Maneja el botón para redirigir a la página de resultados
                    document.getElementById('goToResults').addEventListener('click', function() {
                        const metricsString = encodeURIComponent(JSON.stringify(gameMetrics));
                        window.location.href = '/results_atac?score=' + score + 
                            '&hits=' + gameMetrics.hits + 
                            '&errors=' + gameMetrics.errors +
                            '&duration=' + gameDuration.toFixed(1) +
                            '&metrics=' + metricsString;
                    });
                } else {
                    time--;
                    timeDisplay.innerText = time;
                }
            }
        }, 1000);
        createStimuli();
        // El primer estímulo ya se mostró, ahora el intervalo espera el tiempo completo para el siguiente
        stimuliInterval = setInterval(() =>{
            if (!isPaused){
                createStimuli()
            }
        }, stimuliDuration);
    }

    function initializeOccupiedMap() {
        const cols = Math.ceil(gameArea.clientWidth / (imageWidth + minSpacing));
        const rows = Math.ceil(gameArea.clientHeight / (imageHeight + minSpacing));
        occupiedMap = Array.from({ length: rows }, () => Array(cols).fill(false));
        console.log('Mapa de ocupación inicializado:', occupiedMap);
    }

    function markOccupied(x, y) {
        const colStart = Math.floor(x / (imageWidth + minSpacing));
        const colEnd = Math.floor((x + imageWidth) / (imageWidth + minSpacing));
        const rowStart = Math.floor(y / (imageHeight + minSpacing));
        const rowEnd = Math.floor((y + imageHeight) / (imageHeight + minSpacing));
        
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                if (col >= 0 && col < occupiedMap[0].length && row >= 0 && row < occupiedMap.length) {
                    occupiedMap[row][col] = true;
                    console.log(`Posición marcada como ocupada: (col: ${col}, row: ${row})`);
                }
            }
        }
    }

    function isOccupied(x, y) {
        const colStart = Math.floor(x / (imageWidth + minSpacing));
        const colEnd = Math.floor((x + imageWidth) / (imageWidth + minSpacing));
        const rowStart = Math.floor(y / (imageHeight + minSpacing));
        const rowEnd = Math.floor((y + imageHeight) / (imageHeight + minSpacing));

        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                if (col >= 0 && col < occupiedMap[0].length && row >= 0 && row < occupiedMap.length) {
                    console.log(`Verificación de ocupación en (col: ${col}, row: ${row}):`, occupiedMap[row][col]);
                    if (occupiedMap[row][col]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function getRandomPosition() {
        const maxX = gameArea.clientWidth - imageWidth;
        const maxY = gameArea.clientHeight - imageHeight;
        const randomX = Math.floor(Math.random() * maxX);
        const randomY = Math.floor(Math.random() * maxY);
        console.log('Posición aleatoria generada:', { x: randomX, y: randomY });
        return { x: randomX, y: randomY };
    }

    function createStimuli() {

        if (isPaused) return;

        console.log("Creando estímulos");
        gameArea.innerHTML = ''; // Limpiar los estímulos anteriores
        initializeOccupiedMap(); // Reiniciar el mapa de ocupación

        // Para nivel avanzado: usar categorías mixtas
        if (level === 'advanced') {
            createMixedStimuli();
        } else {
            createSingleCategoryStimuli();
        }
    }

    function createSingleCategoryStimuli() {
        const category = categories[level][currentCategory];
        if (!category) {
            console.error("Categoría no encontrada:", currentCategory);
            return;
        }

        const chosenItem = category.names[Math.floor(Math.random() * category.names.length)];
        
        // Registrar datos del estímulo actual
        currentStimulusData = {
            displayTime: Date.now(),
            correctAnswer: chosenItem
        };
        
        sendAudioToRobot(category.audio[chosenItem]); // Reproducir la instrucción

        // Limpiar el intervalo anterior si existe
        clearInterval(audioRepeatInterval);
        audioRepeatCount = 0; // Resetear contador
        
        // Calcular máximo de repeticiones (total posible - 1)
        let maxAudioRepeats = Math.floor(stimuliDuration / 10000) - 1;
        
        // Configurar intervalo para repetir audio cada 10 segundos
        audioRepeatInterval = setInterval(() => {
            if (!isPaused && audioRepeatCount < maxAudioRepeats) {
                sendAudioToRobot(category.audio[chosenItem])
                //category.audio[chosenItem].play();
                audioRepeatCount++;
            } else if (audioRepeatCount >= maxAudioRepeats) {
                clearInterval(audioRepeatInterval);
            }
        }, 10000);

        // Mezclar el orden de las imágenes
        const shuffledItems = category.names.sort(() => Math.random() - 0.5);

        shuffledItems.forEach((item) => {
            const stimulus = document.createElement('img');
            stimulus.classList.add('stimulus');
            stimulus.src = category.imagePath + item + '.png';
            stimulus.alt = item;

            let position;
            let attempts = 0;
            const maxAttempts = 200;

            do {
                position = getRandomPosition();
                attempts++;
                if (attempts > maxAttempts) {
                    console.error("No se pudo encontrar una posición válida para el estímulo:", item);
                    return;
                }
            } while (isOccupied(position.x, position.y));

            markOccupied(position.x, position.y);

            stimulus.style.position = 'absolute';
            stimulus.style.left = position.x + 'px';
            stimulus.style.top = position.y + 'px';
            stimulus.style.width = imageWidth + 'px';
            stimulus.style.height = imageHeight + 'px';
            stimulus.style.cursor = 'pointer';

            const handleStimulusClick = () => {
                if (isPaused) return;
                
                // Calcular tiempo de reacción
                const responseTime = Date.now() - currentStimulusData.displayTime;
                
                if (stimulus.alt === chosenItem) {
                    // ACIERTO
                    gameMetrics.hits++;
                    gameMetrics.responses.push({
                        number: gameMetrics.hits + gameMetrics.errors,
                        stimulus: currentStimulusData.correctAnswer,
                        result: 'Acierto',
                        responseTime: responseTime
                    });
                    
                    // Agregar animación de acierto
                    stimulus.classList.add('correct');
                    clearInterval(audioRepeatInterval); // Limpiar intervalo cuando acierta
                    score++;
                    scoreDisplay.innerText = score;
                    // Esperar a que termine la animación antes de cambiar de estímulo
                    setTimeout(() => {
                        gameArea.innerHTML = '';
                        // Crear el siguiente estímulo inmediatamente
                        createStimuli();
                        // Resetear el intervalo para que espere el tiempo completo antes del siguiente cambio automático
                        clearInterval(stimuliInterval);
                        stimuliInterval = setInterval(() => {
                            if (!isPaused) {
                                createStimuli();
                            }
                        }, stimuliDuration);
                    }, 600); // Duración de la animación (600ms)
                }
                else {
                    // ERROR
                    gameMetrics.errors++;
                    gameMetrics.responses.push({
                        number: gameMetrics.hits + gameMetrics.errors,
                        stimulus: currentStimulusData.correctAnswer,
                        result: 'Error',
                        selectedOption: stimulus.alt,
                        responseTime: responseTime
                    });
                    
                    // Agregar animación de error
                    stimulus.classList.add('incorrect');
                    sendAudioToRobot(try_again);
                    // Remover la clase después de la animación
                    setTimeout(() => {
                        stimulus.classList.remove('incorrect');
                    }, 600); // Duración de la animación
                }
            };

            stimulus.addEventListener('click', handleStimulusClick);
            stimulus.addEventListener('touchstart', handleStimulusClick);

            gameArea.appendChild(stimulus);
        });

        // Rotación de categorías
        if (level === 'intermediate') {
            currentCategory = currentCategory === 'instruments' ? 'figures' : (currentCategory === 'figures' ? 'activities' : 'instruments');
        } else if (level === 'basic') {
            currentCategory = currentCategory === 'animals' ? 'vowels' : (currentCategory === 'vowels' ? 'colors' : 'animals');
        }
    }

    function createMixedStimuli() {
        // Para nivel avanzado: mezclar dos categorías
        const allCategories = ['instruments', 'figures', 'activities'];
        const category1Name = currentCategory;
        // Seleccionar una segunda categoría diferente
        const category2Name = allCategories.find(cat => cat !== currentCategory);
        
        const category1 = categories[level][category1Name];
        const category2 = categories[level][category2Name];

        if (!category1 || !category2) {
            console.error("Categorías no encontradas");
            return;
        }

        // Elegir un item de cada categoría
        const chosenItem1 = category1.names[Math.floor(Math.random() * category1.names.length)];
        const chosenItem2 = category2.names[Math.floor(Math.random() * category2.names.length)];
        
        // Registrar datos del estímulo actual
        currentStimulusData = {
            displayTime: Date.now(),
            correctAnswer: chosenItem1
        };
        
        // Reproducir el audio del primer ítem (el que se debe encontrar)
        sendAudioToRobot(category1.audio[chosenItem1]);

        // Limpiar el intervalo anterior si existe
        clearInterval(audioRepeatInterval);
        audioRepeatCount = 0; // Resetear contador
        
        // Calcular máximo de repeticiones (total posible - 1)
        let maxAudioRepeats = Math.floor(stimuliDuration / 10000) - 1;
        
        // Configurar intervalo para repetir audio cada 10 segundos
        audioRepeatInterval = setInterval(() => {
            if (!isPaused && audioRepeatCount < maxAudioRepeats) {
                sendAudioToRobot(category1.audio[chosenItem1])
                audioRepeatCount++;
            } else if (audioRepeatCount >= maxAudioRepeats) {
                clearInterval(audioRepeatInterval);
            }
        }, 10000);

        // Mezclar todos los items de ambas categorías
        const allItems = [
            ...category1.names.map(item => ({ name: item, category: category1, key: item })),
            ...category2.names.map(item => ({ name: item, category: category2, key: item }))
        ].sort(() => Math.random() - 0.5);

        allItems.forEach((itemObj) => {
            const stimulus = document.createElement('img');
            stimulus.classList.add('stimulus');
            stimulus.src = itemObj.category.imagePath + itemObj.name + '.png';
            stimulus.alt = itemObj.key;

            let position;
            let attempts = 0;
            const maxAttempts = 200;

            do {
                position = getRandomPosition();
                attempts++;
                if (attempts > maxAttempts) {
                    return;
                }
            } while (isOccupied(position.x, position.y));

            markOccupied(position.x, position.y);

            stimulus.style.position = 'absolute';
            stimulus.style.left = position.x + 'px';
            stimulus.style.top = position.y + 'px';
            stimulus.style.width = imageWidth + 'px';
            stimulus.style.height = imageHeight + 'px';
            stimulus.style.cursor = 'pointer';

            const handleStimulusClick = () => {
                if (isPaused) return;
                
                // Calcular tiempo de reacción
                const responseTime = Date.now() - currentStimulusData.displayTime;
                
                if (stimulus.alt === chosenItem1) {
                    // ACIERTO
                    gameMetrics.hits++;
                    gameMetrics.responses.push({
                        number: gameMetrics.hits + gameMetrics.errors,
                        stimulus: currentStimulusData.correctAnswer,
                        result: 'Acierto',
                        responseTime: responseTime
                    });
                    
                    // Agregar animación de acierto
                    stimulus.classList.add('correct');
                    clearInterval(audioRepeatInterval); // Limpiar intervalo cuando acierta
                    score++;
                    scoreDisplay.innerText = score;
                    // Esperar a que termine la animación antes de cambiar de estímulo
                    setTimeout(() => {
                        gameArea.innerHTML = '';
                        // Crear el siguiente estímulo inmediatamente
                        createStimuli();
                        // Resetear el intervalo para que espere el tiempo completo antes del siguiente cambio automático
                        clearInterval(stimuliInterval);
                        stimuliInterval = setInterval(() => {
                            if (!isPaused) {
                                createStimuli();
                            }
                        }, stimuliDuration);
                    }, 600); // Duración de la animación (600ms)
                }
                else {
                    // ERROR
                    gameMetrics.errors++;
                    gameMetrics.responses.push({
                        number: gameMetrics.hits + gameMetrics.errors,
                        stimulus: currentStimulusData.correctAnswer,
                        result: 'Error',
                        selectedOption: stimulus.alt,
                        responseTime: responseTime
                    });
                    
                    // Agregar animación de error
                    stimulus.classList.add('incorrect');
                    sendAudioToRobot(try_again);
                    // Remover la clase después de la animación
                    setTimeout(() => {
                        stimulus.classList.remove('incorrect');
                    }, 600); // Duración de la animación
                }
            };

            stimulus.addEventListener('click', handleStimulusClick);
            stimulus.addEventListener('touchstart', handleStimulusClick);

            gameArea.appendChild(stimulus);
        });

        // Rotación para la siguiente ronda
        const nextIndex = (allCategories.indexOf(currentCategory) + 1) % allCategories.length;
        currentCategory = allCategories[nextIndex];
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

    startButton.addEventListener('click', startGame);
});