// game_4_Chile.js 
// Obtener parámetros desde la URL
function getParametersFromURL() {
    const params = new URLSearchParams(window.location.search);
    let level = params.get('level');
    const playerName = params.get('name') || 'Unknown';
    const sessionName = params.get('sessionName') || 'basic';
    
    // Validar que el nivel sea válido
    if (level !== 'basic' && level !== 'intermediate' && level !== 'advanced') {
        level = 'intermediate'; // por defecto
    }
    
    return { level, playerName, sessionName };
}

// Configuración global
const urlParams = getParametersFromURL();
let currentLevel = urlParams.level;

// Objeto para rastrear métricas del juego
let gameMetrics = {
    playerName: urlParams.playerName,
    sessionName: urlParams.sessionName,
    level: urlParams.level,
    startTime: null,
    endTime: null,
    score: 0,
    errors: 0,
    hitErrors: 0,  // Errores al colocar incorrectamente
    categorizationTimes: [],  // Tiempo de cada categorización correcta
    lastCategorizationTime: null  // Para calcular diferencia de tiempos
};

// Configuración de ítems correctos por nivel
const LEVELS_CONFIG = {
    intermediate: {
        title: 'Categorizar Medios de Transporte',
        correctItems: {
            aereo: ["aereo1", "aereo2"],
            terrestre: ["terrestre1", "terrestre2"],
            maritimo: ["maritimo1", "maritimo2"]
        },
        slots: ['aereo', 'terrestre', 'maritimo'],
        maxItems: 2  // dos items por slot
    },
    advanced: {
        title: 'Categorizar Transportes y Alimentos',
        correctItems: {
            aereo: ["aereo1", "aereo2"],
            maritimo: ["maritimo1", "maritimo2"],
            terrestre: ["terrestre1", "terrestre2"],
            frutas: ["fruta1", "fruta2"],
            verduras: ["verdura1", "verdura2"]
        },
        slots: ['aereo', 'maritimo', 'terrestre', 'frutas', 'verduras'],
        maxItems: 2  // dos items por slot
    },
    basic: {
        title: 'Categorizar Frutas y Verduras',
        correctItems: {
            frutas: ["fruta1", "fruta2"],
            verduras: ["verdura1", "verdura2"]
        },
        slots: ['frutas', 'verduras'],
        maxItems: 2  // dos items por slot
    }
};

// Elementos principales
const scoreDisplay = document.getElementById('score');
const feedback = document.getElementById('feedback');

let score = 0;
let optionsContainer = null;  // Se inicializa dinámicamente
let placedItems = new Set();  // Rastrear items ya colocados correctamente

// Sonidos
const no_colocar = 'sounds/no_colocar';
const complete = 'sounds/Juego_completado';
const item_de = 'sounds/Item_devuelto';
const correct = 'sounds/Correcto';

// Mapeo de items a sonidos para frutas, verduras y transportes
const ITEM_SOUNDS = {
    'fruta1': 'sounds/fruits/apple',        // manzana
    'fruta2': 'sounds/fruits/pear',         // pera
    'verdura1': 'sounds/vegetables/tomato', // tomate
    'verdura2': 'sounds/vegetables/carrot', // zanahoria
    'aereo1': 'sounds/transports/airplane',  // avión 1
    'aereo2': 'sounds/transports/airplane_2',  // avión 2
    'terrestre1': 'sounds/transports/train',   // auto/carro 1
    'terrestre2': 'sounds/transports/car',   // auto/carro 2
    'maritimo1': 'sounds/transports/submarine',   // barco/ship 1
    'maritimo2': 'sounds/transports/ship'    // barco/ship 2
};

// Mapeo de categorías a sonidos
const CATEGORY_SOUNDS = {
    'frutas': 'sounds/fruits/fruits',
    'verduras': 'sounds/vegetables/vegetables',
    'aereo': 'sounds/transports/aereo',
    'terrestre': 'sounds/transports/terrestre',
    'maritimo': 'sounds/transports/maritimo'
};

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

// Reproducir sonido de la categor�a
function playCategorySound(categoryId) {
    const soundFile = CATEGORY_SOUNDS[categoryId];
    if (soundFile) {
        console.log('Enviando sonido de categor�a al robot:', soundFile);
        sendAudioToRobot(soundFile);
    } else {
        console.warn('No se encontr� sonido para la categor�a:', categoryId);
    }
}

// Reproducir sonido del item (nombre del item)
function playItemSound(itemId) {
    const soundFile = ITEM_SOUNDS[itemId];
    if (soundFile) {
        console.log('Enviando sonido del item al robot:', soundFile);
        sendAudioToRobot(soundFile);
    } else {
        console.warn('No se encontr� sonido para el item:', itemId);
    }
}

