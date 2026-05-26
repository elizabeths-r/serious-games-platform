// Demo Game - Versión simplificada para demostración interactiva
document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('demoGameArea');
    const startBtn = document.getElementById('startDemoBtn');
    const resetBtn = document.getElementById('resetDemoBtn');
    const scoreDisplay = document.getElementById('demoScore');
    const instructionBox = document.getElementById('instructionBox');

    // Inyectar estilos CSS para la animación del botón
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulseButton {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
            }
            50% {
                transform: scale(1.1);
                box-shadow: 0 0 0 15px rgba(76, 175, 80, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
            }
        }

        .pulse-animation {
            animation: pulseButton 1.5s infinite;
        }

        #startDemoBtn.pulse-animation {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
        }
    `;
    document.head.appendChild(style);

    // Aplicar animación al botón de inicio
    if (startBtn) {
        startBtn.classList.add('pulse-animation');
    }

    let demoScore = 0;
    let demoRunning = false;

    // Estímulos del nivel básico del juego
    const demoCategories = {
        'animals': {
            names: ['dog', 'cat', 'rooster'],
            imagePath: '/static/images/animals/',
            audio: {
                'dog': new Audio('/static/sounds/animals/dog.mp3'),
                'cat': new Audio('/static/sounds/animals/cat.mp3'),
                'rooster': new Audio('/static/sounds/animals/rooster.mp3')
            },
            labels: ['Perro', 'Gato', 'Gallo']
        },
        'vowels': {
            names: ['a', 'e', 'i', 'o', 'u'],
            imagePath: '/static/images/vowels/',
            audio: {
                'a': new Audio('/static/sounds/vowels/a.mp3'),
                'e': new Audio('/static/sounds/vowels/e.mp3'),
                'i': new Audio('/static/sounds/vowels/i.mp3'),
                'o': new Audio('/static/sounds/vowels/o.mp3'),
                'u': new Audio('/static/sounds/vowels/u.mp3')
            },
            labels: ['A', 'E', 'I', 'O', 'U']
        },
        'colors': {
            names: ['red', 'blue', 'yellow'],
            imagePath: '/static/images/colors/',
            audio: {
                'red': new Audio('/static/sounds/colors/red.mp3'),
                'blue': new Audio('/static/sounds/colors/blue.mp3'),
                'yellow': new Audio('/static/sounds/colors/yellow.mp3')
            },
            labels: ['Rojo', 'Azul', 'Amarillo']
        }
    };

    let currentRound = 0;
    const maxRounds = 3;
    const imageWidth = 90;
    const imageHeight = 90;
    const minSpacing = 70;
    let occupiedMap = [];
    const demoCategories_order = ['animals', 'vowels', 'colors'];
    let imagesLoaded = false;
    let preloadedImages = {}; // Almacenar imágenes precargadas

    // Audios de mensajes del interfaz
    const uiAudios = {
        'start': new Audio('/static/sounds/ui/comenzar_demo.mp3'),
        'instructions': new Audio('/static/sounds/ui/haz_clic_imagen.mp3'),
        'correct': new Audio('/static/sounds/ui/correcto.mp3'),
        'wrong': new Audio('/static/sounds/ui/intenta_nuevo.mp3'),
        'completed': new Audio('/static/sounds/ui/demo_completado.mp3'),
        'ready': new Audio('/static/sounds/ui/listo_jugar.mp3'),
        'excellent': new Audio('/static/sounds/ui/excelente.mp3'),
        'understood': new Audio('/static/sounds/ui/entiendes_juego.mp3'),
        'choose_level': new Audio('/static/sounds/ui/elige_nivel.mp3')
    };

    // Función para reproducir audio con fallback a síntesis de voz
    function playAudioWithFallback(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        
        // Seleccionar voz masculina en español
        const voices = window.speechSynthesis.getVoices();
        const spanishMaleVoice = voices.find(voice => 
            voice.lang.includes('es') && voice.name.toLowerCase().includes('male')
        ) || voices.find(voice => voice.lang.includes('es'));
        
        if (spanishMaleVoice) {
            utterance.voice = spanishMaleVoice;
        }
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // Función para reproducir audio de UI (con fallback a síntesis de voz)
    function playUIAudio(audioKey, fallbackText) {
        const audio = uiAudios[audioKey];
        
        audio.onended = () => audio.currentTime = 0; // Reset para próxima reproducción
        audio.onerror = () => {
            // Si el audio pregrabado no existe, usar síntesis de voz
            const utterance = new SpeechSynthesisUtterance(fallbackText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;  // Voz más grave
            
            // Seleccionar voz masculina en español
            const voices = window.speechSynthesis.getVoices();
            const spanishMaleVoice = voices.find(voice => 
                voice.lang.includes('es') && voice.name.toLowerCase().includes('male')
            ) || voices.find(voice => voice.lang.includes('es'));
            
            if (spanishMaleVoice) {
                utterance.voice = spanishMaleVoice;
            }
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        };
        
        audio.play().catch(() => {
            // Si no se puede reproducir, usar síntesis de voz
            const utterance = new SpeechSynthesisUtterance(fallbackText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 0.8;  // Voz más grave
            
            // Seleccionar voz masculina en español
            const voices = window.speechSynthesis.getVoices();
            const spanishMaleVoice = voices.find(voice => 
                voice.lang.includes('es') && voice.name.toLowerCase().includes('male')
            ) || voices.find(voice => voice.lang.includes('es'));
            
            if (spanishMaleVoice) {
                utterance.voice = spanishMaleVoice;
            }
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    }

    // Precarga de imágenes y audios
    function preloadImages() {
        let totalItems = 0;
        let loadedItems = 0;

        // Contar total de imágenes
        Object.values(demoCategories).forEach(category => {
            totalItems += category.names.length; // Imágenes
        });

        // Precarga de imágenes con eventos onload
        return new Promise((resolve) => {
            Object.values(demoCategories).forEach(category => {
                category.names.forEach(item => {
                    const img = new Image();
                    img.onload = () => {
                        // Guardar imagen precargada
                        const key = category.imagePath + item + '.png';
                        preloadedImages[key] = img;
                        loadedItems++;
                        if (loadedItems === totalItems) {
                            // Todas las imágenes cargadas, ahora cargar audios
                            preloadAudios().then(resolve);
                        }
                    };
                    img.onerror = () => {
                        loadedItems++;
                        if (loadedItems === totalItems) {
                            preloadAudios().then(resolve);
                        }
                    };
                    img.src = category.imagePath + item + '.png';
                });
            });
        });
    }

    // Precarga de audios
    function preloadAudios() {
        return new Promise((resolve) => {
            let audioTotal = 0;
            let audioLoaded = 0;

            // Contar audios
            Object.values(demoCategories).forEach(category => {
                audioTotal += category.names.length;
            });
            audioTotal += Object.keys(uiAudios).length;

            // Precarga de audios de estímulos
            Object.values(demoCategories).forEach(category => {
                category.names.forEach(item => {
                    const audio = category.audio[item];
                    audio.oncanplaythrough = audio.onerror = () => {
                        audioLoaded++;
                        if (audioLoaded === audioTotal) {
                            resolve();
                        }
                    };
                    audio.load();
                });
            });

            // Precarga de audios de UI
            Object.values(uiAudios).forEach(audio => {
                audio.oncanplaythrough = audio.onerror = () => {
                    audioLoaded++;
                    if (audioLoaded === audioTotal) {
                        resolve();
                    }
                };
                audio.load();
            });

            // Timeout de seguridad - si no carga en 8 segundos, continuar igual
            setTimeout(() => {
                resolve();
            }, 8000);
        });
    }

    // Inicializar precarga cuando carga el DOM
    instructionBox.innerHTML = '<span style="color: #999;">Cargando recursos...</span>';
    startBtn.style.opacity = '0.5';
    startBtn.style.cursor = 'not-allowed';
    startBtn.disabled = true;
    preloadImages().then(() => {
        imagesLoaded = true;
        instructionBox.innerHTML = 'Haz clic en el botón "Comenzar Demo" para empezar';
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';
        startBtn.disabled = false;
        playUIAudio('start', 'Haz clic en el botón Comenzar Demo para empezar');
        // Iluminar el botón cuando se reproduce el audio
        setTimeout(() => {
            startBtn.classList.add('highlight');
            setTimeout(() => {
                startBtn.classList.remove('highlight');
            }, 4000);
        }, 100);
    });

    // Inicializar mapa de ocupación
    function initializeOccupiedMap() {
        const cols = Math.ceil(gameArea.clientWidth / (imageWidth + minSpacing));
        const rows = Math.ceil(gameArea.clientHeight / (imageHeight + minSpacing));
        occupiedMap = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    // Marcar una posición como ocupada
    function markOccupied(x, y) {
        const colStart = Math.floor(x / (imageWidth + minSpacing));
        const colEnd = Math.floor((x + imageWidth) / (imageWidth + minSpacing));
        const rowStart = Math.floor(y / (imageHeight + minSpacing));
        const rowEnd = Math.floor((y + imageHeight) / (imageHeight + minSpacing));
        
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                if (col >= 0 && col < occupiedMap[0].length && row >= 0 && row < occupiedMap.length) {
                    occupiedMap[row][col] = true;
                }
            }
        }
    }

    // Verificar si una posición está ocupada
    function isOccupied(x, y) {
        const colStart = Math.floor(x / (imageWidth + minSpacing));
        const colEnd = Math.floor((x + imageWidth) / (imageWidth + minSpacing));
        const rowStart = Math.floor(y / (imageHeight + minSpacing));
        const rowEnd = Math.floor((y + imageHeight) / (imageHeight + minSpacing));

        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                if (col >= 0 && col < occupiedMap[0].length && row >= 0 && row < occupiedMap.length) {
                    if (occupiedMap[row][col]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Obtener posición aleatoria disponible
    function getRandomPosition() {
        const maxX = gameArea.clientWidth - imageWidth;
        const maxY = gameArea.clientHeight - imageHeight;
        
        // Si no hay espacio suficiente, usar posición aleatoria simple
        if (maxX <= 0 || maxY <= 0) {
            return {
                x: Math.max(0, Math.random() * (gameArea.clientWidth - imageWidth)),
                y: Math.max(0, Math.random() * (gameArea.clientHeight - imageHeight))
            };
        }
        
        let position;
        let attempts = 0;
        const maxAttempts = 500; // Aumentado de 200 a 500

        do {
            position = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };
            attempts++;
        } while (isOccupied(position.x, position.y) && attempts < maxAttempts);

        // Si aún no encontró posición después de muchos intentos, devolver posición aleatoria
        if (attempts >= maxAttempts) {
            return {
                x: Math.max(0, Math.random() * maxX),
                y: Math.max(0, Math.random() * maxY)
            };
        }

        return position;
    }

    function startDemo() {
        if (demoRunning || !imagesLoaded) return;
        
        startBtn.classList.remove('pulse-animation');
        demoRunning = true;
        demoScore = 0;
        currentRound = 0;
        scoreDisplay.innerText = demoScore;
        startBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        
        playRound();
    }

    function playRound() {
        if (currentRound >= maxRounds) {
            endDemo();
            return;
        }

        currentRound++;
        gameArea.innerHTML = ''; // Limpiar
        initializeOccupiedMap(); // Reiniciar mapa de ocupación
        
        // Usar categoría en orden (sin repetir)
        const selectedCategory = demoCategories_order[currentRound - 1];
        const category = demoCategories[selectedCategory];
        
        // Seleccionar item aleatorio
        const selectedIndex = Math.floor(Math.random() * category.names.length);
        const selectedItem = category.names[selectedIndex];
        const selectedLabel = category.labels[selectedIndex];
        
        // Mostrar instrucción
        instructionBox.innerHTML = `<strong>Escucha:</strong> "${selectedLabel}"<br><small>Haz clic en la imagen correcta</small>`;
        playUIAudio('instructions', 'Haz clic en la imagen correcta');
        
        // Reproducir audio del estímulo después de que termine el UI audio
        setTimeout(() => {
            if (category.audio && category.audio[selectedItem]) {
                category.audio[selectedItem].play().catch(() => {
                    // Si el audio no se puede reproducir, usar síntesis de voz
                    playAudioWithFallback(selectedLabel);
                });
            } else {
                // Si el audio no existe, usar síntesis de voz
                playAudioWithFallback(selectedLabel);
            }
        }, 1500);
        
        // Crear estímulos con las imágenes reales
        const shuffledItems = [...category.names].sort(() => Math.random() - 0.5);
        
        shuffledItems.forEach((item, index) => {
            const position = getRandomPosition();
            
            if (!position) {
                console.warn('No se pudo encontrar posición para:', item);
                return;
            }

            // Verificar que la posición sea válida
            if (position.x < 0 || position.y < 0 || 
                position.x + imageWidth > gameArea.clientWidth || 
                position.y + imageHeight > gameArea.clientHeight) {
                return;
            }

            markOccupied(position.x, position.y);

            const stimulus = document.createElement('img');
            stimulus.className = 'demo-stimulus';
            // Usar la imagen precargada en lugar de hacer nueva petición
            const imgKey = category.imagePath + item + '.png';
            if (preloadedImages[imgKey]) {
                stimulus.src = preloadedImages[imgKey].src;
            } else {
                stimulus.src = imgKey; // Fallback si no está precargada
            }
            stimulus.alt = item;
            
            // Posicionar usando la posición válida encontrada
            stimulus.style.left = position.x + 'px';
            stimulus.style.top = position.y + 'px';
            
            stimulus.addEventListener('click', () => {
                if (!demoRunning) return;
                
                if (item === selectedItem) {
                    // Acierto
                    stimulus.classList.add('correct');
                    demoScore++;
                    scoreDisplay.innerText = demoScore;
                    instructionBox.innerHTML = '<span style="color: #28a745; font-weight: bold;">✓ ¡Correcto!</span>';
                    playUIAudio('correct', '¡Correcto!');
                    
                    setTimeout(() => {
                        playRound();
                    }, 1500);
                } else {
                    // Error
                    stimulus.classList.add('wrong');
                    instructionBox.innerHTML = '<span style="color: #dc3545; font-weight: bold;">✗ Intenta de nuevo</span>';
                    playUIAudio('wrong', 'Intenta de nuevo');
                    
                    setTimeout(() => {
                        stimulus.classList.remove('wrong');
                    }, 300);
                }
            });
            
            gameArea.appendChild(stimulus);
        });
    }

    function endDemo() {
        demoRunning = false;
        startBtn.classList.add('pulse-animation');
        instructionBox.innerHTML = `
            <strong style="color: black; font-size: 18px;">¡Demo completado!</strong><br>
            <span>Puntuación final: <strong>${demoScore}/3</strong></span>
        `;
        playUIAudio('completed', '¡Demo completado!');
        
        gameArea.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: black; font-size: 45px;">🎉 ¡Excelente!</h2>
            </div>
        `;
        
        setTimeout(() => {
            playUIAudio('excellent', '¡Excelente!');
        }, 2500);
        
        startBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
    }

    function resetDemo() {
        startBtn.classList.add('pulse-animation');
        gameArea.innerHTML = '';
        instructionBox.innerHTML = 'Haz clic en el botón "Comenzar Demo" para empezar';
        scoreDisplay.innerText = '0';
        currentRound = 0;
        demoScore = 0;
        demoRunning = false;
        startBtn.style.display = 'inline-block';
        resetBtn.style.display = 'none';
        window.speechSynthesis.cancel();
        playUIAudio('start', 'Haz clic en el botón Comenzar Demo para empezar');
        // Iluminar el botón cuando se reproduce el audio
        setTimeout(() => {
            startBtn.classList.add('highlight');
            setTimeout(() => {
                startBtn.classList.remove('highlight');
            }, 4000);
        }, 100);
    }

    startBtn.addEventListener('click', startDemo);
    resetBtn.addEventListener('click', resetDemo);
});

    function playUIAudio(audioKey, fallbackText) {
        const audio = uiAudios[audioKey];

        sendAudioToRobot(audio);

        // fallback opcional
        if (fallbackText) {
            const utterance = new SpeechSynthesisUtterance(fallbackText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 0.8;

            setTimeout(() => {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }, 300); // pequeño delay por si falla el robot
        }
    }