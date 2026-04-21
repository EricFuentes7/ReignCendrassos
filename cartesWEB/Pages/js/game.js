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

let data_cartes, data_personatges;
let cartaActual = 0;
let proximaCarta = 0;

let stats = {
  educacio: 50, 
  capacitatsClau: 50, 
  convivencia: 50, 
  diners: 50 
};

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

async function cargarJSON() {
  const [cartesRes, personatgesRes] = await Promise.all([
    fetch('/data/cartes.json'),
    fetch('/data/personatges.json')
  ]);
  const cartes = await cartesRes.json();
  const personatges = 
  updateStats();
  return [cartes, personatges];
}

function getRandomIndex(data) {
  return Math.floor(Math.random() * data.length);
}

cargarJSON().then(([cartes, personatges]) => {
  data_cartes = cartes;
  data_personatges = personatges;
  cartaActual = getRandomIndex(data_cartes);
  proximaCarta = getRandomIndex(data_cartes);
  renderJuego();
});

function renderJuego() {
  textCard.textContent = data_cartes[cartaActual].text;
  imatgePersonatge.src = data_personatges[data_cartes[cartaActual].character].image;
  nomPersonatge.textContent = data_personatges[data_cartes[cartaActual].character].name;
  nextCharacterImg.src = data_personatges[data_cartes[proximaCarta].character].image;
}

function resetIndicators() {
  document.querySelectorAll('.indicator').forEach(dot => {
    dot.style.opacity = "0";
    dot.style.transform = "translateX(-50%) scale(0)";
  });
}

hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

hammer.on('panmove', (e) => {
  const rotation = Math.max(-20, Math.min(20, e.deltaX / 10));
  const translate = Math.max(-150, Math.min(150, e.deltaX));
  aGirar.style.transform = `rotate(${rotation}deg) translateX(${translate}px)`;

  const opacity = Math.min(Math.abs(translate) / 100, 1);
  const side = e.deltaX > 0 ? 'right' : 'left';
  
  if (data_cartes && data_cartes[cartaActual]) {
    textoCambiar.textContent = data_cartes[cartaActual][side].label;
    divDecision.style.opacity = `${opacity}`;

    const efectos = data_cartes[cartaActual][side].effects;
    
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
    const efectos = data_cartes[cartaActual][decision].effects;

    for (const stat in efectos) {
      if (stats.hasOwnProperty(stat)) {
        stats[stat] += efectos[stat];
        stats[stat] = Math.max(0, Math.min(100, stats[stat]));
      }
    }

    updateStats();
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
    cartaActual = proximaCarta;
    proximaCarta = getRandomIndex(data_cartes);
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