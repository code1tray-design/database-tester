/*
 * Course Portal Main Script
 * Extracted from index.html
 */

// ================================================================
// COURSES ARRAY — edit only this to add/remove cards
// Fields: title, tag, desc, file, icon, bg (css gradient), badge, bc (badge class), meta
// ================================================================
const COURSES = [
  {
    title:"VIKSIT BHARAT - Skill to Scale Startup Simulator.",
    tag:"quiz based",
    desc:"real-world applications in business & accounting.",
    file:"game.html",
    icon:"🤖",
    bg:"linear-gradient(135deg,#1c0035 0%,#450a7a 100%)",
    badge:"NEW", bc:"bn",
    meta:"18 Topics · May 2025"
  },
  {
    title:"stage 1",
    tag:"LEVEL 2",
    desc:"Market Field Study Submission.",
    file:"test1.html",
    icon:"📁",
    bg:"linear-gradient(135deg,#00082e 0%,#0a1f7a 100%)",
    badge:"HOT", bc:"bh",
    meta:"12 Cases · April 2025"
  },
  {
    title:"CASE STUDY",
    tag:"Quiz",
    desc:"Topic-wise MCQs and short-answer practice sets for BCom exams.",
    file:"case-study.html",
    icon:"📝",
    bg:"linear-gradient(135deg,#00180e 0%,#013d22 100%)",
    badge:"TOP", bc:"bt",
    meta:"150+ Questions · May 2025"
  },
  /* ── ADD MORE COURSES HERE ──────────────────────────────── */
  // {
  //   title:"Financial Accounting — Unit 1",
  //   tag:"Notes",
  //   desc:"Journal entries, ledger, trial balance, and final accounts.",
  //   file:"financial-acc.html",
  //   icon:"📒",
  //   bg:"linear-gradient(135deg,#1a1000 0%,#3d2800 100%)",
  //   badge:"FREE", bc:"bf",
  //   meta:"6 Topics · June 2025"
  // },
];

// Build cards
document.addEventListener('DOMContentLoaded',()=>{
  const g=document.getElementById('grid');
  if(document.getElementById('cnt'))
    document.getElementById('cnt').textContent=COURSES.length;
  COURSES.forEach((c,i)=>{
    const a=document.createElement('a');
    a.className='card';
    a.href=c.file;
    a.style.animationDelay=`${i*.12}s`;
    a.innerHTML=`
      <div class="cthumb" style="background:${c.bg}">
        ${c.icon}
        ${c.badge?`<span class="cbadge ${c.bc}">${c.badge}</span>`:''}
      </div>
      <div class="cbody">
        <div class="ctag">${c.tag}</div>
        <div class="ctitle">${c.title}</div>
        <div class="cdesc">${c.desc}</div>
        <div class="cfoot">
          <span class="cmeta">${c.meta}</span>
          <span class="carrow">↗</span>
        </div>
      </div>`;
    g.appendChild(a);
  });
});

// Search function
function doSearch(){
  const q=document.getElementById('sinput').value.toLowerCase().trim();
  document.querySelectorAll('.card').forEach(c=>{
    c.style.display=(!q||c.textContent.toLowerCase().includes(q))?'flex':'none';
  });
  if(q)document.getElementById('courses').scrollIntoView({behavior:'smooth'});
}

// ================================================================
// SILK WAVE BACKGROUND
// — slow ambient flow + scroll-reactive turbulence —
// ================================================================
(function(){
  const cv=document.getElementById('bg');
  if(!cv) return;
  const cx=cv.getContext('2d');
  let W,H;

  function resize(){
    W=cv.width=window.innerWidth;
    H=cv.height=window.innerHeight;
  }
  window.addEventListener('resize',resize);
  resize();

  // Scroll energy tracker
  let lastScrollY = window.scrollY;
  let scrollEnergy = 0;
  let scrollVel = 0;

  window.addEventListener('scroll', ()=>{
    const curr = window.scrollY;
    scrollVel = Math.abs(curr - lastScrollY);
    scrollEnergy = Math.min(scrollEnergy + scrollVel * 0.6, 120);
    lastScrollY = curr;
  }, {passive:true});

  let T = 0;
  const waves=[
    {y:.28, a:160, f:.0014, s:.00018, sr:1.8, c:'rgba(192,38,211,.22)'},
    {y:.38, a:130, f:.0018, s:.00014, sr:1.2, c:'rgba(167,139,250,.20)'},
    {y:.48, a:190, f:.0012, s:.00012, sr:2.2, c:'rgba(124,58,237,.18)'},
    {y:.58, a:150, f:.0016, s:.00016, sr:1.0, c:'rgba(37,99,235,.16)'},
    {y:.66, a:110, f:.002,  s:.0002,  sr:1.5, c:'rgba(14,165,233,.14)'},
    {y:.44, a:100, f:.0022, s:.00022, sr:2.6, c:'rgba(236,72,153,.12)'},
    {y:.35, a:140, f:.0013, s:.00010, sr:1.3, c:'rgba(99,102,241,.15)'},
  ];

  function draw(){
    scrollEnergy *= 0.92;
    const e = scrollEnergy;
    cx.fillStyle='#06040f';
    cx.fillRect(0,0,W,H);
    const glowAlpha = 0.12 + e * 0.0008;
    const glow=cx.createRadialGradient(W*.5,H*.55,0,W*.5,H*.55,W*.65);
    glow.addColorStop(0,`rgba(124,58,237,${glowAlpha})`);
    glow.addColorStop(.5,`rgba(192,38,211,${glowAlpha*.5})`);
    glow.addColorStop(1,'transparent');
    cx.fillStyle=glow;
    cx.fillRect(0,0,W,H);
    waves.forEach(w=>{
      cx.beginPath();
      const baseY = H * w.y;
      const extraA = e * w.sr * 0.55;
      const totalA = w.a + extraA;
      const speedBoost = 1 + e * 0.018;
      cx.moveTo(0,H);
      for(let x=0;x<=W;x+=4){
        const phase = T * w.s * speedBoost;
        const y = baseY
          + Math.sin(x*w.f  + phase)           * totalA
          + Math.sin(x*w.f*1.6 + phase*1.4)   * totalA * .35
          + Math.sin(x*w.f*.7  + phase*.8)     * totalA * .2;
        cx.lineTo(x,y);
      }
      cx.lineTo(W,H);
      cx.closePath();
      cx.fillStyle=w.c;
      cx.fill();
    });
    T += 1;
    requestAnimationFrame(draw);
  }
  draw();
})();
