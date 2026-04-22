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

// --- NUEVO: BANDERAS ACTIVAS AL INICIAR ---
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
        prepararSiguienteCarta(true); // true = es el inicio del juego
        renderJuego();
    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }
}

// --- GAME LOGIC (CARDS & RULES) ---
// --- NUEVO: OBTENER CARTA CON FILTRO DE BANDERAS Y SALVAVIDAS ---
function obtenerCartaAleatoria() {
    const cartasValidas = todasLasCartas.filter(carta => {
        // 1. Reglas básicas originales
        if (!carta.isRepeatable && cartasJugadas.has(carta.id)) return false;
        if (carta.requiresCardId !== null && carta.requiresCardId !== "" && !cartasJugadas.has(carta.requiresCardId)) return false;
        if (cartaActualObj && carta.id === cartaActualObj.id) return false;

        // 2. Motor de Banderas estricto del JSON
        if (carta.requiresFlag && !banderasActivas.has(carta.requiresFlag)) {
            return false;
        }

        // --- 3. FILTROS SALVAVIDAS ESTRICTOS (¡Aquí está la magia!) ---
        
        // Xavi solo sale si está activo (o si es su carta de retorno que tiene requiresFlag)
        if (carta.character === "XaviSala" && !banderasActivas.has("xavi_activo") && !carta.requiresFlag) return false;

        // Rosa solo sale si está activa (o si es su carta de llamada desde el retiro)
        if (carta.character === "RosaCavalle" && !banderasActivas.has("rosa_activa") && !carta.requiresFlag) return false;

        // Coral solo sale si está activa
        if (carta.character === "CoralPlanaguma" && !banderasActivas.has("coral_activa") && !carta.requiresFlag) return false;

        // Novedad: Si Coral ya se ha despedido (activó xavi_vuelve), la bloqueamos para que no repita
        if (carta.character === "CoralPlanaguma" && banderasActivas.has("xavi_vuelve")) return false;

        // Novedad: Andrea (TODA Andrea) solo sale si es la substituta oficial
        if (carta.character === "AndreaAndaluz" && !banderasActivas.has("andrea_substituta") && !carta.requiresFlag) return false;

        return true;
    });

    if (cartasValidas.length === 0) {
        console.warn("¡No quedan cartas válidas en el mazo! Reiniciando ciclo...");
        return todasLasCartas[0];
    }

    const indiceRandom = Math.floor(Math.random() * cartasValidas.length);
    return cartasValidas[indiceRandom];
}

// --- NUEVO: PREPARAR SIGUIENTE CARTA ARREGLADA ---
function prepararSiguienteCarta(esInicio = false) {
    if (esInicio) {
        cartaActualObj = obtenerCartaAleatoria();
        proximaCartaObj = obtenerCartaAleatoria();
    } else {
        // Como la carta forzada ya se metió en la recámara durante el swipe,
        // simplemente la pasamos al frente y generamos una nueva detrás.
        cartaActualObj = proximaCartaObj;
        proximaCartaObj = obtenerCartaAleatoria();
    }
}

function getPersonaje(key) {
    return todosLosPersonajes.find(p => p.key === key) || { name: "Desconocido", image: "" };
}

