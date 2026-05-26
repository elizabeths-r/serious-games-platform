// game_4.js 
// Configuración de ítems correctos
const CORRECT_ITEMS = {
    comida: "comida1",
    decoracion: "decoracion",
    actividad: "actividad"
};

// Elementos principales
const scoreDisplay = document.getElementById('score');
const feedback = document.getElementById('feedback');
const optionsContainer = document.getElementById('options');
const slots = document.querySelectorAll('.drop-slot');
const scoreFinalDisplay = document.getElementById('scoreDisplay');

let score = 0;

// Sonidos
const no_colocar = 'sounds/no_colocar';
const complete = 'sounds/Juego_completado';
const item_de = 'sounds/Item_devuelto';
const correct = 'sounds/Correcto';

function sendAudioToRobot(audioFile) {
    console.log('Enviando audio al robot:', audioFile);
    fetch('/play_audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioFile }),
    }).catch((error) => {
        console.error('Error al enviar el audio al robot:', error);
    });
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
    const c = document.querySelector('#comida_slot img')?.dataset.item === CORRECT_ITEMS.comida;
    const d = document.querySelector('#decoracion_slot img')?.dataset.item === CORRECT_ITEMS.decoracion;
    const a = document.querySelector('#actividad_slot img')?.dataset.item === CORRECT_ITEMS.actividad;
    return c && d && a;
}

// ----------------- DRAG & DROP (PC) -----------------
document.querySelectorAll('#options img').forEach(img => {
    img.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', img.dataset.item);
        if (e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
        }
    });
});

// ----------------- TOUCH SUPPORT -----------------
let touchDraggedItem = null;
let touchClone = null;

function enableTouchDrag(img) {
    img.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchDraggedItem = img;

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

document.querySelectorAll('#options img').forEach(img => {
    enableTouchDrag(img);
});

// ----------------- DROP EN SLOTS -----------------
slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => e.preventDefault());

    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const img = document.querySelector(img[data-item="${itemId}"]);
        if (!img) {
            feedback.textContent = 'Imagen no encontrada.';
            return;
        }

        const slotType = slot.dataset.slot;

        if (slot.querySelector('img')) {
            feedback.textContent = 'Ya hay un item en este espacio.';
            return;
        }

        if (CORRECT_ITEMS[slotType] !== itemId) {
            sendAudioToRobot(no_colocar);
            feedback.textContent = 'No puedes colocar este item aqui.';
            return;
        }

        // Correcto
        slot.textContent = '';
        slot.appendChild(img);
        setScore(score + 1);
        feedback.textContent = 'Correcto';
        sendAudioToRobot(correct);

        if (isGameComplete()) {
            document.querySelectorAll('#options img, .drop-slot img').forEach(i => {
                if (i) i.setAttribute('draggable', 'false');
            });
            sendAudioToRobot(complete);
            scoreFinalDisplay.innerText = score;
            $('#scoreModal').modal('show');
            document.getElementById('goToResults').addEventListener('click', function() {
            window.location.href = '/results_atac?score=' + score;
        });
	}
    });

    slot.addEventListener('click', () => {
        const child = slot.querySelector('img');
        if (!child) return;

        optionsContainer.appendChild(child);
        slot.textContent = slot.dataset.slot;
        sendAudioToRobot(item_de);
        feedback.textContent = 'Item quitado.';
    });
});