import './style.css';

const $ = id => document.getElementById(id);
const canvas = $('heartCanvas');
const ctx = canvas.getContext('2d');

let W = 0, H = 0;
let particles = [];
let fireworks = [];
let roses = [];
let hue = 330;
let rotX = 0, rotY = 0;
let targetX = 0, targetY = 0;
let dragging = false;
let lastX = 0, lastY = 0;
let zoom = 1;
let pulseEnabled = true;
let lastFrame = 0;

const words = ['أحبج','يمّه','روحي','عمري','حياتي','أماني','دعواتج'];

function heart(t) {
  return {
    x: 16 * Math.sin(t) ** 3,
    y: -(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))
  };
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  W = rect.width;
  H = rect.height;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  createParticles();
}

function createParticles() {
  particles = [];
  for (let i = 0; i < 850; i++) {
    const t = Math.random()*Math.PI*2;
    const p = heart(t);
    const fill = .72 + Math.random()*.28;

    particles.push({
      x:p.x*fill,
      y:p.y*fill,
      z:(Math.random()-.5)*12,
      size:Math.random()*2+0.6,
      text:Math.random()<.07,
      word:words[Math.floor(Math.random()*words.length)],
      phase:Math.random()*6
    });
  }
}

function drawHeart(time) {
  const scale = Math.min(W,H)/38*zoom;
  const beat = pulseEnabled ? 1+Math.sin(time*.003)*.055 : 1;

  rotY += (targetY-rotY)*.06;
  rotX += (targetX-rotX)*.06;

  ctx.clearRect(0,0,W,H);

  const points = particles.map(p => {
    const x=p.x*scale*beat;
    const y=p.y*scale*beat;
    const z=p.z*scale;

    const x1=x*Math.cos(rotY)-z*Math.sin(rotY);
    const z1=x*Math.sin(rotY)+z*Math.cos(rotY);
    const y1=y*Math.cos(rotX)-z1*Math.sin(rotX);
    const z2=y*Math.sin(rotX)+z1*Math.cos(rotX);
    const perspective=480/(480+z2);

    return {
      x:W/2+x1*perspective,
      y:H/2+y1*perspective,
      depth:z2,
      perspective,
      p
    };
  });

  points.sort((a,b)=>a.depth-b.depth);

  // هالة القلب
  const glow=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,scale*19);
  glow.addColorStop(0,`hsla(${hue},100%,50%,.13)`);
  glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,W,H);

  for(const item of points) {
    const {x,y,perspective,p}=item;
    if(perspective<=0) continue;

    ctx.save();
    ctx.globalAlpha=Math.min(1,Math.max(.2,perspective));

    if(p.text && perspective>.75) {
      ctx.font=`700 ${Math.max(9,12*perspective)}px Cairo`;
      ctx.textAlign='center';
      ctx.fillStyle=`hsl(${hue},100%,82%)`;
      ctx.shadowColor=`hsl(${hue},100%,60%)`;
      ctx.shadowBlur=13;
      ctx.fillText(p.word,x,y);
    } else {
      ctx.beginPath();
      ctx.arc(x,y,p.size*perspective,0,Math.PI*2);
      ctx.fillStyle=`hsl(${hue+p.phase},100%,75%)`;
      ctx.shadowColor=`hsl(${hue},100%,60%)`;
      ctx.shadowBlur=12;
      ctx.fill();
    }
    ctx.restore();
  }
}

function burst(x,y) {
  for(let i=0;i<65;i++) {
    const angle=Math.random()*Math.PI*2;
    const speed=Math.random()*4+1.5;
    fireworks.push({
      x,y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,
      life:1,
      size:Math.random()*3+1
    });
  }
}

