document.addEventListener('DOMContentLoaded', () => {
        const demoGameArea = document.getElementById('demoGameArea');
        const demoScore = document.getElementById('demoScore');
        const demoTimer = document.getElementById('demoTimer');
        const startDemoBtn = document.getElementById('startDemoBtn');
        const resetDemoBtn = document.getElementById('resetDemoBtn');
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
        if (startDemoBtn) {
            startDemoBtn.classList.add('pulse-animation');
        }

        let demoRunning = false;
        let demoTimeLeft = 20;
        let demoObjects = [];
        let demoPlayerX = 200;
        const demoPlayerWidth = 80;
        const demoPlayerHeight = 40;
        let demoGameScore = 0;
        let demoGameTimer = null;
        let demoObjectTimer = null;

        // Datos de las imágenes
        const objectImages = {
            airplane: '/static/images/transports/airplane.png',
            car: '/static/images/transports/car.png',
            bomb: '/static/images/transports/bomb.png'
        };

        // Audios de instrucciones del demo
        const uiAudios = {
            'start': new Audio('/static/sounds/ui/comenzar_demo.mp3'),
            'instructions': new Audio('/static/sounds/ui/instrucciones_2.mp3'),
            'correct': new Audio('/static/sounds/ui/correcto.mp3'),
            'wrong': new Audio('/static/sounds/ui/bombas.mp3'),
            'completed': new Audio('/static/sounds/ui/demo_completado.mp3'),
            'excellent': new Audio('/static/sounds/ui/excelente.mp3')
        };

        // Función para reproducir audio de UI con fallback a síntesis de voz
        function playUIAudio(audioKey, fallbackText) {
            const audio = uiAudios[audioKey];
            
            audio.onended = () => audio.currentTime = 0; // Reset para próxima reproducción
            audio.onerror = () => {
                // Si el audio pregrabado no existe, usar síntesis de voz
                playTextToSpeech(fallbackText);
            };
            
            audio.play().catch(() => {
                // Si no se puede reproducir, usar síntesis de voz
                playTextToSpeech(fallbackText);
            });
        }

        // Función para síntesis de voz
        function playTextToSpeech(text) {
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

        startDemoBtn.addEventListener('click', () => {
            startDemo();
        });

        resetDemoBtn.addEventListener('click', () => {
            resetDemo();
        });

        demoGameArea.addEventListener('mousemove', (e) => {
            if (demoRunning) {
                const rect = demoGameArea.getBoundingClientRect();
                const x = e.clientX - rect.left;
                demoPlayerX = Math.max(0, Math.min(x - demoPlayerWidth / 2, demoGameArea.offsetWidth - demoPlayerWidth));
                updatePlayerPosition();
            }
        });

        demoGameArea.addEventListener('touchmove', (e) => {
            if (demoRunning) {
                const rect = demoGameArea.getBoundingClientRect();
                const x = e.touches[0].clientX - rect.left;
                demoPlayerX = Math.max(0, Math.min(x - demoPlayerWidth / 2, demoGameArea.offsetWidth - demoPlayerWidth));
                updatePlayerPosition();
            }
        });

        function startDemo() {
            playUIAudio('instructions', 'Comenzar demo');
            startDemoBtn.classList.remove('pulse-animation');
            demoRunning = true;
            demoTimeLeft = 30;
            demoGameScore = 0;
            demoObjects = [];
            demoScore.textContent = '0';
            demoTimer.textContent = '30';
            demoGameArea.innerHTML = '';
            startDemoBtn.style.display = 'none';
            resetDemoBtn.style.display = 'inline-block';
            instructionBox.textContent = '¡Vamos! Mueve los niños para capturar los transportes y esquiva las bombas';
            instructionBox.style.background = '#fff3cd';

            // Crear jugador
            const player = document.createElement('div');
            player.id = 'demoPlayer';
            player.className = 'demo-player';
            demoGameArea.appendChild(player);
            updatePlayerPosition();

            // Timer
            demoGameTimer = setInterval(() => {
                demoTimeLeft--;
                demoTimer.textContent = demoTimeLeft;
                if (demoTimeLeft <= 0) {
                    endDemo();
                }
            }, 1000);

            // Generar objetos
            demoObjectTimer = setInterval(() => {
                generateDemoObject();
            }, 800);
        }

        function generateDemoObject() {
            const types = ['airplane', 'car', 'bomb'];
            // 80% transportes, 20% bomba
            const rand = Math.random();
            let type;
            if (rand < 0.8) {
                type = types[Math.floor(Math.random() * 2)]; // airplane o car
            } else {
                type = 'bomb';
            }

            const obj = document.createElement('div');
            obj.className = 'demo-falling-object';
            obj.style.backgroundImage = `url('${objectImages[type]}')`;
            obj.style.left = Math.random() * (demoGameArea.offsetWidth - 60) + 'px';
            obj.style.top = '0px';
            obj.dataset.type = type;
            obj.dataset.y = 0;
            demoGameArea.appendChild(obj);
            demoObjects.push({
                element: obj,
                type: type,
                x: parseInt(obj.style.left),
                y: 0
            });
        }

        function updatePlayerPosition() {
            const player = document.getElementById('demoPlayer');
            if (player) {
                player.style.left = demoPlayerX + 'px';
            }
        }

        function endDemo() {
            playUIAudio('completed', `Demo terminada con puntuación de ${demoGameScore} puntos`);
            //startDemoBtn.classList.add('pulse-animation');
            demoRunning = false;
            clearInterval(demoGameTimer);
            clearInterval(demoObjectTimer);
            instructionBox.textContent = `¡Demo terminada! Puntuación: ${demoGameScore}.`;
            instructionBox.style.background = '#d4edda';
            startDemoBtn.style.display = 'inline-block';
            resetDemoBtn.style.display = 'none';
        }

        function resetDemo() {
            playUIAudio('start', 'Haz clic en el botón Comenzar Demo para empezar');
            startDemoBtn.classList.add('pulse-animation');
            demoRunning = false;
            clearInterval(demoGameTimer);
            clearInterval(demoObjectTimer);
            demoGameArea.innerHTML = '';
            demoTimeLeft = 30;
            demoGameScore = 0;
            demoScore.textContent = '0';
            demoTimer.textContent = '30';
            demoObjects = [];
            instructionBox.textContent = 'Haz clic en el botón "Comenzar Demo" para empezar';
            instructionBox.style.background = '#e8f4f8';
            startDemoBtn.style.display = 'inline-block';
            resetDemoBtn.style.display = 'none';
        }

        // Animación de caída
        setInterval(() => {
            if (demoRunning) {
                demoObjects.forEach((obj, index) => {
                    obj.y += 3;
                    obj.element.style.top = obj.y + 'px';

                    // Verificar colisión
                    if (obj.y + 60 > demoGameArea.offsetHeight - demoPlayerHeight &&
                        obj.y + 60 < demoGameArea.offsetHeight &&
                        obj.x + 60 > demoPlayerX &&
                        obj.x < demoPlayerX + demoPlayerWidth) {
                        
                        if (obj.type === 'bomb') {
                            playUIAudio('wrong', 'Oops, capturaste una bomba');
                            demoGameScore = Math.max(0, demoGameScore - 2);
                            instructionBox.textContent = '😬 ¡Oops! Capturaste una bomba - 2 puntos';
                            instructionBox.style.background = '#f8d7da';
                        } else {
                            playUIAudio('excellent', 'Excelente, capturaste un transporte');
                            demoGameScore++;
                            instructionBox.textContent = '🎉 ¡Excelente! Capturaste un transporte + 1 punto';
                            instructionBox.style.background = '#d4edda';
                        }
                        demoScore.textContent = demoGameScore;
                        obj.element.remove();
                        demoObjects.splice(index, 1);
                        
                        // Volver al mensaje normal después de 1.5 segundos
                        setTimeout(() => {
                            if (demoRunning) {
                                instructionBox.textContent = '¡Vamos! Mueve los niños para capturar los transportes y esquiva las bombas';
                                instructionBox.style.background = '#e8f4f8';
                            }
                        }, 1500);
                    }

                    // Remover si sale del área
                    if (obj.y > demoGameArea.offsetHeight) {
                        obj.element.remove();
                        demoObjects.splice(index, 1);
                    }
                });
            }
        }, 30);

        // Reproducir audio de instrucciones al cargar la página
        playUIAudio('start', 'Haz clic en el botón Comenzar Demo para empezar');
});
