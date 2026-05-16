// ─── CHATBOT LOGIC ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const chatbotContainer = document.getElementById('chatbot-container');
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotHeader = document.getElementById('chatbot-header');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotSend = document.getElementById('chatbot-send');

// Chatbot knowledge base
const CHATBOT_KNOWLEDGE = {
  // Planet-specific information
  planets: {
    sun: {
      keywords: ['sun', 'star', 'solar'],
      response: "The Sun is our star! ☀️ It's a G-type main-sequence star that's about 4.6 billion years old. It contains 99.86% of the Solar System's mass and provides the energy that makes life on Earth possible. Surface temperature: 5,500°C!"
    },
    mercury: {
      keywords: ['mercury'],
      response: "Mercury is the smallest and fastest planet! 🏃 It's closest to the Sun and has extreme temperature swings from -180°C at night to 430°C during the day. It has no moons and takes only 88 Earth days to orbit the Sun."
    },
    venus: {
      keywords: ['venus'],
      response: "Venus is Earth's 'evil twin'! 🌋 It's similar in size but has a runaway greenhouse effect with surface temperatures of 462°C - hot enough to melt lead! It rotates backwards and has thick clouds of sulfuric acid."
    },
    earth: {
      keywords: ['earth', 'home'],
      response: "Earth is our home! 🌍 The only known planet with life, it has liquid water, a protective atmosphere, and a magnetic field. 71% of its surface is covered by oceans. It has one moon that stabilizes its axial tilt."
    },
    mars: {
      keywords: ['mars', 'red planet'],
      response: "Mars is the Red Planet! 🔴 It gets its color from iron oxide (rust) on its surface. It has the largest volcano in the Solar System (Olympus Mons) and evidence of ancient water. It has 2 small moons: Phobos and Deimos."
    },
    jupiter: {
      keywords: ['jupiter', 'giant', 'great red spot'],
      response: "Jupiter is the king of planets! 👑 It's the largest planet with 95 known moons. The Great Red Spot is a storm larger than Earth that's been raging for centuries! Jupiter's strong gravity protects inner planets from asteroids."
    },
    saturn: {
      keywords: ['saturn', 'rings', 'ringed'],
      response: "Saturn is the ringed wonder! 💍 Its spectacular rings are made of ice and rock particles. It has 146 known moons, including Titan which has a thick atmosphere. Saturn is so light it would float in water!"
    },
    uranus: {
      keywords: ['uranus', 'ice giant'],
      response: "Uranus is the tilted ice giant! ❄️ It rotates on its side (98° tilt), possibly due to a massive collision. It's made of water, methane, and ammonia ices. The methane gives it a blue-green color. It has 28 known moons."
    },
    neptune: {
      keywords: ['neptune', 'windiest'],
      response: "Neptune is the windiest planet! 💨 It has the fastest winds in the Solar System at 2,100 km/h! It's the farthest planet from the Sun and has a beautiful deep blue color from methane. It has 16 known moons, including Triton."
    }
  },
  
  // General topics
  topics: {
    moons: {
      keywords: ['moon', 'moons', 'satellite'],
      response: "Moons are natural satellites! 🌙 Our Solar System has over 200 known moons. The largest is Ganymede (Jupiter), bigger than Mercury! Some moons like Europa and Enceladus might have subsurface oceans with potential for life."
    },
    exploration: {
      keywords: ['explore', 'exploration', 'mission', 'spacecraft', 'probe'],
      response: "Space exploration is amazing! 🚀 We've sent probes to every planet! Notable missions: Voyager 1 & 2 (interstellar space), Mars rovers (Curiosity, Perseverance), Juno (Jupiter), and Cassini (Saturn). The James Webb Space Telescope is revolutionizing astronomy!"
    },
    life: {
      keywords: ['life', 'alien', 'habitable'],
      response: "The search for life continues! 👽 We're looking at Mars (past life), Europa and Enceladus (subsurface oceans), and Titan (organic chemistry). We've also discovered thousands of exoplanets, some in the 'habitable zone' where liquid water could exist!"
    },
    distance: {
      keywords: ['distance', 'far', 'how far', 'away'],
      response: "Space is HUGE! 📏 Light from the Sun takes 8 minutes to reach Earth, 43 minutes to Jupiter, and 4 hours to Neptune! The nearest star (Proxima Centauri) is 4.24 light-years away. Our galaxy is 100,000 light-years across!"
    },
    size: {
      keywords: ['size', 'big', 'large', 'small', 'diameter'],
      response: "Sizes vary wildly! 📐 Jupiter is 11x Earth's diameter and could fit 1,300 Earths inside! The Sun is 109x Earth's diameter. Mercury is only 38% Earth's size. Saturn's rings span 282,000 km but are only 10 meters thick!"
    },
    temperature: {
      keywords: ['temperature', 'hot', 'cold', 'warm'],
      response: "Temperatures are extreme! 🌡️ Venus is hottest at 462°C. Mercury swings from -180°C to 430°C. Earth averages 15°C. The outer planets are freezing: Jupiter -110°C, Neptune -218°C. Space itself is -270°C!"
    },
    orbit: {
      keywords: ['orbit', 'year', 'revolution'],
      response: "Orbits define years! 🔄 Mercury orbits in 88 Earth days, while Neptune takes 165 Earth years! Planets orbit in ellipses, not perfect circles. The closer to the Sun, the faster they move (Kepler's laws)."
    },
    rotation: {
      keywords: ['rotation', 'day', 'spin'],
      response: "Rotation defines days! 🌍 Earth rotates in 24 hours. Jupiter spins fastest (9.9 hours) despite being huge! Venus rotates backwards and takes 243 Earth days. Uranus rotates on its side!"
    }
  },
  
  // Default responses
  greetings: {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: "Hello! 👋 I'm here to answer your questions about the Solar System. Ask me about planets, moons, space exploration, or anything astronomical!"
  },
  thanks: {
    keywords: ['thank', 'thanks', 'appreciate'],
    response: "You're welcome! 😊 Feel free to ask more questions about our amazing Solar System!"
  },
  help: {
    keywords: ['help', 'what can you', 'how do'],
    response: "I can answer questions about: 🌟 Planets (Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune) 🌙 Moons and satellites 🚀 Space exploration 🔭 Astronomy facts. Just ask away!"
  }
};

