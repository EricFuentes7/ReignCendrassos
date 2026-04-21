const textCard = document.getElementById("cardText");
const imatgePersonatge = document.getElementById("characterImg");
const nomPersonatge = document.getElementById("characterName");
const aGirar = document.getElementById("aGirar");
const cardBehind = document.getElementById("cardBehind");
const nextCharacterImg = document.getElementById("nextCharacterImg");
const divDecision = document.getElementById("characterDecision");
const textoCambiar = divDecision.querySelector('p');
const flipperElement = document.querySelector('.flipper');
const hammer = new Hammer(aGirar);

let todasLasCartas = [];
let todosLosPersonajes = [];
let cartasJugadas = new Set(); // Para guardar los IDs de las cartas ya jugadas
let idProximaCartaForzada = null; // Si una carta te obliga a ir a un ID concreto

let cartaActualObj = null;
let proximaCartaObj = null;

let stats = {
    educacio: 50,
    capacitatsClau: 50,
    convivencia: 50,
    diners: 50
};

// --- STATS LOGIC ---
function updateStats() {
    for (const key in stats) {
        const stat = stats[key];
        const container = document.getElementById(key);
        if (container) {
            const fill = container.querySelector('.fill');
            fill.style.height = stat + '%';
        }
    }
}

function setStatIcon(id, maskURL) {
    const statContainer = document.getElementById(id);
    if(statContainer) {
        const bar = statContainer.querySelector('.bar');
        bar.style.webkitMaskImage = `url(${maskURL})`;
        bar.style.maskImage = `url(${maskURL})`;
    }
}

setStatIcon('educacio', 'assets/img/stats/Educacio_Test.png');
setStatIcon('capacitatsClau', 'assets/img/stats/CapacitatsClau_Test.png');
setStatIcon('convivencia', 'assets/img/stats/Convivencia_Test.png');
setStatIcon('diners', 'assets/img/stats/Diners_Test.png');

// --- DATA FETCHING ---
async function inicializarJuego() {
    try {
        const [cartasRes, personajesRes] = await Promise.all([
            fetch('http://localhost:5239/cartes'),
            fetch('http://localhost:5239/persones')
        ]);

        todasLasCartas = await cartasRes.json();
        todosLosPersonajes = await personajesRes.json();

        updateStats();
        prepararSiguienteCarta(true); // true = es el inicio del juego
        renderJuego();
    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }
}

// --- GAME LOGIC (CARDS & RULES) ---
function obtenerCartaAleatoria() {
    const cartasValidas = todasLasCartas.filter(carta => {
        // 1. Si no es repetible y ya está en el Set de jugadas, la descartamos
        if (!carta.isRepeatable && cartasJugadas.has(carta.id)) {
            return false;
        }
        // 2. Si requiere un ID específico, verificamos que ese ID ya se haya jugado
        if (carta.requiresCardId !== null && !cartasJugadas.has(carta.requiresCardId)) {
            return false;
        }
        // 3. Evitamos que salga exactamente la misma carta dos veces seguidas por azar
        if (cartaActualObj && carta.id === cartaActualObj.id) {
            return false;
        }
        return true;
    });

    if (cartasValidas.length === 0) {
        console.warn("¡No quedan cartas válidas en el mazo!");
        // Aquí podrías manejar un final de juego o reiniciar las repetibles
        return todasLasCartas[0];
    }

    const indiceRandom = Math.floor(Math.random() * cartasValidas.length);
    return cartasValidas[indiceRandom];
}

function prepararSiguienteCarta(esInicio = false) {
    if (esInicio) {
        cartaActualObj = obtenerCartaAleatoria();
        proximaCartaObj = obtenerCartaAleatoria();
    } else {
        // La que estaba detrás pasa a ser la actual
        cartaActualObj = proximaCartaObj;

        // Decidir cuál será la NUEVA que se pone detrás
        if (idProximaCartaForzada !== null) {
            // Si la carta anterior dictó cuál es la siguiente por narices
            proximaCartaObj = todasLasCartas.find(c => c.id === idProximaCartaForzada) || obtenerCartaAleatoria();
            idProximaCartaForzada = null; // Reseteamos
        } else {
            proximaCartaObj = obtenerCartaAleatoria();
        }
    }
}

function getPersonaje(key) {
    return todosLosPersonajes.find(p => p.key === key) || { name: "Desconocido", image: "" };
}