function renderJuego() {
    if (!cartaActualObj || !proximaCartaObj) return;

    // --- MODIFICADO: LÓGICA DE RENDERIZADO PARA MOSTRAR LA IMAGEN Y NOMBRE DE LA MUERTE ---
    if (cartaActualObj.id === "carta_muerte") {
        textCard.textContent = cartaActualObj.text;
        nomPersonatge.textContent = cartaActualObj.customName;
        imatgePersonatge.src = cartaActualObj.customImg;
        
        imatgePersonatge.style.display = ""; 
        nextCharacterImg.style.display = "none"; // Atrás no mostramos a nadie porque se reinicia
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

    // Sonido al cruzar el ángulo 0
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

            if (efectos && efectos[statId] !== undefined && Math.abs(translate) > 25) {
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

    if (translate >= threshold || translate <= -threshold){
        
        // --- AÑADIDO: SI DESLIZAMOS LA CARTA DE MUERTE, CORTAMOS LA EJECUCIÓN Y REINICIAMOS ---
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

        // 1. Aplicar stats y añadir clases de color
        for (const stat in efectos) {
            if (stats.hasOwnProperty(stat)) {
                const valorEfecto = efectos[stat];
                const statDiv = document.getElementById(stat);

                // --- NUEVO: Feedback visual de color ---
                if (statDiv && valorEfecto !== 0) {
                    const claseColor = valorEfecto > 0 ? 'subiendo' : 'bajando';
                    statDiv.classList.add(claseColor);
                }
                // ---------------------------------------

                stats[stat] += valorEfecto;
                stats[stat] = Math.max(0, Math.min(100, stats[stat]));
            }
        }
        updateStats();

        // --- AÑADIDO: COMPROBAR SI HAS MUERTO DESPUÉS DE APLICAR STATS ---
        let hasMuerto = false;
        let textoMuerte = "";
        let imgMuerte = "";
        let nomMuerte = "";
        
        for (const stat in stats) {
            if (stats[stat] <= 0) {
                hasMuerto = true;
                textoMuerte = `Has fracassat. La teva capacitat de ${stat} ha arribat a 0.`;
                imgMuerte = `/assets/img/deaths/muerte_${stat}_0.png`; // <--- Ajusta la ruta y extensión aquí
                nomMuerte = `Mort per manca de ${stat}`;
                break;
            } else if (stats[stat] >= 100) {
                hasMuerto = true;
                textoMuerte = `Has fracassat. La teva capacitat de ${stat} ha arribat a 100.`;
                imgMuerte = `/assets/img/deaths/muerte_${stat}_100.png`; // <--- Ajusta la ruta y extensión aquí
                nomMuerte = `Mort per excés de ${stat}`;
                break;
            }
        }

        if (hasMuerto) {
            // Inyectamos la carta de muerte para la siguiente ronda creada "al vuelo"
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
            // --- NUEVO: ACTUALIZAR BANDERAS ---
            if (accionTomada.setFlag) banderasActivas.add(accionTomada.setFlag);
            if (accionTomada.removeFlag) banderasActivas.delete(accionTomada.removeFlag);

            // --- NUEVO: ARREGLO DEL DELAY DEL NEXTCARDID ---
            if (accionTomada.nextCardId !== null && accionTomada.nextCardId !== "") {
                proximaCartaObj = todasLasCartas.find(c => c.id === accionTomada.nextCardId) || obtenerCartaAleatoria();
                const personajeProximo = getPersonaje(proximaCartaObj.character);
                nextCharacterImg.src = personajeProximo.image; 
            }

            // Sumar semana
            semanes++;
            document.getElementById('semanes-text').textContent = `${semanes} setmanes al poder`;
        }

        // 2. Registrar carta como jugada
        cartasJugadas.add(cartaActualObj.id);

        // 4. Sonido swipe
        playSound(swipeSound);

        // 5. Animar la salida
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
        // Preparamos los datos de la siguiente ronda
        prepararSiguienteCarta();
        renderJuego();

        // --- NUEVO: Limpiar colores de stats ---
        document.querySelectorAll('.stat').forEach(statDiv => {
            statDiv.classList.remove('subiendo', 'bajando');
        });
        // ---------------------------------------

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

// --- AÑADIDO: FUNCIÓN DE REINICIO CON FUNDIDO Y SONIDO DE CUERVO ---
function reiniciarJuegoConFundido() {
    playSound(cuervoSound);

    // Crear div negro para el fundido
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

    // Iniciar fundido a negro
    setTimeout(() => {
        blackScreen.style.opacity = '1';
    }, 50);

    // Una vez está todo negro (1s de transición), reiniciamos variables
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

        // Reset de la carta girada para ponerla en su sitio
        aGirar.style.transition = 'none';
        aGirar.style.transform = 'translateY(0) translateX(0) rotate(0)';
        divDecision.style.opacity = '0';

        // Recargar nueva ronda desde cero
        prepararSiguienteCarta(true);
        renderJuego();

        // Quitar fundido (Fade in a la nueva partida)
        blackScreen.style.opacity = '0';
        
        // Destruir el div negro para que no estorbe en el DOM
        setTimeout(() => {
            blackScreen.remove();
        }, 1000);

    }, 1000);
}

// Iniciar
inicializarJuego();