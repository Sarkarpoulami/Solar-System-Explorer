// ─── canvas & resize ───────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, CX, CY;
function resize() { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; CX=W/2; CY=H/2; }
resize(); window.addEventListener('resize', resize);

// ─── planet definitions ────────────────────────────────────────────────────
const PLANETS = [
  { name:'Sun',     sub:'Our Star',           col:[255,235,120], atmoCol:[255,200,80],  orbitR:0,    orbitSpeed:0,       pRadius:45, pCount:2500, rings:false, hasAtmo:true,
    type:'G-type Star', dia:'1,392,700 km', dist:'0 AU', day:'25 Earth days', year:'—', moons:'0', temp:'5,500 °C surface',
    moonData: [],
    colorFn:(d,t,i,tot)=>{
      const flare = Math.sin(t*3 + i*0.1) * 0.3;
      const corona = Math.sin(t*1.5 + d*8) * 0.2;
      const h = 50 + flare*10 + corona*8; // More yellow hue
      const s = 90 + flare*10;
      const l = 70 + d*20 + flare*10;
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Mercury', sub:'The Swift Planet',   col:[140,130,115], atmoCol:[120,110,95],  orbitR:90,   orbitSpeed:4.15,    pRadius:12,  pCount:800,  rings:false, hasAtmo:false,
    type:'Terrestrial', dia:'4,879 km', dist:'0.39 AU', day:'58.6 Earth days', year:'88 Earth days', moons:'0', temp:'-180 to 430 °C',
    moonData: [],
    colorFn:(d,t,i,tot)=>{
      const crater = Math.sin(i*0.3) > 0.7 ? 0.3 : 0;
      const h = 25 + d*8 - crater*10;
      const s = 15 + d*12 - crater*8;
      const l = 35 + d*30 - crater*15;
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Venus',   sub:'The Veiled Planet',  col:[255,240,180], atmoCol:[255,200,120], orbitR:140,  orbitSpeed:1.62,    pRadius:18, pCount:1000, rings:false, hasAtmo:true,
    type:'Terrestrial', dia:'12,104 km', dist:'0.72 AU', day:'243 Earth days', year:'225 Earth days', moons:'0', temp:'462 °C avg',
    moonData: [],
    colorFn:(d,t,i,tot)=>{
      const cloud = Math.sin(t*2 + i*0.2 + d*6) * 0.4;
      const h = 50 + cloud*20;
      const s = 40 + cloud*30 + d*20;
      const l = 75 + cloud*15 + d*15;
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Earth',   sub:'Our Home',           col:[70,130,180],  atmoCol:[135,206,250], orbitR:195,  orbitSpeed:1.0,     pRadius:20, pCount:1200, rings:false, hasAtmo:true,
    type:'Terrestrial', dia:'12,742 km', dist:'1.00 AU', day:'24 hours', year:'365.25 days', moons:'1', temp:'-88 to 58 °C',
    moonData: [
      { name:'Moon', orbitR:2.2, size:5, speed:1.0, col:[200,200,200], angle:0 }
    ],
    colorFn:(d,t,i,tot)=>{
      const noise = Math.sin(i*0.5 + t*0.1) * 0.3;
      const f = (i + noise*100) / tot;
      if(f < 0.3) return `hsl(${220 + d*15 + noise*20}, ${60 + d*25}%, ${40 + d*35}%)`; // Ocean
      if(f < 0.45) return `hsl(${120 + d*20 + noise*15}, ${45 + d*20}%, ${35 + d*25}%)`; // Land
      if(f < 0.55) return `hsl(${30 + d*25 + noise*10}, ${40 + d*15}%, ${45 + d*20}%)`; // Desert
      if(f < 0.7) return `hsl(${100 + d*30 + noise*20}, ${50 + d*25}%, ${30 + d*30}%)`; // Forest
      return `hsl(${0}, 0%, ${85 + d*15}%)`; // Ice/Clouds
    }},
  { name:'Mars',    sub:'The Red Planet',     col:[205,92,52],   atmoCol:[139,69,19],   orbitR:255,  orbitSpeed:0.531,   pRadius:16, pCount:900,  rings:false, hasAtmo:true,
    type:'Terrestrial', dia:'6,779 km', dist:'1.52 AU', day:'24.6 hours', year:'687 Earth days', moons:'2', temp:'-153 to 20 °C',
    moonData: [
      { name:'Phobos', orbitR:1.9, size:3, speed:3.0,  col:[160,145,130], angle:0 },
      { name:'Deimos', orbitR:2.8, size:2, speed:1.26, col:[150,135,120], angle:2.1 }
    ],
    colorFn:(d,t,i,tot)=>{
      const dust = Math.sin(i*0.4 + t*0.5) * 0.2;
      const canyon = Math.sin(i*0.8) > 0.8 ? 0.4 : 0;
      const h = 15 + d*12 + dust*10 - canyon*8;
      const s = 65 + d*20 + dust*15 - canyon*20;
      const l = 35 + d*25 + dust*10 - canyon*20;
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Jupiter', sub:'The Giant',          col:[230,185,120], atmoCol:[210,140,60],  orbitR:360,  orbitSpeed:0.0843,  pRadius:35, pCount:3800, rings:true,  hasAtmo:true, ringInner:1.28, ringOuter:1.6, ringCol:'rgba(180,150,100,0.22)',
    type:'Gas Giant', dia:'139,820 km', dist:'5.20 AU', day:'9.9 hours', year:'11.9 Earth years', moons:'95', temp:'-110 °C cloud tops',
    moonData: [
      { name:'Io',       orbitR:2.1, size:8,  speed:2.8,  col:[255,220,80],  angle:0 },
      { name:'Europa',   orbitR:2.9, size:7,  speed:1.5,  col:[210,195,170], angle:1.6 },
      { name:'Ganymede', orbitR:3.8, size:9,  speed:0.8,  col:[170,160,145], angle:3.2 },
      { name:'Callisto', orbitR:4.8, size:8,  speed:0.35, col:[130,120,105], angle:5.0 },
      { name:'+91 more', orbitR:5.8, size:3,  speed:0.14, col:[150,145,135], angle:1.0 }
    ],
    colorFn:(d,t,i,tot)=>{
      // Latitude-based bands — particles sorted by gy (y on sphere = latitude)
      const lat = i / tot; // 0=south pole, 1=north pole proxy
      const bandPhase = lat * 22 + t * 0.18; // slow eastward drift
      const band = Math.floor(bandPhase) % 22;
      const bandEdge = Math.sin(bandPhase * Math.PI) * 0.5 + 0.5; // 0-1 within band
      // Turbulence at band edges
      const turb = Math.sin(i * 0.7 + t * 1.8) * 0.3 * (1 - Math.abs(bandEdge - 0.5) * 2);
      // Great Red Spot: oval region
      const grsLat = 0.38 + Math.sin(t*0.05)*0.01;
      const grsLon = (t * 0.08) % 1.0;
      const dLat = Math.abs(lat - grsLat);
      const dLon = Math.abs((i/tot*3 % 1.0) - grsLon);
      const inGRS = dLat < 0.09 && dLon < 0.12;
      // Oval storm cells (white ovals)
      const oval = Math.sin(i*0.9 + t*0.6) > 0.91 && lat > 0.2 && lat < 0.8;
      let h, s, l;
      if(inGRS) {
        const swirl = Math.sin(dLat*30 + dLon*25 + t*2.5) * 0.5;
        h = 8 + swirl*12; s = 90; l = 38 + d*20 + swirl*8;
      } else if(oval) {
        h = 40 + turb*15; s = 30; l = 82 + d*12;
      } else if(band % 3 === 0) { // Dark belts
        h = 22 + turb*18; s = 72 + d*20; l = 38 + d*28 + turb*8;
      } else if(band % 3 === 1) { // Bright zones
        h = 38 + turb*12; s = 55 + d*22; l = 65 + d*22 + turb*6;
      } else { // Transition
        h = 30 + turb*20; s = 62 + d*28; l = 50 + d*26 + turb*10;
      }
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Saturn',  sub:'The Ringed Wonder',  col:[250,232,178], atmoCol:[190,170,110], orbitR:475,  orbitSpeed:0.0339,  pRadius:30, pCount:3000, rings:true,  hasAtmo:true, ringInner:1.3, ringOuter:2.3, ringCol:'rgba(210,190,140,0.38)',
    type:'Gas Giant', dia:'116,460 km', dist:'9.58 AU', day:'10.7 hours', year:'29.5 Earth years', moons:'146', temp:'-178 °C avg',
    moonData: [
      { name:'Titan',    orbitR:3.0, size:9,  speed:0.7,  col:[220,180,85],  angle:0 },
      { name:'Rhea',     orbitR:3.8, size:6,  speed:0.42, col:[205,200,190], angle:2.2 },
      { name:'Iapetus',  orbitR:4.8, size:6,  speed:0.22, col:[158,138,108], angle:4.0 },
      { name:'Dione',    orbitR:2.6, size:5,  speed:0.85, col:[205,203,197], angle:1.1 },
      { name:'Tethys',   orbitR:2.3, size:5,  speed:1.05, col:[215,215,210], angle:3.5 },
      { name:'+141 more',orbitR:5.8, size:3,  speed:0.11, col:[148,145,140], angle:2.0 }
    ],
    colorFn:(d,t,i,tot)=>{
      const lat = i / tot;
      const bandPhase = lat * 16 + t * 0.12; // Saturn's slower rotation bands
      const band = Math.floor(bandPhase) % 16;
      const inBand = Math.sin(bandPhase * Math.PI);
      const wave = Math.sin(i * 0.5 + t * 1.2) * 0.25;
      const hexStorm = lat > 0.78 && lat < 0.88; // north polar hexagon hint
      let h, s, l;
      if(hexStorm) {
        h = 200 + wave*20; s = 35 + d*20; l = 45 + d*25 + wave*10;
      } else if(band % 4 === 0) { // Bright equatorial zone
        h = 42 + wave*10; s = 65 + d*25; l = 72 + d*18 + wave*8;
      } else if(band % 4 === 1) { // Mid brown belt
        h = 30 + wave*12; s = 55 + d*28; l = 52 + d*24 + wave*6;
      } else if(band % 4 === 2) { // Caramel zone
        h = 48 + wave*8;  s = 60 + d*22; l = 68 + d*20 + wave*5;
      } else { // Pale cream zone
        h = 50 + wave*15; s = 40 + d*18; l = 78 + d*14 + wave*8;
      }
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Uranus',  sub:'The Ice Giant',      col:[79,208,231],  atmoCol:[60,210,235], orbitR:575,  orbitSpeed:0.0119,  pRadius:24, pCount:2200, rings:true,  hasAtmo:true, ringInner:1.4, ringOuter:1.75, ringCol:'rgba(100,200,220,0.2)',
    type:'Ice Giant', dia:'50,724 km', dist:'19.2 AU', day:'17.2 hours', year:'84 Earth years', moons:'28', temp:'-224 °C avg',
    moonData: [
      { name:'Titania',  orbitR:2.9, size:6,  speed:0.55, col:[190,185,178], angle:0 },
      { name:'Oberon',   orbitR:3.5, size:6,  speed:0.35, col:[178,168,162], angle:2.5 },
      { name:'Umbriel',  orbitR:2.3, size:5,  speed:0.85, col:[115,108,100], angle:1.2 },
      { name:'Ariel',    orbitR:2.0, size:5,  speed:1.1,  col:[200,195,188], angle:4.2 },
      { name:'+24 more', orbitR:4.4, size:3,  speed:0.18, col:[150,148,145], angle:3.0 }
    ],
    colorFn:(d,t,i,tot)=>{
      const lat = i / tot;
      // Uranus has subtle banding + a strong methane blue-green hue
      const pole = Math.min(lat, 1-lat) * 2; // 0=pole, 1=equator
      const methane = Math.sin(i * 0.18 + t * 0.55) * 0.28;
      const bandWave = Math.sin(lat * 14 * Math.PI + t * 0.25) * 0.18;
      const deepGlow = d > 0.7; // front-facing particles glow brightest
      // Uranus: axial tilt means poles face us — brighter polar cap
      const polarCap = lat < 0.15 || lat > 0.85;
      let h, s, l;
      if(polarCap) {
        h = 195 + methane*12; s = 55 + d*20; l = 72 + d*18 + methane*10;
      } else if(deepGlow) {
        h = 186 + methane*16 + bandWave*12; s = 82 + methane*15; l = 58 + d*28 + methane*12;
      } else {
        h = 190 + methane*18 + bandWave*10; s = 78 + d*18 + methane*12; l = 44 + d*32 + methane*14 + bandWave*8;
      }
      return `hsl(${h},${s}%,${l}%)`;
    }},
  { name:'Neptune', sub:'The Windiest',       col:[72,142,203],  atmoCol:[80,100,255],  orbitR:660,  orbitSpeed:0.00607, pRadius:22, pCount:1300, rings:true,  hasAtmo:true, ringInner:1.35, ringOuter:1.65, ringCol:'rgba(80,100,255,0.18)',
    type:'Ice Giant', dia:'49,244 km', dist:'30.1 AU', day:'16.1 hours', year:'165 Earth years', moons:'16', temp:'-218 °C avg',
    moonData: [
      { name:'Triton',   orbitR:2.5, size:8,  speed:0.65, col:[210,218,228], angle:0 },
      { name:'Proteus',  orbitR:1.9, size:5,  speed:1.4,  col:[130,130,140], angle:2.0 },
      { name:'Nereid',   orbitR:3.9, size:4,  speed:0.22, col:[158,158,168], angle:4.5 },
      { name:'+13 more', orbitR:4.9, size:3,  speed:0.10, col:[148,148,158], angle:1.5 }
    ],
    colorFn:(d,t,i,tot)=>{
      const storm = Math.sin(t*4 + i*0.4 + d*6) * 0.3;
      const darkSpot = (i/tot > 0.3 && i/tot < 0.5 && Math.sin(i*0.15) > 0.8) ? 0.4 : 0;
      const h = 215 + storm*20 + d*15 - darkSpot*30;
      const s = 70 + storm*25 + d*20 - darkSpot*40;
      const l = 45 + d*25 + storm*15 - darkSpot*25;
      return `hsl(${h},${s}%,${l}%)`;
    }},
];

// ─── state ─────────────────────────────────────────────────────────────────
let mode = 'system';        // 'system' | 'planet'
let focusedIdx = -1;        // which planet is focused
let systemZoom = 0.55;      // zoom of orrery view (1 = natural)
let targetSystemZoom = 0.55;
let systemRotY = 0;         // tilt of whole system
let systemRotX = -0.22;
let manualRotX = 0, manualRotY = 0;

// Planet angles in orbit
const orbitAngles = PLANETS.map((_,i)=>Math.random()*Math.PI*2);

// Per-planet particle data
const planetParticles = PLANETS.map(()=>null);
let activePCount = 0;

// Explore-mode (zoomed into planet)
let exploreRotX = 0.2, exploreRotY = 0;
let exploreScale = 1.0, targetExploreScale = 1.0;
let exploreScatter = 0, targetExploreScatter = 0;

let time = 0;

// Enhanced Star Field with Milky Way
const STARS = [];
const MILKY_WAY_STARS = [];
const NEBULA_CLOUDS = [];

// Generate main star field (bright stars)
for(let i = 0; i < 1200; i++) {
  STARS.push({
    x: Math.random() * 6000 - 3000,
    y: Math.random() * 5000 - 2500,
    r: Math.random() * 1.8 + 0.3,
    a: 0.4 + Math.random() * 0.6,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.5 + Math.random() * 2,
    color: Math.random() < 0.1 ? `hsl(${200 + Math.random() * 60}, 70%, 85%)` : 'white'
  });
}

// Generate Milky Way band (dense star field)
for(let i = 0; i < 3000; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 800 + 200;
  const bandWidth = 150 + Math.random() * 100;
  const bandOffset = (Math.random() - 0.5) * bandWidth;
  
  MILKY_WAY_STARS.push({
    x: Math.cos(angle) * distance + bandOffset * Math.sin(angle),
    y: Math.sin(angle) * distance * 0.3 + bandOffset * Math.cos(angle) * 0.3,
    r: Math.random() * 0.8 + 0.2,
    a: 0.1 + Math.random() * 0.4,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.3 + Math.random() * 1.5
  });
}

// Generate nebula clouds for depth
for(let i = 0; i < 8; i++) {
  NEBULA_CLOUDS.push({
    x: Math.random() * 4000 - 2000,
    y: Math.random() * 3000 - 1500,
    size: 200 + Math.random() * 400,
    color: `hsl(${240 + Math.random() * 60}, 60%, 15%)`,
    alpha: 0.05 + Math.random() * 0.1,
    drift: Math.random() * 0.2 - 0.1
  });
}

// Moon angle state (live-updated each frame)
const moonAngles = PLANETS.map(pd => (pd.moonData||[]).map(m => m.angle));