function renderJuego() {
    if (!cartaActualObj || !proximaCartaObj) return;

    // Actual
    const personajeActual = getPersonaje(cartaActualObj.character);
    textCard.textContent = cartaActualObj.text;
    imatgePersonatge.src = personajeActual.image;
    nomPersonatge.textContent = personajeActual.name;

    // Próxima (la que se asoma por detrás)
    const personajeProximo = getPersonaje(proximaCartaObj.character);
    nextCharacterImg.src = personajeProximo.image;
}

function resetIndicators() {
    document.querySelectorAll('.indicator').forEach(dot => {
        dot.style.opacity = "0";
        dot.style.transform = "translateX(-50%) scale(0)";
    });
}

// --- HAMMER SWIPE LOGIC ---
hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

hammer.on('panmove', (e) => {
    const rotation = Math.max(-20, Math.min(20, e.deltaX / 10));
    const translate = Math.max(-150, Math.min(150, e.deltaX));
    aGirar.style.transform = `rotate(${rotation}deg) translateX(${translate}px)`;

    const opacity = Math.min(Math.abs(translate) / 100, 1);
    const side = e.deltaX > 0 ? 'right' : 'left';

    if (cartaActualObj) {
        textoCambiar.textContent = cartaActualObj[side].label;
        divDecision.style.opacity = `${opacity}`;

        const efectos = cartaActualObj[side].effects;

        document.querySelectorAll('.stat').forEach(statDiv => {
            const statId = statDiv.id;
            const dot = statDiv.querySelector('.indicator');

            if (efectos[statId] !== undefined && Math.abs(translate) > 25) {
                const magnitude = Math.abs(efectos[statId]);
                const scaleValue = magnitude > 10 ? 1.4 : 0.8;
                dot.style.opacity = opacity;
                dot.style.transform = `translateX(-50%) scale(${scaleValue})`;
            } else {
                dot.style.opacity = "0";
                dot.style.transform = "translateX(-50%) scale(0)";
            }
        });
    }
});

hammer.on('panend', (e) => {
    const translate = e.deltaX;
    const threshold = 80;
    resetIndicators();

    if (translate >= threshold || translate <= -threshold){
        const isRight = translate >= threshold;
        const decision = isRight ? 'right' : 'left';
        const accionTomada = cartaActualObj[decision];
        const efectos = accionTomada.effects;

        // 1. Aplicar stats
        for (const stat in efectos) {
            if (stats.hasOwnProperty(stat)) {
                stats[stat] += efectos[stat];
                stats[stat] = Math.max(0, Math.min(100, stats[stat]));
            }
        }
        updateStats();

        // 2. Registrar carta como jugada
        cartasJugadas.add(cartaActualObj.id);

        // 3. Revisar si hay nextCardId (carta forzada para la próxima ronda)
        if (accionTomada.nextCardId !== null) {
            idProximaCartaForzada = accionTomada.nextCardId;
        }

        // 4. Animar la salida
        const endX = isRight ? 350 : -350;
        const endRot = isRight ? 20 : -20;
        aGirar.style.transition = 'transform 0.4s ease-out';
        aGirar.style.transform = `translateY(600px) translateX(${endX}px) rotate(${endRot}deg)`;

        ejecutarAnimacionCambio();
    } else {
        // Soltó antes del threshold, vuelve al centro
        aGirar.style.transition = 'transform 0.3s ease-out';
        aGirar.style.transform = `rotate(0deg) translateX(0px)`;
        divDecision.style.opacity = `0`;
    }
});

function ejecutarAnimacionCambio() {
    setTimeout(() => {
        flipperElement.style.transition = 'transform 0.6s';
        cardBehind.classList.add('flipped');
    }, 100);

    setTimeout(() => {
        // Preparamos los datos de la siguiente ronda
        prepararSiguienteCarta();
        renderJuego();

        aGirar.style.transition = 'none';
        flipperElement.style.transition = 'none';
        aGirar.style.transform = 'translateY(0) translateX(0) rotate(0)';
        divDecision.style.opacity = '0';
        cardBehind.classList.remove('flipped');
        aGirar.style.zIndex = 20;
        cardBehind.style.zIndex = 5;

        setTimeout(() => {
            aGirar.style.transition = 'transform 0.2s ease';
        }, 50);
    }, 700);
}

// Iniciar
inicializarJuego();