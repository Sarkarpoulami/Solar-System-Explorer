// ─── hand tracking ──────────────────────────────────────────────────────────
let gestH=[], prevDist=null, prevMid=null, prevAngle=null;
let isRightOpen=false, isLeftOpen=false;
let rightPointing=false;
let bothFistsTimer=null;  // timestamp when both fists were first detected in planet mode
const cursorEl=document.getElementById('cursor');
const gestEl=document.getElementById('gesture-hud');
const statusEl=document.getElementById('status');
const spotlightEl=document.getElementById('spotlight');
// Smoothed spotlight position
let slX=window.innerWidth/2, slY=window.innerHeight/2;
const SL_SMOOTH=0.18;

// Right index fingertip position on screen
let rightTip={x:-1,y:-1};
// Track the last planet the right index finger pointed at
let lastAimedIdx=-1;

// Open score: how many fingers are extended (0-5)
function openScore(lm){
  const pa=lm[0]; const tips=[8,12,16,20],mcps=[5,9,13,17]; let o=0;
  for(let i=0;i<4;i++){const t=lm[tips[i]],m=lm[mcps[i]]; if(Math.hypot(t.x-pa.x,t.y-pa.y,t.z-pa.z)>Math.hypot(m.x-pa.x,m.y-pa.y,m.z-pa.z)*1.5)o++;}
  const th=lm[4],tb=lm[2]; if(Math.hypot(th.x-pa.x,th.y-pa.y,th.z-pa.z)>Math.hypot(tb.x-pa.x,tb.y-pa.y,tb.z-pa.z)*1.25)o++;
  return o;
}

// Pointing: index finger extended, middle+ring+pinky curled
function isPointing(lm){
  const pa=lm[0];
  const indexTip=lm[8], indexMcp=lm[5];
  const midTip=lm[12], midMcp=lm[9];
  const ringTip=lm[16], ringMcp=lm[13];
  const indexD=Math.hypot(indexTip.x-pa.x,indexTip.y-pa.y,indexTip.z-pa.z);
  const indexBaseD=Math.hypot(indexMcp.x-pa.x,indexMcp.y-pa.y,indexMcp.z-pa.z);
  const midD=Math.hypot(midTip.x-pa.x,midTip.y-pa.y,midTip.z-pa.z);
  const midBaseD=Math.hypot(midMcp.x-pa.x,midMcp.y-pa.y,midMcp.z-pa.z);
  const ringD=Math.hypot(ringTip.x-pa.x,ringTip.y-pa.y,ringTip.z-pa.z);
  const ringBaseD=Math.hypot(ringMcp.x-pa.x,ringMcp.y-pa.y,ringMcp.z-pa.z);
  // Index must be extended, middle and ring must be curled
  return indexD > indexBaseD*1.55 && midD < midBaseD*1.45 && ringD < ringBaseD*1.45;
}

// Fully open palm (4+ fingers extended)
function isFullyOpen(lm){ return openScore(lm)>=4; }

function palmXY(lm){ return {x:(1-lm[0].x)*W, y:lm[0].y*H}; }

// Compute planet screen position for hit testing
function getPlanetScrPos(i){
  const pd=PLANETS[i];
  const zoom=systemZoom;
  const rx=systemRotX+manualRotX, ry=systemRotY+manualRotY;
  const cosRX=Math.cos(rx),sinRX=Math.sin(rx);
  const px3=Math.cos(orbitAngles[i])*pd.orbitR;
  const pz3=Math.sin(orbitAngles[i])*pd.orbitR;
  const px2=px3*Math.cos(ry)-pz3*Math.sin(ry);
  const py2=px3*Math.sin(ry)*sinRX+pz3*Math.cos(ry)*sinRX;
  return {x:CX+px2*zoom, y:CY-py2*zoom, r:Math.max(38,pd.pRadius*zoom*2.2+22)};
}

function hitPlanet(sx,sy) {
  let best=-1, bestD=Infinity;
  PLANETS.forEach((pd,i)=>{
    const sp=getPlanetScrPos(i);
    const d=Math.hypot(sx-sp.x,sy-sp.y);
    if(d<sp.r && d<bestD){ bestD=d; best=i; }
  });
  return best;
}

