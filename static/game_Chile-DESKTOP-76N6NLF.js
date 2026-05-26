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

    const try_again = new Audio('static/sounds/tente_novamente.mp3');
    const categories = {
        'basic': {
            'animals': {
                names: ['dog', 'cat', 'rooster'],
                audio: {
                    'dog': new Audio('/static/sounds/animals/dog.mp3'),
                    'cat': new Audio('/static/sounds/animals/cat.mp3'),
                    'rooster': new Audio('/static/sounds/animals/rooster.mp3')
                },
                imagePath: '/static/images/animals/'
            },
            'vowels': {
                names: ['a', 'e', 'i', 'o', 'u'],
                audio: {
                    'a': new Audio('/static/sounds/vowels/a.mp3'),
                    'e': new Audio('/static/sounds/vowels/e.mp3'),
                    'i': new Audio('/static/sounds/vowels/i.mp3'),
                    'o': new Audio('/static/sounds/vowels/o.mp3'),
                    'u': new Audio('/static/sounds/vowels/u.mp3')
                },
                imagePath: '/static/images/vowels/'
            },
            'colors': {
                names: ['red', 'blue', 'yellow'],
                audio: {
                    'red': new Audio('/static/sounds/colors/red.mp3'),
                    'blue': new Audio('/static/sounds/colors/blue.mp3'),
                    'yellow': new Audio('/static/sounds/colors/yellow.mp3')
                },
                imagePath: '/static/images/colors/'
            }
        },
        'intermediate': {
            'instruments': {
                names: ['drum', 'guitar', 'maracas', 'trumpet'],
                audio: {
                    'drum': new Audio('/static/sounds/instruments/drum.mp3'),
                    'guitar': new Audio('/static/sounds/instruments/guitar.mp3'),
                    'maracas': new Audio('/static/sounds/instruments/maracas.mp3'),
                    'trumpet': new Audio('/static/sounds/instruments/trumpet.mp3')
                },
                imagePath: '/static/images/instruments/'
            },
            'figures': {
                names: ['circle', 'kite', 'square', 'triangle'], // Puedes cambiar los estímulos si es necesario
                audio: {
                    'circle': new Audio('/static/sounds/figures/circle.mp3'),
                    'kite': new Audio('/static/sounds/figures/kite.mp3'),
                    'square': new Audio('/static/sounds/figures/square.mp3'),
                    'triangle': new Audio('/static/sounds/figures/triangle.mp3')
                },
                imagePath: '/static/images/figures/'
            },
            'activities': {
                names: ['eating', 'laugh', 'silence', 'whistle'],
                audio: {
                    'eating': new Audio('/static/sounds/activities/eating.mp3'),
                    'laugh': new Audio('/static/sounds/activities/laugh.mp3'),
                    'silence': new Audio('/static/sounds/activities/silence.mp3'),
                    'whistle': new Audio('/static/sounds/activities/whistle.mp3')
                },
                imagePath: '/static/images/activities/'
            }
        },
        'advanced': {
            'instruments': {
                names: ['drum', 'guitar', 'maracas', 'trumpet'],
                audio: {
                    'drum': new Audio('/static/sounds/instruments/drum.mp3'),
                    'guitar': new Audio('/static/sounds/instruments/guitar.mp3'),
                    'maracas': new Audio('/static/sounds/instruments/maracas.mp3'),
                    'trumpet': new Audio('/static/sounds/instruments/trumpet.mp3')
                },
                imagePath: '/static/images/instruments/'
            },
            'figures': {
                names: ['circle', 'kite', 'square', 'triangle'],
                audio: {
                    'circle': new Audio('/static/sounds/figures/circle.mp3'),
                    'kite': new Audio('/static/sounds/figures/kite.mp3'),
                    'square': new Audio('/static/sounds/figures/square.mp3'),
                    'triangle': new Audio('/static/sounds/figures/triangle.mp3')
                },
                imagePath: '/static/images/figures/'
            },
            'activities': {
                names: ['eating', 'laugh', 'silence', 'whistle'],
                audio: {
                    'eating': new Audio('/static/sounds/activities/eating.mp3'),
                    'laugh': new Audio('/static/sounds/activities/laugh.mp3'),
                    'silence': new Audio('/static/sounds/activities/silence.mp3'),
                    'whistle': new Audio('/static/sounds/activities/whistle.mp3')
                },
                imagePath: '/static/images/activities/'
            }
        }
    };

    let currentCategory = 'animals'; // Puedes inicializar en 'animals' o en 'vowels'

    const urlParams = new URLSearchParams(window.location.search);
    let level = urlParams.get('level') || 'basic';

    console.log(currentCategory)

    const imageWidth = 90; // Tamaño de las imágenes
    const imageHeight = 90;
    const minSpacing = 70; // Espacio mínimo entre imágenes

    let occupiedMap = [];

    function startGame() {
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
                    // alert("Tiempo terminado! Puntuación final: " + score);
                    // window.location.href = '/results_atac?score=' + score;
                    // Establece la puntuación final en el modal
                    // Actualiza el contenido del span con el id 'scoreDisplay'
                    $('#scoreDisplay').text(score);
                    // Muestra el modal
                    $('#timeUpModal').modal('show');
                    
                    // Maneja el botón para redirigir a la página de resultados
                    document.getElementById('goToResults').addEventListener('click', function() {
                        window.location.href = '/results_atac?score=' + score;
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
        category.audio[chosenItem].play(); // Reproducir la instrucción

        // Limpiar el intervalo anterior si existe
        clearInterval(audioRepeatInterval);
        audioRepeatCount = 0; // Resetear contador
        
        // Calcular máximo de repeticiones (total posible - 1)
        let maxAudioRepeats = Math.floor(stimuliDuration / 10000) - 1;
        
        // Configurar intervalo para repetir audio cada 10 segundos
        audioRepeatInterval = setInterval(() => {
            if (!isPaused && audioRepeatCount < maxAudioRepeats) {
                category.audio[chosenItem].play();
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
                if (stimulus.alt === chosenItem) {
                    clearInterval(audioRepeatInterval); // Limpiar intervalo cuando acierta
                    score++;
                    scoreDisplay.innerText = score;
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
                }
                else {
                    try_again.play();
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
        
        // Reproducir el audio del primer ítem (el que se debe encontrar)
        category1.audio[chosenItem1].play();

        // Limpiar el intervalo anterior si existe
        clearInterval(audioRepeatInterval);
        audioRepeatCount = 0; // Resetear contador
        
        // Calcular máximo de repeticiones (total posible - 1)
        let maxAudioRepeats = Math.floor(stimuliDuration / 10000) - 1;
        
        // Configurar intervalo para repetir audio cada 10 segundos
        audioRepeatInterval = setInterval(() => {
            if (!isPaused && audioRepeatCount < maxAudioRepeats) {
                category1.audio[chosenItem1].play();
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
                if (stimulus.alt === chosenItem1) {
                    clearInterval(audioRepeatInterval); // Limpiar intervalo cuando acierta
                    score++;
                    scoreDisplay.innerText = score;
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
                }
                else {
                    try_again.play();
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