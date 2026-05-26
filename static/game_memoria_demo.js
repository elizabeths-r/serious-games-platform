document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const startButton = document.getElementById('startButton');
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');

    // Demo con 2 pares de cartas (4 cartas totales)
    let cards = [
        { name: '1', img: 'static/images/numbers/1.png' },
        { name: '1', img: 'static/images/numbers/1.png' },
        { name: '2', img: 'static/images/numbers/2.png' },
        { name: '2', img: 'static/images/numbers/2.png' }
    ];

    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let matchedCards = 0;
    let score = 0;

    // Audios de instrucciones del demo
    const uiAudios = {
        'start': new Audio('/static/sounds/ui/comenzar_demo.mp3'),
        'instructions': new Audio('/static/sounds/ui/instrucciones_3.mp3'),
        'correct': new Audio('/static/sounds/ui/correcto.mp3'),
        'wrong': new Audio('/static/sounds/ui/intenta_nuevo.mp3'),
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
    
    function shuffle(array) {
        array.sort(() => 0.5 - Math.random());
    }

    function createBoard() {
        shuffle(cards);
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.name = card.name;
            
            const cardImg = document.createElement('img');
            cardImg.src = card.img;
            cardImg.alt = card.name;
            cardElement.appendChild(cardImg);
            
            cardElement.addEventListener('click', flipCard);
            grid.appendChild(cardElement);
        });
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;

        this.classList.add('flip');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            return;
        }
        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        const isMatch = firstCard.dataset.name === secondCard.dataset.name;
        if (isMatch) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        firstCard.classList.add('matched');
        secondCard.removeEventListener('click', flipCard);
        secondCard.classList.add('matched');
        matchedCards += 2;
        score++;
        scoreDisplay.innerText = score;
        playUIAudio('correct', '¡Correcto!');

        if (matchedCards === cards.length) {
            message.textContent = '¡Excelente! 🎉';
            message.style.color = 'black';
            lockBoard = true;
            setTimeout(() => {
                playUIAudio('completed', '¡Demo completado!');
                setTimeout(() => {
                    playUIAudio('excellent', '¡Excelente trabajo!');
                }, 1500);
            }, 500);
        }
        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        playUIAudio('wrong', 'Intenta de nuevo');
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

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

        #startButton.pulse-animation {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
        }
    `;
    document.head.appendChild(style);

    // Agregar animación al botón
    startButton.classList.add('pulse-animation');

    // Limpiar el grid al cargar
    grid.innerHTML = '';

    startButton.addEventListener('click', () => {
        grid.innerHTML = '';
        message.textContent = '';
        message.style.color = '#4caf50';
        createBoard();
        matchedCards = 0;
        score = 0;
        scoreDisplay.innerText = score;
        startButton.classList.remove('pulse-animation');
        setTimeout(() => {
            playUIAudio('instructions', 'Haz clic en las cartas para voltearlas y encuentra los pares iguales');
        }, 300);
    });

    // Reproducir audio de instrucciones al cargar la página
    playUIAudio('start', 'Haz clic en el botón Comenzar Demo para empezar');
});
