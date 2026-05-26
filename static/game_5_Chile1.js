const emotions = [
    { name: 'Feliz', image: 'images/emotions/happy.png', sound: 'sounds/emotions/happy' },
    { name: 'Triste', image: 'images/emotions/sad.png', sound: 'sounds/emotions/sad' },
    { name: 'Enojado', image: 'images/emotions/angry.png', sound: 'sounds/emotions/angry' },
    { name: 'Sorprendido', image: 'images/emotions/surprised.png', sound: 'sounds/emotions/surprised' }
    // { name: 'Desgosto', image: 'images/emotions/disgust.png' },
    // { name: 'Medo', image: 'images/emotions/fear.png' }
];

const situations = [
    { text: 'El niño está jugando con sus amigos.', emotion: 'Feliz', image:'images/scenarios/playing_children.jpg', audio: 'sounds/detective/situacion_jugando' },
    { text: 'El niño se cayó y esta llorando.', emotion: 'Triste', image:'images/scenarios/crying_children.jpg', audio: 'sounds/detective/situacion_cayendo' },
    { text: 'El niño está recibiendo un regalo sorpresa.', emotion: 'Sorprendido', image:'images/scenarios/surprising_children.jpg', audio: 'sounds/detective/situacion_regalo_sorpresa' },
    { text: 'Otro niño daño su juguete y no quiere hablar con nadie.', emotion: 'Enojado', image:'images/scenarios/anoying_children.jpg', audio: 'sounds/detective/situacion_juguete_roto' }
    // { text: 'Ele ouviu um barulho alto enquanto estava sozinho na sala.', emotion: 'Medo', image:'images/scenarios/fear.jpg' },
    // { text: 'Ele não gosta nada da comida e a empurra com o garfo.', emotion: 'Desgosto', image: 'images/scenarios/disgusting_children.jpg' }
];

const emotionReactions = {
    'Feliz': ['Jugar juntos', 'Consuelalo o abrazalo', 'Dale su espacio'],
    'Triste': ['Consuelalo o abrazalo', 'Jugar juntos', 'Ignorar'],
    'Enojado': ['Dale su espacio', 'Jugar juntos', 'Ignorar'],
    'Sorprendido': ['Pregunta que paso', 'Jugar juntos', 'Consuelalo o abrazalo'],
    // 'Desgosto': ['Pergunte como você se sente', 'Dê-lhe espaço', 'Brincar juntos'],
    // 'Medo': ['Brincar juntos', 'Conforte', 'Dê-lhe espaço']
};

const reactionAudioMap = {
    'Jugar juntos': 'sounds/detective/opcion_jugar_juntos',
    'Consuelalo o abrazalo': 'sounds/detective/opcion_consuelalo_abrazalo',
    'Dale su espacio': 'sounds/detective/opcion_dale_espacio',
    'Ignorar': 'sounds/detective/opcion_ignorar',
    'Pregunta que paso': 'sounds/detective/opcion_pregunta_que_paso'
};

const correctReactionAudioMap = {
    'Feliz': 'sounds/detective/correcto_feliz',
    'Triste': 'sounds/detective/correcto_triste',
    'Enojado': 'sounds/detective/correcto_enojado',
    'Sorprendido': 'sounds/detective/correcto_sorprendido'
};

const incorrectReactionAudioMap = {
    'Feliz': 'sounds/detective/incorrecto_feliz',
    'Triste': 'sounds/detective/incorrecto_triste',
    'Enojado': 'sounds/detective/incorrecto_enojado',
    'Sorprendido': 'sounds/detective/incorrecto_sorprendido'
};

const try_again = 'sounds/tente_novamente'; // Usamos solo la ruta del archivo
const correct = 'sounds/Correcto'; // Usamos solo la ruta del archivo

const startButton = document.getElementById('startButton');
const urlParams = new URLSearchParams(window.location.search);
let level = urlParams.get('level') || 'basic';
let sessionName = urlParams.get('sessionName') || 'Unknown';
let playerName = urlParams.get('name') || sessionStorage.getItem('playerName') || 'Unknown';
let currentEmotion = 0;
let score = 0;
let timeRemaining = 120;
let timeInterval;
let gameStarted = false; // Estado para verificar si el juego ha comenzado
let startTime = null; // Tiempo de inicio del juego
let emotionStartTime = null; // Tiempo de inicio de cada emoción

// Objeto para rastrear métricas del juego
let gameMetrics = {
    playerName: playerName,
    sessionName: sessionName,
    gameName: 'Detetive de Emoções',
    gameLevel: level,
    hits: 0, // Respuestas correctas de emociones
    errors: 0, // Respuestas incorrectas de emociones
    score: 0,
    gameDuration: 0,
    avgResponseTime: 0,
    responses: [], // Array de respuestas por emoción
    emotionAccuracy: {}, // Precisión por emoción
    reactionAccuracy: {}, // Precisión por reacción (si level === 'advanced')
    responseTimes: [] // Tiempos de respuesta para cada pregunta
};