// Cambiar nivel - DEPRECADO (se mantiene por compatibilidad)
function changeLevel() {
    console.warn('changeLevel() ya no se usa. El nivel se define desde la URL.');
    resetGame();
}

// Reiniciar juego
function resetGame() {
    score = 0;
    scoreDisplay.textContent = score;
    feedback.textContent = '';
    placedItems = new Set();  // Limpiar items colocados
    
    // Reiniciar métricas del juego
    gameMetrics = {
        playerName: gameMetrics.playerName,
        sessionName: gameMetrics.sessionName,
        level: gameMetrics.level,
        startTime: Date.now(),
        endTime: null,
        score: 0,
        errors: 0,
        hitErrors: 0,
        categorizationTimes: [],
        lastCategorizationTime: Date.now()
    };
    
    // Limpiar slots
    const slotsId = getSlotsContainerId();
    const slots = document.querySelectorAll(`#${slotsId} .drop-slot`);
    
    const labels = {
        'comida': 'Comida',
        'decoracion': 'Decoración',
        'actividad': 'Actividad',
        'aereo': 'Aéreo',
        'terrestre': 'Terrestre',
        'maritimo': 'Marítimo',
        'ferrocarril': 'Ferrocarril',
        'carretera': 'Carretera',
        'especial': 'Especial',
        'frutas': 'Fruta',
        'verduras': 'Verdura'
    };
    
    const emojis = {
        'aereo': '🌍',
        'terrestre': '🛣️',
        'maritimo': '🌊',
        'frutas': '🍍',
        'verduras': '🥗'
    };
    
    slots.forEach(slot => {
        const slotType = slot.dataset.slot;
        const label = labels[slotType] || slotType;
        const emoji = emojis[slotType];
        
        slot.innerHTML = '';
        if (emoji) {
            slot.innerHTML = `<span class="emoji">${emoji}</span>${label}`;
        } else {
            slot.textContent = label;
        }
    });
    
    // Restaurar opacidad de imágenes
    document.querySelectorAll('#options img, #options-basic img, #options-advanced img').forEach(img => {
        img.style.opacity = '1';
        img.style.pointerEvents = 'auto';
        img.setAttribute('draggable', 'true');
    });
    
    // Reiniciar drag & drop
    initializeDragDrop();
}

// Helpers modal
function openModal(msg) {
    const m = document.getElementById('modal');
    document.getElementById('modal-text').textContent = msg;
    m.style.display = 'block';
}
function closeModal() {
    const m = document.getElementById('modal');
    m.style.display = 'none';
}
window.closeModal = closeModal;

// Actualizar puntuación
function setScore(value) {
    score = value;
    scoreDisplay.textContent = score;
}

// Comprobar si el juego está completo
function isGameComplete() {
    const slotsId = getSlotsContainerId();
    const slotsSelector = document.querySelectorAll(`#${slotsId} .drop-slot`);
    const config = LEVELS_CONFIG[currentLevel];
    
    // Validar que cada slot tenga el número correcto de imágenes
    let allComplete = true;
    slotsSelector.forEach(slot => {
        const images = slot.querySelectorAll('img');
        if (images.length !== config.maxItems) {
            allComplete = false;
        }
    });
    
    return allComplete;
}

// Obtener identificador del container actual
function getOptionsContainerId() {
    if (currentLevel === 'advanced') return 'options-advanced';
    if (currentLevel === 'intermediate') return 'options';
    return 'options-basic';
}

function getSlotsContainerId() {
    if (currentLevel === 'advanced') return 'slots-advanced';
    if (currentLevel === 'intermediate') return 'slots';
    return 'slots-basic';
}

// Crear contenedor para imagen (para nivel básico)
function createImageContainer(img) {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.margin = '3px';
    container.style.width = '55px';
    container.style.height = '55px';
    
    const newImg = img.cloneNode(true);
    newImg.style.width = '100%';
    newImg.style.height = '100%';
    newImg.style.objectFit = 'contain';
    newImg.style.borderRadius = '10px';
    newImg.dataset.originalItem = img.dataset.item;
    
    container.appendChild(newImg);
    return container;
}

