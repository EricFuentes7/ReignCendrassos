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

// --- VOLUM (0.0 a 1.0) ---
const VOLUM_MUSICA = 1;
const VOLUM_SWIPE  = 0.3;
const VOLUM_SELECT = 0.3;

// --- AUDIO ---
const bgMusic = new Audio('/assets/audio/bgmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = VOLUM_MUSICA;

const swipeSound = new Audio('/assets/audio/swipe.mp3');
swipeSound.volume = VOLUM_SWIPE;

const selectSound = new Audio('/assets/audio/select.mp3');
selectSound.volume = VOLUM_SELECT;

// --- AUDIO AÑADIDO: CUERVO ---
const cuervoSound = new Audio('/assets/audio/cuervo.mp3');
cuervoSound.volume = 1.0;

let lastDeltaSign = 0;
let semanes = 0;

function playSound(audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

// Iniciar música de fondo al primer toque del usuario
document.addEventListener('pointerdown', () => {
    if (bgMusic.paused) bgMusic.play().catch(() => {});
}, { once: true });

let todasLasCartas = [];
let todosLosPersonajes = [];
let cartasJugadas = new Set();
let idProximaCartaForzada = null;

let cartaActualObj = null;
let proximaCartaObj = null;

let stats = {
    educacio: 50,
    capacitatsClau: 50,
    convivencia: 50,
    diners: 50
};

// --- BANDERAS ACTIVAS AL INICIAR ---
let banderasActivas = new Set([
    "xavi_activo",
    "rosa_activa"
]);

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
            fetch('https://reigns-api.onrender.com/cartes'),
            fetch('https://reigns-api.onrender.com/persones')
        ]);

        todasLasCartas = await cartasRes.json();
        todosLosPersonajes = await personajesRes.json();

        updateStats();
        prepararSiguienteCarta(true);
        renderJuego();

        setTimeout(() => {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                }, 1000);
            }
        }, 500);

    } catch (error) {
        console.error("Error al conectar con la API:", error);
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = "ERROR AL CARGAR";
    }
}

// --- GAME LOGIC ---
function obtenerCartaAleatoria() {
    const cartasValidas = todasLasCartas.filter(carta => {
        // Excloure sempre les cartes de tutorial del joc normal
        if (carta.isTutorial) return false;

        if (!carta.isRepeatable && cartasJugadas.has(carta.id)) return false;
        if (carta.requiresCardId !== null && carta.requiresCardId !== "" && !cartasJugadas.has(carta.requiresCardId)) return false;
        if (cartaActualObj && carta.id === cartaActualObj.id) return false;

        if (carta.requiresFlag && !banderasActivas.has(carta.requiresFlag)) return false;

        if (carta.character === "XaviSala" && !banderasActivas.has("xavi_activo") && !carta.requiresFlag) return false;
        if (carta.character === "RosaCavalle" && !banderasActivas.has("rosa_activa") && !carta.requiresFlag) return false;
        if (carta.character === "CoralPlanaguma" && !banderasActivas.has("coral_activa") && !carta.requiresFlag) return false;
        if (carta.character === "CoralPlanaguma" && banderasActivas.has("xavi_vuelve")) return false;
        if (carta.character === "AndreaAndaluz" && !banderasActivas.has("andrea_substituta") && !carta.requiresFlag) return false;

        return true;
    });

    if (cartasValidas.length === 0) {
        console.warn("No quedan cartas válidas en el mazo! Reiniciando ciclo...");
        return todasLasCartas.find(c => !c.isTutorial) || todasLasCartas[0];
    }

    const indiceRandom = Math.floor(Math.random() * cartasValidas.length);
    return cartasValidas[indiceRandom];
}

function prepararSiguienteCarta(esInicio = false) {
    if (esInicio) {
        // Si és la primera vegada, comencem pel tutorial
        if (!localStorage.getItem('tutorialMostrat')) {
            localStorage.setItem('tutorialMostrat', 'true');
            const tutorialCards = todasLasCartas
                .filter(c => c.isTutorial)
                .sort((a, b) => a.id - b.id);

            if (tutorialCards.length > 0) {
                cartaActualObj = tutorialCards[0];
                proximaCartaObj = tutorialCards[1] || obtenerCartaAleatoria();
                return;
            }
        }
        // Partida normal (o ja ha vist el tutorial)
        cartaActualObj = obtenerCartaAleatoria();
        proximaCartaObj = obtenerCartaAleatoria();
    } else {
        cartaActualObj = proximaCartaObj;
        proximaCartaObj = obtenerCartaAleatoria();
    }
}