function playEmotionSound(soundFile) {
    const audio = new Audio(`static/${soundFile}`);
    audio.play().catch((error) => {
        console.error('Error al reproducir sonido:', error);
    });
}

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


function newEmotion() {
    document.getElementById('puntaje').textContent = `Puntaje: ${score}`;
    let emotionName='';
    if (level === 'medium') {
        document.getElementById('situation').style.display = 'block';
        document.getElementById('video-container').style.display = 'none';
        document.getElementById('reaction-container').style.display = 'none';
        let newSituationIndex;
        do {
            newSituationIndex = Math.floor(Math.random() * situations.length);
        } while (newSituationIndex === currentEmotion);
        currentEmotion = newSituationIndex;
        document.getElementById('situation-text').textContent = situations[currentEmotion].text;
        document.getElementById('situation-image').src = `static/${situations[currentEmotion].image}`;
        const correctEmotion = situations[currentEmotion].emotion;        
        sendEmotionToRobot(correctEmotion);
        sendAudioToRobot(situations[currentEmotion].audio);
        const emotionObj = emotions.find(e => e.name === correctEmotion);
        if (emotionObj) {
            setTimeout(() => {
                sendAudioToRobot(emotionObj.sound);
            }, 5000);
        }

    } else if (level === 'basic') {
        document.getElementById('situation').style.display = 'none';
        document.getElementById('reaction-container').style.display = 'none';
        let newEmotionIndex;
        do {
            newEmotionIndex = Math.floor(Math.random() * emotions.length);
        } while (newEmotionIndex === currentEmotion);
        currentEmotion = newEmotionIndex;
        emotionName= emotions[currentEmotion].name;

        // Mostrar el contenedor de video
        const videoContainer = document.getElementById('video-container');
        const videoEl = document.getElementById('emotion-video');
        videoContainer.style.display = 'block';

        // Cambiar la fuente del video
        videoEl.src = `static/videos/${emotionName}.mp4`;
        videoEl.load();
        videoEl.play();
        sendEmotionToRobot(emotionName);

        const emotionObj = emotions.find(e => e.name === emotionName);
        if (emotionObj) {
            setTimeout(() => {
                sendAudioToRobot(emotionObj.sound);
            }, 5000);
        }

    } else if (level === 'advanced') {
        document.getElementById('situation').style.display = 'block'; // Mostrar situación
        document.getElementById('options-container').style.display = 'grid'; // Mostrar opciones de emociones
        document.getElementById('video-container').style.display = 'none';
        document.getElementById('reaction-container').style.display = 'none'; // Ocultar reacciones
        let newSituationIndex;
        do {
            newSituationIndex = Math.floor(Math.random() * situations.length);
        } while (newSituationIndex === currentEmotion);
        currentEmotion = newSituationIndex;
        document.getElementById('situation-text').textContent = situations[currentEmotion].text;
        document.getElementById('situation-image').src = `static/${situations[currentEmotion].image}`;
        const correctEmotion = situations[currentEmotion].emotion;        
        sendEmotionToRobot(correctEmotion);
        sendAudioToRobot(situations[currentEmotion].audio);
        const emotionObj = emotions.find(e => e.name === correctEmotion);
        if (emotionObj) {
            setTimeout(() => {
                sendAudioToRobot(emotionObj.sound);
            }, 5000);
        }

    }
    
    // Registrar el tiempo de inicio de esta emoción para medir respuesta
    emotionStartTime = Date.now();
}

function showReactionOptions(emotion) {
    const optionsContainer = document.getElementById('reaction-options');
    optionsContainer.innerHTML = ''; // Limpia las opciones previas
    
    // Ocultar botones de emociones mientras se muestran reacciones
    document.getElementById('options-container').style.display = 'none';
    
    const options = emotionReactions[emotion];
    const buttons = [];
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-default', 'reaction-option');
        button.textContent = option;
        button.dataset.option = option; // Para identificar el botón
        button.onclick = () => checkReaction(emotion, option);
        optionsContainer.appendChild(button);
        buttons.push(button);
    });

    // Enviar audio de la pregunta sobre la reacción al robot
    sendAudioToRobot('sounds/detective/pregunta_reaccion');

    document.getElementById('reaction-container').style.display = 'block';
    
    // Reproducir audios de las opciones en secuencia después de 2 segundos
    setTimeout(() => {
        playReactionAudiosInSequence(options, buttons);
    }, 3000);
}

