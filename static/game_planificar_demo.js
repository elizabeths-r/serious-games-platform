document.addEventListener('DOMContentLoaded', () => {
    const message = document.getElementById('message');
    const scoreDisplay = document.getElementById('score');
    const startButton = document.getElementById('startButton');

    // Configuración del nivel básico
    const LEVEL_CONFIG = {
        correctItems: {
            frutas: ["fruta1"],
            verduras: ["verdura1"]
        },
        slots: ['frutas', 'verduras'],
        maxItems: 1
    };

    let score = 0;
    let placedItems = new Set();

    // Audios de interfaz del demo
    const uiAudios = {
        'start': '/static/sounds/ui/comenzar_demo.mp3',
        'instructions': '/static/sounds/ui/instrucciones_4.mp3',
        'correct': '/static/sounds/ui/correcto.mp3',
        'wrong': '/static/sounds/ui/intenta_nuevo.mp3',
        'completed': '/static/sounds/ui/demo_completado.mp3',
        'excellent': '/static/sounds/ui/excelente.mp3',
        'ahora_turno': '/static/sounds/ui/ahora_turno.mp3'
    };

    // Función para reproducir audio de UI con fallback a text-to-speech
    function playUIAudio(audioKey, fallbackText) {
        const audioFile = uiAudios[audioKey];
        const audio = new Audio(audioFile);
        
        audio.onended = () => audio.currentTime = 0;
        audio.onerror = () => {
            playTextToSpeech(fallbackText);
        };
        
        audio.play().catch(() => {
            playTextToSpeech(fallbackText);
        });
    }

    // Función para síntesis de voz
    function playTextToSpeech(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        
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

    // Reproducir sonido de la categoría
    function playCategorySound(categoryName) {
        const categoryNames = {
            'frutas': 'Frutas',
            'verduras': 'Verduras'
        };
        
        const text = categoryNames[categoryName] || categoryName;
        playTextToSpeech(text);
    }

    // Iluminar un slot
    function highlightSlot(slotType, duration = 2000) {
        let slotId;
        if (slotType === 'frutas') {
            slotId = 'frutas_slot';
        } else if (slotType === 'verduras') {
            slotId = 'verduras_slot';
        }
        
        const slot = document.getElementById(slotId);
        if (slot) {
            slot.style.backgroundColor = '#00BCD4';
            slot.style.boxShadow = '0 0 25px rgba(0, 188, 212, 1)';
            slot.style.borderColor = '#00BCD4';
            
            setTimeout(() => {
                slot.style.backgroundColor = '#f0f0f0';
                slot.style.boxShadow = 'none';
                slot.style.borderColor = '#aaa';
            }, duration);
        }
    }

    // Simular arrastre de un item al slot
    function simulateDrop(itemId, slotType) {
        const img = document.querySelector(`[data-item="${itemId}"]`);
        const slot = document.querySelector(`[data-slot="${slotType}"]`);
        
        if (!img || !slot) return;

        // Obtener posiciones
        const imgRect = img.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();

        // Crear clon visual que se anima
        const clone = img.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.zIndex = '9999';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.8';
        clone.style.left = imgRect.left + 'px';
        clone.style.top = imgRect.top + 'px';
        clone.style.width = '100px';
        clone.style.height = '100px';
        clone.style.transition = 'all 1s ease-in-out';
        document.body.appendChild(clone);

        // Animar hacia el slot
        setTimeout(() => {
            clone.style.left = (slotRect.left + slotRect.width / 2 - 50) + 'px';
            clone.style.top = (slotRect.top + slotRect.height / 2 - 50) + 'px';
            clone.style.width = '55px';
            clone.style.height = '55px';
        }, 50);

        // Remover clone después de la animación
        setTimeout(() => {
            document.body.removeChild(clone);
        }, 1050);
    }

    // Hacer demostración automática
    async function demonstrateGame() {
        message.textContent = 'Observa cómo jugar...';
        
        // Demostración 1: Frutas
        await new Promise(resolve => setTimeout(resolve, 500));
        playCategorySound('frutas');
        highlightSlot('frutas', 2500);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        simulateDrop('fruta1', 'frutas');
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Demostración 2: Verduras
        playCategorySound('verduras');
        highlightSlot('verduras', 2500);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        simulateDrop('verdura1', 'verduras');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        message.textContent = 'Ahora es tu turno';
        playUIAudio('ahora_turno', 'Ahora es tu turno');
    }
    
    function resetDemo() {
        score = 0;
        scoreDisplay.textContent = score;
        message.textContent = '';
        placedItems = new Set();

        // Limpiar slots
        const slots = document.querySelectorAll('#slots .drop-slot');
        const slotLabels = {
            'frutas': 'Fruta',
            'verduras': 'Verdura'
        };
        const slotEmojis = {
            'frutas': '🍍',
            'verduras': '🥗'
        };
        slots.forEach(slot => {
            slot.innerHTML = '';
            const slotType = slot.dataset.slot;
            const emoji = slotEmojis[slotType];
            const label = slotLabels[slotType];
            slot.innerHTML = `<span class="emoji">${emoji}</span>${label}`;
        });

        // Restaurar imágenes
        document.querySelectorAll('#options img').forEach(img => {
            img.style.opacity = '1';
            img.style.pointerEvents = 'auto';
            img.setAttribute('draggable', 'true');
        });

        initializeDragDrop();
    }

    // Inicializar drag and drop
    function initializeDragDrop() {
        const options = document.getElementById('options');
        const slots = document.querySelectorAll('#slots .drop-slot');
        const allImages = document.querySelectorAll('#options img');

        // DRAG & DROP (PC)
        allImages.forEach(img => {
            img.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', img.dataset.item);
                if (e.dataTransfer.setDragImage) {
                    e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
                }
            });
        });

        // DROP EN SLOTS
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.style.backgroundColor = '#e8f5e9';
            });

            slot.addEventListener('dragleave', (e) => {
                if (e.target === slot) {
                    slot.style.backgroundColor = '#f0f0f0';
                }
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.style.backgroundColor = '#f0f0f0';

                const itemId = e.dataTransfer.getData('text/plain');
                const img = document.querySelector(`#options img[data-item="${itemId}"]`);
                
                if (!img) {
                    message.textContent = 'Error: Imagen no encontrada';
                    return;
                }

                // Validar si el item ya fue colocado
                if (placedItems.has(itemId)) {
                    message.textContent = 'Este item ya fue colocado correctamente.';
                    playUIAudio('wrong', 'Este item ya fue colocado');
                    return;
                }

                const slotType = slot.dataset.slot;
                const correctItems = LEVEL_CONFIG.correctItems[slotType];

                // Verificar si el item es correcto para este slot
                let isCorrect = false;
                if (Array.isArray(correctItems)) {
                    isCorrect = correctItems.includes(itemId);
                } else {
                    isCorrect = correctItems === itemId;
                }

                if (!isCorrect) {
                    message.textContent = 'No puedes colocar este item aquí.';
                    playUIAudio('wrong', 'No puedes colocar este item aquí');
                    return;
                }

                // Verificar si el item ya está en este slot
                const itemsInSlot = Array.from(slot.querySelectorAll('img')).map(i => i.dataset.item);
                if (itemsInSlot.includes(itemId)) {
                    message.textContent = 'Este item ya está colocado.';
                    return;
                }
                
                // Verificar si el slot está lleno
                if (itemsInSlot.length >= LEVEL_CONFIG.maxItems) {
                    message.textContent = 'Este slot está lleno.';
                    return;
                }

                // Crear contenedor para la imagen
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
                newImg.style.border = 'none';
                newImg.style.cursor = 'default';
                newImg.style.padding = '0';
                newImg.dataset.originalItem = itemId;
                
                container.appendChild(newImg);
                
                // Limpiar el contenido del slot solo si es la primera imagen
                if (itemsInSlot.length === 0) {
                    slot.textContent = '';
                }
                
                slot.appendChild(container);

                // Marcar item como colocado
                placedItems.add(itemId);

                // Ocultar la imagen original
                img.style.opacity = '0.5';
                img.style.pointerEvents = 'none';

                score++;
                scoreDisplay.textContent = score;
                message.textContent = 'Correcto ✓';
                message.style.color = '#4caf50';
                playUIAudio('correct', 'Correcto');

                // Verificar si terminó el demo
                if (score === 2) {
                    setTimeout(() => {
                        message.textContent = '¡Excelente! 🎉 Demo completado';
                        message.style.color = '#4caf50';
                        playUIAudio('completed', 'Demo completado');
                        setTimeout(() => {
                            playUIAudio('excellent', 'Excelente trabajo');
                        }, 1500);
                    }, 500);
                }
            });
        });

        // TOUCH SUPPORT
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

        allImages.forEach(img => {
            enableTouchDrag(img);
        });
    }

    // Event listener para el botón de inicio
    startButton.addEventListener('click', () => {
        resetDemo();
        startButton.classList.remove('highlight');
        setTimeout(() => {
            playUIAudio('instructions', 'Arrastra las imágenes a su categoría correcta. Tienes frutas y verduras que clasificar.');
            // Después de las instrucciones, mostrar demostración
            setTimeout(() => {
                demonstrateGame();
            }, 3500);
        }, 300);
    });

    // Reproducir audio inicial
    setTimeout(() => {
        playUIAudio('start', 'Haz clic en Comenzar Demo para empezar');
    }, 500);
});