// Inicializar drag & drop
function initializeDragDrop() {
    const optionsId = getOptionsContainerId();
    const slotsId = getSlotsContainerId();
    const optionsContainer = document.getElementById(optionsId);
    const slots = document.querySelectorAll(`#${slotsId} .drop-slot`);
    const allImages = document.querySelectorAll(`#${optionsId} img`);
    
    // DRAG & DROP (PC)
    allImages.forEach(img => {
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', img.dataset.item);
            if (e.dataTransfer.setDragImage) {
                e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
            }
        });
        
        // Reproducir sonido al hacer click
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            playItemSound(img.dataset.item);
        });
    });

    // TOUCH SUPPORT
    let touchDraggedItem = null;
    let touchClone = null;

    function enableTouchDrag(img) {
        img.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchDraggedItem = img;
            
            // Reproducir sonido al tocar
            playItemSound(img.dataset.item);

            touchClone = img.cloneNode(true);
            touchClone.style.position = 'absolute';
            touchClone.style.pointerEvents = 'none';
            touchClone.style.opacity = '0.7';
            touchClone.style.width = img.offsetWidth + 'px';
            document.body.appendChild(touchClone);

            moveClone(e.touches[0]);
        });

        img.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (touchClone) {
                moveClone(e.touches[0]);
            }
        });

        img.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (touchClone) {
                document.body.removeChild(touchClone);
                touchClone = null;
            }

            const touch = e.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

            if (dropTarget && dropTarget.classList.contains('drop-slot')) {
                simulateDrop(touchDraggedItem, dropTarget);
            }

            touchDraggedItem = null;
        });
    }

    function moveClone(touch) {
        if (touchClone) {
            touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
            touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
        }
    }

    function simulateDrop(img, slot) {
        const itemId = img.dataset.item;
        const e = new Event('drop', { bubbles: true });
        e.dataTransfer = { getData: () => itemId };
        slot.dispatchEvent(e);
    }

    allImages.forEach(img => {
        enableTouchDrag(img);
    });

    // DROP EN SLOTS
    slots.forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());

        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const img = document.querySelector(`#${optionsId} img[data-item="${itemId}"]`);
            
            if (!img) {
                feedback.textContent = 'Imagen no encontrada.';
                return;
            }

            // Validar si el item ya fue colocado correctamente antes
            if (placedItems.has(itemId)) {
                feedback.textContent = 'Este item ya fue colocado correctamente.';
                sendAudioToRobot(no_colocar);
                return;
            }

            const slotType = slot.dataset.slot;
            const config = LEVELS_CONFIG[currentLevel];
            const correctItems = config.correctItems[slotType];

            // Verificar si el item es correcto para este slot
            let isCorrect = false;
            if (Array.isArray(correctItems)) {
                isCorrect = correctItems.includes(itemId);
            } else {
                isCorrect = correctItems === itemId;
            }

            if (!isCorrect) {
                sendAudioToRobot(no_colocar);
                feedback.textContent = 'No puedes colocar este item aqui.';
                gameMetrics.errors++;  // Contar error
                gameMetrics.hitErrors++;
                return;
            }

            // Verificar si el item ya está en este slot
            const itemsInSlot = Array.from(slot.querySelectorAll('img')).map(i => i.dataset.originalItem || i.dataset.item);
            if (itemsInSlot.includes(itemId)) {
                feedback.textContent = 'Este item ya está colocado.';
                return;
            }
            
            // Verificar si el slot está lleno
            if (itemsInSlot.length >= config.maxItems) {
                feedback.textContent = 'Este slot está lleno.';
                return;
            }

            // Agregar imagen al slot
            if (currentLevel === 'intermediate' || currentLevel === 'advanced') {
                // Para intermedio/advanced: crear contenedor para visualizar bien múltiples items
                const container = createImageContainer(img);
                if (slot.textContent && slot.textContent.trim() && !slot.querySelector('img')) {
                    slot.textContent = '';
                }
                slot.appendChild(container);
            } else {
                // Para básico: igual lógica
                const container = createImageContainer(img);
                if (slot.textContent && slot.textContent.trim() && !slot.querySelector('img')) {
                    slot.textContent = '';
                }
                slot.appendChild(container);
            }

            // Marcar item como colocado correctamente
            placedItems.add(itemId);

            // Ocultar la imagen original y hacerla no-arrastreable
            img.style.opacity = '0.5';
            img.style.pointerEvents = 'none';
            img.setAttribute('draggable', 'false');

            setScore(score + 1);
            gameMetrics.score = score;
            
            // Rastrear tiempo de categorización
            const currentTime = Date.now();
            if (gameMetrics.lastCategorizationTime === null) {
                gameMetrics.lastCategorizationTime = gameMetrics.startTime;
            }
            const timeDiff = currentTime - gameMetrics.lastCategorizationTime;
            gameMetrics.categorizationTimes.push({
                item: itemId,
                category: slotType,
                timeMs: timeDiff
            });
            gameMetrics.lastCategorizationTime = currentTime;
            
            feedback.textContent = 'Correcto';
            sendAudioToRobot(correct);

            if (isGameComplete()) {
                document.querySelectorAll(`#${optionsId} img, #${slotsId} img`).forEach(i => {
                    if (i) i.setAttribute('draggable', 'false');
                });
                sendAudioToRobot(complete);
                
                // Capturar tiempo de finalización
                gameMetrics.endTime = Date.now();
                const gameDuration = (gameMetrics.endTime - gameMetrics.startTime) / 1000; // en segundos
                
                // Llenar el modal con los datos
                document.getElementById('playerName').innerText = gameMetrics.playerName;
                document.getElementById('playerLevel').innerText = gameMetrics.level;
                document.getElementById('totalScoreDisplay').innerText = gameMetrics.score;
                
                // Enviar métricas al backend
                const metricsToSave = {
                    playerName: gameMetrics.playerName,
                    sessionName: gameMetrics.sessionName,
                    gameName: 'Planejamento',
                    level: gameMetrics.level,
                    hits: gameMetrics.score,
                    errors: gameMetrics.errors,
                    score: gameMetrics.score,
                    gameDuration: gameDuration,
                    avgResponseTime: (gameDuration / gameMetrics.score).toFixed(2),
                    responsesDetail: JSON.stringify(gameMetrics.categorizationTimes)
                };
                
                fetch('/save_game_metrics', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(metricsToSave)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Métricas guardadas:', data);
                })
                .catch(error => {
                    console.error('Error al guardar métricas:', error);
                });
                
                $('#timeUpModal').modal('show');
                document.getElementById('goToResults').addEventListener('click', function() {
                    window.location.href = '/results_atac?score=' + gameMetrics.score;
                });
            }
        });

        // Click para retirar items y reproducir sonido de categoría
        slot.addEventListener('click', () => {
            const slotType = slot.dataset.slot;
            
            // Reproducir sonido de la categoría
            playCategorySound(slotType);
            
            const images = slot.querySelectorAll('img');
            if (images.length > 0) {
                const lastImg = images[images.length - 1];
                const itemId = lastImg.dataset.originalItem || lastImg.dataset.item;
                
                // No permitir retirar items ya colocados correctamente
                if (placedItems.has(itemId)) {
                    return;
                }
                
                const originalImg = document.querySelector(`#${optionsId} img[data-item="${itemId}"]`);
                if (originalImg) {
                    originalImg.style.opacity = '1';
                    originalImg.style.pointerEvents = 'auto';
                }
                lastImg.parentElement.remove();
                
                if (slot.querySelectorAll('img').length === 0) {
                    const labels = {
                        'aereo': 'Aéreo',
                        'ferrocarril': 'Ferrocarril',
                        'carretera': 'Carretera',
                        'maritimo': 'Marítimo',
                        'especial': 'Especial',
                        'terrestre': 'Terrestre',
                        'frutas': 'Fruta',
                        'verduras': 'Verdura',
                        'comida': 'Comida',
                        'decoracion': 'Decoración',
                        'actividad': 'Actividad'
                    };
                    slot.textContent = labels[slot.dataset.slot] || slot.dataset.slot;
                    // Re-agregar el emoji
                    const emojis = {
                        'aereo': '✈️',
                        'terrestre': '🚗',
                        'maritimo': '🚢',
                        'frutas': '🍎',
                        'verduras': '🥕'
                    };
                    const emoji = emojis[slotType];
                    if (emoji) {
                        slot.innerHTML = `<span class="emoji">${emoji}</span>${labels[slotType]}`;
                    }
                }
                sendAudioToRobot(item_de);
                feedback.textContent = 'Item quitado.';
            }
        });
    });
}

