document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const startButton = document.getElementById('startButton');
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');
    const scoreFinalDisplay = document.getElementById('scoreDisplay');

    // ====== MÉTRICAS DEL JUEGO ======
    let gameMetrics = {
        playerName: 'Unknown',
        sessionName: 'Unknown',
        level: 'basic',
        startTime: null,
        endTime: null,
        hits: 0,                      // Pares encontrados
        errors: 0,                    // Intentos fallidos
        score: 0,
        firstCardTime: null,          // Tiempo de primera carta
        cardsFlipped: 0,              // Total de flips
        cardsViewed: new Set(),       // Cartas vistas (única)
        pairTimes: [],                // Tiempo de cada par encontrado
        attemptHistory: [],           // Historial: aciertos/errores
        winStreak: 0,                 // Racha actual
        maxWinStreak: 0               // Mejor racha histórica
    };

    // Capturar parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    let playerName = urlParams.get('name') || 'Jugador_' + Date.now();
    let sessionName = urlParams.get('sessionName') || 'Unknown Session';
    let level = urlParams.get('level') || 'basic';

    gameMetrics.playerName = playerName;
    gameMetrics.sessionName = sessionName;
    gameMetrics.level = level;

    let cards = [
        { name: '1', img: 'static/images/numbers/1.png' },
        { name: '1', img: 'static/images/numbers/1.png' },
        { name: '2', img: 'static/images/numbers/2.png' },
        { name: '2', img: 'static/images/numbers/2.png' },
        { name: '3', img: 'static/images/numbers/3.png' },
        { name: '3', img: 'static/images/numbers/3.png' }
    ];

    const try_again = 'sounds/mario-bros-ooh';
    const turn_carta = 'sounds/turn_carta';
    const two_carta = 'sounds/two_cartas';
    const victorySound = 'sounds/victory';

    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let matchedCards = 0;
    let score = 0;
    let pairStartTime = null;          // Registrar tiempo de par actual

    // FunciÃ³n para enviar el archivo de audio al robot a travÃ©s de Flask
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

    function shuffle(array) {
        array.sort(() => 0.5 - Math.random());
    }

    function createBoard() {
        // Ajustar el grid según el nivel
        grid.className = 'grid grid-' + level;
        
        if (level === 'intermediate') {
            cards = [
                { name: 'a', img: 'static/images/vowels/a.png' },
                { name: 'a', img: 'static/images/vowels/a.png' },
                { name: 'e', img: 'static/images/vowels/e.png' },
                { name: 'e', img: 'static/images/vowels/e.png' },
                { name: 'i', img: 'static/images/vowels/i.png' },
                { name: 'i', img: 'static/images/vowels/i.png' },
                { name: 'o', img: 'static/images/vowels/o.png' },
                { name: 'o', img: 'static/images/vowels/o.png' },
                { name: 'u', img: 'static/images/vowels/u.png' },
                { name: 'u', img: 'static/images/vowels/u.png' }
            ];
        } else if (level === 'advanced') {
            cards = [
                { name: 'a', img: 'static/images/vowels/a.png' },
                { name: 'a', img: 'static/images/vowels/a.png' },
                { name: 'e', img: 'static/images/vowels/e.png' },
                { name: 'e', img: 'static/images/vowels/e.png' },
                { name: 'i', img: 'static/images/vowels/i.png' },
                { name: 'i', img: 'static/images/vowels/i.png' },
                { name: 'o', img: 'static/images/vowels/o.png' },
                { name: 'o', img: 'static/images/vowels/o.png' },
                { name: 'u', img: 'static/images/vowels/u.png' },
                { name: 'u', img: 'static/images/vowels/u.png' },
                { name: '1', img: 'static/images/numbers/1.png' },
                { name: '1', img: 'static/images/numbers/1.png' },
                { name: '2', img: 'static/images/numbers/2.png' },
                { name: '2', img: 'static/images/numbers/2.png' },
                { name: '3', img: 'static/images/numbers/3.png' },
                { name: '3', img: 'static/images/numbers/3.png' },
                { name: '4', img: 'static/images/numbers/4.png' },
                { name: '4', img: 'static/images/numbers/4.png' },
                { name: '5', img: 'static/images/numbers/5.png' },
                { name: '5', img: 'static/images/numbers/5.png' }
            ];
        }
        shuffle(cards);
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.dataset.name = card.name;
            
            const cardImg = document.createElement('img');
            cardImg.src = card.img;
            cardElement.appendChild(cardImg);
            
            cardElement.addEventListener('click', flipCard);
            cardElement.addEventListener('touchstart', flipCard);
            grid.appendChild(cardElement);
        });
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === firstCard) return;
        
        // Registrar tiempo de primera carta del juego
        if (gameMetrics.firstCardTime === null && gameMetrics.cardsFlipped === 0) {
            gameMetrics.startTime = Date.now();
            gameMetrics.firstCardTime = 0;
        }
        
        gameMetrics.cardsFlipped++;
        gameMetrics.cardsViewed.add(this.dataset.name);
        
        // Enviar el audio al robot
        sendAudioToRobot(turn_carta);

        this.classList.add('flip');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;
            pairStartTime = Date.now();
            return;
        }
        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        const isMatch = firstCard.dataset.name === secondCard.dataset.name;
        if (isMatch) {
            disableCards();
            sendAudioToRobot(two_carta); 
       } else {
            sendAudioToRobot(try_again);
            unflipCards();
       }
    }

    function disableCards() {
        // ACIERTO: Registrar par encontrado
        const pairTime = (Date.now() - pairStartTime) / 1000;
        gameMetrics.hits++;
        gameMetrics.pairTimes.push(pairTime);
        gameMetrics.attemptHistory.push({ type: 'hit', time: pairTime });
        gameMetrics.winStreak++;
        if (gameMetrics.winStreak > gameMetrics.maxWinStreak) {
            gameMetrics.maxWinStreak = gameMetrics.winStreak;
        }
        
        firstCard.removeEventListener('click', flipCard);
        firstCard.removeEventListener('touchstart', flipCard);
        firstCard.classList.add('matched');
        secondCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('touchstart', flipCard);
        secondCard.classList.add('matched');
        matchedCards += 2;
        score++;
        gameMetrics.score = score;
        scoreDisplay.innerText = score;
        if (matchedCards === cards.length) {
           gameMetrics.endTime = Date.now();
           sendAudioToRobot(victorySound);
           scoreFinalDisplay.innerText = score;
           endGame();
        }
        resetBoard();
    }

    function unflipCards() {
        // ERROR: Intentos fallidos
        gameMetrics.errors++;
        gameMetrics.attemptHistory.push({ type: 'error' });
        gameMetrics.winStreak = 0; // Resetear racha
        
        lockBoard = true;
        firstCard.classList.add('wrong-match');
        secondCard.classList.add('wrong-match');
        setTimeout(() => {
            firstCard.classList.remove('flip');
            firstCard.classList.remove('wrong-match');
            secondCard.classList.remove('flip');
            secondCard.classList.remove('wrong-match');
            resetBoard();
        }, 1500);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    // Inyectar estilos CSS para las animaciones de las cartas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes cardMatch {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                background-color: #4caf50 !important;
                border-color: #4caf50 !important;
            }
        }

        @keyframes cardWrong {
            0%, 100% {
                transform: rotateZ(0deg);
            }
            25% {
                transform: rotateZ(-5deg);
            }
            75% {
                transform: rotateZ(5deg);
            }
        }

        .card {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .card:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }

        .card.matched {
            animation: cardMatch 0.5s ease-out;
            cursor: default !important;
            background-color: #4caf50 !important;
            border-color: #4caf50 !important;
        }

        .card.wrong-match {
            animation: cardWrong 0.4s ease-in-out;
        }
    `;
    document.head.appendChild(style);

    // ====== FUNCIÓN PARA CALCULAR Y GUARDAR MÉTRICAS ======
    function endGame() {
        const gameDuration = (gameMetrics.endTime - gameMetrics.startTime) / 1000;
        const totalAttempts = gameMetrics.hits + gameMetrics.errors;
        
        // Calcular métricas derivadas
        const efficiency = gameMetrics.hits > 0 ? (gameMetrics.hits / totalAttempts * 100).toFixed(1) : 0;
        const avgAttemptsPerPair = gameMetrics.hits > 0 ? (totalAttempts / gameMetrics.hits).toFixed(2) : 0;
        const avgSearchTime = gameMetrics.hits > 0 ? (gameDuration / gameMetrics.hits).toFixed(2) : 0;
        const cardsViewedCount = gameMetrics.cardsViewed.size;
        
        console.log('=== Métricas de Juego 3 ===');
        console.log('Aciertos (Pares):', gameMetrics.hits);
        console.log('Errores (Intentos fallidos):', gameMetrics.errors);
        console.log('Eficiencia:', efficiency + '%');
        console.log('Promedio intentos por par:', avgAttemptsPerPair);
        console.log('Tiempo promedio de búsqueda:', avgSearchTime + 's');
        console.log('Cartas vistas (únicas):', cardsViewedCount);
        console.log('Mejor racha:', gameMetrics.maxWinStreak);
        console.log('Duración total:', gameDuration.toFixed(1) + 's');
        
        // Poblar datos en el modal (campos ocultos)
        document.getElementById('hitsDisplay').innerText = gameMetrics.hits;
        document.getElementById('errorsDisplay').innerText = gameMetrics.errors;
        document.getElementById('efficiencyDisplay').innerText = efficiency;
        document.getElementById('gameDurationDisplay').innerText = gameDuration.toFixed(1);
        document.getElementById('avgSearchTimeDisplay').innerText = avgSearchTime;
        
        // ====== GUARDAR MÉTRICAS EN LA BASE DE DATOS ======
        const metricsToSave = {
            playerName: gameMetrics.playerName,
            sessionName: gameMetrics.sessionName,
            gameName: 'Memória Mágica',
            level: gameMetrics.level,
            hits: gameMetrics.hits,
            errors: gameMetrics.errors,
            score: gameMetrics.score,
            gameDuration: parseFloat(gameDuration.toFixed(1)),
            avgResponseTime: gameMetrics.pairTimes.length > 0 
                ? (gameMetrics.pairTimes.reduce((a, b) => a + b) / gameMetrics.pairTimes.length * 1000).toFixed(0)
                : 0,
            responses: [],
            // Métricas adicionales personalizadas para Memory game
            first_card_time: gameMetrics.firstCardTime,
            total_cards_flipped: gameMetrics.cardsFlipped,
            cards_viewed: cardsViewedCount,
            pair_times: gameMetrics.pairTimes,
            efficiency_percent: parseFloat(efficiency),
            avg_attempts_per_pair: parseFloat(avgAttemptsPerPair),
            avg_search_time: parseFloat(avgSearchTime),
            max_win_streak: gameMetrics.maxWinStreak,
            attempt_history: gameMetrics.attemptHistory
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
        
        // Mostrar modal de resultados
        document.getElementById('playerName').innerText = gameMetrics.playerName;
        document.getElementById('playerLevel').innerText = gameMetrics.level;
        document.getElementById('scoreDisplay').innerText = gameMetrics.hits;
        
        $('#scoreModal').modal('show');
        
        // Manejar el botón Aceptar del modal
        document.getElementById('goToResults').addEventListener('click', function() {
            window.location.href = '/results_atac?score=' + gameMetrics.hits;
        });
    }

    startButton.addEventListener('click', () => {
        grid.innerHTML = '';
        createBoard();
        message.textContent = '';
        matchedCards = 0;
        score = 0;
        scoreDisplay.innerText = score;
        
        // Reiniciar métricas para nuevo juego
        gameMetrics.startTime = null;
        gameMetrics.endTime = null;
        gameMetrics.hits = 0;
        gameMetrics.errors = 0;
        gameMetrics.firstCardTime = null;
        gameMetrics.cardsFlipped = 0;
        gameMetrics.cardsViewed.clear();
        gameMetrics.pairTimes = [];
        gameMetrics.attemptHistory = [];
        gameMetrics.winStreak = 0;
        gameMetrics.maxWinStreak = 0;
    });
});