// Chatbot toggle functionality
let isChatbotMinimized = false;

chatbotToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleChatbot();
});

chatbotHeader.addEventListener('click', () => {
  toggleChatbot();
});

function toggleChatbot() {
  isChatbotMinimized = !isChatbotMinimized;
  chatbotContainer.classList.toggle('minimized', isChatbotMinimized);
  chatbotToggle.textContent = isChatbotMinimized ? '+' : '−';
}

// Add message to chat
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
  
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = isUser ? 'You' : 'AI Assistant';
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;
  
  messageDiv.appendChild(label);
  messageDiv.appendChild(bubble);
  chatbotMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message bot typing-message';
  typingDiv.innerHTML = `
    <div class="message-label">AI Assistant</div>
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatbotMessages.appendChild(typingDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator(typingDiv) {
  if (typingDiv && typingDiv.parentNode) {
    typingDiv.parentNode.removeChild(typingDiv);
  }
}

// Get bot response
function getBotResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for distance queries between two planets
  if (lowerMessage.includes('distance') || lowerMessage.includes('between') || lowerMessage.includes('how far')) {
    // Extract planet names mentioned
    const mentionedPlanets = [];
    for (const planet of PLANETS) {
      if (lowerMessage.includes(planet.name.toLowerCase())) {
        mentionedPlanets.push(planet);
      }
    }
    
    // If two planets are mentioned, calculate distance
    if (mentionedPlanets.length === 2) {
      const planet1 = mentionedPlanets[0];
      const planet2 = mentionedPlanets[1];
      
      // Get distances from Sun in AU
      const dist1 = parseFloat(planet1.dist.split(' ')[0]) || 0;
      const dist2 = parseFloat(planet2.dist.split(' ')[0]) || 0;
      
      // Calculate distance between planets (simplified - actual distance varies with orbital positions)
      const minDist = Math.abs(dist1 - dist2);
      const maxDist = dist1 + dist2;
      const avgDist = (minDist + maxDist) / 2;
      
      // Convert AU to km (1 AU ≈ 149.6 million km)
      const minDistKm = (minDist * 149.6).toFixed(1);
      const maxDistKm = (maxDist * 149.6).toFixed(1);
      const avgDistKm = (avgDist * 149.6).toFixed(1);
      
      return `The distance between ${planet1.name} and ${planet2.name} varies as they orbit! 🌍↔️🪐\n\n` +
             `• Closest approach: ${minDist.toFixed(2)} AU (${minDistKm} million km)\n` +
             `• Farthest apart: ${maxDist.toFixed(2)} AU (${maxDistKm} million km)\n` +
             `• Average distance: ${avgDist.toFixed(2)} AU (${avgDistKm} million km)\n\n` +
             `Note: 1 AU (Astronomical Unit) = 149.6 million km, the distance from Earth to the Sun!`;
    }
    
    // If one planet mentioned with "how far" or "distance"
    if (mentionedPlanets.length === 1) {
      const planet = mentionedPlanets[0];
      return `${planet.name} is ${planet.dist} from the Sun! 🌞 That's about ${(parseFloat(planet.dist) * 149.6).toFixed(0)} million kilometers. ` +
             `Light from the Sun takes ${planet.name === 'Earth' ? '8 minutes' : 
              planet.name === 'Mars' ? '13 minutes' : 
              planet.name === 'Jupiter' ? '43 minutes' : 
              planet.name === 'Saturn' ? '80 minutes' : 
              planet.name === 'Neptune' ? '4 hours' : 'several minutes'} to reach ${planet.name}!`;
    }
  }
  
  // Check for comparison queries (which is bigger, larger, etc.)
  if ((lowerMessage.includes('bigger') || lowerMessage.includes('larger') || lowerMessage.includes('smaller') || 
       lowerMessage.includes('compare') || lowerMessage.includes('vs')) && 
      (lowerMessage.includes('than') || lowerMessage.includes('or'))) {
    const mentionedPlanets = [];
    for (const planet of PLANETS) {
      if (lowerMessage.includes(planet.name.toLowerCase())) {
        mentionedPlanets.push(planet);
      }
    }
    
    if (mentionedPlanets.length === 2) {
      const p1 = mentionedPlanets[0];
      const p2 = mentionedPlanets[1];
      const d1 = parseInt(p1.dia.replace(/,/g, ''));
      const d2 = parseInt(p2.dia.replace(/,/g, ''));
      
      const bigger = d1 > d2 ? p1 : p2;
      const smaller = d1 > d2 ? p2 : p1;
      const ratio = (Math.max(d1, d2) / Math.min(d1, d2)).toFixed(1);
      
      return `${bigger.name} is much bigger than ${smaller.name}! 📏\n\n` +
             `• ${bigger.name}: ${bigger.dia} diameter\n` +
             `• ${smaller.name}: ${smaller.dia} diameter\n\n` +
             `${bigger.name} is ${ratio}x larger than ${smaller.name}!`;
    }
  }
  
  // Check for "how many moons" queries
  if ((lowerMessage.includes('how many') || lowerMessage.includes('number of')) && lowerMessage.includes('moon')) {
    const mentionedPlanets = [];
    for (const planet of PLANETS) {
      if (lowerMessage.includes(planet.name.toLowerCase())) {
        mentionedPlanets.push(planet);
      }
    }
    
    if (mentionedPlanets.length > 0) {
      const planet = mentionedPlanets[0];
      const moonCount = planet.moons;
      
      if (moonCount === '0') {
        return `${planet.name} has no moons! 🌑 It orbits alone. Mercury and Venus are the only planets without natural satellites.`;
      } else if (moonCount === '1') {
        return `${planet.name} has 1 moon! 🌙 Our Moon is the 5th largest moon in the Solar System and helps stabilize Earth's axial tilt.`;
      } else {
        const majorMoons = planet.moonData.filter(m => !m.name.includes('+')).map(m => m.name).join(', ');
        return `${planet.name} has ${moonCount} known moons! 🌙 The major ones are: ${majorMoons}. ` +
               `${planet.name === 'Jupiter' ? "Jupiter's moon Europa might have a subsurface ocean!" : 
                 planet.name === 'Saturn' ? "Saturn's moon Titan has a thick atmosphere and liquid methane lakes!" : 
                 planet.name === 'Neptune' ? "Neptune's moon Triton orbits backwards!" : ""}`;
      }
    }
  }
  
  // Check greetings (must come after specific queries)
  for (const keyword of CHATBOT_KNOWLEDGE.greetings.keywords) {
    if (lowerMessage.includes(keyword) && lowerMessage.length < 20) { // Short greeting
      return CHATBOT_KNOWLEDGE.greetings.response;
    }
  }
  
  // Check thanks
  for (const keyword of CHATBOT_KNOWLEDGE.thanks.keywords) {
    if (lowerMessage.includes(keyword)) {
      return CHATBOT_KNOWLEDGE.thanks.response;
    }
  }
  
  // Check help
  for (const keyword of CHATBOT_KNOWLEDGE.help.keywords) {
    if (lowerMessage.includes(keyword)) {
      return CHATBOT_KNOWLEDGE.help.response;
    }
  }
  
  // Check topics BEFORE planets (to avoid false matches)
  for (const [topic, data] of Object.entries(CHATBOT_KNOWLEDGE.topics)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        return data.response;
      }
    }
  }
  
  // Check planets (should be last to avoid false positives)
  for (const [planet, data] of Object.entries(CHATBOT_KNOWLEDGE.planets)) {
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        return data.response;
      }
    }
  }
  
  // Default response
  return "That's an interesting question! 🤔 I specialize in Solar System facts. Try asking about:\n\n" +
         "• Specific planets (e.g., 'Tell me about Mars')\n" +
         "• Distances (e.g., 'Distance between Earth and Jupiter')\n" +
         "• Comparisons (e.g., 'Is Saturn bigger than Earth?')\n" +
         "• Moons (e.g., 'How many moons does Jupiter have?')\n" +
         "• Space topics (exploration, temperature, orbits, etc.)";
}

// Handle sending message
function sendMessage() {
  const message = chatbotInput.value.trim();
  if (!message) return;
  
  // Add user message
  addMessage(message, true);
  chatbotInput.value = '';
  
  // Show typing indicator
  const typingDiv = showTypingIndicator();
  
  // Simulate thinking time (500-1500ms)
  const thinkingTime = 500 + Math.random() * 1000;
  
  setTimeout(() => {
    removeTypingIndicator(typingDiv);
    const response = getBotResponse(message);
    addMessage(response, false);
  }, thinkingTime);
}

// Event listeners
chatbotSend.addEventListener('click', sendMessage);

chatbotInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Focus input when clicking in the chatbot (but not on messages)
chatbotContainer.addEventListener('click', (e) => {
  if (e.target === chatbotContainer || e.target === chatbotMessages) {
    chatbotInput.focus();
  }
});

console.log('🌌 Solar System AI Chatbot initialized!');

// ═══════════════════════════════════════════════════════════════════════════