// Inicializar cuando cargue la página
window.addEventListener('DOMContentLoaded', () => {
    // Inicializar tiempo de inicio del juego
    gameMetrics.startTime = Date.now();
    gameMetrics.lastCategorizationTime = gameMetrics.startTime;
    
    // Recuperar datos del jugador de sessionStorage si existen
    const storedPlayerName = sessionStorage.getItem('playerName');
    const storedSessionName = sessionStorage.getItem('sessionName');
    if (storedPlayerName) {
        gameMetrics.playerName = storedPlayerName;
    }
    if (storedSessionName) {
        gameMetrics.sessionName = storedSessionName;
    }
    
    // Configurar nivel
    console.log('Nivel del juego:', currentLevel);
    console.log('Métricas inicializadas:', gameMetrics);
    
    // Actualizar título
    document.getElementById('game-title').textContent = LEVELS_CONFIG[currentLevel].title;
    
    // Mostrar/ocultar elementos según nivel
    document.querySelectorAll('.level-content').forEach(elem => {
        elem.style.display = elem.dataset.level === currentLevel ? '' : 'none';
    });
    
    // Inicializar optionsContainer
    const optionsId = getOptionsContainerId();
    optionsContainer = document.getElementById(optionsId);
    
    // Inicializar drag & drop
    initializeDragDrop();
});