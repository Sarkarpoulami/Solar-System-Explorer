function buildPlanetParticles(idx) {
  const pd = PLANETS[idx];
  const count = pd.pCount;
  const arr = [];
  // Per-planet surface flow speeds (Jupiter fastest, Uranus moderate)
  const flowSpeeds = {
    'Jupiter': 0.0055, 'Saturn': 0.004, 'Uranus': 0.003,
    'Neptune': 0.005,  'Sun': 0.002,    'Mars': 0.0008,
    'Earth': 0.001,    'Venus': 0.0006, 'Mercury': 0
  };
  const flow = flowSpeeds[pd.name] || 0;

  for (let i=0;i<count;i++) {
    const phi = Math.acos(1-2*(i+0.5)/count);
    const theta = Math.PI*(1+Math.sqrt(5))*i;
    const gx=Math.sin(phi)*Math.cos(theta), gy=Math.cos(phi), gz=Math.sin(phi)*Math.sin(theta);
    const depth=(gz+1)/2;
    // Velocity: tangential to sphere surface, latitude-band direction (east-west)
    // For gas giants: equatorial bands flow faster (differential rotation)
    const latSpeed = flow * (1 + Math.abs(gy) * 0.5); // equator slightly faster
    // Eastward unit vector at this point: perpendicular to radius in XZ plane
    const vx = -Math.sin(theta) * latSpeed * (1 + Math.sin(phi*4)*0.3);
    const vy = 0;
    const vz =  Math.cos(theta) * latSpeed * (1 + Math.sin(phi*4)*0.3);
    arr.push({ gx,gy,gz, x:gx,y:gy,z:gz,
      sx:(Math.random()-0.5)*3.5, sy:(Math.random()-0.5)*3.5, sz:(Math.random()-0.5)*3.5,
      size:0.8+Math.random()*1.4, delay:Math.random(),
      vx, vy, vz, // surface flow velocity
      color: pd.colorFn(depth, time, i, count) });
  }
  planetParticles[idx] = arr;

  // rings
  if (pd.rings) {
    const ri=pd.ringInner||1.3, ro=pd.ringOuter||1.8;
    const rc = pd.name==='Saturn'?3600 : pd.name==='Jupiter'?1200 : 900;
    const rings=[];
    for (let i=0;i<rc;i++) {
      const angle=Math.random()*Math.PI*2, r=ri+Math.random()*(ro-ri);
      rings.push({ angle, r, spread:(Math.random()-0.5)*0.05, size:0.5+Math.random()*0.8, alpha:0.18+Math.random()*0.65 });
    }
    planetParticles[idx]._rings = rings;
  }
}

// Preload all planet particles lazily
PLANETS.forEach((_,i)=>buildPlanetParticles(i));

function refreshParticleColors(idx) {
  const pd=PLANETS[idx]; const arr=planetParticles[idx]; if(!arr) return;
  const count=arr.length;
  for(let i=0;i<count;i++){
    const p=arr[i]; const depth=(p.gz+1)/2;
    p.color=pd.colorFn(depth,time,i,count);
  }
}