// Enhanced selection ring with multiple layers
function drawSelectionRing(idx){
  const sp=getPlanetScrPos(idx);
  const t=Date.now()*0.003;
  const pulse=0.7+Math.sin(t*3)*0.3;
  const pulse2=0.8+Math.sin(t*4.5)*0.2;
  
  const pr=sp.r+8;
  
  // Outer ethereal glow
  const outerGrd=ctx.createRadialGradient(sp.x,sp.y,pr*0.5,sp.x,sp.y,pr*3);
  outerGrd.addColorStop(0,`rgba(120,220,255,${0.1*pulse})`);
  outerGrd.addColorStop(0.3,`rgba(80,180,255,${0.08*pulse})`);
  outerGrd.addColorStop(0.7,`rgba(40,140,255,${0.04*pulse})`);
  outerGrd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(sp.x,sp.y,pr*3,0,Math.PI*2);
  ctx.fillStyle=outerGrd; ctx.fill();
  
  // Middle glow ring
  const midGrd=ctx.createRadialGradient(sp.x,sp.y,pr*0.6,sp.x,sp.y,pr*2);
  midGrd.addColorStop(0,`rgba(120,220,255,${0.15*pulse2})`);
  midGrd.addColorStop(0.5,`rgba(120,220,255,${0.1*pulse2})`);
  midGrd.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(sp.x,sp.y,pr*2,0,Math.PI*2);
  ctx.fillStyle=midGrd; ctx.fill();
  
  // Animated rotating particles around the ring
  for(let i = 0; i < 8; i++) {
    const angle = (t * 2 + i * Math.PI / 4) % (Math.PI * 2);
    const particleX = sp.x + Math.cos(angle) * (pr + 4);
    const particleY = sp.y + Math.sin(angle) * (pr + 4);
    const particleAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i);
    
    ctx.beginPath();
    ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,220,255,${particleAlpha})`;
    ctx.fill();
  }
  
  // Main crisp ring with gradient
  ctx.beginPath(); 
  ctx.arc(sp.x,sp.y,pr,0,Math.PI*2);
  const ringGrad = ctx.createLinearGradient(sp.x-pr, sp.y-pr, sp.x+pr, sp.y+pr);
  ringGrad.addColorStop(0, `rgba(120,220,255,${0.9*pulse})`);
  ringGrad.addColorStop(0.5, `rgba(180,240,255,${1.0*pulse})`);
  ringGrad.addColorStop(1, `rgba(120,220,255,${0.9*pulse})`);
  ctx.strokeStyle=ringGrad;
  ctx.lineWidth=2; 
  ctx.stroke();
  
  // Inner highlight ring
  ctx.beginPath(); 
  ctx.arc(sp.x,sp.y,pr-3,0,Math.PI*2);
  ctx.strokeStyle=`rgba(255,255,255,${0.4*pulse})`;
  ctx.lineWidth=1; 
  ctx.stroke();
  
  // Enhanced planet name with glow effect
  ctx.font='bold 12px Courier New';
  ctx.textAlign='center';
  
  // Text shadow/glow
  ctx.fillStyle=`rgba(120,220,255,${0.6*pulse})`;
  for(let dx = -1; dx <= 1; dx++) {
    for(let dy = -1; dy <= 1; dy++) {
      if(dx !== 0 || dy !== 0) {
        ctx.fillText(PLANETS[idx].name.toUpperCase(), sp.x + dx, sp.y - pr - 8 + dy);
      }
    }
  }
  
  // Main text
  ctx.fillStyle=`rgba(255,255,255,${0.95*pulse})`;
  ctx.fillText(PLANETS[idx].name.toUpperCase(), sp.x, sp.y-pr-8);
  
  // Subtitle with enhanced styling
  ctx.font='9px Courier New';
  ctx.fillStyle=`rgba(180,240,255,0.7)`;
  ctx.fillText('open hand to explore', sp.x, sp.y-pr-22);

  // ── Show moons orbiting the selected planet ──
  const pd = PLANETS[idx];
  if (pd.moonData && pd.moonData.length > 0) {
    const zoom = systemZoom;
    const rx = systemRotX + manualRotX;
    const tiltFactor = Math.abs(Math.cos(rx)) * 0.55 + 0.15;
    const visualPr = Math.max(3, pd.pRadius * zoom * (0.7 + 0.5));

    pd.moonData.forEach((moon, mi) => {
      if (moon.name.includes('more')) return;
      const mAngle = moonAngles[idx][mi] || moon.angle;
      const orbitScale = visualPr * moon.orbitR * 1.1;
      const mx = sp.x + Math.cos(mAngle) * orbitScale;
      const my = sp.y + Math.sin(mAngle) * orbitScale * tiltFactor;
      const mSize = Math.max(1.5, moon.size * zoom * 0.65);
      const [mr, mg, mb] = moon.col;

      // Orbit ring — highlighted blue tint
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, orbitScale, orbitScale * tiltFactor, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120,200,255,${0.18 * pulse})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Moon glow — larger and brighter than system view
      const mgrd = ctx.createRadialGradient(mx, my, 0, mx, my, mSize * 4);
      mgrd.addColorStop(0, `rgba(${mr},${mg},${mb},0.5)`);
      mgrd.addColorStop(0.5, `rgba(${mr},${mg},${mb},0.2)`);
      mgrd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(mx, my, mSize * 4, 0, Math.PI * 2);
      ctx.fillStyle = mgrd; ctx.fill();

      // Moon body
      ctx.beginPath(); ctx.arc(mx, my, mSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${mr},${mg},${mb},1)`;
      ctx.fill();

      // Moon name label
      ctx.font = '8px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(180,230,255,${0.85 * pulse})`;
      ctx.fillText(moon.name.toUpperCase(), mx, my - mSize - 5);
    });
  }
}

