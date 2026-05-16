// ─── AUTO-NARRATION SYSTEM ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const narrationPanel = document.getElementById('narration-panel');
const narrationTopic = document.getElementById('narration-topic');
const narrationContent = document.getElementById('narration-content');
const narrationClose = document.getElementById('narration-close');
const narrationArrow = document.getElementById('narration-arrow');
const narrationPlay = document.getElementById('narration-play');
const narrationPause = document.getElementById('narration-pause');
const narrationStop = document.getElementById('narration-stop');

// Text-to-Speech setup
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isNarrating = false;
let isPanelMinimized = false;

// Narration content database
const NARRATION_DATA = {
  intro: {
    title: "Solar System Overview",
    text: "The Solar System consists of the Sun, eight planets, their moons, asteroids, comets, and other celestial bodies. The Sun is at the center, and all planets revolve around it due to gravitational force."
  },
  Sun: {
    title: "The Sun",
    text: "The Sun is a star made mainly of hydrogen and helium gases. It is the largest object in the Solar System. It provides heat and light to all planets. Energy is produced inside the Sun by nuclear fusion. The gravity of the Sun keeps all planets in orbit. Approximate age: 4.6 billion years. Surface temperature: about 5500 degrees Celsius."
  },
  Mercury: {
    title: "Mercury",
    text: "Closest planet to the Sun. Smallest planet in the Solar System. No atmosphere and no moons. Extremely hot during day and very cold at night. Takes 88 days to revolve around the Sun."
  },
  Venus: {
    title: "Venus",
    text: "Called the Earth's twin because of similar size. Hottest planet due to thick carbon dioxide atmosphere. Rotates in the opposite direction compared to most planets. No moons. Known as the Morning Star or Evening Star."
  },
  Earth: {
    title: "Earth",
    text: "Only known planet that supports life. Has water, oxygen, and suitable temperature. Called the Blue Planet because most of its surface is covered with water. Has one natural satellite, the Moon. Takes 365 days to revolve around the Sun."
  },
  Mars: {
    title: "Mars",
    text: "Known as the Red Planet due to iron oxide on its surface. Has the largest volcano in the Solar System: Olympus Mons. Has two moons, Phobos and Deimos. Scientists search for signs of past water and life on Mars."
  },
  Jupiter: {
    title: "Jupiter",
    text: "Largest planet in the Solar System. A gas giant mainly made of hydrogen and helium. Famous for the Great Red Spot, a giant storm. Has many moons including Ganymede, the largest moon. Strong magnetic field."
  },
  Saturn: {
    title: "Saturn",
    text: "Famous for its beautiful ring system. Second largest planet. Made mostly of gases. Has many moons; Titan is the largest. Least dense planet; it could float in water theoretically."
  },
  Uranus: {
    title: "Uranus",
    text: "Ice giant with a blue-green color due to methane gas. Rotates on its side. Very cold planet. Has rings and many moons."
  },
  Neptune: {
    title: "Neptune",
    text: "Farthest planet from the Sun. Deep blue in color because of methane gas. Has very strong winds and storms. Takes about 165 Earth years to complete one orbit."
  }
};

// Show narration panel with content
function showNarration(key) {
  const data = NARRATION_DATA[key];
  if (!data) {
    console.log('No narration data for:', key);
    return;
  }
  
  console.log('Showing narration for:', key);
  
  // Update content
  narrationTopic.textContent = data.title;
  narrationContent.innerHTML = `<p>${data.text}</p>`;
  
  // Show panel with animation
  narrationPanel.classList.add('visible');
  narrationArrow.classList.remove('visible');
  isPanelMinimized = false;
  
  // Auto-play narration after a short delay
  setTimeout(() => {
    playNarration(data.text);
  }, 800);
}

// Minimize narration panel (slide back)
function minimizeNarration() {
  narrationPanel.classList.remove('visible');
  narrationArrow.classList.add('visible');
  isPanelMinimized = true;
  stopNarration();
}

// Show narration panel again
function showNarrationPanel() {
  narrationPanel.classList.add('visible');
  narrationArrow.classList.remove('visible');
  isPanelMinimized = false;
}

// Play text-to-speech
function playNarration(text) {
  // Stop any ongoing narration
  stopNarration();
  
  // Create new utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.9; // Slightly slower for clarity
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;
  
  // Set voice (prefer English voices)
  const voices = speechSynthesis.getVoices();
  const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
  if (englishVoice) {
    currentUtterance.voice = englishVoice;
  }
  
  // Event handlers
  currentUtterance.onstart = () => {
    isNarrating = true;
    narrationPlay.classList.add('playing');
    narrationPlay.textContent = '🔊 Playing';
  };
  
  currentUtterance.onend = () => {
    isNarrating = false;
    narrationPlay.classList.remove('playing');
    narrationPlay.textContent = '▶ Play';
  };
  
  currentUtterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isNarrating = false;
    narrationPlay.classList.remove('playing');
    narrationPlay.textContent = '▶ Play';
  };
  
  // Start speaking
  speechSynthesis.speak(currentUtterance);
}

// Pause narration
function pauseNarration() {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    narrationPlay.textContent = '▶ Resume';
  }
}

// Resume narration
function resumeNarration() {
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    narrationPlay.textContent = '🔊 Playing';
  } else if (!isNarrating) {
    // Replay from start
    const text = narrationContent.textContent;
    playNarration(text);
  }
}

// Stop narration
function stopNarration() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  isNarrating = false;
  narrationPlay.classList.remove('playing');
  narrationPlay.textContent = '▶ Play';
}

// Event listeners
narrationClose.addEventListener('click', minimizeNarration);
narrationArrow.addEventListener('click', showNarrationPanel);

narrationPlay.addEventListener('click', () => {
  if (speechSynthesis.paused) {
    resumeNarration();
  } else if (!isNarrating) {
    const text = narrationContent.textContent;
    playNarration(text);
  }
});

narrationPause.addEventListener('click', pauseNarration);
narrationStop.addEventListener('click', stopNarration);

// Load voices (needed for some browsers)
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}

// Show intro narration on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    showNarration('intro');
  }, 2000); // Show after 2 seconds
});

// Track mode changes to show planet narration
let lastNarrationPlanet = null;
let checkCount = 0;

// Monitor when planet mode is entered
setInterval(() => {
  checkCount++;
  
  // Debug logging every 5 seconds
  if (checkCount % 10 === 0) {
    console.log('Narration check:', {
      mode: mode,
      focusedIdx: focusedIdx,
      lastPlanet: lastNarrationPlanet,
      isPanelMinimized: isPanelMinimized
    });
  }
  
  if (mode === 'planet' && focusedIdx >= 0 && focusedIdx < PLANETS.length) {
    const currentPlanet = PLANETS[focusedIdx].name;
    
    console.log('Planet mode detected:', currentPlanet, 'Last:', lastNarrationPlanet);
    
    // Show narration if it's a different planet OR if panel was minimized
    if (currentPlanet !== lastNarrationPlanet) {
      lastNarrationPlanet = currentPlanet;
      
      console.log('Triggering narration for:', currentPlanet);
      
      // Small delay to let the planet view settle
      setTimeout(() => {
        showNarration(currentPlanet);
      }, 1000);
    }
  } else if (mode === 'system') {
    if (lastNarrationPlanet !== null) {
      console.log('Returned to system view, resetting planet tracking');
    }
    lastNarrationPlanet = null; // Reset when back in system view
  }
}, 500); // Check every 500ms

console.log('🔊 Auto-Narration System initialized!');
console.log('Available planets:', PLANETS.map(p => p.name));

