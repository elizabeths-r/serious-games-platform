document.addEventListener('DOMContentLoaded', () => {
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('startButton');
    const videoContainer = document.getElementById('video-container');
    const emotionVideo = document.getElementById('emotion-video');

    const emotions = [
        { name: 'Feliz', image: 'images/emotions/happy.png', sound: 'sounds/emotions/happy', video: 'videos/Feliz.mp4' },
        { name: 'Triste', image: 'images/emotions/sad.png', sound: 'sounds/emotions/sad', video: 'videos/Triste.mp4' },
        { name: 'Enojado', image: 'images/emotions/angry.png', sound: 'sounds/emotions/angry', video: 'videos/Enojado.mp4' },
        { name: 'Sorprendido', image: 'images/emotions/surprised.png', sound: 'sounds/emotions/surprised', video: 'videos/Sorprendido.mp4' }
    ];

    const uiAudios = {
        'start': 'sounds/ui/comenzar_demo',
        'instructions': 'sounds/ui/instrucciones_1',
        'correct': 'sounds/ui/correcto',
        'wrong': 'sounds/ui/intenta_nuevo',
        'completed': 'sounds/ui/demo_completado',
        'excellent': 'sounds/ui/excelente',
        'ahora_turno': 'sounds/ui/ahora_turno'
    };

    let score = 0;
    let gameStarted = false;
    let correctAnswers = 0;
    let totalQuestions = 2; // Número de emociones a identificar en la demo

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

    // Funci�n para reproducir audio de UI (con fallback a sintesis de voz)
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
            }, 300); // peque�o delay por si falla el robot
        }
    }

    // Funci�n para reproducir audio con fallback a sintesis de voz
    function playTextToSpeech(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        
        // Seleccionar voz masculina en espa�ol
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

    // Función para síntesis de voz con Promise
    function playTextToSpeechWithPromise(text) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 0.8;
            
            const voices = window.speechSynthesis.getVoices();
            const spanishVoice = voices.find(voice => voice.lang.includes('es')) || voices[0];
            
            if (spanishVoice) {
                utterance.voice = spanishVoice;
            }
            
            utterance.onend = resolve;
            
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        });
    }

    // Reproducir sonido de la emoción
    function playEmotionSound(emotionName) {
        const emotion = emotions.find(e => e.name === emotionName);
        if (emotion) {
            sendAudioToRobot(emotion.sound);
        }
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



    // Mostrar video de una emoción
    function showEmotionVideo(emotionName) {
        const emotion = emotions.find(e => e.name === emotionName);
        if (emotion) {
            emotionVideo.src = `/static/${emotion.video}`;
            emotionVideo.load();
            emotionVideo.play();
            sendEmotionToRobot(emotion.name)
        }
    }

    // Demostración automática
    async function demonstrateGame() {
        message.textContent = 'Observa cómo jugar...';
        
        // Demostración 1: Feliz
        await new Promise(resolve => setTimeout(resolve, 1000));
        message.textContent = 'Mira el video de la emoción...';
        showEmotionVideo('Feliz');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        message.textContent = 'La emoción correcta es: Feliz 😊';
        message.style.color = '#4caf50';
        playEmotionSound('Feliz');
        await playUIAudio('correct');
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Demostración 2: Triste
        message.textContent = 'Mira el siguiente video...';
        message.style.color = 'black';
        showEmotionVideo('Triste');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        message.textContent = 'La emoción correcta es: Triste 😢';
        message.style.color = '#4caf50';
        playEmotionSound('Triste');
        await playUIAudio('correct');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        message.textContent = 'Ahora es tu turno';
        message.style.color = 'black';
        await playUIAudio('ahora_turno');
    }

    // Resetear demo
    function resetDemo() {
        score = 0;
        scoreDisplay.textContent = `${score} / ${totalQuestions}`;
        message.textContent = '';
        correctAnswers = 0;
        gameStarted = true;

        // Mostrar primer video
        showNextEmotion();
    }

    // Seleccionar siguiente emoción aleatoria
    function showNextEmotion() {
        if (correctAnswers >= totalQuestions) {
            endGame();
            return;
        }

        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        showEmotionVideo(randomEmotion.name);
        message.textContent = '¿Cuál es la emoción?';
        message.style.color = 'black';
    }

    // Verificar respuesta
    function checkEmotion(selectedEmotion) {
        if (!gameStarted) {
            message.textContent = 'Presiona "Comenzar Demo" para empezar.';
            setTimeout(() => { message.textContent = ''; }, 1500);
            return;
        }

        // Obtener la emoción que se muestra en el video
        const videoSrc = emotionVideo.src;
        const emotionName = emotions.find(e => videoSrc.includes(e.name))?.name;

        if (selectedEmotion === emotionName) {
            score++;
            correctAnswers++;
            scoreDisplay.textContent = `${score} / ${totalQuestions}`;
            message.textContent = '¡Correcto! 🎉';
            message.style.color = '#4caf50';
            playUIAudio('correct');

            setTimeout(() => {
                if (correctAnswers >= totalQuestions) {
                    endGame();
                } else {
                    showNextEmotion();
                }
            }, 1500);
        } else {
            message.textContent = 'Intenta de nuevo 😕';
            message.style.color = '#f44336';
            playUIAudio('wrong');

            setTimeout(() => {
                message.textContent = '¿Cuál es la emoción?';
                message.style.color = 'black';
            }, 1500);
        }
    }

    // Terminar juego
    function endGame() {
        gameStarted = false;
        message.textContent = '¡Excelente! Demo completado 🎉';
        message.style.color = '#4caf50';
        playUIAudio('completed');
        setTimeout(() => {
            playUIAudio('excellent');
        }, 1500);
    }

    // Event listeners para botones de emoción
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const emotionName = btn.dataset.emotion;
            checkEmotion(emotionName);
        });
    });

    // Event listener para botón de inicio
    startButton.addEventListener('click', async () => {
        resetDemo();
        startButton.classList.remove('highlight');
        setTimeout(async () => {
            await playUIAudio('instructions', 'Mira los videos de las emociones y haz clic en el botón correcto para identificar cada una.');
            // Después de las instrucciones, mostrar demostración
            await demonstrateGame();
        }, 300);
    });

    // Reproducir audio inicial
    setTimeout(() => {
        playUIAudio('start');
    }, 500);
});
