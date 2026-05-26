document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const startButton = document.getElementById('startButton');
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');
    const scoreFinalDisplay = document.getElementById('scoreDisplay');

    let cards = [
        { name: 'batman', img: 'static/images/superheroes/batman.png' },
        { name: 'batman', img: 'static/images/superheroes/batman.png' },
        { name: 'captain_america', img: 'static/images/superheroes/captain_america.png' },
        { name: 'captain_america', img: 'static/images/superheroes/captain_america.png' },
        { name: 'children_hero', img: 'static/images/superheroes/children_hero.png' },
        { name: 'children_hero', img: 'static/images/superheroes/children_hero.png' },
        { name: 'ironman', img: 'static/images/superheroes/ironman.png' },
        { name: 'ironman', img: 'static/images/superheroes/ironman.png' },
        { name: 'spiderman', img: 'static/images/superheroes/spiderman.png' },
        { name: 'spiderman', img: 'static/images/superheroes/spiderman.png' }
        //{ name: 'superman', img: 'static/images/superheroes/superman.png' },
        //{ name: 'superman', img: 'static/images/superheroes/superman.png' },
        //{ name: 'superwoman', img: 'static/images/superheroes/superwoman.png' },
        //{ name: 'superwoman', img: 'static/images/superheroes/superwoman.png' },
        //{ name: 'verde', img: 'static/images/superheroes/verde.png' },
        //{ name: 'verde', img: 'static/images/superheroes/verde.png' }
    ];

    const try_again = 'sounds/mario-bros-ooh';
    const turn_carta = 'sounds/turn_carta';
    const two_carta = 'sounds/two_cartas';
    const victorySound = 'sounds/victory'; // AsegÃºrate de tener este archivo de audio
    const urlParams = new URLSearchParams(window.location.search);
    let level = urlParams.get('level') || 'basic';

    let hasFlippedCard = false;
    let lockBoard = false;
    let firstCard, secondCard;
    let matchedCards = 0;
    let score = 0;

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
        if (level === 'advanced') {
            cards = [
                { name: 'chip', img: 'static/images/disney/chip.png' },
                { name: 'chip', img: 'static/images/disney/chip.png' },
                { name: 'dale', img: 'static/images/disney/dale.png' },
                { name: 'dale', img: 'static/images/disney/dale.png' },
                { name: 'goofy', img: 'static/images/disney/goofy.png' },
                { name: 'goofy', img: 'static/images/disney/goofy.png' },
                { name: 'louie', img: 'static/images/disney/louie.png' },
                { name: 'louie', img: 'static/images/disney/louie.png' },
                { name: 'mabel', img: 'static/images/disney/mabel.png' },
                { name: 'mabel', img: 'static/images/disney/mabel.png' },
                { name: 'mcduck', img: 'static/images/disney/mcduck.png' },
                { name: 'mcduck', img: 'static/images/disney/mcduck.png' },
                { name: 'mcquack', img: 'static/images/disney/mcquack.png' },
                { name: 'mcquack', img: 'static/images/disney/mcquack.png' },
                { name: 'mike', img: 'static/images/disney/mike.png' },
                { name: 'mike', img: 'static/images/disney/mike.png' },
                { name: 'pumba', img: 'static/images/disney/pumba.png' },
                { name: 'pumba', img: 'static/images/disney/pumba.png' },
                { name: 'simba', img: 'static/images/disney/simba.png' },
                { name: 'simba', img: 'static/images/disney/simba.png' }
                //{ name: 'sirenita', img: 'static/images/disney/sirenita.png' },
                //{ name: 'sirenita', img: 'static/images/disney/sirenita.png' },
                //{ name: 'sulley', img: 'static/images/disney/sulley.png' },
                //{ name: 'sulley', img: 'static/images/disney/sulley.png' },
                //{ name: 'timon', img: 'static/images/disney/timon.png' },
                //{ name: 'timon', img: 'static/images/disney/timon.png' },
                //{ name: 'wall-e', img: 'static/images/disney/wall-e.png' },
                //{ name: 'wall-e', img: 'static/images/disney/wall-e.png' },
                //{ name: 'nemo', img: 'static/images/disney/nemo.png' },
                //{ name: 'nemo', img: 'static/images/disney/nemo.png' },
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
        // Enviar el audio al robot
        sendAudioToRobot(turn_carta);

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
            sendAudioToRobot(two_carta); 
       } else {
            sendAudioToRobot(try_again);
            unflipCards();
       }
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        firstCard.removeEventListener('touchstart', flipCard);
        secondCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('touchstart', flipCard);
        matchedCards += 2;
        score++;
        scoreDisplay.innerText = score;
        if (matchedCards === cards.length) {
           sendAudioToRobot(victorySound);
           scoreFinalDisplay.innerText = score;
           $('#scoreModal').modal('show');
           document.getElementById('goToResults').addEventListener('click', function() {
           window.location.href = '/results_atac?score=' + score;
	   });
        }
        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');
            resetBoard();
        }, 1500);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    startButton.addEventListener('click', () => {
        grid.innerHTML = '';
        createBoard();
        message.textContent = '';
        matchedCards = 0;
        score = 0; // reiniciar puntaje
        scoreDisplay.innerText = score;
    });
});