function getPersonaje(key) {
    return todosLosPersonajes.find(p => p.key === key) || { name: "Desconocido", image: "" };
}

function renderJuego() {
    if (!cartaActualObj || !proximaCartaObj) return;

    if (cartaActualObj.id === "carta_muerte") {
        textCard.textContent = cartaActualObj.text;
        nomPersonatge.textContent = cartaActualObj.customName;
        imatgePersonatge.src = cartaActualObj.customImg;
        imatgePersonatge.style.display = "";
        nextCharacterImg.style.display = "none";
    } else {
        imatgePersonatge.style.display = "";
        nextCharacterImg.style.display = "";

        const personajeActual = getPersonaje(cartaActualObj.character);
        textCard.textContent = cartaActualObj.text;
        imatgePersonatge.src = personajeActual.image;
        nomPersonatge.textContent = personajeActual.name;
    }

    if (proximaCartaObj.id !== "carta_muerte" && cartaActualObj.id !== "carta_muerte") {
        const personajeProximo = getPersonaje(proximaCartaObj.character);
        nextCharacterImg.src = personajeProximo.image;
    }
}

function resetIndicators() {
    document.querySelectorAll('.indicator').forEach(dot => {
        dot.style.opacity = "0";
        dot.style.transform = "translateX(-50%) scale(0)";
    });
}

// --- HAMMER SWIPE LOGIC ---
hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

hammer.on('panstart', () => {
    playSound(selectSound);
    lastDeltaSign = 0;
});