// ─── RENDER: orrery system view ─────────────────────────────────────────────
function drawSystem(highlightIdx) {
  const zoom = systemZoom;
  const rx = systemRotX + manualRotX;
  const ry = systemRotY + manualRotY;

  // tilt transforms: flatten the orbital plane
  ctx.save();
  ctx.translate(CX, CY);

  // Draw orbits
  PLANETS.forEach((pd,i)=>{
    if (pd.orbitR === 0) return;
    const r = pd.orbitR * zoom;
    const tiltY = Math.sin(rx) * r;
    const alpha = i===highlightIdx ? 0.2 : 0.06;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, Math.abs(Math.cos(rx))*r, ry, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = i===highlightIdx ? 1 : 0.5;
    ctx.stroke();
  });

  // Draw planets (sorted by depth)
  const items = PLANETS.map((pd,i)=>{
    const angle = orbitAngles[i]+ry;
    const r = pd.orbitR*zoom;
    const px3 = Math.cos(orbitAngles[i])*pd.orbitR;
    const pz3 = Math.sin(orbitAngles[i])*pd.orbitR;
    const cosRX=Math.cos(rx),sinRX=Math.sin(rx);
    const px2 = px3*Math.cos(ry)-pz3*Math.sin(ry);
    const py2 = px3*Math.sin(ry)*sinRX+0*cosRX+pz3*Math.cos(ry)*sinRX;
    const pz2 = px3*Math.sin(ry)*cosRX-0*sinRX+pz3*Math.cos(ry)*cosRX;
    const sx=px2*zoom, sy=-py2*zoom;
    const depth=(pz2+1000)/2000;
    return {pd,i,sx,sy,depth};
  });
  items.sort((a,b)=>a.depth-b.depth);

  items.forEach(({pd,i,sx,sy,depth})=>{
    const pr = Math.max(3, pd.pRadius*zoom*(0.7+depth*0.5));
    const isHL = i===highlightIdx;
    const [r,g,b]=pd.col;

    // Enhanced glow for highlighted planet and special Sun glow
    if (isHL || i === 0) { // Sun (index 0) always gets special treatment
      const glowIntensity = i === 0 ? 1.5 : 1.0; // Sun gets stronger glow
      const glowColor = i === 0 ? [255, 235, 120] : [r, g, b]; // Yellow for Sun
      
      // Outer ethereal glow
      const outerGrd = ctx.createRadialGradient(sx,sy,0,sx,sy,pr*8*glowIntensity);
      outerGrd.addColorStop(0,`rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${0.2*glowIntensity})`);
      outerGrd.addColorStop(0.3,`rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${0.12*glowIntensity})`);
      outerGrd.addColorStop(0.7,`rgba(120,220,255,${0.05*glowIntensity})`);
      outerGrd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(sx,sy,pr*8*glowIntensity,0,Math.PI*2);
      ctx.fillStyle=outerGrd; ctx.fill();
      
      // Inner bright glow
      const grd=ctx.createRadialGradient(sx,sy,0,sx,sy,pr*4*glowIntensity);
      grd.addColorStop(0,`rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${0.5*glowIntensity})`);
      grd.addColorStop(0.5,`rgba(${glowColor[0]},${glowColor[1]},${glowColor[2]},${0.3*glowIntensity})`);
      grd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(sx,sy,pr*4*glowIntensity,0,Math.PI*2);
      ctx.fillStyle=grd; ctx.fill();
      
      // Sun corona effect
      if (i === 0) {
        for(let corona = 0; corona < 12; corona++) {
          const coronaAngle = (corona / 12) * Math.PI * 2 + time * 0.5;
          const coronaLength = pr * (3 + Math.sin(time * 2 + corona) * 1.5);
          const coronaX = sx + Math.cos(coronaAngle) * coronaLength;
          const coronaY = sy + Math.sin(coronaAngle) * coronaLength;
          
          const coronaGrd = ctx.createRadialGradient(sx, sy, pr, coronaX, coronaY, pr * 0.5);
          coronaGrd.addColorStop(0, 'rgba(255, 235, 120, 0.3)');
          coronaGrd.addColorStop(1, 'rgba(255, 200, 80, 0)');
          
          ctx.beginPath();
          ctx.arc(coronaX, coronaY, pr * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = coronaGrd;
          ctx.fill();
        }
      }
    }

    // Realistic planet rendering with surface features
    const dotCount = Math.max(15, Math.floor(pr*pr*2.5));
    const lightAngle = time * 0.3; // Slower, more realistic rotation
    const planetRotation = time * (pd.orbitSpeed * 0.1); // Planet rotation
    
    // Create surface texture based on planet type
    for (let d=0;d<dotCount;d++) {
      const phi=Math.acos(1-2*(d+0.5)/dotCount);
      const theta=Math.PI*(1+Math.sqrt(5))*d + planetRotation;
      const dx=Math.sin(phi)*Math.cos(theta)*pr;
      const dy=Math.cos(phi)*pr;
      const dz=Math.sin(phi)*Math.sin(theta)*pr;
      const dep=(dz+pr)/(2*pr);
      
      // Realistic lighting with terminator
      const lightX = Math.cos(lightAngle);
      const lightY = Math.sin(lightAngle) * 0.3;
      const lightZ = 0.8;
      const normalX = dx/pr, normalY = dy/pr, normalZ = dz/pr;
      const dotProduct = lightX*normalX + lightY*normalY + lightZ*normalZ;
      const lighting = Math.max(0.05, dotProduct);
      
      // Atmospheric scattering for planets with atmosphere
      let atmosphereEffect = 1;
      if (pd.hasAtmo && dep > 0.7) {
        atmosphereEffect = 0.7 + 0.3 * Math.pow(dep, 2);
      }
      
      const baseAlpha = (0.2 + dep * 0.8) * atmosphereEffect;
      const alpha = baseAlpha * Math.pow(lighting, 0.7);
      const size = (0.8 + dep * 1.0) * (0.7 + lighting * 0.5);
      
      // Get realistic planet color - use base colors if colorFn fails
      let planetColor;
      try {
        planetColor = pd.colorFn(dep, time, d, dotCount);
      } catch(e) {
        // Fallback to base planet colors
        const [baseR, baseG, baseB] = pd.col;
        planetColor = `hsl(${Math.round(baseR/255*360)}, ${Math.round(baseG/255*100)}%, ${Math.round(baseB/255*100)}%)`;
      }
      
      // Parse HSL color and apply lighting
      const hslMatch = planetColor.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
      if (hslMatch) {
        let [, h, s, l] = hslMatch.map(Number);
        
        // Apply realistic lighting
        l = Math.max(5, l * (0.3 + lighting * 0.7));
        s = Math.max(10, s * (0.8 + lighting * 0.2));
        
        // Add subsurface scattering for gas giants
        if (pd.type.includes('Giant') && lighting < 0.3) {
          l += 10; // Subtle glow from internal heat
        }
        
        ctx.beginPath(); 
        ctx.arc(sx+dx, sy+dy, size, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
        ctx.fill();
        
        // Add specular highlights for planets with atmosphere or ice
        if ((pd.hasAtmo || pd.name === 'Uranus' || pd.name === 'Neptune') && lighting > 0.8 && dep > 0.6) {
          ctx.beginPath();
          ctx.arc(sx+dx, sy+dy, size * 0.4, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.4 * lighting})`;
          ctx.fill();
        }
        
        // Add surface detail for rocky planets
        if (pd.type === 'Terrestrial' && Math.random() < 0.1) {
          const detailSize = size * 0.3;
          ctx.beginPath();
          ctx.arc(sx+dx + (Math.random()-0.5)*size, sy+dy + (Math.random()-0.5)*size, detailSize, 0, Math.PI*2);
          ctx.fillStyle = `hsla(${h + (Math.random()-0.5)*20}, ${s}%, ${l * 0.7}%, ${alpha * 0.6})`;
          ctx.fill();
        }
      } else {
        // Fallback rendering with base colors
        const [baseR, baseG, baseB] = pd.col;
        const lightR = Math.min(255, baseR * (0.5 + lighting * 0.5));
        const lightG = Math.min(255, baseG * (0.5 + lighting * 0.5));
        const lightB = Math.min(255, baseB * (0.5 + lighting * 0.5));
        
        ctx.beginPath(); 
        ctx.arc(sx+dx, sy+dy, size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${lightR}, ${lightG}, ${lightB}, ${alpha})`;
        ctx.fill();
      }
    }
    
    // Add terminator line for enhanced realism
    if (pd.name !== 'Sun') {
      const terminatorGrad = ctx.createLinearGradient(sx - pr, sy, sx + pr, sy);
      terminatorGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
      terminatorGrad.addColorStop(0.3, 'rgba(0,0,0,0.2)');
      terminatorGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
      terminatorGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(lightAngle);
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI * 2);
      ctx.fillStyle = terminatorGrad;
      ctx.fill();
      ctx.restore();
    }

    // Enhanced realistic ring systems
    if (pd.rings && pd.ringInner) {
      ctx.save();
      ctx.translate(sx,sy);
      const ri=pd.ringInner*pr, ro=pd.ringOuter*pr;
      const ringTilt = rx + 0.3;
      
      // Multiple ring bands with gaps (like Saturn)
      const ringBands = pd.name === 'Saturn' ? 
        [{inner: ri, outer: ri + (ro-ri)*0.3, alpha: 0.8, color: 'rgba(210,190,140,'},
         {inner: ri + (ro-ri)*0.35, outer: ri + (ro-ri)*0.6, alpha: 0.6, color: 'rgba(180,160,120,'},
         {inner: ri + (ro-ri)*0.65, outer: ri + (ro-ri)*0.85, alpha: 0.7, color: 'rgba(200,180,130,'},
         {inner: ri + (ro-ri)*0.9, outer: ro, alpha: 0.5, color: 'rgba(170,150,110,'}] :
        [{inner: ri, outer: ro, alpha: 0.4, color: pd.ringCol.replace('rgba(', '').replace(')', '').split(',').slice(0,3).join(',') + ','}];
      
      ringBands.forEach(band => {
        for (let r = band.inner; r <= band.outer; r += 2) {
          const ringAlpha = band.alpha * (1 - Math.abs(Math.sin(ringTilt))) * 
                           (0.7 + 0.3 * Math.sin(r * 0.1 + time * 2)); // Ring particle variation
          
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * Math.abs(Math.sin(ringTilt)), ry, 0, Math.PI * 2);
          ctx.strokeStyle = band.color + ringAlpha + ')';
          ctx.lineWidth = 0.8 + Math.sin(r * 0.05) * 0.3;
          ctx.stroke();
        }
      });
      
      // Ring shadow on planet (for Saturn)
      if (pd.name === 'Saturn') {
        const shadowGrd = ctx.createLinearGradient(-pr, -pr*0.3, pr, pr*0.3);
        shadowGrd.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGrd.addColorStop(0.3, 'rgba(0,0,0,0.2)');
        shadowGrd.addColorStop(0.7, 'rgba(0,0,0,0.2)');
        shadowGrd.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        ctx.arc(0, 0, pr * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = shadowGrd;
        ctx.fill();
      }
      
      ctx.restore();
    }

    // Label
    if (zoom > 0.35 || isHL) {
      const la = isHL ? 0.9 : Math.max(0, (zoom-0.3)*3*0.5);
      ctx.fillStyle=`rgba(255,255,255,${la*0.7})`;
      ctx.font=`${isHL?11:9}px 'Courier New'`;
      ctx.textAlign='center';
      ctx.fillText(pd.name.toUpperCase(), sx, sy+pr*2.2+10);
    }

    // ── Draw moons orbiting this planet in system view ──
    if (pd.moonData && pd.moonData.length > 0 && pr > 4) {
      pd.moonData.forEach((moon, mi) => {
        if (moon.name.includes('more')) return; // skip "+91 more" labels
        // Advance moon angle
        moonAngles[i][mi] = (moonAngles[i][mi] || moon.angle) + moon.speed * 0.003;
        const mAngle = moonAngles[i][mi];
        // Scale orbit relative to planet screen size
        const orbitScale = pr * moon.orbitR * 1.1;
        // Flatten orbit slightly for perspective
        const tiltFactor = Math.abs(Math.cos(rx)) * 0.55 + 0.15;
        const mx = sx + Math.cos(mAngle) * orbitScale;
        const my = sy + Math.sin(mAngle) * orbitScale * tiltFactor;
        const mSize = Math.max(1.2, moon.size * zoom * 0.55);
        const [mr, mg, mb] = moon.col;
        // Orbit ring (faint)
        ctx.beginPath();
        ctx.ellipse(sx, sy, orbitScale, orbitScale * tiltFactor, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,0.07)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Moon glow
        const mgrd = ctx.createRadialGradient(mx, my, 0, mx, my, mSize * 3);
        mgrd.addColorStop(0, `rgba(${mr},${mg},${mb},0.35)`);
        mgrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(mx, my, mSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = mgrd; ctx.fill();
        // Moon dot
        ctx.beginPath(); ctx.arc(mx, my, mSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mr},${mg},${mb},0.9)`;
        ctx.fill();
        // Moon label (only when zoomed in or highlighted)
        if ((zoom > 0.7 || isHL) && mSize > 2) {
          ctx.font = '7px Courier New';
          ctx.fillStyle = `rgba(200,220,255,0.55)`;
          ctx.textAlign = 'center';
          ctx.fillText(moon.name.toUpperCase(), mx, my - mSize - 4);
        }
      });
    }
  });

  ctx.restore();
}

// ─── RENDER: planet explore view ────────────────────────────────────────────
const sortBuf=[];
function drawPlanetExplore(idx) {
  const pd=PLANETS[idx];
  const arr=planetParticles[idx]; if(!arr) return;
  const rx=exploreRotX, ry=exploreRotY;
  const scale=targetExploreScale;
  const rad = Math.max(pd.pRadius*6, 140) * scale;
  const [r,g,b]=pd.col;

  // Enhanced realistic atmosphere rendering
  if (pd.hasAtmo && exploreScatter<0.7) {
    const baseA = (pd.name === 'Jupiter' || pd.name === 'Uranus') ? 0.22 : 0.15;
    const a=(1-exploreScatter)*baseA;
    const [ar,ag,ab]=pd.atmoCol;
    
    // Multi-layered atmosphere for realism
    // Outer atmosphere (thin)
    const outerGrd=ctx.createRadialGradient(CX,CY,rad*0.9,CX,CY,rad*1.8);
    outerGrd.addColorStop(0,`rgba(${ar},${ag},${ab},${a*0.2})`);
    outerGrd.addColorStop(0.3,`rgba(${ar},${ag},${ab},${a*0.4})`);
    outerGrd.addColorStop(0.7,`rgba(${ar},${ag},${ab},${a*0.2})`);
    outerGrd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(CX,CY,rad*1.8,0,Math.PI*2); 
    ctx.fillStyle=outerGrd; ctx.fill();
    
    // Main atmosphere
    const mainGrd=ctx.createRadialGradient(CX,CY,rad*0.7,CX,CY,rad*1.4);
    mainGrd.addColorStop(0,`rgba(${ar},${ag},${ab},${a*0.3})`);
    mainGrd.addColorStop(0.5,`rgba(${ar},${ag},${ab},${a*0.6})`);
    mainGrd.addColorStop(0.8,`rgba(${ar},${ag},${ab},${a*0.3})`);
    mainGrd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(CX,CY,rad*1.4,0,Math.PI*2); 
    ctx.fillStyle=mainGrd; ctx.fill();
    
    // Atmospheric scattering effect (blue shift for Earth-like)
    if (pd.name === 'Earth') {
      const scatterGrd=ctx.createRadialGradient(CX,CY,rad*0.8,CX,CY,rad*1.3);
      scatterGrd.addColorStop(0,'rgba(135,206,250,0.1)');
      scatterGrd.addColorStop(0.6,'rgba(135,206,250,0.2)');
      scatterGrd.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(CX,CY,rad*1.3,0,Math.PI*2); 
      ctx.fillStyle=scatterGrd; ctx.fill();
    }
    
    // Atmospheric glow on the day side
    const lightAngle = time * 0.3;
    const glowX = CX + Math.cos(lightAngle) * rad * 0.3;
    const glowY = CY + Math.sin(lightAngle) * rad * 0.15;
    const glowGrd=ctx.createRadialGradient(glowX,glowY,0,glowX,glowY,rad*0.8);
    glowGrd.addColorStop(0,`rgba(255,255,200,${a*0.3})`);
    glowGrd.addColorStop(0.5,`rgba(${ar},${ag},${ab},${a*0.2})`);
    glowGrd.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(glowX,glowY,rad*0.8,0,Math.PI*2); 
    ctx.fillStyle=glowGrd; ctx.fill();
  }

  // Enhanced realistic rings in exploration mode
  const rings=arr._rings;
  if (rings) {
    const ri=pd.ringInner*rad, ro=pd.ringOuter*rad;
    const tilt=rx+0.4;
    
    // Sort ring particles by depth for proper rendering
    const sortedRings = rings.map(rp => {
      const px = Math.cos(rp.angle+ry) * rp.r;
      const py = Math.sin(rp.angle+ry) * rp.r * Math.abs(Math.sin(tilt));
      const pz = Math.sin(rp.angle+ry) * Math.cos(tilt);
      return {...rp, px, py, pz, depth: pz};
    }).sort((a, b) => a.depth - b.depth);
    
    sortedRings.forEach(rp=>{
      const px=CX+rp.px*rad;
      const py=CY+rp.py+rp.spread*rad;
      const behind=rp.depth < 0;
      const distance = Math.abs(rp.r - (ri + ro) / 2) / ((ro - ri) / 2);
      
      // Ring particle size varies with distance and perspective
      const baseSize = rp.size * (1 - exploreScatter * 0.8);
      const perspectiveSize = baseSize * (0.8 + 0.4 * Math.abs(Math.sin(tilt)));
      const finalSize = perspectiveSize * (0.7 + 0.3 * (1 - distance));
      
      ctx.beginPath(); 
      ctx.arc(px, py, finalSize, 0, Math.PI*2);
      
      // Enhanced ring particle colors based on composition
      let ringColor;
      if (pd.name === 'Saturn') {
        // Saturn's rings have ice and rock particles
        const iceParticle = Math.random() < 0.7;
        ringColor = iceParticle ? 
          `rgba(240,235,220,${rp.alpha * (1-exploreScatter*0.9) * (behind?0.4:1.0)})` :
          `rgba(180,160,140,${rp.alpha * (1-exploreScatter*0.9) * (behind?0.4:1.0)})`;
      } else {
        // Other planets have darker, rockier rings
        ringColor = `rgba(120,100,80,${rp.alpha * (1-exploreScatter*0.9) * (behind?0.3:1.0)})`;
      }
      
      ctx.fillStyle = ringColor;
      ctx.fill();
      
      // Add subtle glow for ice particles in Saturn's rings
      if (pd.name === 'Saturn' && Math.random() < 0.1 && !behind) {
        ctx.beginPath();
        ctx.arc(px, py, finalSize * 1.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${rp.alpha * 0.1})`;
        ctx.fill();
      }
    });
  }

  // Sort particles by depth
  const cosY=Math.cos(ry), sinY=Math.sin(ry), cosX=Math.cos(rx), sinX=Math.sin(rx);
  sortBuf.length=0;
  arr.forEach(p=>{
    const pz=p.x*sinY*cosX-p.y*sinX+p.z*cosY*cosX;
    sortBuf.push({p,pz});
  });
  sortBuf.sort((a,b)=>a.pz-b.pz);

  const sc=exploreScatter;
  const isGasGiant = pd.name==='Jupiter' || pd.name==='Saturn' || pd.name==='Uranus' || pd.name==='Neptune';
  sortBuf.forEach(({p})=>{
    const t=sc;
    let tx,ty,tz;
    if(t>0.01){
      const lt=Math.max(0,Math.min(1,(t-p.delay*0.2)/0.8));
      const e=1-Math.pow(1-lt,2);
      tx=p.gx+(p.sx-p.gx)*e; ty=p.gy+(p.sy-p.gy)*e; tz=p.gz+(p.sz-p.gz)*e;
    } else {
      const lt=Math.max(0,Math.min(1,((1-t)-p.delay*0.25)/0.75));
      const e=lt<0.5?2*lt*lt:-1+(4-2*lt)*lt;
      tx=p.sx+(p.gx-p.sx)*e; ty=p.sy+(p.gy-p.sy)*e; tz=p.sz+(p.gz-p.sz)*e;
    }
    p.x+=(tx-p.x)*0.1; p.y+=(ty-p.y)*0.1; p.z+=(tz-p.z)*0.1;

    // ── Surface flow: nudge gx/gy/gz along velocity then re-normalise ──
    if(sc < 0.05 && (p.vx || p.vy || p.vz)) {
      p.gx += p.vx; p.gy += p.vy; p.gz += p.vz;
      const len = Math.sqrt(p.gx*p.gx + p.gy*p.gy + p.gz*p.gz);
      p.gx /= len; p.gy /= len; p.gz /= len;
      // Wrap: re-derive theta to keep particle on sphere surface permanently
    }

    let rx2=p.x*cosY-p.z*sinY;
    let ry2=p.x*sinY*sinX+p.y*cosX+p.z*cosY*sinX;
    let rz2=p.x*sinY*cosX-p.y*sinX+p.z*cosY*cosX;

    const sx=CX+rx2*rad, sy=CY-ry2*rad;
    const depth=(rz2+1.5)/3;
    const alphaBase = isGasGiant ? Math.max(0.06, 0.15+depth*0.85) : Math.max(0.04,0.1+depth*0.9);
    const alpha = alphaBase*(1-sc*0.25);
    // Gas giants: larger, crisper particles so bands are clearly visible
    const sizeBase = pd.name==='Jupiter' ? 1.15 : pd.name==='Saturn' ? 1.05 : pd.name==='Uranus' ? 1.1 : 0.8;
    const sz=(sizeBase+Math.random()*1.2)*Math.max(0.2,0.35+depth*0.95);
    ctx.beginPath(); ctx.arc(sx,sy,sz,0,Math.PI*2);
    ctx.fillStyle=p.color;
    ctx.globalAlpha=alpha;
    ctx.fill(); ctx.globalAlpha=1;
  });
}

// ─── RENDER: moons in explore mode ──────────────────────────────────────────
// pass = 'back'  → orbit rings + moons behind the planet (dim)
// pass = 'front' → moons in front of the planet (bright)
// Moons orbit independently around the planet centre in screen space,
// exactly like Earth's Moon — a tilted ellipse that never stops moving.
function drawMoons(idx, dt, pass) {
  const pd = PLANETS[idx];
  const moons = pd.moonData;
  if (!moons || moons.length === 0) return;

  // Planet radius on screen — orbits scale relative to this
  const planetRad = Math.max(pd.pRadius * 6, 140) * targetExploreScale;

  // Fixed orbital tilt so orbits look 3-D (like in the Earth screenshot)
  const TILT = 0.28; // vertical squish: 1=circle, 0=flat line

  // Advance moon angles only on the back pass (so we don't double-advance)
  if (pass === 'back') {
    moons.forEach((moon, mi) => {
      moonAngles[idx][mi] = (moonAngles[idx][mi] || 0) + moon.speed * dt * 0.55;
    });
  }

  // ── On back pass: draw all orbit ellipses ──────────────────────────────
  if (pass === 'back') {
    moons.forEach((moon, mi) => {
      const isMore = moon.name.includes('more');
      const orbitA = moon.orbitR * planetRad;
      const orbitB = orbitA * TILT;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbitA, orbitB, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isMore ? `rgba(180,200,255,0.07)` : `rgba(180,200,255,0.22)`;
      ctx.lineWidth   = isMore ? 0.3 : 0.6;
      ctx.setLineDash(isMore ? [2, 7] : [5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });
  }

  // ── Build moon screen positions ────────────────────────────────────────
  const moonList = moons.map((moon, mi) => {
    const angle  = moonAngles[idx][mi] || 0;
    const orbitA = moon.orbitR * planetRad;
    const orbitB = orbitA * TILT;
    const mx = CX + Math.cos(angle) * orbitA;
    const my = CY + Math.sin(angle) * orbitB;
    // sin(angle): positive = bottom of ellipse = in front of planet
    //             negative = top of ellipse    = behind planet
    const depth = Math.sin(angle);
    const behindPlanet = depth < 0;
    return { moon, mi, mx, my, depth, angle, behindPlanet };
  });

  // Filter to correct pass
  const toRender = moonList.filter(m =>
    pass === 'back' ? m.behindPlanet : !m.behindPlanet
  );

  // Sort back-to-front within each pass
  toRender.sort((a, b) => a.depth - b.depth);

  // ── Draw each moon ────────────────────────────────────────────────────
  toRender.forEach(({ moon, mx, my, depth, angle, behindPlanet }) => {
    const [mr, mg, mb] = moon.col;
    const isMore = moon.name.includes('more');
    const normDepth = (depth + 1) / 2; // 0=back, 1=front

    const baseSize = isMore ? moon.size * 0.55 : moon.size * 1.2;
    const moonSize = baseSize * (0.7 + normDepth * 0.4) * Math.max(0.75, targetExploreScale);
    const alpha    = behindPlanet ? 0.18 : (0.65 + normDepth * 0.35);

    if (isMore) {
      ctx.beginPath(); ctx.arc(mx, my, moonSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${mr},${mg},${mb},${alpha * 0.45})`;
      ctx.fill();
      ctx.font = `7px 'Courier New'`;
      ctx.fillStyle = `rgba(180,200,255,${alpha * 0.5})`;
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, mx, my - moonSize - 3);
      return;
    }

    // Outer halo
    const haloR = moonSize * 5.5;
    const halo  = ctx.createRadialGradient(mx, my, 0, mx, my, haloR);
    halo.addColorStop(0,   `rgba(${mr},${mg},${mb},${0.20 * alpha})`);
    halo.addColorStop(0.5, `rgba(${mr},${mg},${mb},${0.08 * alpha})`);
    halo.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(mx, my, haloR, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();

    // Inner core glow
    const coreR    = moonSize * 2.6;
    const coreGlow = ctx.createRadialGradient(mx, my, 0, mx, my, coreR);
    coreGlow.addColorStop(0,   `rgba(${Math.min(255,mr+50)},${Math.min(255,mg+50)},${Math.min(255,mb+50)},${0.6 * alpha})`);
    coreGlow.addColorStop(0.6, `rgba(${mr},${mg},${mb},${0.28 * alpha})`);
    coreGlow.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(mx, my, coreR, 0, Math.PI * 2);
    ctx.fillStyle = coreGlow; ctx.fill();

    // Moon sphere (particle dots with lighting)
    const dotCount = Math.max(14, Math.floor(moonSize * moonSize * 4.5));
    for (let d = 0; d < dotCount; d++) {
      const phi   = Math.acos(1 - 2 * (d + 0.5) / dotCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * d;
      const dx = Math.sin(phi) * Math.cos(theta) * moonSize;
      const dy = Math.cos(phi) * moonSize;
      const dz = Math.sin(phi) * Math.sin(theta) * moonSize;
      const dep    = (dz + moonSize) / (2 * moonSize);
      const lit    = behindPlanet ? (0.12 + dep * 0.35) : (0.28 + dep * 0.72);
      const dAlpha = behindPlanet ? (0.18 + dep * 0.25) : (0.45 + dep * 0.55);
      ctx.beginPath(); ctx.arc(mx + dx, my + dy, 0.65 + dep * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(mr*lit)},${Math.round(mg*lit)},${Math.round(mb*lit)},${dAlpha})`;
      ctx.fill();
    }

    // Specular highlight (front moons only)
    if (!behindPlanet) {
      ctx.beginPath();
      ctx.arc(mx - moonSize * 0.28, my - moonSize * 0.28, moonSize * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.38 * normDepth})`;
      ctx.fill();
    }

    // Label
    const labelAlpha = behindPlanet ? 0.22 : (0.78 + normDepth * 0.22);
    const fontSize   = Math.round(8 + moonSize * 0.35);
    ctx.font = `bold ${fontSize}px 'Courier New'`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${mr},${mg},${mb},${labelAlpha * 0.55})`;
    ctx.fillText(moon.name.toUpperCase(), mx + 1, my - moonSize - 5);
    ctx.fillStyle = `rgba(220,235,255,${labelAlpha})`;
    ctx.fillText(moon.name.toUpperCase(), mx, my - moonSize - 6);
  });
}


function setInfo(idx) {
  const pd=PLANETS[idx];
  document.getElementById('planet-name').textContent=pd.name;
  document.getElementById('planet-sub').textContent=pd.sub;
  document.getElementById('i-type').textContent=pd.type;
  document.getElementById('i-dia').textContent=pd.dia;
  document.getElementById('i-dist').textContent=pd.dist;
  document.getElementById('i-day').textContent=pd.day;
  document.getElementById('i-year').textContent=pd.year;
  document.getElementById('i-moons').textContent=pd.moons;
  document.getElementById('i-temp').textContent=pd.temp;
  document.getElementById('info-panel').style.opacity='1';
}

function updateInstructionBox() {
  const instructionBox = document.getElementById('instruction-box');
  
  if (mode === 'system') {
    instructionBox.innerHTML = `
      <h4>Hand Controls</h4>
      <div class="instruction-item">
        <span class="gesture-icon">👆</span>
        <span class="instruction-text">Point index finger to aim</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">✋</span>
        <span class="instruction-text">Open hand to explore planet</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">↔</span>
        <span class="instruction-text">Two hands to zoom system</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">✊</span>
        <span class="instruction-text">Closed fist to rotate</span>
      </div>
    `;
  } else if (mode === 'planet') {
    instructionBox.innerHTML = `
      <h4>Planet Mode</h4>
      <div class="instruction-item">
        <span class="gesture-icon">✊</span>
        <span class="instruction-text">Closed fist to rotate planet</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">✋</span>
        <span class="instruction-text">Open hand to scatter particles</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">↔</span>
        <span class="instruction-text">Two hands to zoom in/out</span>
      </div>
      <div class="instruction-item">
        <span class="gesture-icon">✊✊</span>
        <span class="instruction-text">Both fists to exit planet</span>
      </div>
    `;
  }
}

function clearInfo() {
  document.getElementById('planet-name').textContent='Solar System';
  document.getElementById('planet-sub').textContent='spread hands to zoom in · right hand to select';
  document.getElementById('info-panel').style.opacity='0';
  document.getElementById('mode-badge').textContent='solar system';
  document.getElementById('moon-badge').style.opacity='0';
  updateInstructionBox();
}

function enterPlanet(idx) {
  focusedIdx=idx; mode='planet';
  exploreRotX=0.2; exploreRotY=0; targetExploreScale=1.0; exploreScale=1.0;
  targetExploreScatter=0; exploreScatter=0;
  setInfo(idx);
  document.getElementById('mode-badge').textContent='exploring · '+PLANETS[idx].name.toLowerCase();
  document.getElementById('hint').innerHTML='✊ right fist drag → rotate planet<br>✋ open right hand → scatter particles<br>↔ two hands spread/pinch → zoom<br>✊✊ both fists → exit to solar system';
  updateInstructionBox();

  // Moon badge
  const pd = PLANETS[idx];
  const moonBadge = document.getElementById('moon-badge');
  const moonCount = parseInt(pd.moons) || 0;
  if (moonCount > 0) {
    const named = (pd.moonData||[]).filter(m=>!m.name.includes('more')).map(m=>m.name);
    const namedStr = named.length > 0 ? ' · ' + named.join(' · ') : '';
    moonBadge.innerHTML = `🌑 ${moonCount} Moon${moonCount!==1?'s':''}${namedStr}`;
    moonBadge.style.opacity = '1';
  } else {
    moonBadge.innerHTML = '🌑 No moons';
    moonBadge.style.opacity = '0.5';
  }
}

function exitPlanet() {
  mode='exiting';  // cinematic zoom-out state
  exitProgress=0;
  clearInfo();
  document.getElementById('hint').innerHTML='👆 right index → aim at planet<br>✋ open right hand → zoom into planet<br>↔ two hands spread → zoom system<br>✊ drag → rotate system / planet<br>✊✊ both fists → exit planet';
}

// Cinematic exit zoom-out state
let exitProgress=0;  // 0→1

// ─── main loop ───────────────────────────────────────────────────────────────
let lastT=performance.now(), fc=0, fpsT=performance.now();
let highlightIdx=-1;

function loop() {
  requestAnimationFrame(loop);
  const now=performance.now(); const dt=Math.min((now-lastT)/1000,0.05); lastT=now; time+=dt;

  // Advance orbits
  PLANETS.forEach((pd,i)=>{ orbitAngles[i]+=pd.orbitSpeed*dt*0.012; });

  // Smooth zoom
  systemZoom+=(targetSystemZoom-systemZoom)*0.06;
  exploreScale+=(targetExploreScale-exploreScale)*0.07;
  exploreScatter+=(targetExploreScatter-exploreScatter)*0.055;

  // Deep space background with subtle gradient
  const bgGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H));
  bgGrad.addColorStop(0, 'rgba(5, 5, 15, 0.3)');
  bgGrad.addColorStop(0.5, 'rgba(0, 0, 8, 0.25)');
  bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Draw nebula clouds first (background layer)
  NEBULA_CLOUDS.forEach(cloud => {
    cloud.x += cloud.drift * dt * 10;
    const screenX = (cloud.x + CX) % (W + 400) - 200;
    const screenY = (cloud.y + CY) % (H + 400) - 200;
    
    const nebulaGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, cloud.size);
    nebulaGrad.addColorStop(0, cloud.color.replace('15%', '25%').replace(/[\d.]+\)/, cloud.alpha + ')'));
    nebulaGrad.addColorStop(0.4, cloud.color.replace('15%', '18%').replace(/[\d.]+\)/, cloud.alpha * 0.6 + ')'));
    nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = nebulaGrad;
    ctx.beginPath();
    ctx.arc(screenX, screenY, cloud.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw Milky Way band
  MILKY_WAY_STARS.forEach(star => {
    star.twinkle += star.twinkleSpeed * dt;
    const twinkleAlpha = star.a * (0.7 + 0.3 * Math.sin(star.twinkle));
    
    const screenX = (star.x + CX + systemRotY * 100) % (W + 200) - 100;
    const screenY = (star.y + CY + systemRotX * 50) % (H + 200) - 100;
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, star.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 245, 220, ${twinkleAlpha})`;
    ctx.fill();
    
    // Add subtle glow for some stars
    if (Math.random() < 0.1) {
      ctx.beginPath();
      ctx.arc(screenX, screenY, star.r * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 220, ${twinkleAlpha * 0.2})`;
      ctx.fill();
    }
  });

  // Draw main bright stars with twinkling
  STARS.forEach(star => {
    star.twinkle += star.twinkleSpeed * dt;
    const twinkleAlpha = star.a * (0.8 + 0.2 * Math.sin(star.twinkle));
    const twinkleSize = star.r * (0.9 + 0.1 * Math.sin(star.twinkle * 1.3));
    
    const screenX = (star.x + systemRotY * 200) % (W + 400) - 200;
    const screenY = (star.y + systemRotX * 100) % (H + 400) - 200;
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, twinkleSize, 0, Math.PI * 2);
    ctx.fillStyle = star.color === 'white' ? `rgba(255, 255, 255, ${twinkleAlpha})` : star.color.replace(/[\d.]+\)/, twinkleAlpha + ')');
    ctx.fill();
    
    // Add cross-shaped sparkle for brightest stars
    if (star.r > 1.5 && Math.sin(star.twinkle) > 0.7) {
      const sparkleAlpha = twinkleAlpha * 0.6;
      ctx.strokeStyle = star.color === 'white' ? `rgba(255, 255, 255, ${sparkleAlpha})` : star.color.replace(/[\d.]+\)/, sparkleAlpha + ')');
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(screenX - star.r * 3, screenY);
      ctx.lineTo(screenX + star.r * 3, screenY);
      ctx.moveTo(screenX, screenY - star.r * 3);
      ctx.lineTo(screenX, screenY + star.r * 3);
      ctx.stroke();
    }
  });

  ctx.globalAlpha = 1;

  if (mode==='system') {
    drawSystem(highlightIdx);
    if(highlightIdx>=0) drawSelectionRing(highlightIdx);
  } else if(mode==='exiting'){
    // Cinematic zoom-out: planet shrinks, solar system fades in
    exitProgress+=dt*0.9;  // ~1.1s total
    const ease=1-Math.pow(1-Math.min(1,exitProgress),3);

    // Shrink planet scale toward 0
    exploreScale=Math.max(0, 1-ease);
    targetExploreScale=exploreScale;
    refreshParticleColors(focusedIdx);
    drawPlanetExplore(focusedIdx);

    // Overlay solar system fading in
    ctx.globalAlpha=ease;
    const savedMode=mode; mode='system';
    drawSystem(-1);
    mode=savedMode;
    ctx.globalAlpha=1;

    // Flash vignette at transition midpoint
    if(exitProgress>0.3 && exitProgress<0.7){
      const vigA=(0.5-Math.abs(exitProgress-0.5))*0.6;
      ctx.fillStyle=`rgba(0,0,0,${vigA})`; ctx.fillRect(0,0,W,H);
    }

    if(exitProgress>=1.0){
      mode='system'; focusedIdx=-1; exitProgress=0;
      exploreScale=1; targetExploreScale=1; exploreScatter=0; targetExploreScatter=0;
    }
  } else {
    refreshParticleColors(focusedIdx);
    drawMoons(focusedIdx, dt, 'back');   // behind-planet moons first
    drawPlanetExplore(focusedIdx);        // planet body on top of them
    drawMoons(focusedIdx, dt, 'front');  // in-front moons drawn last
  }

  fc++; if(now-fpsT>600){ document.getElementById('fps').textContent='FPS '+Math.round(fc/((now-fpsT)/1000)); fc=0; fpsT=now; }
}
loop();

// Initialize instruction box
updateInstructionBox();