function playReactionAudiosInSequence(options, buttons) {
    let delay = 0;
    
    options.forEach((option, index) => {
        setTimeout(() => {
            const button = buttons[index];
            const audioFile = reactionAudioMap[option];
            
            if (audioFile) {
                // Iluminar el botón
                button.classList.add('highlighted');
                
                // Enviar audio al robot
                sendAudioToRobot(audioFile);
                
                // Quitar iluminación después de 1.5 segundos
                setTimeout(() => {
                    button.classList.remove('highlighted');
                }, 3000);
            }
        }, delay);
        
        delay += 5000; // 2 segundos entre cada opción
    });
}

function checkReaction(emotion, selectedReaction) {
    const feedback = document.getElementById('reaction-feedback');
    
    if (isCorrectReaction(emotion, selectedReaction)) {
        feedback.textContent = 'Muy bien! Esa es la reacción adecuada para alguien que se siente ' + emotion.toLowerCase() + '.';
        feedback.classList.add('feedback-correct');
        feedback.classList.remove('feedback-incorrect');
        score++;
        gameMetrics.score = score;
        
        // Registrar reacción correcta
        if (!gameMetrics.reactionAccuracy[emotion]) {
            gameMetrics.reactionAccuracy[emotion] = { correct: 0, attempts: 0 };
        }
        gameMetrics.reactionAccuracy[emotion].attempts++;
        gameMetrics.reactionAccuracy[emotion].correct++;
        
        const correctAudio = correctReactionAudioMap[emotion];
        sendAudioToRobot(correctAudio);
        setTimeout(() => {
            feedback.textContent = '';
            feedback.classList.remove('feedback-correct');
            document.getElementById('reaction-container').style.display = 'none';
            newEmotion();
        }, 2000);
    } else {
        feedback.textContent = 'Hmm, esa reacción no es muy buena para alguien que se siente ' + emotion.toLowerCase() + '. Prueba otra.';
        feedback.classList.add('feedback-incorrect');
        feedback.classList.remove('feedback-correct');
        
        // Registrar reacción incorrecta
        if (!gameMetrics.reactionAccuracy[emotion]) {
            gameMetrics.reactionAccuracy[emotion] = { correct: 0, attempts: 0 };
        }
        gameMetrics.reactionAccuracy[emotion].attempts++;
        
        const incorrectAudio = incorrectReactionAudioMap[emotion];
        sendAudioToRobot(incorrectAudio);
        setTimeout(() => {
            feedback.textContent = '';
            feedback.classList.remove('feedback-incorrect');
        }, 1500);
    }
}

function isCorrectReaction(emotion, selectedReaction) {
    const correctReactions = {
        'Feliz': 'Jugar juntos',
        'Triste': 'Consuelalo o abrazalo',
        'Enojado': 'Dale su espacio',
        'Sorprendido': 'Pregunta que le paso'
        // 'Desgosto': 'Pergunte como você se sente',
        // 'Medo': 'Conforte'
    };
    return selectedReaction === correctReactions[emotion];
}

function sendEmotionToRobot(emotion) {
    fetch('/send_emotion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emotion: emotion })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor:", data);
    })
    .catch(error => {
        console.error("Error al enviar la emoción:", error);
    });
}

function checkEmotion(selectedEmotion) {
    const feedback = document.getElementById('feedback');
    
    // Si el juego no ha comenzado, solo reproducir el sonido
    if (!gameStarted) {
        return;
    }
    
    // Registrar el tiempo de respuesta (desde que se mostró la emoción)
    const responseTime = Date.now() - emotionStartTime;
    let isCorrect = false;
    let correctEmotion = '';
    
    // Determinar la emoción correcta según el nivel
    if (level === 'basic') {
        correctEmotion = emotions[currentEmotion].name;
        isCorrect = selectedEmotion === correctEmotion;
    } else if (level === 'medium') {
        correctEmotion = situations[currentEmotion].emotion;
        isCorrect = selectedEmotion === correctEmotion;
    } else if (level === 'advanced') {
        correctEmotion = situations[currentEmotion].emotion;
        isCorrect = selectedEmotion === correctEmotion;
    }
    
    // Registrar la respuesta en gameMetrics
    gameMetrics.responses.push({
        emotion: correctEmotion,
        selectedEmotion: selectedEmotion,
        isCorrect: isCorrect,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
    });
    
    // Actualizar precisión por emoción
    if (!gameMetrics.emotionAccuracy[correctEmotion]) {
        gameMetrics.emotionAccuracy[correctEmotion] = { correct: 0, attempts: 0 };
    }
    gameMetrics.emotionAccuracy[correctEmotion].attempts++;
    if (isCorrect) {
        gameMetrics.emotionAccuracy[correctEmotion].correct++;
    }
    
    // Agregar tiempo de respuesta
    gameMetrics.responseTimes.push(responseTime);
    
    // Lógica del juego cuando ha comenzado
    if (isCorrect) {
        score++;
        gameMetrics.hits++;
        gameMetrics.score = score;
        feedback.textContent = '¡Correcto! 🎉';
        sendAudioToRobot(correct)
        setTimeout(() => {
            feedback.textContent = '';
            if (level === 'advanced') {
                showReactionOptions(selectedEmotion);
            } else {
                newEmotion();
            }
        }, 5000);
    } else {
        gameMetrics.errors++;
        feedback.textContent = 'Intentalo otra vez. 😕';
        sendAudioToRobot(try_again)
        setTimeout(() => { feedback.textContent = ''; }, 1000);
    }
}