function onResults(results) {
  const lms=results.multiHandLandmarks;
  const hands=results.multiHandedness;

  if(!lms||!lms.length){
    statusEl.style.opacity='1';
    statusEl.innerHTML='✋ Show your hands<br><span style="font-size:10px;color:rgba(255,255,255,0.28)">Right index → aim at planet · Open hand → zoom in</span>';
    gestH=[]; prevDist=null; prevMid=null; prevAngle=null;
    cursorEl.classList.remove('active','pointing');
    spotlightEl.classList.remove('visible','pointing-mode');
    highlightIdx=-1; rightPointing=false; lastAimedIdx=-1;
    return;
  }
  statusEl.style.opacity='0';

  // ── Spotlight: track palm of first available hand ──────────────────────────
  {
    const trackLm = lms[0]; // always track first detected hand
    if(trackLm){
      // Use wrist (0) and middle MCP (9) to find palm center
      const wx=(1-trackLm[0].x)*W, wy=trackLm[0].y*H;
      const mx=(1-trackLm[9].x)*W, my=trackLm[9].y*H;
      const rawX=(wx+mx)/2, rawY=(wy+my)/2;
      // Low-pass smooth
      slX += (rawX-slX)*SL_SMOOTH;
      slY += (rawY-slY)*SL_SMOOTH;
      spotlightEl.style.left=slX+'px';
      spotlightEl.style.top=slY+'px';
      spotlightEl.classList.add('visible');
    }
  }

  // Block input during cinematic transitions
  if(mode==='exiting') return;
  let rightLm=null, leftLm=null;
  if(hands){
    hands.forEach((h,i)=>{
      if(h.label==='Left') rightLm=lms[i];
      else leftLm=lms[i];
    });
  }
  if(!rightLm && lms.length>=1) rightLm=lms[0];
  if(!leftLm && lms.length>=2) leftLm=lms[1];

  const rOpen=rightLm?openScore(rightLm):0;
  const lOpen=leftLm?openScore(leftLm):0;
  isRightOpen=rOpen>=2.5;
  isLeftOpen=lOpen>=2.5;
  const rFullyOpen=rightLm?isFullyOpen(rightLm):false;

  rightPointing=rightLm?isPointing(rightLm):false;
  if(rightLm){
    rightTip.x=(1-rightLm[8].x)*W;
    rightTip.y=rightLm[8].y*H;
  }

  // ── SYSTEM MODE ──
  if(mode==='system'){

    if(rightPointing){
      // Show cursor at index fingertip
      cursorEl.style.left=rightTip.x+'px';
      cursorEl.style.top=rightTip.y+'px';
      cursorEl.classList.add('active','pointing');
      // Move spotlight to fingertip and intensify
      slX += (rightTip.x - slX)*0.35;
      slY += (rightTip.y - slY)*0.35;
      spotlightEl.style.left=slX+'px';
      spotlightEl.style.top=slY+'px';
      spotlightEl.classList.add('pointing-mode');

      const hit=hitPlanet(rightTip.x,rightTip.y);
      highlightIdx=hit;

      if(hit>=0){
        lastAimedIdx=hit; // remember which planet we last aimed at
        gestEl.textContent='👆 '+PLANETS[hit].name+' selected — open hand to explore';
      } else {
        gestEl.textContent='👆 aim at a planet';
      }

    } else if(rFullyOpen && lastAimedIdx>=0){
      // Right hand was pointing at a planet, now opened → ENTER that planet
      cursorEl.classList.remove('active','pointing');
      enterPlanet(lastAimedIdx);
      gestEl.textContent='🌍 zooming into '+PLANETS[lastAimedIdx].name+'...';
      lastAimedIdx=-1; highlightIdx=-1;
      prevDist=null; prevMid=null; prevAngle=null;
      return;

    } else if(isRightOpen && lastAimedIdx>=0){
      // Partial open also triggers (>= 2.5 score)
      cursorEl.classList.remove('active','pointing');
      enterPlanet(lastAimedIdx);
      gestEl.textContent='🌍 zooming into '+PLANETS[lastAimedIdx].name+'...';
      lastAimedIdx=-1; highlightIdx=-1;
      prevDist=null; prevMid=null; prevAngle=null;
      return;

    } else {
      cursorEl.classList.remove('active','pointing');
      spotlightEl.classList.remove('pointing-mode');
      if(!rightPointing) highlightIdx=-1;
      // Reset aimed planet only when both hands are clearly closed/neutral
      if(!rightPointing && !isRightOpen) lastAimedIdx=-1;
    }

    // Two hands: zoom + rotate system
    if(lms.length>=2 && rightLm && leftLm && !rightPointing){
      const p0=palmXY(rightLm), p1=palmXY(leftLm);
      const dx=p1.x-p0.x, dy=p1.y-p0.y;
      const dist=Math.hypot(dx,dy);
      const mid={x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2};
      const angle=Math.atan2(dy,dx);
      if(prevDist!==null){
        const dd=dist-prevDist;
        targetSystemZoom=Math.max(0.18,Math.min(2.8,targetSystemZoom+dd/W*2.8));
        gestEl.textContent='↔ system zoom ×'+targetSystemZoom.toFixed(2);
      }
      if(prevMid!==null){ systemRotY+=(mid.x-prevMid.x)/W*Math.PI*2; systemRotX+=(mid.y-prevMid.y)/H*Math.PI*1.4; }
      if(prevAngle!==null){ let da=angle-prevAngle; if(da>Math.PI)da-=Math.PI*2; if(da<-Math.PI)da+=Math.PI*2; systemRotX+=da*0.3; }
      prevDist=dist; prevMid=mid; prevAngle=angle;
    } else if(lms.length===1 && !rightPointing && !isRightOpen){
      // Single closed hand drag → rotate system
      const p=palmXY(lms[0]);
      if(prevMid){ systemRotY+=(p.x-prevMid.x)/W*Math.PI*2; systemRotX+=(p.y-prevMid.y)/H*Math.PI*1.4; }
      prevMid=p; prevDist=null; prevAngle=null;
      gestEl.textContent='✊ rotating system';
    } else if(!rightPointing){
      prevDist=null; prevMid=null; prevAngle=null;
    }
  }

  // ── PLANET MODE ──
  else if(mode==='planet'){
    const bothFistsClosed = lms.length>=2 && rightLm && leftLm && !isRightOpen && !isLeftOpen;
    const oneFistClosed   = lms.length===1 && rightLm && !isRightOpen;

    // ✊✊ BOTH FISTS CLOSED → zoom out to solar system
    if(bothFistsClosed){
      if(!bothFistsTimer){ bothFistsTimer=Date.now(); }
      const held=(Date.now()-bothFistsTimer)/1000;
      // Show countdown hint after 0.1s so it feels instant but not accidental
      if(held>0.12){
        gestEl.textContent='✊✊ releasing to solar system...';
        exitPlanet();
        bothFistsTimer=null;
        prevDist=null; prevMid=null; prevAngle=null;
        return;
      }
    } else {
      bothFistsTimer=null;
    }

    // Right hand open → scatter particles
    if(!bothFistsClosed && isRightOpen){
      const ratio=Math.max(0,Math.min(1,(rOpen-2.5)/2.5));
      targetExploreScatter=0.1+ratio*0.9;
      if(targetExploreScatter>0.28){
        planetParticles[focusedIdx].forEach(p=>{ const r=1+Math.random()*2.5,sp=Math.random()*Math.PI,st=Math.random()*Math.PI*2; p.sx=Math.sin(sp)*Math.cos(st)*r; p.sy=Math.cos(sp)*r; p.sz=Math.sin(sp)*Math.sin(st)*r; p.delay=Math.random(); });
      }
      gestEl.textContent='✋ scattered '+Math.round(targetExploreScatter*100)+'%';
      prevDist=null; prevMid=null; prevAngle=null;
    }
    // Two hands spread/pinch → zoom explore scale
    else if(lms.length>=2 && rightLm && leftLm && !isRightOpen){
      const p0=palmXY(rightLm), p1=palmXY(leftLm);
      const dist=Math.hypot(p0.x-p1.x,p0.y-p1.y);
      const mid={x:(p0.x+p1.x)/2,y:(p0.y+p1.y)/2};
      const angle=Math.atan2(p1.y-p0.y,p1.x-p0.x);
      if(prevDist!==null){
        const dd=dist-prevDist;
        targetExploreScale=Math.max(0.3,Math.min(4.0,targetExploreScale+dd/W*4));
        gestEl.textContent='↔ zoom ×'+targetExploreScale.toFixed(2);
      }
      if(prevMid){ exploreRotY+=(mid.x-prevMid.x)/W*Math.PI*2.5; exploreRotX+=(mid.y-prevMid.y)/H*Math.PI*2; }
      if(prevAngle!==null){ let da=angle-prevAngle; if(da>Math.PI)da-=Math.PI*2; if(da<-Math.PI)da+=Math.PI*2; exploreRotX+=da*0.4; }
      prevDist=dist; prevMid=mid; prevAngle=angle;
    }
    // Single right fist drag → rotate planet
    else if(oneFistClosed){
      targetExploreScatter=0;
      const p=palmXY(rightLm);
      if(prevMid){ exploreRotY+=(p.x-prevMid.x)/W*Math.PI*2.5; exploreRotX+=(p.y-prevMid.y)/H*Math.PI*2; }
      prevMid=p; prevDist=null; prevAngle=null;
      gestEl.textContent='✊ rotating '+PLANETS[focusedIdx].name;
    } else {
      prevDist=null; prevMid=null; prevAngle=null;
    }
  }
}

async function initHands(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:640,height:480}});
    document.getElementById('video').srcObject=stream;
    await document.getElementById('video').play();
    const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
    hands.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:0.65,minTrackingConfidence:0.5});
    hands.onResults(onResults);
    const camera=new Camera(document.getElementById('video'),{onFrame:async()=>{await hands.send({image:document.getElementById('video')});},width:640,height:480});
    camera.start();
    statusEl.innerHTML='✋ Show your hands<br><span style="font-size:10px;color:rgba(255,255,255,0.28)">Spread two hands to zoom in · Right hand to select</span>';
  }catch(e){
    statusEl.innerHTML='⚠ Camera denied<br><span style="font-size:10px;color:rgba(255,255,255,0.28)">'+e.message+'</span>';
  }
}
initHands();

// ═══════════════════════════════════════════════════════════════════════════