function drawEffects() {
  fireworks=fireworks.filter(p=>p.life>0);
  for(const p of fireworks) {
    p.x+=p.vx;
    p.y+=p.vy;
    p.vy+=.035;
    p.life-=.018;

    ctx.save();
    ctx.globalAlpha=p.life;
    ctx.fillStyle=`hsl(${hue},100%,75%)`;
    ctx.shadowColor=`hsl(${hue},100%,65%)`;
    ctx.shadowBlur=12;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  roses=roses.filter(r=>r.life>0);
  for(const r of roses) {
    r.y+=r.speed;
    r.x+=Math.sin(r.y*.025)*.8;
    r.life-=.006;
    ctx.save();
    ctx.globalAlpha=r.life;
    ctx.font=`${r.size}px serif`;
    ctx.fillText('🌹',r.x,r.y);
    ctx.restore();
  }
}

function animate(time) {
  requestAnimationFrame(animate);

  // تقليل الحمل على الهاتف
  if(time-lastFrame<25) return;
  lastFrame=time;

  drawHeart(time);
  drawEffects();

  if(Math.random()<.006 && $('mainSite').classList.contains('visible')) {
    burst(Math.random()*W,Math.random()*H*.45);
  }
}

canvas.addEventListener('pointerdown',e=>{
  dragging=true;
  lastX=e.clientX;
  lastY=e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
  if(!dragging) return;
  targetY+=(e.clientX-lastX)*.009;
  targetX+=(e.clientY-lastY)*.009;
  targetX=Math.max(-1.1,Math.min(1.1,targetX));
  lastX=e.clientX;
  lastY=e.clientY;
});

canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('pointercancel',()=>dragging=false);

$('enterBtn').onclick=()=>{
  $('intro').classList.add('hide');
  $('mainSite').classList.add('visible');
  setTimeout(resize,200);
  burst(W/2,H/2);
};

$('pulseBtn').onclick=()=>{
  pulseEnabled=!pulseEnabled;
  $('pulseBtn').innerHTML=pulseEnabled
    ? '<span>💗</span> النبض يعمل'
    : '<span>🤍</span> النبض هادئ';
  burst(W/2,H/2);
};

$('fireBtn').onclick=()=>{
  for(let i=0;i<5;i++) {
    burst(Math.random()*W,Math.random()*H*.7);
  }
};

$('roseBtn').onclick=()=>{
  for(let i=0;i<35;i++) {
    roses.push({
      x:Math.random()*W,
      y:-Math.random()*H,
      speed:Math.random()*1.5+.5,
      size:Math.random()*17+17,
      life:1
    });
  }
};

document.querySelectorAll('.color').forEach(btn=>{
  btn.onclick=()=>{
    hue=Number(btn.dataset.hue);
    burst(W/2,H/2);
  };
});

const message=`يمّه الحبيبة، مهما أحچي ومهما أكتب، ما أوفيج حقج.

أدري شكد تعبتي علمودي، وشكد سهرات وتحملتي، وشكد مرة خليتي راحتج على مود أشوف نفسي مرتاح.

يمكن ما أگدر أردلج كل التعب اللي تعبتيه، بس أتمنى ربي يوفقني وأكون ابن يفرّح قلبج ويخليج فخورة بيه.

بر الوالدين مو مجرد كلمة نحچيها، هو حب واحترام وإحسان، وهو أقل واجب نقدمه للناس اللي ضحّوا براحتهم حتى نكون بخير.

يمّه، إنتِ الأمان والحنان، وإنتِ أحلا أم بالدنيا، ووجودج بحياتي نعمة أحمد ربي عليها كل يوم.

ربي يحفظج إلي، ويطوّل بعمرج، ويبعد عنج كل تعب وحزن، ويخليني أشوف الفرحة بعيونج دوم.

أحبج يمّه، حب أكبر من كل الكلام. ❤️`;

let typingTimer;

$('letterBtn').onclick=()=>{
  $('letterModal').classList.add('open');
  const output=$('messageText');
  output.textContent='';
  clearInterval(typingTimer);

  let i=0;
  typingTimer=setInterval(()=>{
    output.textContent+=message[i++];
    if(i>=message.length) clearInterval(typingTimer);
  },35);
};

function closeLetter() {
  $('letterModal').classList.remove('open');
  clearInterval(typingTimer);
}

$('closeModal').onclick=closeLetter;
$('letterModal').addEventListener('click',e=>{
  if(e.target===$('letterModal')) closeLetter();
});

window.addEventListener('resize',resize);

resize();
requestAnimationFrame(animate);