hammer.on('panmove', (e) => {
    const rotation = Math.max(-20, Math.min(20, e.deltaX / 10));
    const translate = Math.max(-150, Math.min(150, e.deltaX));
    aGirar.style.transform = `rotate(${rotation}deg) translateX(${translate}px)`;

    const currentSign = e.deltaX > 0 ? 1 : e.deltaX < 0 ? -1 : 0;
    if (currentSign !== 0 && lastDeltaSign !== 0 && currentSign !== lastDeltaSign) {
        playSound(selectSound);
    }
    if (currentSign !== 0) lastDeltaSign = currentSign;

    const opacity = Math.min(Math.abs(translate) / 100, 1);
    const side = e.deltaX > 0 ? 'right' : 'left';

    if (cartaActualObj) {
        textoCambiar.textContent = cartaActualObj[side].label;
        divDecision.style.opacity = `${opacity}`;

        const efectos = cartaActualObj[side].effects;

        document.querySelectorAll('.stat').forEach(statDiv => {
            const statId = statDiv.id;
            const dot = statDiv.querySelector('.indicator');

            if (efectos && efectos[statId] !== undefined && efectos[statId] !== 0 && Math.abs(translate) > 25) {
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
    lastDeltaSign = 0;

    if (translate >= threshold || translate <= -threshold) {

        if (cartaActualObj && cartaActualObj.id === "carta_muerte") {
            const endX = translate >= threshold ? 350 : -350;
            const endRot = translate >= threshold ? 20 : -20;
            aGirar.style.transition = 'transform 0.4s ease-out';
            aGirar.style.transform = `translateY(600px) translateX(${endX}px) rotate(${endRot}deg)`;
            reiniciarJuegoConFundido();
            return;
        }

        const isRight = translate >= threshold;
        const decision = isRight ? 'right' : 'left';
        const accionTomada = cartaActualObj[decision];
        const efectos = accionTomada.effects;

        // Si és carta de tutorial no apliquem stats ni banderes ni setmanes
        const esTutorial = !!cartaActualObj.isTutorial;

        if (!esTutorial) {
            for (const stat in efectos) {
                if (stats.hasOwnProperty(stat)) {
                    const valorEfecto = efectos[stat];
                    const statDiv = document.getElementById(stat);

                    if (statDiv && valorEfecto !== 0) {
                        const claseColor = valorEfecto > 0 ? 'subiendo' : 'bajando';
                        statDiv.classList.add(claseColor);
                    }

                    stats[stat] += valorEfecto;
                    stats[stat] = Math.max(0, Math.min(100, stats[stat]));
                }
            }
            updateStats();
        }

        let hasMuerto = false;
        let textoMuerte = "";
        let imgMuerte = "";
        let nomMuerte = "";

        if (!esTutorial) {
            for (const stat in stats) {
                if (stats[stat] <= 0) {
                    hasMuerto = true;
                    textoMuerte = `Has fracassat. La teva capacitat de ${stat} ha arribat a 0.`;
                    imgMuerte = `/assets/img/deaths/muerte_${stat}_0.png`;
                    nomMuerte = `Mort per manca de ${stat}`;
                    break;
                } else if (stats[stat] >= 100) {
                    hasMuerto = true;
                    textoMuerte = `Has fracassat. La teva capacitat de ${stat} ha arribat a 100.`;
                    imgMuerte = `/assets/img/deaths/muerte_${stat}_100.png`;
                    nomMuerte = `Mort per excés de ${stat}`;
                    break;
                }
            }
        }

        if (hasMuerto) {
            proximaCartaObj = {
                id: "carta_muerte",
                text: textoMuerte,
                customImg: imgMuerte,
                customName: nomMuerte,
                character: "none",
                left: { label: "Fi", effects: {} },
                right: { label: "Fi", effects: {} }
            };
        } else {
            if (!esTutorial) {
                if (accionTomada.setFlag) banderasActivas.add(accionTomada.setFlag);
                if (accionTomada.removeFlag) banderasActivas.delete(accionTomada.removeFlag);
            }

            if (accionTomada.nextCardId !== null && accionTomada.nextCardId !== "") {
                proximaCartaObj = todasLasCartas.find(c => c.id === accionTomada.nextCardId) || obtenerCartaAleatoria();
                const personajeProximo = getPersonaje(proximaCartaObj.character);
                nextCharacterImg.src = personajeProximo.image;
            }

            if (!esTutorial) {
                semanes++;
                document.getElementById('semanes-text').textContent = `${semanes} setmanes al poder`;
            }
        }

        cartasJugadas.add(cartaActualObj.id);

        playSound(swipeSound);

        const endX = isRight ? 350 : -350;
        const endRot = isRight ? 20 : -20;
        aGirar.style.transition = 'transform 0.4s ease-out';
        aGirar.style.transform = `translateY(600px) translateX(${endX}px) rotate(${endRot}deg)`;

        ejecutarAnimacionCambio();
    } else {
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
        prepararSiguienteCarta();
        renderJuego();

        document.querySelectorAll('.stat').forEach(statDiv => {
            statDiv.classList.remove('subiendo', 'bajando');
        });

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

// --- REINICI AMB FUNDIDO I SO DE CORB ---
function reiniciarJuegoConFundido() {
    const recordActual = localStorage.getItem('record_semanas') || 0;
    if (semanes > parseInt(recordActual)) {
        localStorage.setItem('record_semanas', semanes);
    }

    playSound(cuervoSound);

    const blackScreen = document.createElement('div');
    blackScreen.style.position = 'fixed';
    blackScreen.style.top = '0';
    blackScreen.style.left = '0';
    blackScreen.style.width = '100vw';
    blackScreen.style.height = '100vh';
    blackScreen.style.backgroundColor = 'black';
    blackScreen.style.zIndex = '9999';
    blackScreen.style.opacity = '0';
    blackScreen.style.transition = 'opacity 1s ease-in-out';
    blackScreen.style.pointerEvents = 'none';
    document.body.appendChild(blackScreen);

    setTimeout(() => {
        blackScreen.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        stats = {
            educacio: 50,
            capacitatsClau: 50,
            convivencia: 50,
            diners: 50
        };
        semanes = 0;
        document.getElementById('semanes-text').textContent = `${semanes} setmanes al poder`;

        cartasJugadas.clear();
        banderasActivas = new Set([
            "xavi_activo",
            "rosa_activa"
        ]);

        updateStats();

        document.querySelectorAll('.stat').forEach(statDiv => {
            statDiv.classList.remove('subiendo', 'bajando');
        });

        aGirar.style.transition = 'none';
        aGirar.style.transform = 'translateY(0) translateX(0) rotate(0)';
        divDecision.style.opacity = '0';

        prepararSiguienteCarta(true);
        renderJuego();

        blackScreen.style.opacity = '0';

        setTimeout(() => {
            blackScreen.remove();
        }, 1000);

    }, 1000);
}

// Iniciar
inicializarJuego();
