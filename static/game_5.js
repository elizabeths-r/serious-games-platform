const emotions = [
    { name: 'Feliz', image: 'images/emotions/happy.png' },
    { name: 'Triste', image: 'images/emotions/sad.png' },
    { name: 'Brabo', image: 'images/emotions/angry.png' },
    { name: 'Surpreso', image: 'images/emotions/surprised.png' }
    // { name: 'Desgosto', image: 'images/emotions/disgust.png' },
    // { name: 'Medo', image: 'images/emotions/fear.png' }
];

const situations = [
    { text: 'O menino está brincando com seus amigos.', emotion: 'Feliz', image:'images/scenarios/playing_children.jpg' },
    { text: 'A criança caiu e está chorando.', emotion: 'Triste', image:'images/scenarios/crying_children.jpg' },
    { text: 'A criança está recebendo um presente surpresa.', emotion: 'Surpreso', image:'images/scenarios/surprising_children.jpg' },
    { text: 'Outra criança quebrou o brinquedo e não quer falar com ninguém.', emotion: 'Brabo', image:'images/scenarios/anoying_children.jpg' }
    // { text: 'Ele ouviu um barulho alto enquanto estava sozinho na sala.', emotion: 'Medo', image:'images/scenarios/fear.jpg' },
    // { text: 'Ele não gosta nada da comida e a empurra com o garfo.', emotion: 'Desgosto', image: 'images/scenarios/disgusting_children.jpg' }
];

const emotionReactions = {
    'Feliz': ['Brincar juntos', 'Conforte', 'Dê-lhe espaço'],
    'Triste': ['Conforte', 'Brincar juntos', 'Ignorar'],
    'Brabo': ['Dê-lhe espaço', 'Brincar juntos', 'Ignorar'],
    'Surpreso': ['Pergunte o que aconteceu', 'Brincar juntos', 'Conforte'],
    // 'Desgosto': ['Pergunte como você se sente', 'Dê-lhe espaço', 'Brincar juntos'],
    // 'Medo': ['Brincar juntos', 'Conforte', 'Dê-lhe espaço']
};

const startButton = document.getElementById('startButton');
const urlParams = new URLSearchParams(window.location.search);
let level = urlParams.get('level') || 'basic';
let currentEmotion = 0;
let score = 0;
let timeRemaining = 120;
let timeInterval;
let gameStarted = false; // Estado para verificar si el juego ha comenzado



function newEmotion() {
    document.getElementById('puntaje').textContent = `Pontuação: ${score}`;
    let emotionName='';
    if (level === 'medium') {
        document.getElementById('situation').style.display = 'block';
        let newSituationIndex;
        do {
            newSituationIndex = Math.floor(Math.random() * situations.length);
        } while (newSituationIndex === currentEmotion);
        currentEmotion = newSituationIndex;
        document.getElementById('situation-text').textContent = situations[currentEmotion].text;
        document.getElementById('situation-image').src = `static/${situations[currentEmotion].image}`;

    } else if (level === 'basic') {
        //document.getElementById('image-container').style.display = 'block';
        document.getElementById('situation').style.display = 'none';
        let newEmotionIndex;
        do {
            newEmotionIndex = Math.floor(Math.random() * emotions.length);
        } while (newEmotionIndex === currentEmotion);
        currentEmotion = newEmotionIndex;
        //document.getElementById('emotion-image').src = `static/${emotions[currentEmotion].image}`;
        emotionName= emotions[currentEmotion].name;
        sendEmotionToRobot(emotionName);
    } else if (level === 'advanced') {
        document.getElementById('situation').style.display = 'block'; // Mostrar situación
        document.getElementById('image-container').style.display = 'none'; // Ocultar emociones
        let newSituationIndex;
        do {
            newSituationIndex = Math.floor(Math.random() * situations.length);
        } while (newSituationIndex === currentEmotion);
        currentEmotion = newSituationIndex;
        document.getElementById('situation-text').textContent = situations[currentEmotion].text;
        document.getElementById('situation-image').src = `static/${situations[currentEmotion].image}`;
    }
}

function showReactionOptions(emotion) {
    const optionsContainer = document.getElementById('reaction-options');
    optionsContainer.innerHTML = ''; // Limpia las opciones previas
    
    emotionReactions[emotion].forEach(option => {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-default', 'reaction-option');
        button.textContent = option;
        button.onclick = () => checkReaction(emotion, option);
        optionsContainer.appendChild(button);
    });

    document.getElementById('reaction-container').style.display = 'block'; // Muestra el contenedor de reacciones
}

function checkReaction(emotion, selectedReaction) {
    const feedback = document.getElementById('reaction-feedback');
    
    if (isCorrectReaction(emotion, selectedReaction)) {
        feedback.textContent = 'Muito bom! Essa é uma reação apropriada para alguém que sente ' + emotion.toLowerCase() + '.';
    } else {
        feedback.textContent = 'Hmm, essa reação não é a melhor para quem se sente ' + emotion.toLowerCase() + '. Prueba otra.';
    }
    setTimeout(() => {
        feedback.textContent = '';
        document.getElementById('reaction-container').style.display = 'none';
        newEmotion();
    }, 2000);
}

function isCorrectReaction(emotion, selectedReaction) {
    const correctReactions = {
        'Feliz': 'Brincar juntos',
        'Triste': 'Conforte',
        'Brabo': 'Dê-lhe espaço',
        'Surpreso': 'Pergunte o que aconteceu'
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
    if (!gameStarted) {
        console.log("no ha iniciado")
        feedback.textContent = 'Pressione "Iniciar Jogo" para começar. ⚠️';
        setTimeout(() => { feedback.textContent = ''; }, 1000);
        return; // Sale de la función si el juego no ha comenzado
    }
    if ((level === 'basic' && selectedEmotion === emotions[currentEmotion].name) ||
        (level === 'medium' && selectedEmotion === situations[currentEmotion].emotion)) {
        score++;
        feedback.textContent = '¡Correto! 🎉';
        setTimeout(() => {
            feedback.textContent = '';
            newEmotion();
        }, 1000);
    } else if (level === 'advanced' && selectedEmotion === situations[currentEmotion].emotion){
        score++;
        feedback.textContent = '¡Correto! 🎉';
        setTimeout(() => {
            feedback.textContent = '';
            showReactionOptions(selectedEmotion);
        }, 1000);
    } 
    else {
        feedback.textContent = 'Tente novamente. 😕';
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
    $('#scoreDisplay').text(score);
    // Muestra el modal
    $('#timeUpModal').modal('show');            
    // Maneja el botón para redirigir a la página de resultados
    document.getElementById('goToResults').addEventListener('click', function() {
    window.location.href = '/results_atac?score=' + score;
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
            newEmotion();
            clearInterval(timeInterval);
            timeInterval = setInterval(updateTime, 1000);
        }
    });
}