function updateTime() {
    if (timeRemaining > 0) {
        timeRemaining--;
        document.getElementById('time').textContent = timeRemaining;
    } else {
        endGame();
    }
}

function endGame() {
    clearInterval(timeInterval);
    
    // Calcular tiempo total del juego
    gameMetrics.gameDuration = Math.round((Date.now() - startTime) / 1000); // en segundos
    
    // Calcular promedio de tiempo de respuesta
    if (gameMetrics.responseTimes.length > 0) {
        gameMetrics.avgResponseTime = Math.round(
            gameMetrics.responseTimes.reduce((a, b) => a + b, 0) / gameMetrics.responseTimes.length
        );
    }
    
    // Calcular percentaje de precisión por emoción
    const emotionAccuracyPercent = {};
    for (const emotion in gameMetrics.emotionAccuracy) {
        const data = gameMetrics.emotionAccuracy[emotion];
        emotionAccuracyPercent[emotion] = Math.round((data.correct / data.attempts) * 100);
    }
    gameMetrics.emotionAccuracy = emotionAccuracyPercent;
    
    // Calcular percentaje de precisión por reacción (solo en nivel advanced)
    if (level === 'advanced') {
        const reactionAccuracyPercent = {};
        for (const reaction in gameMetrics.reactionAccuracy) {
            const data = gameMetrics.reactionAccuracy[reaction];
            reactionAccuracyPercent[reaction] = Math.round((data.correct / data.attempts) * 100);
        }
        gameMetrics.reactionAccuracy = reactionAccuracyPercent;
    }
    
    // Enviar métricas a la base de datos
    saveGameMetrics();
    
    $('#scoreDisplay').text(score);
    // Muestra el modal
    $('#timeUpModal').modal('show');            
    // Maneja el botón para redirigir a la página de resultados
    document.getElementById('goToResults').addEventListener('click', function() {
    window.location.href = '/results_atac?score=' + score;
    });
}

function saveGameMetrics() {
    // Preparar payload para servidor
    const metricsPayload = {
        playerName: gameMetrics.playerName,
        sessionName: gameMetrics.sessionName,
        gameName: gameMetrics.gameName,
        gameLevel: gameMetrics.gameLevel,
        level: gameMetrics.gameLevel,
        hits: gameMetrics.hits,
        errors: gameMetrics.errors,
        score: gameMetrics.score,
        gameDuration: gameMetrics.gameDuration,
        avgResponseTime: gameMetrics.avgResponseTime,
        responsesDetail: gameMetrics.responses,
        emotionAccuracy: gameMetrics.emotionAccuracy,
        reactionAccuracy: gameMetrics.reactionAccuracy
    };
    
    console.log('Guardando métricas:', metricsPayload);
    
    fetch('/save_game_metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(metricsPayload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Métricas guardadas exitosamente:', data);
        } else {
            console.error('Error al guardar métricas:', data.error);
        }
    })
    .catch(error => {
        console.error('Error de conexión:', error);
    });
}


window.onload = function() {
    // Mostrar el modal de introducción automáticamente al cargar la página
    $('#introModal').modal('show');
    // Configura el botón de inicio después de que el jugador lea la historia
    document.getElementById('startButton').addEventListener('click', () => {
        if (!gameStarted) {
            score = 0;
            timeRemaining = 120;
            gameStarted = true;
            startTime = Date.now(); // Registrar tiempo de inicio
            
            // Reinicializar métricas
            gameMetrics.hits = 0;
            gameMetrics.errors = 0;
            gameMetrics.score = 0;
            gameMetrics.responses = [];
            gameMetrics.emotionAccuracy = {};
            gameMetrics.reactionAccuracy = {};
            gameMetrics.responseTimes = [];
            
            newEmotion();
            clearInterval(timeInterval);
            timeInterval = setInterval(updateTime, 1000);
        }
    });
}