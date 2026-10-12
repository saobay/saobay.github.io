// ================= 2. TRỘN DUNG DỊCH — bản Hollywood theo video quảng cáo =================
(function(){
  var cv = document.getElementById('cv-mix');
  var G = fitCanvas(cv);
  // Chi fit lai khi chuyen tab (qua __fitAll), KHONG fit khi resize/cuon
  window.__refits.push(function(){ var g2 = fitCanvas(cv); if (g2 && !g2.hidden) G = g2; });

  // ---------- Dữ liệu hóa chất: màu phát sáng kiểu video ----------
  var CHEMS = {
    HCl:      {f:'HCl',       name:'axit clohiđric',  color:'#edf3f5', glow:'#9fc3d4', type:'acid', cat:'Axit'},
    H2SO4:    {f:'H₂SO₄',     name:'axit sunfuric',   color:'#f4f1e8', glow:'#c9bfa5', type:'acid', cat:'Axit'},
    CH3COOH:  {f:'CH₃COOH',   name:'axit axetic',     color:'#eef1f1', glow:'#a9bcbc', type:'acid', cat:'Axit'},
    NaOH:     {f:'NaOH',      name:'natri hiđroxit',  color:'#edf2f4', glow:'#9db8c4', type:'base', cat:'Bazơ'},
    KOH:      {f:'KOH',       name:'kali hiđroxit',   color:'#eef0f3', glow:'#a5b0c0', type:'base', cat:'Bazơ'},
    'Ca(OH)2':{f:'Ca(OH)₂',   name:'canxi hiđroxit',  color:'#f1f1ee', glow:'#b0b0a5', type:'base', cat:'Bazơ'},
    CuSO4:    {f:'CuSO₄',     name:'đồng(II) sunfat', color:'#38bdf8', glow:'#0284c7', type:'salt', cat:'Muối'},
    NaCl:     {f:'NaCl',      name:'natri clorua',    color:'#f0f3f4', glow:'#b6c4c9', type:'salt', cat:'Muối'},
    AgNO3:    {f:'AgNO₃',     name:'bạc nitrat',      color:'#eef2f5', glow:'#a9bfd0', type:'salt', cat:'Muối'},
    FeCl3:    {f:'FeCl₃',     name:'sắt(III) clorua', color:'#fbbf24', glow:'#d97706', type:'salt', cat:'Muối'},
    litmus:   {f:'Quỳ tím',   name:'quỳ tím',         color:'#a78bfa', glow:'#7c3aed', type:'ind',  cat:'Chỉ thị'},
    phenol:   {f:'Phenolphtalein', name:'phenolphtalein', color:'#f2f4f5', glow:'#b9c2c9', type:'ind', cat:'Chỉ thị'},
    Zn:       {f:'Zn',        name:'kẽm',         color:'#cbd5e1', glow:'#94a3b8', type:'metal', cat:'Kim loại'},
    Fe:       {f:'Fe',        name:'sắt',         color:'#e8c98a', glow:'#b45309', type:'metal', cat:'Kim loại'},
    Mg:       {f:'Mg',        name:'magie',       color:'#f8fafc', glow:'#e2e8f0', type:'metal', cat:'Kim loại'},
    Cu:       {f:'Cu',        name:'đồng',        color:'#fdba74', glow:'#c2410c', type:'metal', cat:'Kim loại'},
    Na:       {f:'Na',        name:'natri',       color:'#d7dde6', glow:'#94a3b8', type:'metal', cat:'Kim loại'},
    C2H5OH:   {f:'C₂H₅OH',    name:'cồn 96 độ',   color:'#edf3f5', glow:'#9fc3d4', type:'fuel',  cat:'Cồn'},
    H2O:      {f:'H₂O',       name:'nước cất',    color:'#bae6fd', glow:'#38bdf8', type:'water', cat:'Dung môi'}
  };
  var SHELF_ORDER = ['HCl','H2SO4','CH3COOH','NaOH','KOH','Ca(OH)2','CuSO4','NaCl','AgNO3','FeCl3','litmus','phenol','Zn','Fe','Mg','Cu','Na','C2H5OH','H2O'];

  var eqs = {
    'HCl|NaOH':  'HCl + NaOH → NaCl + H₂O',
    'HCl|KOH':   'HCl + KOH → KCl + H₂O',
    'HCl|Ca(OH)2': '2HCl + Ca(OH)₂ → CaCl₂ + 2H₂O',
    'H2SO4|NaOH':  'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
    'H2SO4|KOH':  'H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O',
    'H2SO4|Ca(OH)2': 'H₂SO₄ + Ca(OH)₂ → CaSO₄ + 2H₂O',
    'CH3COOH|NaOH': 'CH₃COOH + NaOH → CH₃COONa + H₂O',
    'CH3COOH|KOH':  'CH₃COOH + KOH → CH₃COOK + H₂O',
    'CH3COOH|Ca(OH)2': '2CH₃COOH + Ca(OH)₂ → (CH₃COO)₂Ca + 2H₂O'
  };

  // ---------- Bình thí nghiệm ----------
  var _vid = 0;
  function vesselCap(type){
    if (type === 'tube') return 1;
    return 5;
  }
  function makeVessel(type, chemKey, vol){
    var c = CHEMS[chemKey] || CHEMS.HCl;
    return {
      id: ++_vid, type: type, chemKey: chemKey,
      vol: vol, volShown: vol, cap: vesselCap(type),
      contents: (chemKey && vol > 0) ? [{k: chemKey, v: vol}] : [],
      bubbles: [], fizz: 0, sel: false,
      tilt: 0, tiltDir: 1, swirl: Math.random()*6.28,
      x: 0, y: 0, w: 108, h: 162, rect: null,
      reacted: false
    };
  }
  function vesselColor(v){
    if (!v || !v.contents) return {color:'#1e293b', glow:'#334155'};
    // Đổi màu từ từ: dùng màu đang hiển thị (dispColor) thay vì nhảy ngay sang indColor
    if (v.dispColor) return {color: v.dispColor, glow: v.dispColor};
    // Màu pha trộn theo thể tích từng chất
    var tot = 0, r = 0, g = 0, b = 0, gr = 0, gg = 0, gb = 0;
    for (var i=0;i<v.contents.length;i++){
      var c = CHEMS[v.contents[i].k]; if(!c) continue;
      var vv = v.contents[i].v; tot += vv;
      var cc = hexRgb(c.color), gc = hexRgb(c.glow);
      r+=cc[0]*vv; g+=cc[1]*vv; b+=cc[2]*vv; gr+=gc[0]*vv; gg+=gc[1]*vv; gb+=gc[2]*vv;
    }
    if (tot <= 0) return {color:'#1e293b', glow:'#334155'};
    return {color: rgbStr(r/tot,g/tot,b/tot), glow: rgbStr(gr/tot,gg/tot,gb/tot)};
  }
  function hexRgb(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
  function rgbStr(r,g,b){ return 'rgb('+Math.round(r)+','+Math.round(g)+','+Math.round(b)+')'; }
  function hasType(v, t){
    for (var i=0;i<v.contents.length;i++){ var c = CHEMS[v.contents[i].k]; if (c && c.type===t && v.contents[i].v>0.01) return true; }
    return false;
  }

  var vessels = [];
  // ===== SOUND_FX: âm thanh tổng hợp bằng Web Audio API (không cần file ngoài) =====
  var SND = {
    ctx: null, master: null, noiseBuf: null, enabled: true, loops: {},
    init: function(){
      if (this.ctx) { try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch(e){} return; }
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        // buffer noise trắng dùng chung 2s
        var len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
        this.mkLoop('pour', 'bandpass', 900, 1.2, 0, 0);  // rót: nền nhẹ, chính là glug
        this.mkLoop('boil', 'lowpass', 420, 0.7, 3.2, 0.30);    // sôi sủi bọt
        this.mkLoop('fire', 'lowpass', 850, 0.6, 11, 0.12);     // lửa cháy phừng phựt
        this.mkLoop('gas', 'highpass', 3600, 0.7, 0, 0);        // khí xì xì
      } catch(e){ this.ctx = null; }
    },
    mkLoop: function(name, type, freq, q, lfoHz, lfoDepth){
      var c = this.ctx;
      var src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      var g = c.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
      var lg = null;
      if (lfoHz > 0){
        var lfo = c.createOscillator(); lfo.frequency.value = lfoHz;
        lg = c.createGain(); lg.gain.value = 0; // Bắt đầu = 0, chỉ tăng khi có target > 0
        lfo.connect(lg); lg.connect(g.gain); lfo.start();
      }
      this.loops[name] = g;
      this.loops[name + '_lfo'] = lg;
      this.loops[name + '_lfoDepth'] = lfoDepth;
    },
    set: function(name, target){
      if (!this.ctx || !this.loops[name]) return;
      try {
        var t = this.enabled ? target : 0;
        this.loops[name].gain.setTargetAtTime(t, this.ctx.currentTime, 0.06);
        // Scale LFO theo target để khi tắt thì im hoàn toàn
        var lg = this.loops[name + '_lfo'];
        var depth = this.loops[name + '_lfoDepth'] || 0;
        if (lg){
          // LFO depth tỉ lệ với target (target 0 -> LFO 0 -> im hoàn toàn)
          var lfoTarget = t > 0.01 ? depth * Math.min(1, t * 3) : 0;
          lg.gain.setTargetAtTime(lfoTarget, this.ctx.currentTime, 0.06);
        }
      }
      catch(e){}
    },
    allOff: function(){
      var self = this;
      Object.keys(this.loops).forEach(function(k){ self.set(k, 0); });
    },
    // tiếng nổ: noise bùng + sine trầm rơi
    boom: function(){
      if (!this.ctx || !this.enabled) return;
      try {
        var c = this.ctx, t = c.currentTime;
        var n = c.createBufferSource(); n.buffer = this.noiseBuf;
        var nf = c.createBiquadFilter(); nf.type = 'lowpass';
        nf.frequency.setValueAtTime(3200, t); nf.frequency.exponentialRampToValueAtTime(120, t + 0.55);
        var ng = c.createGain();
        ng.gain.setValueAtTime(0.95, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        n.connect(nf); nf.connect(ng); ng.connect(this.master); n.start(t); n.stop(t + 0.75);
        var o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.5);
        var og = c.createGain();
        og.gain.setValueAtTime(0.85, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        o.connect(og); og.connect(this.master); o.start(t); o.stop(t + 0.6);
      } catch(e){}
    },
    // blub: bọt nước vỡ (sôi) — crackle: tia lửa tách (lửa)
    blub: function(){
      if (!this.ctx || !this.enabled) return;
      try {
        var c = this.ctx, t = c.currentTime;
        var o = c.createOscillator(); o.type = 'sine';
        var f0 = 220 + Math.random() * 260;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.11);
        var g = c.createGain();
        g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.13);
      } catch(e){}
    },
    glug: function(){
      if (!this.ctx || !this.enabled) return;
      try {
        var c = this.ctx, t = c.currentTime, self = this;
        [0, 1].forEach(function(i){
          var o = c.createOscillator(); o.type = 'triangle';
          var f0 = (i === 0 ? 280 : 560) + Math.random() * 250;
          var dt = t + i * 0.035;
          o.frequency.setValueAtTime(f0, dt);
          o.frequency.exponentialRampToValueAtTime(85, dt + 0.07);
          var g = c.createGain();
          g.gain.setValueAtTime(i === 0 ? 0.30 : 0.15, dt);
          g.gain.exponentialRampToValueAtTime(0.001, dt + 0.14);
          o.connect(g); g.connect(self.master); o.start(dt); o.stop(dt + 0.16);
        });
      } catch(e){}
    },
    crackle: function(){
      if (!this.ctx || !this.enabled) return;
      try {
        var c = this.ctx, t = c.currentTime, dur = 0.03 + Math.random() * 0.05;
        var n = c.createBufferSource(); n.buffer = this.noiseBuf;
        n.playbackRate.value = 0.7 + Math.random() * 0.8;
        var f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
        var g = c.createGain();
        g.gain.setValueAtTime(0.10 + Math.random() * 0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        n.connect(f); f.connect(g); g.connect(this.master);
        n.start(t, Math.random() * 1.5); n.stop(t + dur + 0.02);
      } catch(e){}
    },
    // gọi mỗi frame: điều chỉnh âm lượng theo trạng thái thí nghiệm
    tick: function(){
      if (!this.ctx) return;
      var pouring = (typeof pour !== 'undefined') && !!pour;
      var heating = false, boiling = false, gassing = false, i, v;
      try {
        for (i = 0; i < vessels.length; i++){
          v = vessels[i];
          if ((v.heat || 0) > 0.25) heating = true;
          if ((v.heat || 0) > 0.85 && (v.volShown || 0) > 0.03) boiling = true;
          if ((v.fizz || 0) > 0.45) gassing = true;
        }
      } catch(e){}
      this.set('pour', pouring ? 0.12 : 0);
      if (pouring && Math.random() < 0.40) this.glug(); // róc rách liên tục
      this.set('fire', heating ? 0.12 : 0);
      this.set('boil', boiling ? 0.42 : 0);
      this.set('gas', gassing ? 0.26 : 0);
      if (this.enabled){
        if (heating && Math.random() < 0.055) this.crackle();
        if (boiling && Math.random() < 0.11) this.blub();
        if (gassing && !boiling && Math.random() < 0.05) this.blub();
      }
    }
  };
  function resetBench(){
    vessels = []; // BENCH_EMPTY: canvas khởi động trống, user tự lấy bình từ tủ
    pourQ = []; pour = null; selV = null;
    document.getElementById('mix-result').classList.add('hidden');
  }

  // ---------- Tủ hóa chất ----------
  // ---------- Tủ hóa chất chia mục (SHELF_CATS) ----------
  var shelfCat = 'all';
  function buildShelfCats(){
    var bar = document.getElementById('shelf-cats');
    if (!bar || bar.children.length) return;
    var defs = [['all','Tất cả'],['Axit','Axit'],['Bazơ','Bazơ'],['Muối','Muối'],
                ['Kim loại','Kim loại'],['Chỉ thị','Chỉ thị'],['Cồn','Cồn'],['tube','🧪 Ống nghiệm'],['tools','🧰 Dụng cụ']];
    defs.forEach(function(d){
      var b = document.createElement('button');
      b.className = 'shelf-cat' + (d[0]==='all' ? ' active' : '');
      b.type = 'button'; b.textContent = d[1];
      b.addEventListener('click', function(){
        shelfCat = d[0];
        var bs = bar.querySelectorAll('.shelf-cat');
        for (var i=0;i<bs.length;i++) bs[i].classList.remove('active');
        b.classList.add('active');
        buildShelf();
        if (d[0]==='tube'){ addEmptyTube(); } // TUBE_1TAP: bấm 1 lần là ống ra canvas luôn
      });
      bar.appendChild(b);
    });
  }
  function buildShelf(){
    var shelf = document.getElementById('chem-shelf');
    if (!shelf) return;
    shelf.innerHTML = '';
    if (shelfCat === 'tube'){ buildTubeRack(shelf); return; }
    if (shelfCat === 'tools'){ buildToolShelf(shelf); return; }
    SHELF_ORDER.forEach(function(k){
      var c = CHEMS[k];
      if (shelfCat !== 'all' && c.cat !== shelfCat) return;
      var b = document.createElement('button');
      b.className = 'chem-bottle'; b.type = 'button';
      b.style.setProperty('--bglow', (c.glow||'#8b5cf6') + '59'); /* SHELF3D: quầng sáng riêng theo màu hóa chất */
      b.innerHTML = '<span class="bcork"></span><span class="bneck"></span>' +
        '<span class="bbody"><span class="bliq" style="background:radial-gradient(circle at 50% 72%,#ffffff 0%,'+shade(c.color,55)+' 26%,'+c.color+' 62%,'+shade(c.color,-25)+' 100%);color:'+c.glow+'"><i class="lflow"></i></span></span>' +
        '<i class="thspark" style="left:14%;--thd:2.7s;--thdl:-.3s;--thx:12px"></i>' +
        '<i class="thspark" style="left:46%;--thd:3.5s;--thdl:-1.9s;--thx:-13px"></i>' +
        '<i class="thspark" style="left:74%;--thd:3s;--thdl:-2.7s;--thx:7px"></i>' +
        '<span class="blabel">'+c.f+'</span><span class="bcat">'+c.cat+'</span>'; /* TIENHIEP_V1: tia sáng + dòng linh lực */
      b.addEventListener('click', function(){
        try {
          var sibs = shelf.querySelectorAll('.chem-bottle');
          for (var si=0; si<sibs.length; si++) sibs[si].classList.remove('sel');
          b.classList.add('sel');
          addVesselFromShelf(k);
        } catch(eClick){ console.warn('[lab-mix] loi khi lay binh:', eClick && eClick.message); }
      });
      shelf.appendChild(b);
    });
  }
  // Giá gỗ đựng ống nghiệm trống trong tủ (TASK3: bấm là thêm luôn, không chọn 1/2/3)
  function buildTubeRack(shelf){
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;justify-content:center;width:100%;padding:4px 0;';
    var rack = document.createElement('div');
    rack.className = 'tube-rack';
    // Một nút duy nhất: ống nghiệm TRỐNG
    var b = document.createElement('button');
    b.className = 'rack-tube'; b.type = 'button';
    b.innerHTML = '<span class="rack-hole"></span><span class="rt"><i class="rhl"></i></span><span class="rl">+ Ống nghiệm trống</span>';
    b.title = 'Bấm để thêm 1 ống nghiệm trống vào bàn';
    b.addEventListener('click', function(){ addEmptyTube(); });
    rack.appendChild(b);
    wrap.appendChild(rack);
    shelf.appendChild(wrap);
  }
  // Dụng cụ thu khí (GAS_COLLECT): bình thu khí úp ngược + ống dẫn khí
  function buildToolShelf(shelf){
    /* EMPTYVES_V1 */
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;width:100%;padding:6px 0;';
    // Bình trống để đựng dung dịch
    var empties = [['flask','⚗️ Bình tam giác trống'],['beaker','🥛 Cốc đong trống'],['round','🔮 Bình cầu trống'],['tube','🧪 Ống nghiệm trống']];
    empties.forEach(function(e){
      var eb = document.createElement('button');
      eb.className = 'shelf-cat'; eb.type = 'button';
      eb.style.cssText = 'font-size:12px;padding:10px 14px;';
      eb.innerHTML = e[1];
      eb.title = 'Lấy 1 bình trống ra bàn';
      (function(tp){ eb.addEventListener('click', function(){ addEmptyVessel(tp); }); })(e[0]);
      wrap.appendChild(eb);
    });
    var b = document.createElement('button');
    b.className = 'shelf-cat'; b.type = 'button';
    b.style.cssText = 'font-size:12px;padding:10px 16px;';
    b.innerHTML = '🧪 Bình thu khí <span style="opacity:.7;font-weight:400">(ống dẫn + bình úp ngược)</span>';
    b.title = 'Lắp / tháo bộ thu khí cho ống nghiệm';
    b.addEventListener('click', function(){ addGasCollector(); });
    wrap.appendChild(b);
    shelf.appendChild(wrap);
  }
  function addEmptyVessel(type){
    /* EMPTYVES_V1 */
    if (vessels.length >= 4){ alert('Bàn đã có 4 bình rồi! Cất bớt bình (chạm ✕) rồi lấy thêm nhé.'); return; }
    var t = makeVessel(type, null, 0);
    t.contents = []; t.vol = 0; t.volShown = 0; t.shake = 0; t.pop = 1; t.chemKey = null;
    t.x = 0; t.y = 0;
    vessels.push(t);
    try { layout(); } catch(eLay3){}
    var nm = {flask:'Bình tam giác trống', beaker:'Cốc đong trống', round:'Bình cầu trống', tube:'Ống nghiệm trống'}[type] || 'Bình trống';
    flashMsg(t, 'Đã thêm ' + nm + '!');
  }
  function addGasCollector(){
    var tube = null, i;
    if (typeof selV !== 'undefined' && selV && selV.type === 'tube') tube = selV;
    if (!tube) for (i=0;i<vessels.length;i++) if (vessels[i].type === 'tube'){ tube = vessels[i]; break; }
    if (!tube){ alert('Chưa có ống nghiệm! Vào mục 🧪 Ống nghiệm lấy 1 ống trước nhé.'); return; }
    if (tube.collector){ tube.collector = null; flashMsg(tube, 'Đã tháo bộ thu khí!'); }
    else { tube.collector = {gas: 0}; flashMsg(tube, 'Đã lắp bộ thu khí!'); }
  }
  function addEmptyTube(){
    if (vessels.length >= 4){ alert('Bàn đã có 4 bình rồi! Cất bớt bình (chạm ✕) rồi lấy thêm nhé.'); return; }
    var t = makeVessel('tube', null, 0);
    t.contents = []; t.vol = 0; t.volShown = 0; t.shake = 0; t.pop = 1; t.chemKey = null;
    t.x = 0; t.y = 0;
    vessels.push(t);
    try { layout(); } catch(eLay2){}
    flashMsg(t,'Đã thêm ống nghiệm trống!');
  }
  var _vtypeCycle = 0;
  function addVesselFromShelf(chemKey){
    if (vessels.length >= 4){ alert('Bàn đã có 4 bình rồi! Cất bớt bình (chạm ✕) rồi lấy thêm nhé.'); return; }
    var types = ['beaker','flask','tube','round','bottle'];
    var v = makeVessel(types[_vtypeCycle % types.length], chemKey, 0.55);
    _vtypeCycle++;
    vessels.push(v);
    v.pop = 1; // hiệu ứng nảy khi xuất hiện
    try { layout(); } catch(e){} // dat vi tri ngay lap tuc, khong doi frame sau
    flashMsg(v, (CHEMS[chemKey]||{}).f || '');
  }

  // ---------- Hình học bình ----------
  // Vẽ path thân bình (local coords: đáy tại y=0, miệng ở y=-h). Trả về {mouthX, mouthY}
  function traceVessel(ctx, v){
    var w = v.w, h = v.h;
    ctx.beginPath();
    if (v.type === 'beaker'){
      var r = 12;
      ctx.moveTo(-w/2, -h);
      ctx.lineTo(-w/2, -r); ctx.quadraticCurveTo(-w/2, 0, -w/2+r, 0);
      ctx.lineTo(w/2-r, 0);  ctx.quadraticCurveTo(w/2, 0, w/2, -r);
      ctx.lineTo(w/2, -h); ctx.closePath();
      return {mx:0, my:-h};
    } else if (v.type === 'flask'){ // bình tam giác VẼ LẠI: cổ cao thon, thân loe rộng, đáy phẳng
      var nw = w*0.24, nh = h*0.40;
      ctx.moveTo(-nw/2, -h);
      ctx.lineTo(-nw/2, -h+nh);
      ctx.lineTo(-w/2+4, -16); ctx.quadraticCurveTo(-w/2-2, -3, -w/2+10, 0);
      ctx.lineTo(w/2-10, 0);  ctx.quadraticCurveTo(w/2+2, -3, w/2-4, -16);
      ctx.lineTo(nw/2, -h+nh); ctx.lineTo(nw/2, -h); ctx.closePath();
      return {mx:0, my:-h};
    } else if (v.type === 'tube'){ // TUBE_STAND_V1: ống nghiệm thon dài, miệng loe nhẹ
      var tw = w*0.40, tr = tw/2;
      var rimW = tw*1.30, rimH = 11;
      ctx.moveTo(-rimW/2, -h);
      ctx.lineTo(-rimW/2, -h+rimH);
      ctx.lineTo(-tr, -h+rimH+7);
      ctx.lineTo(-tr, -tr); ctx.arc(0, -tr, tr, Math.PI, 0, true); /* BUGFIX2: true = vẽ đáy chữ U đúng */
      ctx.lineTo(tr, -h+rimH+7);
      ctx.lineTo(rimW/2, -h+rimH);
      ctx.lineTo(rimW/2, -h);
      ctx.closePath();
      return {mx:0, my:-h};
    } else if (v.type === 'bottle'){ // chai đựng hóa chất
      var bw2 = w*0.62, bh2 = h*0.62, nwb = w*0.30, nhb = h*0.30, r2 = 10;
      ctx.moveTo(-nwb/2, -h);
      ctx.lineTo(-nwb/2, -h+nhb);
      ctx.lineTo(-bw2/2, -h+nhb);
      ctx.lineTo(-bw2/2, -r2); ctx.quadraticCurveTo(-bw2/2, 0, -bw2/2+r2, 0);
      ctx.lineTo(bw2/2-r2, 0); ctx.quadraticCurveTo(bw2/2, 0, bw2/2, -r2);
      ctx.lineTo(bw2/2, -h+nhb);
      ctx.lineTo(nwb/2, -h+nhb);
      ctx.lineTo(nwb/2, -h);
      ctx.closePath();
      return {mx:0, my:-h};
    } else { // round: bình cầu
      var R = w*0.40, cy = -R-6, nw2 = w*0.22, nh2 = h*0.26;
      ctx.arc(0, cy, R, 0, Math.PI*2);
      ctx.moveTo(nw2/2, cy-R+4); ctx.lineTo(nw2/2, -h);
      ctx.lineTo(-nw2/2, -h); ctx.lineTo(-nw2/2, cy-R+4);
      ctx.closePath();
      return {mx:0, my:-h};
    }
  }
  function innerW(v){ return v.type==='tube' ? v.w*0.40-8 : (v.type==='bottle' ? v.w*0.62-12 : v.w-12); }

  // GAS_COLLECT: vẽ ống dẫn khí cong + bình thu khí úp ngược; nước bị khí đẩy xuống dần
  function drawGasCollector(ctx, v, t){
    var jw = 46, jh = 66;
    var jx = v.x + v.w/2 + 62;
    var jTop = v.y - v.h - jh - 26, jBot = jTop + jh;
    var gas = Math.max(0, Math.min(1, v.collector.gas || 0));
    ctx.save();
    ctx.lineCap = 'round';
    // Ống dẫn khí cong từ miệng ống nghiệm sang miệng bình thu
    var mx0 = v.x, my0 = v.y - v.h, cx1 = v.x + 44, cy1 = v.y - v.h - 34;
    ctx.strokeStyle = 'rgba(160,220,245,0.28)'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(mx0,my0); ctx.quadraticCurveTo(cx1,cy1,jx,jBot-6); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,245,255,0.85)'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(mx0,my0); ctx.quadraticCurveTo(cx1,cy1,jx,jBot-6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx0,my0); ctx.quadraticCurveTo(cx1,cy1,jx,jBot-6); ctx.stroke();
    // Bọt khí chạy dọc ống dẫn khi đang sủi
    if ((v.fizz||0) > 0.25){
      for (var gi2=0; gi2<4; gi2++){
        var gu = ((t*0.9 + gi2/4) % 1);
        var bx = (1-gu)*(1-gu)*mx0 + 2*(1-gu)*gu*cx1 + gu*gu*jx;
        var by = (1-gu)*(1-gu)*my0 + 2*(1-gu)*gu*cy1 + gu*gu*(jBot-6);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, 7); ctx.fill();
      }
    }
    // Thân bình úp ngược
    var jg = ctx.createLinearGradient(jx-jw/2, 0, jx+jw/2, 0);
    jg.addColorStop(0,'rgba(140,200,235,0.20)'); jg.addColorStop(0.5,'rgba(220,245,255,0.10)'); jg.addColorStop(1,'rgba(140,200,235,0.20)');
    ctx.fillStyle = jg;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(jx-jw/2, jTop, jw, jh, 8); else ctx.rect(jx-jw/2, jTop, jw, jh);
    ctx.fill();
    // Nước trong bình (bị khí đẩy xuống)
    var waterH = (jh - 10) * (1 - gas);
    if (waterH > 2){
      var wg2 = ctx.createLinearGradient(0, jBot - waterH, 0, jBot);
      wg2.addColorStop(0, 'rgba(125,211,252,0.85)'); wg2.addColorStop(1, 'rgba(2,132,199,0.85)');
      ctx.fillStyle = wg2;
      ctx.fillRect(jx-jw/2+4, jBot - 4 - waterH, jw-8, waterH);
    }
    // Vùng khí đã thu
    if (gas > 0.02){
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(jx-jw/2+4, jTop+4, jw-8, (jh-10)*gas);
      ctx.fillStyle = '#fef9c3'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('H₂ ' + Math.round(gas*100) + '%', jx, jTop + 16);
    }
    // Viền bình + nhãn
    ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(jx-jw/2, jTop, jw, jh, 8); else ctx.rect(jx-jw/2, jTop, jw, jh);
    ctx.stroke();
    ctx.fillStyle = '#a5f3fc'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Bình thu khí', jx, jBot + 14);
    ctx.restore();
  }
  // ---------- Vẽ một bình (phong cách video: viền sáng + dung dịch phát sáng) ----------
function drawVessel(ctx, v, t){
    if (!v || !isFinite(v.x) || !isFinite(v.y) || !(v.w > 0) || !(v.h > 0)) return;
    var col = vesselColor(v) || {color:'#1e293b', glow:'#334155'};
    ctx.save();
    ctx.translate(v.x, v.y);
    if (pour && pour.a===v) ctx.translate(0,-16);
    if ((v.shake||0)>0.01){ ctx.translate(0,-v.h/2); ctx.rotate(Math.sin(t*26+v.id*1.7)*0.11*v.shake); ctx.translate(0,v.h/2); }
    if (v.pop){ var s = 1 + 0.25*Math.sin(Math.min(1,v.pop)*Math.PI); ctx.scale(s,s); v.pop = Math.max(0, v.pop-0.06); }
    if (v.dragging){ ctx.scale(1.08, 1.08); }
    if (v.tilt){ ctx.translate(0,-v.h); ctx.rotate(v.tilt*v.tiltDir); ctx.translate(0,v.h); }

    var iw = innerW(v), ih = v.h - 14;
    var wamp = 1 + (v.heat||0)*1.8;
    var liqH = Math.max(0, v.volShown) * ih;
    var surfY = -6 - liqH;

    // --- 0. Bóng đổ dưới đáy bình ---
    ctx.save();
    if (v.type==='tube' && !v.dragging){
      // TUBE_STAND_V1: ống treo cao — bóng đổ xuống mặt bàn
      var _shY = (G.h - 30) - v.y;
      ctx.fillStyle = 'rgba(0,0,0,0.30)';
      ctx.beginPath(); ctx.ellipse(0, _shY, v.w*0.46, 11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(0, _shY, v.w*0.58, 14, 0, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(0, 4, v.w*0.52, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(0, 4, v.w*0.64, 12, 0, 0, 7); ctx.fill();
    }
    ctx.restore();

    // --- 1. Dung dịch (cắt theo thân bình) ---
    ctx.save();
    traceVessel(ctx, v); ctx.clip();
    if (liqH > 2){
      var g = ctx.createLinearGradient(0, surfY, 0, 0);
      g.addColorStop(0, col.color);
      g.addColorStop(0.55, col.glow);
      g.addColorStop(1, shade(col.glow, -30));
      ctx.fillStyle = g;
      ctx.fillRect(-v.w/2, surfY, v.w, liqH+8);
      // Lõi phát sáng mạnh
      var rg = ctx.createRadialGradient(0, -liqH*0.40, 2, 0, -liqH*0.40, iw*0.95);
      rg.addColorStop(0, 'rgba(255,255,255,0.85)');
      rg.addColorStop(0.30, hexA(col.glow, 0.75));
      rg.addColorStop(0.65, hexA(col.glow, 0.32));
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(-v.w/2, surfY, v.w, liqH+8);
      // Xoáy thiên hà cho bình cầu
      if (v.type === 'round'){
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (var sIdx=0;sIdx<3;sIdx++){
          var rr = iw*0.32 - sIdx*iw*0.09;
          var a0 = v.swirl*(1+sIdx*0.35) + sIdx*2.1;
          ctx.strokeStyle = hexA(sIdx%2 ? '#ffffff' : col.color, 0.5);
          ctx.lineWidth = 3.5 - sIdx;
          ctx.beginPath();
          ctx.arc(0, -liqH*0.45, Math.max(4,rr), a0, a0+4.2);
          ctx.stroke();
        }
        ctx.restore();
      }
      // Mặt sóng động
      ctx.beginPath();
      var x0 = -iw/2, x1 = iw/2;
      ctx.moveTo(x0, surfY + wave(x0,t,wamp));
      for (var wx=x0; wx<=x1; wx+=6) ctx.lineTo(wx, surfY + wave(wx,t,wamp));
      ctx.lineTo(x1, surfY+7); ctx.lineTo(x0, surfY+7); ctx.closePath();
      ctx.fillStyle = hexA('#ffffff', 0.28);
      ctx.fill();
      // LABV3: mặt dung dịch cong ellipse
      ctx.beginPath();
      ctx.ellipse(0, surfY+1, iw/2*0.94, 5, 0, 0, Math.PI*2);
      ctx.fillStyle = hexA('#ffffff', 0.30);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-iw*0.14, surfY-0.5, iw*0.26, 2.4, -0.12, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.60)';
      ctx.fill();
      // Bọt khí: 9-27 bọt nổi lên
      var nb = Math.round((9 + Math.round(v.fizz*22)) * (1 + (v.heat||0)*1.6));
      for (var bi=0; bi<nb; bi++){
        var bb = v.bubbles[bi];
        if (!bb){ bb = v.bubbles[bi] = {bx: Math.random(), by: Math.random(), r: 1.5+Math.random()*2.5, sp: 0.25+Math.random()*0.6}; }
        bb.by += bb.sp*0.016*(1+v.fizz*2+(v.heat||0)*3.2);
        if (bb.by > 1){ bb.by = 0; bb.bx = Math.random(); }
        var px = (bb.bx-0.5)*iw*0.85, py = -4 - bb.by*liqH;
        var bgr = ctx.createRadialGradient(px-0.6,py-0.6,0.4,px,py,bb.r);
        bgr.addColorStop(0,'rgba(255,255,255,0.95)');
        bgr.addColorStop(0.55,'rgba(255,255,255,0.30)');
        bgr.addColorStop(1,'rgba(255,255,255,0.06)');
        ctx.fillStyle = bgr;
        ctx.beginPath(); ctx.arc(px,py,bb.r,0,7); ctx.fill();
      }
    }
    // Kết tủa trắng lắng xuống đáy
    if (v.precip && v.precip.length){
      for (var ppi=0; ppi<v.precip.length; ppi++){
        var pp = v.precip[ppi];
        var ppx = (pp.x-0.5)*iw*0.85, ppy = -4 - pp.y*liqH;
        ctx.fillStyle = v.precipCol ? hexA(v.precipCol, 0.95) : 'rgba(255,255,255,0.92)';
        ctx.beginPath(); ctx.arc(ppx,ppy,pp.r,0,7); ctx.fill();
      }
      if ((v.milky||0) > 0){
        ctx.fillStyle = v.precipCol ? hexA(v.precipCol, (v.milky*0.30)) : 'rgba(255,255,255,' + (v.milky*0.30).toFixed(2) + ')';
        ctx.fillRect(-v.w/2, surfY, v.w, liqH+8);
      }
    }
    // Lan màu từ giọt chỉ thị (pipet)
    v.diffusions = v.diffusions || [];
    for (var dfi=v.diffusions.length-1; dfi>=0; dfi--){
      var df = v.diffusions[dfi];
      df.r += (df.maxR - df.r)*0.07 + 0.5; df.a -= 0.004;
      if (df.a <= 0.02 || df.r >= df.maxR){ v.diffusions.splice(dfi,1); continue; }
      var dfg = ctx.createRadialGradient(df.x, df.y, 1, df.x, df.y, df.r);
      dfg.addColorStop(0, hexA(df.color, Math.min(0.6,df.a)));
      dfg.addColorStop(1, hexA(df.color, 0));
      ctx.fillStyle = dfg;
      ctx.beginPath(); ctx.arc(df.x, df.y, df.r, 0, 7); ctx.fill();
    }
    // Giọt pipet đang rơi
    (v.fallDrops||[]).forEach(function(fd2){
      ctx.fillStyle = hexA(fd2.color, 0.95);
      ctx.beginPath(); ctx.arc(fd2.x, fd2.y, 3.2, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(fd2.x-1, fd2.y-1, 1.2, 0, 7); ctx.fill();
    });
    ctx.restore(); // hết clip

    // --- 2. Thân thủy tinh ---
    traceVessel(ctx, v);
    var gg2 = ctx.createRadialGradient(0, -v.h*0.48, 6, 0, -v.h*0.48, v.w*0.72);
    gg2.addColorStop(0, 'rgba(255,255,255,0.26)');
    gg2.addColorStop(0.45, 'rgba(255,255,255,0.07)');
    gg2.addColorStop(0.78, 'rgba(8,18,38,0.22)');
    gg2.addColorStop(1, 'rgba(8,18,38,0.04)');
    ctx.fillStyle = gg2; ctx.fill();
    // Viền phát quang
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.shadowColor = col.glow; ctx.shadowBlur = 24;
    traceVessel(ctx, v);
    ctx.strokeStyle = hexA(col.glow, 0.85); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    ctx.lineJoin = 'round';
    traceVessel(ctx, v);
    ctx.strokeStyle = hexA(col.glow, 0.40); ctx.lineWidth = 11; ctx.stroke();
    traceVessel(ctx, v);
    ctx.strokeStyle = 'rgba(230,250,255,0.98)'; ctx.lineWidth = 2.6; ctx.stroke();
    // LABV3: 2 vệt sáng chéo dài kiểu thủy tinh thật
    ctx.save();
    traceVessel(ctx, v); ctx.clip();
    function vStreak(x0, wd, alpha){
      var hg = ctx.createLinearGradient(x0, -v.h, x0+wd, 0);
      hg.addColorStop(0, 'rgba(255,255,255,'+alpha+')');
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.moveTo(x0, -v.h); ctx.lineTo(x0+wd, -v.h);
      ctx.lineTo(x0+wd*0.30, 0); ctx.lineTo(x0-wd*0.70, 0); ctx.closePath(); ctx.fill();
    }
    vStreak(-v.w/2+8, 26, 0.80);
    vStreak(v.w*0.06, 13, 0.42);
    ctx.restore();
    // Ống nghiệm 3D: cong trụ thủy tinh
    if (v.type === 'tube'){
      ctx.save(); traceVessel(ctx, v); ctx.clip();
      var cg2 = ctx.createLinearGradient(-v.w*0.22, 0, v.w*0.22, 0);
      cg2.addColorStop(0,'rgba(8,18,36,0.38)');
      cg2.addColorStop(0.30,'rgba(8,18,36,0)');
      cg2.addColorStop(0.50,'rgba(255,255,255,0.10)');
      cg2.addColorStop(0.70,'rgba(8,18,36,0)');
      cg2.addColorStop(1,'rgba(8,18,36,0.38)');
      ctx.fillStyle = cg2; ctx.fillRect(-v.w*0.24, -v.h, v.w*0.48, v.h);
      var hg2 = ctx.createLinearGradient(-7,0,7,0);
      hg2.addColorStop(0,'rgba(255,255,255,0)');
      hg2.addColorStop(0.5,'rgba(255,255,255,0.60)');
      hg2.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = hg2; ctx.fillRect(-9, -v.h+8, 18, v.h-18);
      ctx.strokeStyle = 'rgba(205,240,255,0.65)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -v.w*0.22, v.w*0.22-3, 0.12*Math.PI, 0.88*Math.PI); ctx.stroke();
      ctx.restore();
      // TUBE_STAND_V1: bỏ kẹp gỗ cũ — ống được giữ bởi giá đỡ kim loại vẽ ở world coords (sau ctx.restore)
    }
    // LABV3: Nút bần gỗ trên miệng bình tam giác + chai (kiểu video quảng cáo)
    if ((v.type === 'flask' || v.type === 'bottle') && (v.tilt||0) < 0.25){
      var neckW = v.type==='flask' ? v.w*0.26 : v.w*0.30;
      var capW = neckW + 10, capH = 14, capY = -v.h - capH + 4;
      var cwg = ctx.createLinearGradient(0, capY, 0, capY+capH);
      cwg.addColorStop(0, '#e0aa5e'); cwg.addColorStop(0.5, '#b07f3e'); cwg.addColorStop(1, '#7c5426');
      ctx.fillStyle = cwg;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-capW/2, capY, capW, capH, 4); else ctx.rect(-capW/2, capY, capW, capH);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,35,10,0.65)'; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,235,190,0.55)';
      ctx.fillRect(-capW/2+2, capY+2, 3, capH-4);
      ctx.strokeStyle = 'rgba(90,55,20,0.55)'; ctx.lineWidth = 1;
      for (var cgi=1; cgi<4; cgi++){
        var cly = capY + (capH*cgi/3);
        ctx.beginPath(); ctx.moveTo(-capW/2+1, cly); ctx.lineTo(capW/2-1, cly); ctx.stroke();
      }
    }
    // 3 tia lấp lánh
    for (var gi=0; gi<3; gi++){
      var gx = -v.w/2 + v.w*(0.18+gi*0.32), gyy = -v.h*(0.25+gi*0.28);
      var tw = 0.35 + 0.65*Math.abs(Math.sin(t*2.2 + gi*2.4 + v.id));
      drawSpark(ctx, gx, gyy, 11*tw, 'rgba(255,255,255,'+(0.9*tw).toFixed(2)+')');
    }
    // Vạch chia độ cho cốc đong
    if (v.type === 'beaker'){
      ctx.strokeStyle = 'rgba(205,240,255,0.5)'; ctx.lineWidth = 1.5;
      for (var mi2=1; mi2<=3; mi2++){
        var myy = -(v.h/4)*mi2;
        ctx.beginPath(); ctx.moveTo(v.w/2-16, myy); ctx.lineTo(v.w/2-6, myy); ctx.stroke();
      }
    }
    ctx.restore();

    // TUBE_STAND_V1: giá đỡ ống nghiệm — thanh đứng + tay kẹp, ống treo cao cách bàn 80px (có chỗ đặt đèn cồn đun bên dưới)
    if (v.type==='tube' && !v.dragging && (v.tilt||0) < 0.3){
      (function(){
        var tableY = G.h - 30;
        var rodX = v.x + v.w*0.30 + 14;
        var clampY = v.y - v.h*0.62;
        var twHalf = v.w*0.20;
        // đế nặng trên mặt bàn
        var bgd = ctx.createLinearGradient(0, tableY-10, 0, tableY);
        bgd.addColorStop(0,'#6b7280'); bgd.addColorStop(1,'#1f2937');
        ctx.fillStyle = bgd;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rodX-26, tableY-10, 52, 10, 5); else ctx.rect(rodX-26, tableY-10, 52, 10);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(rodX-26, tableY-10, 52, 2);
        // thanh đứng kim loại
        var rgd = ctx.createLinearGradient(rodX-4, 0, rodX+4, 0);
        rgd.addColorStop(0,'#6b7280'); rgd.addColorStop(0.5,'#e5e7eb'); rgd.addColorStop(1,'#6b7280');
        ctx.fillStyle = rgd; ctx.fillRect(rodX-4, clampY-6, 8, tableY-10-(clampY-6));
        // khớp nối (bosshead)
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rodX-9, clampY-11, 18, 12, 3); else ctx.rect(rodX-9, clampY-11, 18, 12);
        ctx.fill();
        ctx.fillStyle = '#9ca3af'; ctx.fillRect(rodX-9, clampY-7, 18, 3);
        // tay kẹp ngang tới ống nghiệm
        ctx.fillStyle = '#4b5563'; ctx.fillRect(v.x+twHalf-2, clampY-3.5, rodX-4-(v.x+twHalf-2), 7);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(v.x+twHalf-2, clampY-3.5, rodX-4-(v.x+twHalf-2), 2);
        // hàm kẹp gỗ quanh ống
        ctx.fillStyle = '#a5713f';
        ctx.fillRect(v.x-twHalf-7, clampY-9, 7, 18);
        ctx.fillRect(v.x+twHalf, clampY-9, 7, 18);
        ctx.strokeStyle = 'rgba(60,35,10,0.6)'; ctx.lineWidth = 1;
        ctx.strokeRect(v.x-twHalf-7, clampY-9, 7, 18);
        ctx.strokeRect(v.x+twHalf, clampY-9, 7, 18);
        ctx.fillStyle = 'rgba(255,235,190,0.5)';
        ctx.fillRect(v.x-twHalf-6, clampY-8, 2, 16);
        ctx.fillRect(v.x+twHalf+1, clampY-8, 2, 16);
      })();
    }

    // GAS_COLLECT: vẽ bộ thu khí cho ống nghiệm (world coords)
    if (v.type==='tube' && v.collector && !v.dragging && (v.tilt||0) < 0.3){
      drawGasCollector(ctx, v, t);
    }
    // --- 3. Nhãn tên + % thể tích (LABV3: nằm trên mặt bàn gỗ) ---
    var chem = CHEMS[v.chemKey];
    ctx.fillStyle = '#a5f3fc'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(chem ? chem.f : '', v.x, v.y + 13);
    ctx.fillStyle = 'rgba(165,243,252,0.60)'; ctx.font = '9px sans-serif';
    ctx.fillText(Math.round(v.volShown*100) + '%', v.x, v.y + 25);
    // Huy hiệu góc nghiêng khi rót
    if ((v.tilt||0) > 0.08){
      var deg = Math.round(v.tilt*57.2958);
      var mxw = v.x, myw = v.y - v.h;
      var aa0 = -Math.PI/2, aa1 = aa0 + v.tilt*v.tiltDir;
      ctx.strokeStyle = 'rgba(253,224,71,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mxw, myw, 26, Math.min(aa0,aa1), Math.max(aa0,aa1)); ctx.stroke();
      ctx.fillStyle = '#fde047'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('≈' + deg + '°', mxw + v.tiltDir*36, myw - 16);
    }
    // BOOM_FX: quả cầu lửa + tia lửa khi nổ
    if ((v.boom||0) > 0.01){
      var br2 = (1 - v.boom) * 64 + 12;
      var fg2 = ctx.createRadialGradient(v.x, v.y - v.h/2, 2, v.x, v.y - v.h/2, br2);
      fg2.addColorStop(0, 'rgba(255,255,220,' + (0.95*v.boom).toFixed(2) + ')');
      fg2.addColorStop(0.45, 'rgba(255,170,60,' + (0.75*v.boom).toFixed(2) + ')');
      fg2.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = fg2;
      ctx.beginPath(); ctx.arc(v.x, v.y - v.h/2, br2, 0, 7); ctx.fill();
      for (var spi2=0; spi2<12; spi2++){
        var sa2 = (spi2/12)*6.28 + t*2.5, sr2 = br2*(0.5 + 0.5*((spi2*37)%10)/10);
        drawSpark(ctx, v.x + Math.cos(sa2)*sr2, v.y - v.h/2 + Math.sin(sa2)*sr2, 5, 'rgba(255,200,90,' + (v.boom*0.9).toFixed(2) + ')');
      }
    }
    // BURN_FX: ngọn lửa xanh khi cồn cháy
    if (v.type==='tube' && hasType(v,'fuel') && (v.heat||0) > 0.5){
      var fl = 26 + 8*Math.sin(t*14);
      var flg = ctx.createLinearGradient(0, v.y - v.h, 0, v.y - v.h - fl);
      flg.addColorStop(0, 'rgba(59,130,246,0.9)');
      flg.addColorStop(0.6, 'rgba(147,197,253,0.55)');
      flg.addColorStop(1, 'rgba(147,197,253,0)');
      ctx.fillStyle = flg;
      ctx.beginPath();
      ctx.moveTo(v.x - 9, v.y - v.h);
      ctx.quadraticCurveTo(v.x, v.y - v.h - fl - 10, v.x + 9, v.y - v.h);
      ctx.closePath(); ctx.fill();
    }
    // Hơi nước khi đun nóng
    if ((v.heat||0) > 0.5){
      if (!v.steam) v.steam = [];
      if (Math.random() < 0.35 && v.steam.length < 14)
        v.steam.push({x:(Math.random()-0.5)*22, y:-v.h-6, r:2.5+Math.random()*3, a:0.45});
      v.steam = v.steam.filter(function(sm){ sm.y -= 1.4; sm.a -= 0.009; sm.r += 0.06; return sm.a > 0; });
      v.steam.forEach(function(sm){
        ctx.fillStyle = 'rgba(255,255,255,' + sm.a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(v.x+sm.x, v.y+sm.y, sm.r, 0, 7); ctx.fill();
      });
      ctx.fillStyle = '#fdba74'; ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Đang đun', v.x, v.y - v.h - 30);
    }
    // Khói nhẹ khi đun mạnh
    if ((v.heat||0) > 0.72){
      if (!v.smoke) v.smoke = [];
      if (Math.random() < 0.22 && v.smoke.length < 10)
        v.smoke.push({x:(Math.random()-0.5)*16, y:-v.h-8, r:3+Math.random()*4, a:0.30});
      v.smoke = v.smoke.filter(function(sk){ sk.y -= 1.1; sk.a -= 0.006; sk.r += 0.05; return sk.a > 0; });
      v.smoke.forEach(function(sk){
        ctx.fillStyle = 'rgba(120,130,145,' + sk.a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(v.x+sk.x, v.y+sk.y, sk.r, 0, 7); ctx.fill();
      });
      if (v.heat > 0.9){
        ctx.fillStyle = '#fdba74'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('SÔI!', v.x, v.y - v.h - 44);
      }
    }
    // Vòng chọn
    if (v.sel){
      ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3;
      ctx.setLineDash([7,5]); ctx.lineDashOffset = -t*20;
      ctx.beginPath(); ctx.arc(v.x, v.y - v.h/2, Math.max(v.w,v.h)/2 + 12, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      v.closeBtn = {x: v.x + v.w/2 + 2, y: v.y - v.h - 6, r: 11};
      ctx.fillStyle = '#f87171';
      ctx.beginPath(); ctx.arc(v.closeBtn.x, v.closeBtn.y, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('✕', v.closeBtn.x, v.closeBtn.y + 4);
    } else v.closeBtn = null;
    v.rect = {x0: v.x - v.w/2 - 8, y0: v.y - v.h - 14, x1: v.x + v.w/2 + 8, y1: v.y + 8};
  }
  function wave(x, t, amp){ amp = amp||1; return (Math.sin(x*0.11 + t*3.1)*2.4 + Math.sin(x*0.23 - t*2.1)*1.4)*amp; }
  function drawSpark(ctx, x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y-r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.quadraticCurveTo(x, y, x, y+r);
    ctx.quadraticCurveTo(x, y, x-r, y); ctx.quadraticCurveTo(x, y, x, y-r);
    ctx.fill();
  }
  // ---------- Đèn cồn ----------
  var lamp = {x: 0, y: 0, flameX: 0, flameY: 0, flare: 0};
  function lampPath(ctx){
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-30, -18); ctx.quadraticCurveTo(-30, -34, -14, -36);
    ctx.lineTo(-9, -36); ctx.lineTo(-9, -46); ctx.lineTo(9, -46); ctx.lineTo(9, -36);
    ctx.lineTo(14, -36); ctx.quadraticCurveTo(30, -34, 30, -18);
    ctx.lineTo(30, 0); ctx.quadraticCurveTo(30, 5, 24, 5);
    ctx.lineTo(-24, 5); ctx.quadraticCurveTo(-30, 5, -30, 0);
    ctx.closePath();
  }
  function drawLamp(ctx, t){
    var x = lamp.x, y = lamp.y;
    ctx.save(); ctx.translate(x, y);
    lampPath(ctx);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
    ctx.save(); lampPath(ctx); ctx.clip();
    var ag = ctx.createLinearGradient(0, -14, 0, 4);
    ag.addColorStop(0, 'rgba(147,197,253,0.10)');
    ag.addColorStop(1, 'rgba(59,130,246,0.45)');
    ctx.fillStyle = ag; ctx.fillRect(-32, -14, 64, 20);
    ctx.restore();
    lampPath(ctx);
    ctx.strokeStyle = 'rgba(140,220,255,0.30)'; ctx.lineWidth = 5; ctx.stroke();
    lampPath(ctx);
    ctx.strokeStyle = 'rgba(205,240,255,0.9)'; ctx.lineWidth = 1.8; ctx.stroke();
    // bấc đèn
    ctx.fillStyle = '#1f2937'; ctx.fillRect(-2.5, -50, 5, 8);
    // lửa xanh lam
    var fl = (30 + 4*Math.sin(t*13) + 2*Math.sin(t*29+1.7)) * (1 + lamp.flare*0.35);
    var lean = 3*Math.sin(t*7.3);
    var fg = ctx.createRadialGradient(0, -56, 4, 0, -56, 32);
    fg.addColorStop(0, 'rgba(96,165,250,0.55)'); fg.addColorStop(1, 'rgba(96,165,250,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, -56, 32, 0, 7); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lean*0.3, -46);
    ctx.bezierCurveTo(12+lean, -54, 8+lean, -70, lean, -46-fl);
    ctx.bezierCurveTo(-8+lean, -70, -12+lean, -54, lean*0.3, -46);
    ctx.closePath();
    var flg = ctx.createLinearGradient(0, -46, 0, -46-fl);
    flg.addColorStop(0, '#1e40af'); flg.addColorStop(0.55, '#3b82f6'); flg.addColorStop(1, '#bfdbfe');
    ctx.fillStyle = flg; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lean*0.2, -46);
    ctx.bezierCurveTo(5+lean*0.6, -50, 4+lean*0.6, -58, lean*0.5, -46-fl*0.55);
    ctx.bezierCurveTo(-4+lean*0.6, -58, -5+lean*0.6, -50, lean*0.2, -46);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239,246,255,0.95)'; ctx.fill();
    drawSpark(ctx, 14, -60, 4+2*Math.abs(Math.sin(t*3)), 'rgba(147,197,253,0.8)');
    ctx.fillStyle = 'rgba(165,243,252,0.75)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Đèn cồn', 0, 22);
    ctx.restore();
    lamp.flameX = x + lean; lamp.flameY = y - 52 - fl*0.45;
  }
  function parseColor(c){
    if (c && c.charAt(0) === '#') return hexRgb(c);
    var m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c||'');
    return m ? [+m[1],+m[2],+m[3]] : [128,128,128];
  }
  function shade(hex, amt){
    var c = parseColor(hex);
    return rgbStr(Math.max(0,Math.min(255,c[0]+amt)), Math.max(0,Math.min(255,c[1]+amt)), Math.max(0,Math.min(255,c[2]+amt)));
  }
  function hexA(hex, a){
    var c = parseColor(hex);
    return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';
  }


  // ---------- Nhân vật hoạt hình 3D (phong cách video quảng cáo) ----------
  var chemist = { hx:0, hy:0, mode:'idle', hold:null, armT:0, bobP: Math.random()*6.28, _sx:null, _sy:0 };
  var lampDrag = false;
  var lampPress = null; // LAMP_TOGGLE: phân biệt bấm (toggle) vs kéo (drag)
  function chemistHome(W,H){ return {x: W*0.5, y: H-30}; } /* CENTERBIG_V1 */// nhân vật to đứng giữa canvas, layer nền
  function ikSolve(sx, sy, tx, ty, L1, L2){
    var dx = tx-sx, dy = ty-sy, d = Math.hypot(dx,dy) || 0.001;
    var maxD = L1+L2-2, minD = Math.abs(L1-L2)+2;
    var dc = Math.max(minD, Math.min(maxD, d));
    var ang = Math.atan2(dy,dx);
    var cosA = Math.max(-1, Math.min(1, (L1*L1+dc*dc-L2*L2)/(2*L1*dc)));
    var a = Math.acos(cosA);
    var e1x = sx+L1*Math.cos(ang+a), e1y = sy+L1*Math.sin(ang+a);
    var e2x = sx+L1*Math.cos(ang-a), e2y = sy+L1*Math.sin(ang-a);
    var ex = e1y>e2y?e1x:e2x, ey = e1y>e2y?e1y:e2y;
    return {ex:ex, ey:ey, hx: sx+dc*Math.cos(ang), hy: sy+dc*Math.sin(ang)};
  }
  function updateChemist(t, W, H){
    var mode = 'idle', tgt = null, hold = null;
    if (pour){ mode='pour'; var a=pour.a; tgt={x:a.x-a.tiltDir*(a.w*0.5+16), y:a.y-a.h*0.52}; hold='pour'; }
    else if (typeof carryAnim!=='undefined' && carryAnim){ mode='carry'; tgt={x:carryAnim.a.x, y:carryAnim.a.y-carryAnim.a.h*0.5}; hold='grip'; }
    else if (typeof heatDemo!=='undefined' && heatDemo && heatDemo.tube){ mode='heat'; tgt={x:lamp.x-30, y:lamp.y-34}; hold='lamp'; }
    else if (lampDrag){ mode='heat'; tgt={x:lamp.x-30, y:lamp.y-34}; hold='lamp'; }
    else {
      var dg=null, pd=null, i;
      for (i=0;i<vessels.length;i++){ if(vessels[i].dragging) dg=vessels[i]; }
      if (dg && dg.type==='tube'){ mode='clamp'; tgt={x:dg.x+26, y:dg.y-dg.h*0.62}; hold='clamp'; }
      else if (dg){ mode='carry'; tgt={x:dg.x, y:dg.y-dg.h*0.5}; hold='grip'; }
      else {
        for (i=0;i<vessels.length;i++){ if(vessels[i].fallDrops&&vessels[i].fallDrops.length) pd=vessels[i]; }
        if (pd && pipetOn){ mode='pipet'; tgt={x:pd.x+18, y:pd.y-pd.h-34}; hold='pipet'; }
      }
    }
    chemist.mode = mode; chemist.hold = hold;
    var home = chemistHome(W,H);
    if (!tgt) tgt = {x: home.x+16, y: home.y-52};
    if (chemist.hx===0 && chemist.hy===0){ chemist.hx=tgt.x; chemist.hy=tgt.y; }
    var k = 0.14;
    chemist.hx += (tgt.x-chemist.hx)*k; chemist.hy += (tgt.y-chemist.hy)*k;
    chemist.armT += ((mode==='idle'?0:1)-chemist.armT)*0.1;
  }
function drawChemistBack(ctx, t, W, H){
    // LABV3: cậu bé anime vẽ lại — tóc búi dây vàng, mắt to long lanh, áo cổ trang navy viền vàng
    var home = chemistHome(W,H);
    var bob = Math.sin(t*2.2+chemist.bobP)*1.5;
    var x = home.x, fy = home.y;
    ctx.save(); ctx.translate(x, fy+bob*0.4); ctx.scale(2.0,2.0); /* CENTERBIG_V1 *//* nhân vật to gấp đôi, đứng giữa canvas ở layer nền */
    // Bóng đổ
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(0,2,22,6,0,0,7); ctx.fill();
    // Giày
    ctx.fillStyle='#10182c';
    ctx.beginPath(); ctx.ellipse(-8,-5,8,5,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8,-5,8,5,0,0,7); ctx.fill();
    // Chân
    ctx.fillStyle='#232f52';
    ctx.fillRect(-12,-24,9,20); ctx.fillRect(3,-24,9,20);
    // Áo choàng navy
    var cg = ctx.createLinearGradient(-20,0,20,0);
    cg.addColorStop(0,'#18224a'); cg.addColorStop(0.5,'#2c3f7e'); cg.addColorStop(1,'#18224a');
    ctx.fillStyle=cg;
    ctx.beginPath();
    ctx.moveTo(-17,-92); ctx.lineTo(17,-92);
    ctx.lineTo(22,-24); ctx.lineTo(-22,-24); ctx.closePath(); ctx.fill();
    // Nếp gấp áo
    ctx.strokeStyle='rgba(10,16,38,0.45)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.moveTo(-6,-88); ctx.quadraticCurveTo(-8,-56,-5,-28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(7,-88); ctx.quadraticCurveTo(9,-56,6,-28); ctx.stroke();
    // Viền vàng 2 bên áo
    ctx.strokeStyle='#e8b84b'; ctx.lineWidth=2.4;
    ctx.beginPath(); ctx.moveTo(-17,-92); ctx.lineTo(-22,-24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17,-92); ctx.lineTo(22,-24); ctx.stroke();
    // Tay áo rộng bên trái (tay buông)
    ctx.strokeStyle='#2c3f7e'; ctx.lineCap='round'; ctx.lineWidth=11;
    ctx.beginPath(); ctx.moveTo(-15,-86); ctx.quadraticCurveTo(-22,-68,-19,-50); ctx.stroke();
    ctx.strokeStyle='#e8b84b'; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(-22,-56); ctx.quadraticCurveTo(-21,-52,-19,-50); ctx.stroke();
    ctx.fillStyle='#ffd9b3'; ctx.beginPath(); ctx.arc(-19,-44,5,0,7); ctx.fill();
    // Cổ áo chữ V vàng
    ctx.strokeStyle='#e8b84b'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.moveTo(-8,-92); ctx.lineTo(0,-78); ctx.lineTo(8,-92); ctx.stroke();
    // Đai lưng vàng
    ctx.fillStyle='#e8b84b'; ctx.fillRect(-19,-52,38,7);
    ctx.fillStyle='#8a6420'; ctx.fillRect(-4,-52,8,7);
    ctx.fillStyle='#ffe9b0'; ctx.fillRect(-19,-52,38,1.6);
    // Cổ
    ctx.fillStyle='#ffdcbb'; ctx.fillRect(-5,-100,10,9);
    // Đầu
    var hy=-114;
    ctx.fillStyle='#ffdcbb'; ctx.beginPath(); ctx.arc(0,hy,16,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(-16,hy+1,3.4,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(16,hy+1,3.4,0,7); ctx.fill();
    // Tóc đen
    ctx.fillStyle='#1d1414';
    ctx.beginPath(); ctx.arc(0,hy-2,16.5,Math.PI*0.92,Math.PI*2.08); ctx.fill();
    ctx.fillRect(-16.5,hy-18,33,8);
    // Mái 3 chỏm
    ctx.beginPath();
    ctx.moveTo(-16,hy-10); ctx.lineTo(-9,hy-2); ctx.lineTo(-5,hy-11); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6,hy-11); ctx.lineTo(0,hy-1); ctx.lineTo(6,hy-11); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5,hy-11); ctx.lineTo(11,hy-3); ctx.lineTo(16,hy-10); ctx.closePath(); ctx.fill();
    // Tóc mai
    ctx.fillRect(-18,hy-8,4,12); ctx.fillRect(14,hy-8,4,12);
    // Búi tóc cao + dây vàng + tua rua
    ctx.beginPath(); ctx.arc(0,hy-24,7,0,7); ctx.fill();
    ctx.strokeStyle='#e8b84b'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,hy-24,7,0.4,Math.PI-0.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5,hy-27); ctx.quadraticCurveTo(10,hy-22,8,hy-16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8,hy-26); ctx.quadraticCurveTo(13,hy-21,11,hy-15); ctx.stroke();
    // Bóng tóc
    ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(-4,hy-6,10,Math.PI*1.15,Math.PI*1.55); ctx.stroke();
    // Mắt to long lanh
    var blink=(t%3.7)<0.13;
    if (blink){
      ctx.fillStyle='#1d1414';
      ctx.fillRect(-10,hy-2,7,2); ctx.fillRect(3,hy-2,7,2);
    } else {
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.ellipse(-6.5,hy-1,4.6,5.4,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(6.5,hy-1,4.6,5.4,0,0,7); ctx.fill();
      ctx.fillStyle='#2b6cb0';
      ctx.beginPath(); ctx.arc(-6.5,hy,3,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(6.5,hy,3,0,7); ctx.fill();
      ctx.fillStyle='#141821';
      ctx.beginPath(); ctx.arc(-6.5,hy+0.5,1.8,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(6.5,hy+0.5,1.8,0,7); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(-7.3,hy-1.6,1.2,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(5.7,hy-1.6,1.2,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(-5.7,hy+1.4,0.6,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(7.3,hy+1.4,0.6,0,7); ctx.fill();
    }
    // Lông mày
    ctx.strokeStyle='#1d1414'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-11,hy-9); ctx.quadraticCurveTo(-6.5,hy-11.5,-2,hy-9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2,hy-9); ctx.quadraticCurveTo(6.5,hy-11.5,11,hy-9); ctx.stroke();
    // Má hồng
    ctx.fillStyle='rgba(244,114,182,0.5)';
    ctx.beginPath(); ctx.arc(-11,hy+6,3.4,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(11,hy+6,3.4,0,7); ctx.fill();
    // Miệng cười
    ctx.fillStyle='#8a2f1d';
    ctx.beginPath(); ctx.ellipse(0,hy+7.5,4.8,3.6,0,0.12*Math.PI,0.88*Math.PI); ctx.fill();
    ctx.fillStyle='#ff9d9d';
    ctx.beginPath(); ctx.ellipse(0,hy+9,2.6,1.6,0,0,7); ctx.fill();
    ctx.restore();
    // Neo tay phải ở vai phải
    chemist._sx = x+14*2.0; chemist._sy = fy+bob*0.4-86*2.0; /* CENTERBIG_V1 *//* neo tay theo scale 2.0 */
  }
function drawMiniFlask(ctx, x, y, col){
    // LABV3: bình erlenmeyer mini phát sáng trong tay khi rót
    var c = (col && col.color) ? col : {color:'#7dd3fc', glow:'#22d3ee'};
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.55);
    function mp(){
      ctx.beginPath();
      ctx.moveTo(-4,-20); ctx.lineTo(-4,-11); ctx.lineTo(-10,-1);
      ctx.quadraticCurveTo(-11,1,-8,1); ctx.lineTo(8,1);
      ctx.quadraticCurveTo(11,1,10,-1); ctx.lineTo(4,-11); ctx.lineTo(4,-20);
      ctx.closePath();
    }
    ctx.save(); mp(); ctx.clip();
    var lg=ctx.createLinearGradient(0,-8,0,2);
    lg.addColorStop(0,c.color); lg.addColorStop(1,c.glow);
    ctx.fillStyle=lg; ctx.fillRect(-12,-6,24,9);
    var rg=ctx.createRadialGradient(0,-2,1,0,-2,10);
    rg.addColorStop(0,'rgba(255,255,255,0.85)'); rg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=rg; ctx.fillRect(-12,-8,24,11);
    ctx.restore();
    ctx.save(); ctx.shadowColor=c.glow; ctx.shadowBlur=10;
    mp(); ctx.strokeStyle=c.glow; ctx.lineWidth=2.4; ctx.stroke(); ctx.restore();
    mp(); ctx.strokeStyle='rgba(235,250,255,0.95)'; ctx.lineWidth=1.1; ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(-7,-9); ctx.lineTo(-4,-2); ctx.stroke();
    ctx.restore();
  }
  function drawChemistArm(ctx, t){
    if (chemist._sx==null) return;
    var sx = chemist._sx, sy = chemist._sy;
    var k = chemist.armT;
    var rx = sx+2, ry = sy+30;
    var tx = rx+(chemist.hx-rx)*k, ty = ry+(chemist.hy-ry)*k;
    var sol = ikSolve(sx, sy, tx, ty, 36, 34);
    ctx.save(); ctx.lineCap='round';
    // Tay áo trên (navy)
    ctx.strokeStyle='#2c3f7e'; ctx.lineWidth=13;
    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sol.ex,sol.ey); ctx.stroke();
    // Viền vàng cổ tay áo
    ctx.strokeStyle='#e8b84b'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.moveTo(sol.ex-7,sol.ey-7); ctx.lineTo(sol.ex+7,sol.ey+2); ctx.stroke();
    // Cẳng tay
    ctx.strokeStyle='#ffd9b3'; ctx.lineWidth=10;
    ctx.beginPath(); ctx.moveTo(sol.ex,sol.ey); ctx.lineTo(sol.hx,sol.hy); ctx.stroke();
    // Bàn tay
    ctx.fillStyle='#ffd9b3';
    ctx.beginPath(); ctx.arc(sol.hx,sol.hy,8,0,7); ctx.fill();
    var hold = chemist.hold;
    if (k > 0.5 && hold==='clamp'){
      ctx.fillStyle='#c89b62'; ctx.fillRect(sol.hx-9, sol.hy-14, 18, 10);
      ctx.strokeStyle='#9aa5b1'; ctx.lineWidth=2.5; ctx.strokeRect(sol.hx-9, sol.hy-14, 18, 10);
    } else if (k > 0.5 && hold==='pipet'){
      ctx.save(); ctx.translate(sol.hx, sol.hy); ctx.rotate(0.5);
      ctx.fillStyle='rgba(220,235,255,0.85)'; ctx.fillRect(-3,-26,6,20);
      ctx.fillStyle='#8b5cf6';
      ctx.beginPath(); ctx.moveTo(-3,-6); ctx.lineTo(3,-6); ctx.lineTo(0,2); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#1f2937'; ctx.fillRect(-4,-32,8,7);
      ctx.restore();
    } else if (k > 0.5 && hold==='pour'){
      // Cầm bình erlenmeyer mini nghiêng đổ
      drawMiniFlask(ctx, sol.hx, sol.hy-6, pour ? pour.colA : null);
    } else if (k > 0.5 && hold==='lamp'){
      ctx.strokeStyle='rgba(147,197,253,0.9)'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(sol.hx, sol.hy, 11, 0, 7); ctx.stroke();
    } else if (k > 0.5 && hold==='grip'){
      ctx.strokeStyle='rgba(253,224,71,0.85)'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(sol.hx, sol.hy, 12, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }
  // ---------- Rót: dòng chảy phát sáng + chuyển thể tích ----------
  var pour = null, pourQ = [], selV = null, dragV = null, mixDemo = null;
  // ---------- Nhân vật tự thao tác khi chạm bình (theo yêu cầu user) ----------
  var carryAnim = null;   // bình đang được nhân vật "cầm" bay tới ống nghiệm
  var heatDemo = null;    // nhân vật đang đem đèn cồn đun ống nghiệm
  function demoPourToTube(src){
    if (pour || carryAnim){ if (src) flashMsg(src,'Đợi chút nhé...'); return; }
    if (!src || (src.vol||0) < 0.05){ flashMsg(src,'Bình hết rồi! Lấy bình mới từ tủ nhé.'); return; }
    var tube = null, i;
    for (i=0;i<vessels.length;i++) if (vessels[i].type==='tube' && vessels[i]!==src){ tube = vessels[i]; break; }
    if (!tube){
      if (vessels.length >= 4){ flashMsg(src,'Bàn đầy! Cất bớt bình (chạm ✕) rồi thử lại.'); return; }
      tube = makeVessel('tube', null, 0);
      tube.contents = []; tube.vol = 0; tube.volShown = 0; tube.shake = 0; tube.pop = 1; tube.chemKey = null;
      tube.x = 0; tube.y = 0;
      vessels.push(tube);
    }
    if (typeof selV !== 'undefined' && selV){ selV.sel = false; selV = null; }
    try { layout(); } catch(eLay3){}
    // POUR_SIDE: đem bình sang BÊN CẠNH ống nghiệm — miệng bình khớp miệng ống khi nghiêng
    var _side = (src.x <= tube.x) ? -1 : 1;
    var _gw = (typeof G!=='undefined' && G && G.w) ? G.w : 800;
    var _tx = tube.x + _side*(tube.w*0.5 + src.w*0.30 + 10);
    _tx = Math.max(60, Math.min(_gw-60, _tx));
    var _ty = tube.y - tube.h - 16 + src.h;
    carryAnim = {a:src, b:tube, t:0, dur:0.85, fx:src.x, fy:src.y, tx:_tx, ty:_ty};
    src.carried = true; src.returning = false;
    flashMsg(tube,'Nhân vật đang rót vào ống nghiệm...');
  }
  function demoHeatTube(src){
    var tube = null, i, best = 1e9;
    for (i=0;i<vessels.length;i++){
      var v = vessels[i];
      if (v.type==='tube' && (v.volShown||0) > 0.03){
        var d = Math.abs(v.x - (lamp.x||0));
        if (d < best){ best = d; tube = v; }
      }
    }
    if (!tube){ for (i=0;i<vessels.length;i++) if (vessels[i].type==='tube'){ tube = vessels[i]; break; } }
    if (!tube){ flashMsg(src,'Chưa có ống nghiệm! Vào tủ → mục 🧪 Ống nghiệm để lấy nhé.'); return; }
    if (typeof selV !== 'undefined' && selV){ selV.sel = false; selV = null; }
    lamp.tx = Math.max(48, Math.min(G.w-48, tube.x));
    heatDemo = {tube: tube, t:0};
    flashMsg(tube,'Nhân vật đem đèn cồn tới đun...');
  }
  // LAMP_TOGGLE: bấm đèn cồn = tự bay sang đun ống nghiệm; bấm lần nữa = tự quay về
  function toggleLamp(){
    if (typeof heatDemo!=='undefined' && heatDemo && heatDemo.tube){
      var _ht = heatDemo.tube; heatDemo = null;
      try { lamp.tx = null; } catch(eLT){}
      flashMsg(_ht,'Đã tắt đèn cồn!');
      return;
    }
    var tube = null, best = 1e9, i;
    for (i=0;i<vessels.length;i++){
      var v = vessels[i];
      if (v.type==='tube' && (v.volShown||0) > 0.03){
        var d = Math.abs(v.x - (lamp.x||0));
        if (d < best){ best = d; tube = v; }
      }
    }
    if (!tube){ for (i=0;i<vessels.length;i++) if (vessels[i].type==='tube'){ tube = vessels[i]; break; } }
    if (!tube) return;
    var _gw2 = (typeof G!=='undefined' && G && G.w) ? G.w : 800;
    lamp.tx = Math.max(48, Math.min(_gw2-48, tube.x));
    heatDemo = {tube: tube, t:0};
    flashMsg(tube,'Đèn cồn tự bay sang đun!');
  }
  function startPour(a, b){
    if (!a || !b || a === b || pour) return;
    var capA = a.cap || 1, capB = b.cap || 1;
    // Tính theo đơn vị tuyệt đối: 1 ống nghiệm = 1 đơn vị
    var absA = (a.vol || 0) * capA; // lượng tuyệt đối trong nguồn
    var absB = (b.vol || 0) * capB; // lượng tuyệt đối trong đích
    var spaceB = capB - absB; // chỗ trống trong đích
    // POUR_ML: ô nhập ml; để trống = mặc định 42% bình nguồn
    var amtAbs;
    try {
      var _mlEl = document.getElementById('pour-ml');
      var _ml = _mlEl ? parseFloat(_mlEl.value) : NaN;
      if (!isNaN(_ml) && _ml > 0) amtAbs = Math.min(_ml/100 * capA, absA, spaceB);
      else amtAbs = Math.min(0.42 * capA, absA, spaceB);
    } catch(_mle){ amtAbs = Math.min(0.42 * capA, absA, spaceB); }
    if (amtAbs <= 0.01){ flashMsg(b, 'Đã đầy!'); return; }
    // Chuyển về fraction cho animation
    var amtA = amtAbs / capA; // fraction mất đi ở nguồn
    var amtB = amtAbs / capB; // fraction tăng thêm ở đích
    pour = {a:a, b:b, t:0, dur:4.5, amt:amtA, amtB:amtB, a0:a.vol, b0:b.vol,
            colA: vesselColor(a)};
    a.tiltDir = (b.x >= a.x) ? 1 : -1;
    var _sb = document.getElementById('pour-stop'); if (_sb) _sb.classList.remove('hidden');
  }
  // STOP_POUR: ngừng đổ giữa chừng — giữ lại phần đã rót
  function stopPour(){
    if (!pour) return;
    var p = pour; pour = null;
    var _sb3 = document.getElementById('pour-stop'); if (_sb3) _sb3.classList.add('hidden');
    var pr = Math.min(1, p.t / p.dur);
    var e = pr<0.5 ? 2*pr*pr : 1-Math.pow(-2*pr+2,2)/2;
    var transferredA = p.amt * e;
    var transferredB = (p.amtB || p.amt) * e;
    p.a.carried = false; p.a.returning = true; p.a.tilt = 0;
    p.a.vol = +(p.a0 - transferredA).toFixed(3);
    p.b.vol = +(p.b0 + transferredB).toFixed(3);
    if (transferredB > 0.005 && p.a.chemKey){
      p.b.contents.push({k: p.a.chemKey, v: transferredB});
      p.a.contents = [{k: p.a.chemKey, v: p.a.vol}];
      p.a.chemKey = p.a.contents[0].k;
      checkReaction(p.b, p.a.chemKey);
      p.b.shake = 0.9;
    }
    pourQ = [];
    if (mixDemo){ var _md = mixDemo; mixDemo = null; _md.tubes.forEach(function(tb){ tb.shake = 1.5; }); }
  }
  function finishPour(){
    var p = pour; pour = null;
    var _sb2 = document.getElementById('pour-stop'); if (_sb2) _sb2.classList.add('hidden');
    p.a.carried = false; p.a.returning = true;
    p.a.tilt = 0; p.a.vol = +(p.a0 - p.amt).toFixed(3);
    p.b.vol = +(p.b0 + (p.amtB || p.amt)).toFixed(3);
    // Gộp chất đã rót vào bình đích
    p.b.contents.push({k: p.a.chemKey, v: (p.amtB || p.amt)});
    p.a.contents = [{k: p.a.chemKey, v: p.a.vol}];
    p.a.chemKey = p.a.contents[0].k;
    if (p.b.vol <= 0.001) p.b.contents = [];
    // Phản ứng trung hòa?
    checkReaction(p.b, p.a.chemKey);
    p.b.shake = 0.9; // lắc nhẹ bình đích sau khi rót xong
    if (pourQ.length) { var nx = pourQ.shift(); startPour(nx[0], nx[1]); }
    else if (mixDemo){
      var md = mixDemo; mixDemo = null;
      md.tubes.forEach(function(tb){ tb.shake = 1.5; }); // lắc mạnh 2 ống nghiệm
      setTimeout(function(){ showEquation(md.aKey, md.bKey); }, 1600);
    }
  }
  function applyIndicator(v){
    var hasPhenol = false, hasLitmus = false, i;
    for (i=0;i<v.contents.length;i++){
      if (v.contents[i].k==='phenol' && v.contents[i].v>0.005) hasPhenol = true;
      if (v.contents[i].k==='litmus' && v.contents[i].v>0.005) hasLitmus = true;
    }
    var acid = hasType(v,'acid'), base = hasType(v,'base');
    v.indColor = null;
    if (hasPhenol && base && !acid) v.indColor = '#f472b6';
    else if (hasLitmus && acid && !base) v.indColor = '#ef4444';
    else if (hasLitmus && base && !acid) v.indColor = '#3b82f6';
    // Khởi tạo màu hiển thị nếu chưa có (để chuyển dần từ màu hiện tại)
    if (v.indColor && !v.dispColor){
      // Lấy màu pha trộn hiện tại làm điểm bắt đầu
      var tot = 0, r = 0, g = 0, b = 0;
      for (var j=0;j<v.contents.length;j++){
        var c = CHEMS[v.contents[j].k]; if(!c) continue;
        var vv = v.contents[j].v; tot += vv;
        var cc = hexRgb(c.color);
        r+=cc[0]*vv; g+=cc[1]*vv; b+=cc[2]*vv;
      }
      v.dispColor = tot > 0 ? rgbStr(r/tot,g/tot,b/tot) : v.indColor;
    }
    if (!v.indColor) v.dispColor = null;
  }
  // Chuyển màu dần dần mỗi frame (từ dispColor về indColor)
  function updateColorTransition(v){
    if (!v.indColor || !v.dispColor || v.indColor === v.dispColor) return;
    var cur = hexRgb(v.dispColor), tgt = hexRgb(v.indColor);
    var speed = 0.08; // tốc độ chuyển (càng nhỏ càng chậm, càng tự nhiên)
    var r = cur[0] + (tgt[0]-cur[0])*speed;
    var g = cur[1] + (tgt[1]-cur[1])*speed;
    var b = cur[2] + (tgt[2]-cur[2])*speed;
    // Nếu gần đủ thì chốt luôn
    if (Math.abs(tgt[0]-r)<2 && Math.abs(tgt[1]-g)<2 && Math.abs(tgt[2]-b)<2){
      v.dispColor = v.indColor;
    } else {
      v.dispColor = rgbStr(r,g,b);
    }
  }
  function showPrecipEq(){
    document.getElementById('mix-result').classList.remove('hidden');
    document.getElementById('mix-eq').textContent = 'AgNO\u2083 + NaCl \u2192 AgCl\u2193 (tr\u1eafng) + NaNO\u2083';
    document.getElementById('mix-note').innerHTML =
      'Xu\u1ea5t hi\u1ec7n <b>k\u1ebft t\u1ee7a tr\u1eafng AgCl</b> l\u1eafng d\u1ea7n xu\u1ed1ng \u0111\u00e1y b\u00ecnh.';
  }
  function checkReaction(v, addedKey){
    var i, c;
    // 0. Natri + nước → phản ứng mãnh liệt, H₂ bốc cháy → NỔ (ngoài đời rất nguy hiểm!)
    if (!v.naDone){
      var hasNa = false, hasWa = false;
      for (i=0;i<v.contents.length;i++){
        if (v.contents[i].k==='Na' && v.contents[i].v>0.01) hasNa = true;
        if (v.contents[i].k==='H2O' && v.contents[i].v>0.01) hasWa = true;
      }
      if (hasNa && hasWa){
        v.naDone = true; v.fizz = 3.2; v.boom = 1;
        flashMsg(v, '💥 Natri + nước: NỔ!');
        showResultHTML('2Na + 2H₂O → 2NaOH + H₂↑',
          'Natri phản ứng <b>mãnh liệt</b> với nước: nóng chảy, chạy trên mặt nước rồi <b>bốc cháy và nổ</b> vì khí H₂ sinh ra bắt lửa. Thí nghiệm thật <b>rất nguy hiểm</b> — chỉ xem mô phỏng thôi nhé!');
        triggerBoom(v.x, v.y - v.h*0.55);
      }
    }
    // 1. Kết tủa trắng AgCl
    if (!v.precipDone){
      var hasAg = false, hasCl = false;
      for (i=0;i<v.contents.length;i++){
        if (v.contents[i].k==='AgNO3' && v.contents[i].v>0.01) hasAg = true;
        if (v.contents[i].k==='NaCl' && v.contents[i].v>0.01) hasCl = true;
      }
      if (hasAg && hasCl){
        v.precipDone = true; v.fizz = Math.max(v.fizz, 0.8); v.milky = 1;
        v.precip = [];
        for (var pi=0; pi<46; pi++)
          v.precip.push({x:Math.random(), y:Math.random()*0.35, r:1+Math.random()*2.2, sp:0.25+Math.random()*0.55});
        flashMsg(v, 'K\u1ebft t\u1ee7a tr\u1eafng AgCl!');
        showPrecipEq();
      }
    }
    // 1b. Kết tủa màu: muối đồng/sắt + bazơ → Cu(OH)2 xanh lam / Fe(OH)3 nâu đỏ
    if (!v.precipDone){
      var hasCu = false, hasFe = false, hasOH = false;
      for (i=0;i<v.contents.length;i++){
        if (v.contents[i].k==='CuSO4' && v.contents[i].v>0.01) hasCu = true;
        if (v.contents[i].k==='FeCl3' && v.contents[i].v>0.01) hasFe = true;
        var _cc1 = CHEMS[v.contents[i].k];
        if (_cc1 && _cc1.type==='base' && v.contents[i].v>0.01) hasOH = true;
      }
      if ((hasCu || hasFe) && hasOH){
        v.precipDone = true; v.fizz = Math.max(v.fizz, 0.7); v.milky = 1;
        v.precipCol = hasCu ? '#3b82f6' : '#b4532d';
        v.precip = [];
        for (var pj=0; pj<46; pj++)
          v.precip.push({x:Math.random(), y:Math.random()*0.35, r:1+Math.random()*2.2, sp:0.25+Math.random()*0.55});
        if (hasCu){
          flashMsg(v, 'Kết tủa xanh lam Cu(OH)₂!');
          showResultHTML('CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', 'Xuất hiện <b>kết tủa xanh lam</b> Cu(OH)₂ lắng dần xuống đáy ống nghiệm.');
        } else {
          flashMsg(v, 'Kết tủa nâu đỏ Fe(OH)₃!');
          showResultHTML('FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl', 'Xuất hiện <b>kết tủa nâu đỏ</b> Fe(OH)₃ lắng dần xuống đáy ống nghiệm.');
        }
      }
    }
    // 2. Trung hòa axit-bazơ (BUGFIX3: phản ứng thật - chất hết trước bị trung hòa hết)
    if (hasType(v,'acid') && hasType(v,'base')){
      v.reacted = true; v.fizz = 1;
      var ak = null, bk = null, acidTot = 0, baseTot = 0;
      for (i=0;i<v.contents.length;i++){
        c = CHEMS[v.contents[i].k]; if (!c) continue;
        if (c.type==='acid'){ acidTot += v.contents[i].v; if (!ak) ak = v.contents[i].k; }
        if (c.type==='base'){ baseTot += v.contents[i].v; if (!bk) bk = v.contents[i].k; }
      }
      var reactAmt = Math.min(acidTot, baseTot);
      if (reactAmt > 0.001){
        // Trừ lượng đã phản ứng theo tỉ lệ từng chất
        for (i=0;i<v.contents.length;i++){
          c = CHEMS[v.contents[i].k]; if (!c) continue;
          if (c.type==='acid' && acidTot > 0) v.contents[i].v = Math.max(0, v.contents[i].v - reactAmt * (v.contents[i].v/acidTot));
          else if (c.type==='base' && baseTot > 0) v.contents[i].v = Math.max(0, v.contents[i].v - reactAmt * (v.contents[i].v/baseTot));
        }
        // Loại bỏ chất đã hết
        v.contents = v.contents.filter(function(ct){ return ct.v > 0.001; });
        // Cập nhật nhãn theo chất dư (axit dư → axit, bazơ dư → bazơ, hết → trung tính)
        var acidRem = acidTot - reactAmt, baseRem = baseTot - reactAmt;
        if (acidRem > baseRem + 0.001) v.chemKey = ak;
        else if (baseRem > acidRem + 0.001) v.chemKey = bk;
        else v.chemKey = null; // trung tính hoàn toàn
        // Tổng thể tích không đổi (tạo muối + nước)
      }
      if (ak && bk) showEquation(ak, bk);
    }
    // 2b. Kim loại + axit → khí H2 bay ra (sủi bọt mạnh)
    if (!v.gasDone && hasType(v,'metal') && hasType(v,'acid')){
      v.gasDone = true; v.fizz = Math.max(v.fizz, 1.6);
      var mk=null, ak2=null, jj;
      for (jj=0;jj<v.contents.length;jj++){ var cc2=CHEMS[v.contents[jj].k]; if(!cc2) continue;
        if (cc2.type==='metal' && !mk) mk=v.contents[jj].k;
        if (cc2.type==='acid' && !ak2) ak2=v.contents[jj].k; }
      flashMsg(v, 'Sủi bọt khí H₂!');
      var geq = (mk&&ak2) ? (CHEMS[mk].f+' + '+CHEMS[ak2].f+' → muối + H₂↑') : 'Kim loại + Axit → muối + H₂↑';
      showResultHTML(geq, 'Kim loại tan dần, <b>khí hiđro (H₂)</b> sủi bọt bay lên.' +
        (v.collector ? ' Đã thu vào <b>bình thu khí</b>.' : ' Lắp <b>🧰 Bình thu khí</b> (tủ → Dụng cụ) để thu khí!'));
      if (v.collector) v.collector.gas = Math.min(1, (v.collector.gas||0) + 0.4);
    }
    // 3. Chỉ thị đổi màu theo pH
    var prev = v.indColor;
    applyIndicator(v);
    if (v.indColor && v.indColor !== prev){
      var msg = v.indColor==='#ef4444' ? 'Qu\u1ef3 t\u00edm \u2192 \u0110\u1ece (axit)!'
              : v.indColor==='#3b82f6' ? 'Qu\u1ef3 t\u00edm \u2192 XANH (baz\u01a1)!'
              : 'Phenolphtalein \u2192 H\u1ed2NG (baz\u01a1)!';
      flashMsg(v, msg);
      v.fizz = Math.max(v.fizz, 0.4);
    }
  }
  function flashMsg(v, txt){
    v.flash = {txt: txt, t: 1};
  }
  // Vị trí miệng rót sau khi nghiêng: xoay điểm mép bình quanh tâm miệng (đúng vật lý)
  function pourSpout(p){
    var a = p.a;
    var px = a.x, py = a.y - a.h; // tâm quay = miệng bình
    var phi = (a.tilt||0) * a.tiltDir;
    var lipR = Math.max(10, a.w*0.16);
    var lx = a.tiltDir * lipR, ly = -4;
    var c = Math.cos(phi), s2 = Math.sin(phi);
    return [px + lx*c - ly*s2, py + lx*s2 + ly*c];
  }
  function drawStream(ctx, p, t){
    var sp = pourSpout(p);
    var ax = sp[0], ay = sp[1];
    var bx = p.b.x, by = p.b.y - p.b.h - 2;
    var cx = (ax+bx)/2, cy = Math.min(ay,by) - 26;
    var prog = p.t / p.dur;
    var vis = Math.sin(Math.min(1,prog)*Math.PI); // mờ dần 2 đầu
    if (vis <= 0.03) return;
    function pt(u){
      var x = (1-u)*(1-u)*ax + 2*(1-u)*u*cx + u*u*bx;
      var y = (1-u)*(1-u)*ay + 2*(1-u)*u*cy + u*u*by;
      return [x,y];
    }
    // Dòng ngoài phát sáng
    ctx.lineCap = 'round';
    ctx.strokeStyle = hexA(p.colA.glow, 0.55*vis); ctx.lineWidth = 13;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(cx,cy,bx,by); ctx.stroke();
    // Lõi trắng chảy động
    ctx.strokeStyle = hexA('#ffffff', 0.85*vis); ctx.lineWidth = 2.6;
    ctx.setLineDash([10,7]); ctx.lineDashOffset = -t*160;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(cx,cy,bx,by); ctx.stroke();
    ctx.setLineDash([]);
    // Giọt rơi
    for (var i=0;i<7;i++){
      var u = ((t*1.4 + i/7) % 1);
      var pp = pt(u), pr = 2.5 + 1.5*Math.sin(u*Math.PI);
      ctx.fillStyle = hexA(p.colA.color, 0.9*vis);
      ctx.beginPath(); ctx.arc(pp[0], pp[1], pr, 0, 7); ctx.fill();
      ctx.fillStyle = hexA('#ffffff', 0.8*vis);
      ctx.beginPath(); ctx.arc(pp[0]-0.8, pp[1]-0.8, pr*0.4, 0, 7); ctx.fill();
    }
    // Tia lửa lúc chạm
    for (var s2=0;s2<6;s2++){
      var sa = Math.random()*6.28, sr = 4+Math.random()*10;
      drawSpark(ctx, bx+Math.cos(sa)*sr, by+Math.sin(sa)*sr*0.5, 3+Math.random()*3,
        hexA(p.colA.glow, 0.7*vis*Math.random()));
    }
  }

  // Hiển thị kết quả sau khi trộn (dùng chung: trung hòa / kết tủa / khí / cháy)
  function showResultHTML(eq, note){
    document.getElementById('mix-result').classList.remove('hidden');
    document.getElementById('mix-eq').textContent = eq;
    document.getElementById('mix-note').innerHTML = note;
  }
  // ---------- Phương trình (giữ nguyên tính năng cũ) ----------
  function showEquation(aKey, bKey){
    var key = aKey + '|' + bKey;
    var ind = document.getElementById('mix-ind').value;
    var colName = ind === 'phenol' ? 'không màu (phenolphtalein mất màu)' : 'màu tím (quỳ tím)';
    document.getElementById('mix-result').classList.remove('hidden');
    document.getElementById('mix-eq').textContent = eqs[key] || (CHEMS[aKey].f + ' + ' + CHEMS[bKey].f + ' → muối + nước');
    document.getElementById('mix-note').innerHTML =
      'Đã cho <b>' + CHEMS[aKey].name + '</b> tác dụng với <b>' + CHEMS[bKey].name + '</b> (phản ứng <b>trung hòa</b>). ' +
      'Dung dịch chuyển <b>' + colName + '</b> vì môi trường đã trung tính (pH ≈ 7).';
  }

  // ---------- Chế độ hướng dẫn: giữ dropdown + nút Trộn ----------
  function findVesselByChem(key){
    for (var i=0;i<vessels.length;i++) if (vessels[i].chemKey === key) return vessels[i];
    return null;
  }
  document.getElementById('mix-acid').addEventListener('change', function(){
    var v = vessels[0]; if (v){ v.chemKey = this.value; v.contents = [{k:this.value, v:v.vol}]; v.reacted = false; }
  });
  document.getElementById('mix-base').addEventListener('change', function(){
    var v = vessels[1]; if (v){ v.chemKey = this.value; v.contents = [{k:this.value, v:v.vol}]; v.reacted = false; }
  });
  document.getElementById('mix-go').addEventListener('click', function(){
    var aKey = document.getElementById('mix-acid').value;
    var bKey = document.getElementById('mix-base').value;
    var va = findVesselByChem(aKey) || vessels[0];
    var vb = findVesselByChem(bKey) || vessels[1];
    if (va) { va.chemKey = aKey; va.contents = [{k:aKey, v:va.vol}]; va.reacted = false; va.precipDone = false; }
    if (vb) { vb.chemKey = bKey; vb.contents = [{k:bKey, v:vb.vol}]; vb.reacted = false; vb.precipDone = false; }
    // Nhân vật rót lần lượt vào 2 ống nghiệm trên giá rồi lắc lắc (chuẩn như thật)
    var tubes = [];
    for (var i=0;i<vessels.length;i++) if (vessels[i].type==='tube') tubes.push(vessels[i]);
    while (tubes.length < 2 && vessels.length < 4){
      var nt = makeVessel('tube', aKey, 0.02);
      nt.contents = []; nt.vol = 0.02; nt.volShown = 0.02; nt.shake = 0; nt.pop = 1;
      vessels.push(nt); tubes.push(nt);
    }
    if (tubes.length < 2){ alert('Cần 2 ống nghiệm trống! Cất bớt bình (chạm ✕) rồi thử lại.'); return; }
    var t1 = tubes[0], t2 = tubes[1];
    [t1,t2].forEach(function(tb){
      tb.vol = 0.02; tb.volShown = 0.02; tb.contents = [];
      tb.reacted = false; tb.precipDone = false; tb.precip = null; tb.milky = 0;
      tb.indColor = null; tb.shake = 0; tb.fizz = 0;
    });
    t1.chemKey = aKey; t2.chemKey = bKey;
    var pairs = [];
    if (va && va !== t1 && va !== t2) pairs.push([va, t1]);
    if (vb && vb !== t1 && vb !== t2 && vb !== va) pairs.push([vb, t2]);
    if (!pairs.length){ alert('Hãy lấy thêm bình axit/bazơ từ tủ hóa chất!'); return; }
    mixDemo = {tubes:[t1,t2], aKey:aKey, bKey:bKey};
    pairs.forEach(function(pr){ pourQ.push(pr); });
    if (!pour){ var nx = pourQ.shift(); startPour(nx[0], nx[1]); }
  });
  document.getElementById('mix-reset').addEventListener('click', function(){ resetBench(); });

  // ---------- Pipet nhỏ giọt chỉ thị ----------
  var pipetOn = false;
  function addDrop(v){
    var indKey = document.getElementById('mix-ind').value;
    var c = CHEMS[indKey] || CHEMS.phenol;
    v.fallDrops = v.fallDrops || [];
    if (v.fallDrops.length >= 3) return; // chờ giọt trước rơi xong
    v.fallDrops.push({y: -v.h+4, vy: 0, x: (Math.random()-0.5)*10, color: c.color, glow: c.glow, key: indKey});
  }
  document.getElementById('pipet-btn').addEventListener('click', function(){
    pipetOn = !pipetOn;
    this.textContent = pipetOn ? '💧 Pipet: BẬT ✓' : '💧 Pipet: TẮT';
    this.classList.toggle('bg-violet-600', !pipetOn);
    this.classList.toggle('bg-violet-800', pipetOn);
    if (selV){ selV.sel = false; selV = null; }
  });
  document.getElementById('mix-ind').addEventListener('change', function(){
    var el = document.getElementById('pipet-ind-name');
    if (el) el.textContent = this.options[this.selectedIndex].text;
  });
  document.getElementById('pour-stop').addEventListener('click', function(){ stopPour(); });
  // SOUND_FX: nút bật/tắt + khởi tạo AudioContext ở lần chạm đầu (chính sách autoplay)
  document.addEventListener('pointerdown', function(){ SND.init(); }, {once: true});
  document.getElementById('snd-btn').addEventListener('click', function(){
    SND.init();
    SND.enabled = !SND.enabled;
    this.textContent = SND.enabled ? '\U0001F50A Âm thanh: BẬT' : '\U0001F507 Âm thanh: TẮT';
    if (!SND.enabled) SND.allOff();
  });

  // ---------- Tương tác chạm/kéo ----------
  var dragInfo = null;
  var lpTimer = null, lpV = null; // LONGPRESS_DEL: bấm giữ để xóa bình
  function clearLp(){ if (lpTimer){ clearTimeout(lpTimer); lpTimer = null; lpV = null; } }
  function canvasPos(e){
    var r = cv.getBoundingClientRect();
    var cx = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    var cy = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);
    return {x: cx - r.left, y: cy - r.top};
  }
  function vesselAt(p){
    for (var i=vessels.length-1;i>=0;i--){
      var r = vessels[i].rect;
      if (r && p.x>=r.x0 && p.x<=r.x1 && p.y>=r.y0 && p.y<=r.y1) return vessels[i];
    }
    return null;
  }
  cv.addEventListener('pointerdown', function(e){
    var p = canvasPos(e);
    if (Math.abs(p.x-lamp.x) < 44 && p.y > lamp.y-70 && p.y < lamp.y+14){ lampPress = {x:p.x, y:p.y}; e.preventDefault(); return; }
    var v = vesselAt(p);
    if (v && v.closeBtn){
      var dx = p.x-v.closeBtn.x, dy = p.y-v.closeBtn.y;
      if (dx*dx+dy*dy < 17*17){
        vessels = vessels.filter(function(x){ return x!==v; });
        if (selV===v) selV = null;
        e.preventDefault(); return;
      }
    }
    if (v) dragInfo = {v:v, sx:p.x, sy:p.y, moved:false};
    // LONGPRESS_DEL: bấm giữ 650ms để xóa bình khỏi bàn (lấy bình khác)
    if (v && !pour && !carryAnim){
      (function(_vv){
        lpV = _vv;
        lpTimer = setTimeout(function(){
          if (lpV && vessels.indexOf(lpV) >= 0){
            vessels = vessels.filter(function(x){ return x !== lpV; });
            if (selV === lpV) selV = null;
            try { layout(); } catch(eLpr){}
          }
          lpTimer = null; lpV = null; dragInfo = null;
        }, 650);
      })(v);
    }
  });
  cv.addEventListener('pointermove', function(e){
    var p = canvasPos(e);
    if (lampPress){
      if (Math.hypot(p.x-lampPress.x, p.y-lampPress.y) > 12){ lampDrag = true; lampPress = null; if (typeof heatDemo!=='undefined') heatDemo = null; }
      else return;
    }
    if (lampDrag){ lamp.x = Math.max(48, Math.min(G.w-48, p.x)); lamp.tx = null; return; }
    if (!dragInfo) return;
    if (Math.hypot(p.x-dragInfo.sx, p.y-dragInfo.sy) > 10){ dragInfo.moved = true; clearLp(); }
    if (dragInfo.moved){
      var dv = dragInfo.v;
      dv.dragging = true; dv.returning = false;
      var _dxm = p.x - (dv._lx == null ? p.x : dv._lx); dv._lx = p.x;
      dv.tilt = Math.max(-0.12, Math.min(0.12, _dxm*0.02)); dv.tiltDir = 1;
      dv.x = Math.max(34, Math.min(G.w-34, p.x));
      dv.y = Math.max(dv.h+44, Math.min(G.h-40, p.y + dv.h*0.35));
    }
  });
  cv.addEventListener('pointerup', function(e){
    clearLp();
    if (pour){ stopPour(); e.preventDefault(); return; } // TAP_STOP: bấm vào canvas khi đang đổ = dừng đổ
    if (lampPress){ lampPress = null; toggleLamp(); e.preventDefault(); return; }
    lampDrag = false;
    var p = canvasPos(e), v = vesselAt(p);
    if (dragInfo && dragInfo.moved){
      var dv = dragInfo.v;
      dv.dragging = false; dv.tilt = 0; dv._lx = null;
      if (v && v !== dv) startPour(dv, v); // kéo-thả sang bình khác = rót
      dv.returning = true; // lò xo kéo về chỗ cũ
      dragInfo = null; return;
    }
    dragInfo = null;
    var onClose = v && v.closeBtn && (function(){var dx=p.x-v.closeBtn.x,dy=p.y-v.closeBtn.y;return dx*dx+dy*dy<17*17;})();
    if (pipetOn && v && !onClose){ addDrop(v); return; }
    if (v && !onClose && v.type !== 'tube'){
      var _isFuel = hasType(v,'fuel');
      if (_isFuel){
        // BUGFIX4: toggle đèn cồn - đang đun thì bấm lại để tắt/bỏ ra
        if (typeof heatDemo !== 'undefined' && heatDemo && heatDemo.tube){
          heatDemo = null;
          try { lamp.tx = null; } catch(eLampTx){}
          flashMsg(v,'Đã tắt đèn cồn!');
          return;
        }
        demoHeatTube(v); return;
      }
      // POUR_MANUAL: bấm chọn nguồn đổ -> bấm bình đích -> đổ đúng thứ tự
      // (không tự động đổ vào ống nghiệm nữa)
    }
    if (v){
      if (selV && selV !== v){
        // Đã chọn nguồn, giờ chọn đích -> đổ từ nguồn sang đích
        var srcV = selV, dstV = v;
        selV.sel = false; selV = null;
        // Kiểm tra nguồn có dung dịch không
        if ((srcV.vol || 0) < 0.03){
          flashMsg(srcV, 'Bình nguồn hết rồi!');
          return;
        }
        if ((dstV.vol || 0) > 0.97){
          flashMsg(dstV, 'Bình đích đã đầy!');
          return;
        }
        startPour(srcV, dstV);
        flashMsg(dstV, 'Đang đổ...');
      }
      else {
        // Chọn nguồn đổ (bấm lần 1) hoặc bỏ chọn (bấm lại)
        if (selV) selV.sel = false;
        if (selV === v){
          selV = null;
          flashMsg(v, 'Đã bỏ chọn');
        } else {
          selV = v;
          selV.sel = true;
          // Gợi ý rõ ràng cho người dùng
          var chemName = '';
          try {
            if (v.contents && v.contents.length){
              chemName = v.contents.map(function(c){ return c.name || c.key || ''; }).filter(Boolean).join('+');
            }
          } catch(eNm){}
          flashMsg(v, chemName ? ('Đã chọn: ' + chemName + ' - bấm bình đích để đổ') : 'Đã chọn bình nguồn - bấm bình đích để đổ');
        }
      }
    } else {
      if (selV){ selV.sel = false; selV = null; }
    }
  });
  cv.addEventListener('contextmenu', function(e){ e.preventDefault(); }); // LONGPRESS_DEL: chặn menu khi bấm giữ
  cv.addEventListener('pointercancel', function(){
    clearLp();
    lampDrag = false; lampPress = null;
    if (dragInfo){ dragInfo.v.dragging = false; dragInfo.v.returning = true; dragInfo = null; }
  });

  // ---------- Bố cục bàn ----------
function layout(){
    if (!G || !(G.w > 0) || !(G.h > 0)) return;
    var W = G.w, n = vessels.length;
    var h = Math.min(140, G.h*0.44);
    var charW = 8; /* CENTERBIG_V1 */// nhân vật đứng giữa layer nền -> bình xếp full chiều rộng
    var availW = Math.max(170, W - charW - 66); // chừa chỗ đèn cồn bên phải
    vessels.forEach(function(v, i){
      v.w = Math.min(92, (availW/Math.max(1,n))*0.70);
      if (v.type==='bottle') v.w = Math.min(76, v.w);
      v.h = h * (v.type==='tube' ? 1.12 : v.type==='round' ? 0.95 : v.type==='bottle' ? 1.05 : 1);
      v.hx = charW + availW*(i+1)/(n+1);
      if (v.type==='tube') v.hx = Math.max(charW+24, v.hx-48); // TUBE_LEFT: ống lùi sang trái, tránh đèn cồn tự đun khi chưa dùng
      v.hy = G.h - 30 - (v.type==='tube' ? 80 : 0); // TUBE_STAND_V1: ống nghiệm treo cao trên giá đỡ, đáy cách bàn 80px
      if (v.x === 0 && v.y === 0){ v.x = v.hx; v.y = v.hy; }
    });
    lamp.hx = W - 58; lamp.hy = G.h - 30;
    if (!lampDrag){ lamp.x += (((lamp.tx!=null)?lamp.tx:lamp.hx)-lamp.x)*0.12; lamp.y = lamp.hy; }
  }

  // ---------- Nền phòng lab kiểu video ----------
  var motes = [];
  for (var mi=0; mi<14; mi++) motes.push({x:Math.random(), y:Math.random(), r:1+Math.random()*2, sp:0.05+Math.random()*0.12, ph:Math.random()*6.28});
  // LABV3: đốm bokeh mờ kiểu video quảng cáo
  var bokeh = [];
  var __bokehCols = ['#22d3ee','#818cf8','#c084fc','#38bdf8','#f0abfc'];
  for (var bki=0; bki<9; bki++) bokeh.push({fx:Math.random(), fy:Math.random()*0.72, r:16+Math.random()*30,
    dx:(Math.random()-0.5)*10, dy:(Math.random()-0.5)*6, c:__bokehCols[bki%5]});
  function drawBG(ctx, W, H, t){
    // Nền: xanh navy đậm → đen
    var g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0b1830'); g.addColorStop(0.55,'#081222'); g.addColorStop(1,'#04070e');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // Đốm bokeh trôi nhẹ
    for (var bi=0;bi<bokeh.length;bi++){
      var b = bokeh[bi];
      b.fx += b.dx*0.016/W; b.fy += b.dy*0.016/H;
      if (b.fx<0) b.fx+=1; if (b.fx>1) b.fx-=1;
      if (b.fy<0) b.fy+=1; if (b.fy>1) b.fy-=1;
      var bx = b.fx*W, by = b.fy*H;
      var bg2 = ctx.createRadialGradient(bx,by,1,bx,by,b.r);
      bg2.addColorStop(0, hexA(b.c, 0.15));
      bg2.addColorStop(1, hexA(b.c, 0));
      ctx.fillStyle = bg2;
      ctx.beginPath(); ctx.arc(bx,by,b.r,0,7); ctx.fill();
    }
    // Hạt sáng trôi (bụi phòng lab)
    for (var i=0;i<motes.length;i++){
      var m = motes[i];
      m.y -= m.sp*0.016; if (m.y < -0.05){ m.y = 1.05; m.x = Math.random(); }
      var a = 0.12 + 0.10*Math.sin(t*1.5 + m.ph);
      ctx.fillStyle = 'rgba(140,220,255,'+a.toFixed(2)+')';
      ctx.beginPath(); ctx.arc(m.x*W, m.y*H, m.r, 0, 7); ctx.fill();
    }
    // Bàn gỗ 30px ở đáy
    var by = H-30;
    var wg = ctx.createLinearGradient(0,by,0,H);
    wg.addColorStop(0,'#7a5636'); wg.addColorStop(0.25,'#5d3f24'); wg.addColorStop(1,'#2c1e10');
    ctx.fillStyle = wg; ctx.fillRect(0, by, W, 30);
    // Vân gỗ
    ctx.strokeStyle='rgba(40,24,10,0.5)'; ctx.lineWidth=1.4;
    for (var k2=0;k2<3;k2++){
      var wy = by+8+k2*8;
      ctx.beginPath();
      for (var wx=0; wx<=W; wx+=24) ctx.lineTo(wx, wy+Math.sin(wx*0.05+k2*2)*1.6);
      ctx.stroke();
    }
    // Viền sáng mặt bàn
    ctx.fillStyle='rgba(255,214,150,0.35)'; ctx.fillRect(0,by,W,2);
  }

  // ---------- Vòng lặp chính ----------
  var T0 = performance.now()/1000;
  // FIX 2026-10-11 (LAB_ERR_V1): 1 frame loi khong duoc giet vong lap RAF — tu phuc hoi
  var _frameErr = 0;
  function draw(){
    try {
    if (G.hidden && cv.offsetParent && cv.clientWidth > 0){
      var g2 = fitCanvas(cv);
      if (g2 && !g2.hidden) G = g2;
    }
    if (!G || !G.ctx || !(G.w > 0) || !(G.h > 0)) throw new Error('canvas chua san sang');
    var ctx = G.ctx, W = G.w, H = G.h;
    var t = performance.now()/1000 - T0;
    var _dpr = window.devicePixelRatio || 1;
    ctx.setTransform(_dpr,0,0,_dpr,0,0);
    if (shakeT > 0){
      shakeT = Math.max(0, shakeT - 0.016);
      var _sa = shakeT*18;
      ctx.translate((Math.random()-0.5)*_sa, (Math.random()-0.5)*_sa);
    }
    ctx.clearRect(-26,-26,W+52,H+52);
    drawBG(ctx, W, H, t);
    layout();
    // Nhân vật "cầm" bình bay tới ống nghiệm rồi mới rót
    if (typeof carryAnim !== 'undefined' && carryAnim){
      var _ca = carryAnim; _ca.t += 0.016;
      var _ck = Math.min(1, _ca.t / _ca.dur), _ce = 1 - Math.pow(1-_ck, 3);
      _ca.a.x = _ca.fx + (_ca.tx-_ca.fx)*_ce;
      _ca.a.y = _ca.fy + (_ca.ty-_ca.fy)*_ce;
      if (_ck >= 1){ var _pa=_ca.a, _pb=_ca.b; carryAnim = null; startPour(_pa,_pb); }
    }
    if (typeof heatDemo !== 'undefined' && heatDemo){
      heatDemo.t += 0.016;
      if (heatDemo.t > 30 || vessels.indexOf(heatDemo.tube) < 0) heatDemo = null;
    }
    // Cập nhật rót
    if (pour){
      pour.t += 0.016;
      var pr = Math.min(1, pour.t / pour.dur);
      var e = pr<0.5 ? 2*pr*pr : 1-Math.pow(-2*pr+2,2)/2;
      pour.a.tilt = ((pour.a.type==='bottle') ? 1.00 : 0.85) * Math.sin(Math.min(1,pr*1.15)*Math.PI); // ~57° chai, ~49° bình thường
      var transferred = pour.amt * e;
      pour.a.volShown = Math.max(0, pour.a0 - transferred);
      pour.b.volShown = Math.min(1, pour.b0 + transferred);
      /* CENTERBIG_V1 */// drawStream dời xuống sau drawChemistBack để hiệu ứng đè lên nhân vật
      if (pr >= 1) finishPour();
    } else {
      vessels.forEach(function(v){
        v.volShown += (v.vol - v.volShown)*0.2;
        v.fizz = Math.max(0, v.fizz - 0.008);
        v.shake = Math.max(0, (v.shake||0) - 0.03);
        v.swirl += 0.02 + v.fizz*0.05;
        // Giọt pipet rơi xuống mặt dung dịch
        if (v.fallDrops && v.fallDrops.length){
          var _ih2 = v.h - 14, _liqH2 = Math.max(0, v.volShown)*_ih2, _surfY2 = -6 - _liqH2;
          for (var _fi=v.fallDrops.length-1; _fi>=0; _fi--){
            var _fd = v.fallDrops[_fi];
            _fd.vy += 0.55; _fd.y += _fd.vy;
            if (_fd.y >= _surfY2){
              v.fallDrops.splice(_fi,1);
              v.diffusions = v.diffusions || [];
              v.diffusions.push({x:_fd.x, y:_surfY2+6, r:2, maxR: Math.max(14, innerW(v)*0.55), color:_fd.color});
              var _found = false, _ci;
              for (_ci=0; _ci<v.contents.length; _ci++)
                if (v.contents[_ci].k===_fd.key){ v.contents[_ci].v += 0.02; _found = true; }
              if (!_found) v.contents.push({k:_fd.key, v:0.02});
              v.vol = Math.min(1, +(v.vol+0.02).toFixed(3));
              v.fizz = Math.max(v.fizz, 0.25);
              checkReaction(v, _fd.key);
            }
          }
        }
        // Kết tủa lắng dần
        if (v.precip){
          for (var _pi=0; _pi<v.precip.length; _pi++){
            var _pp = v.precip[_pi];
            if (_pp.y < 0.94) _pp.y += _pp.sp*0.016;
          }
          v.milky = Math.max(0.3, (v.milky||0) - 0.002);
        }
      });
    }
    vessels.forEach(function(v){
      if (v.returning){
        v.x += (v.hx - v.x)*0.18; v.y += (v.hy - v.y)*0.18;
        if (Math.hypot(v.hx-v.x, v.hy-v.y) < 2){ v.x = v.hx; v.y = v.hy; v.returning = false; }
      } else if (!v.dragging && !v.carried){ v.x = v.hx; v.y = v.hy; }
      // Đun nóng: ống nghiệm gần ngọn lửa
      if (v.type === 'tube' && v.volShown > 0.03){
        var dx = v.x - lamp.flameX, dy = (v.y - v.h*0.12) - lamp.flameY; // TUBE_STAND_V1: ngọn lửa chạm đáy ống treo cao
        if (dx*dx + dy*dy < 62*62) v.heat = Math.min(1, (v.heat||0) + 0.03);
        else v.heat = Math.max(0, (v.heat||0) - 0.006);
      } else v.heat = Math.max(0, (v.heat||0) - 0.01);
      // BOOM: H2 + lửa → nổ nhỏ
      if (v.type==='tube' && v.gasDone && !v.popped && (v.heat||0) > 0.55){
        v.popped = true; v.boom = 1; v.fizz = Math.max(v.fizz, 1.2);
        flashMsg(v, '💥 H₂ cháy — nổ nhỏ!');
        showResultHTML('2H₂ + O₂ → 2H₂O', 'Khí hiđro <b>cháy</b> trong không khí với tiếng <b>nổ nhỏ</b> (hỗn hợp nổ).');
        v.gasDone = false;
        if (v.collector) v.collector.gas = 0;
        try { SND.boom(); } catch(_sb){}
      }
      // BURN: cồn trong ống bị đun → cháy với ngọn lửa xanh
      if (v.type==='tube' && hasType(v,'fuel') && (v.heat||0) > 0.5 && !v.burnMsg){
        v.burnMsg = true; flashMsg(v, '🔥 Cồn đang cháy!');
        showResultHTML('C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O', 'Cồn <b>cháy</b> với ngọn lửa xanh, tỏa nhiều nhiệt.');
      }
      if (!(v.type==='tube' && hasType(v,'fuel') && (v.heat||0) > 0.3)) v.burnMsg = false;
      // BURN_MG: magie trong ống bị đun nóng → cháy sáng chói
      if (v.type==='tube' && !v.mgBurned && (v.heat||0) > 0.75){
        var _hasMg = false, _mi2;
        for (_mi2=0; _mi2<v.contents.length; _mi2++) if (v.contents[_mi2].k==='Mg' && v.contents[_mi2].v>0.01) _hasMg = true;
        if (_hasMg){
          v.mgBurned = true; v.boom = 1;
          flashMsg(v, '🔥 Magie cháy sáng chói!');
          showResultHTML('2Mg + O₂ → 2MgO', 'Magie <b>cháy sáng chói</b> trong không khí, tạo thành bột trắng MgO. Ngoài đời thật đừng nhìn thẳng vào ngọn lửa magie nhé!');
          flashFx = {x: v.x, y: v.y - v.h*0.5, t: 0};
          for (var _si2=0; _si2<26; _si2++){
            var _sa4 = Math.random()*6.283, _sp4 = 40+Math.random()*130;
            fxParts.push({x:v.x, y:v.y-v.h*0.5, vx:Math.cos(_sa4)*_sp4, vy:Math.sin(_sa4)*_sp4-40,
              r:1.6+Math.random()*2.4, life:1, decay:1.3, col:['#ffffff','#fef9c3','#fde68a'][_si2%3], grav:300});
          }
          try { SND.boom(); } catch(_sb3){}
        }
      }
      v.boom = Math.max(0, (v.boom||0) - 0.025);
    });
    updateChemist(t, W, H);
    lamp.flare = 0;
    vessels.forEach(function(v){ if ((v.heat||0) > 0.3) lamp.flare = Math.max(lamp.flare, v.heat); });
    drawChemistBack(ctx, t, W, H);
    /* CENTERBIG_V1 */if (pour) drawStream(ctx, pour, t); // dòng rót là hiệu ứng -> vẽ trên nhân vật
    drawLamp(ctx, t);
    vessels.forEach(function(v){
      if (v.dragging){
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(v.x, G.h-44, v.w*0.55, 9, 0, 0, 7); ctx.fill();
      }
    });
    vessels.forEach(function(v){ updateColorTransition(v); });
    vessels.forEach(function(v){ drawVessel(ctx, v, t); });
    drawChemistArm(ctx, t);
    updateDrawFx(ctx, t, W, H);
    // chữ flash (vd: "Đã đầy!")
    vessels.forEach(function(v){
      if (v.flash && v.flash.t > 0){
        v.flash.t -= 0.02;
        ctx.fillStyle = 'rgba(253,224,71,'+Math.min(1,v.flash.t*2).toFixed(2)+')';
        ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(v.flash.txt, v.x, v.y - v.h - 22);
      }
    });
    // Gợi ý khi bàn trống
    if (!vessels.length){
      ctx.fillStyle = 'rgba(165,243,252,0.6)'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Mở Tủ hóa chất ở trên để lấy bình mới ↓', W/2, H/2);
    }
    try { ctx.setTransform(_dpr||1,0,0,_dpr||1,0,0); } catch(_rs){}
    _frameErr = 0;
    } catch(_de){
      try { ctx.setTransform(1,0,0,1,0,0); } catch(_rs2){}
      _frameErr++;
      if (_frameErr <= 3) console.warn('[lab-mix] frame loi (tu phuc hoi):', _de && _de.message);
      // Khong throw tiep — giu vong lap RAF song
    }
    try { SND.tick(); } catch(_se){}
    requestAnimationFrame(draw);
  }


  // ================= FX no + thi nghiem mau trong giao dien tron =================
  var boomFx = null, flashFx = null, fxParts = [], shakeT = 0;
  chemist.shockT = -1; chemist._coughAcc = 0; chemist._coughN = 0;
  function triggerBoom(x, y){
    boomFx = {x: x, y: y, t: 0};
    shakeT = 0.55;
    chemist.shockT = 0; chemist._coughAcc = 0; chemist._coughN = 0;
    for (var i=0;i<80;i++){
      var a=Math.random()*6.283, sp=60+Math.random()*330;
      fxParts.push({x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-130,
        r:2+Math.random()*4.5, life:1, decay:0.9+Math.random()*0.6,
        col:['#fde047','#fbbf24','#f97316','#ef4444','#fff7ed'][i%5], grav:520});
    }
    for (var j=0;j<16;j++){
      fxParts.push({x:x+(Math.random()-0.5)*60, y:y-10, vx:(Math.random()-0.5)*60, vy:-46-Math.random()*60,
        r:10+Math.random()*14, life:1, decay:0.35, col:'rgba(100,116,139,0.5)', grav:-36, grow:24});
    }
    try { SND.boom(); } catch(e){}
  }
  function updateDrawFx(ctx, t, W, H){
    if (boomFx){
      boomFx.t += 0.016;
      if (boomFx.t > 1.4) boomFx = null;
      else {
        var bf = boomFx, fr = bf.t*340 + 24, fa = Math.max(0, 1 - bf.t/0.9);
        var fg = ctx.createRadialGradient(bf.x, bf.y, 4, bf.x, bf.y, fr);
        fg.addColorStop(0, 'rgba(255,255,255,'+(0.95*fa).toFixed(2)+')');
        fg.addColorStop(0.35, 'rgba(253,224,71,'+(0.85*fa).toFixed(2)+')');
        fg.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(bf.x, bf.y, fr, 0, 7); ctx.fill();
        if (bf.t < 0.55){
          ctx.save(); ctx.translate(bf.x, bf.y-118);
          var bs = 0.7 + bf.t*1.7; ctx.scale(bs, bs);
          ctx.fillStyle = '#7c2d12'; ctx.font = 'black 38px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('💥 BÙM!!', 0, 0); ctx.restore();
        }
      }
    }
    if (flashFx){
      flashFx.t += 0.016;
      if (flashFx.t > 0.8) flashFx = null;
      else {
        var fx2 = flashFx, fa2 = Math.max(0, 1 - fx2.t/0.8), fr2 = fx2.t*200 + 16;
        var fg3 = ctx.createRadialGradient(fx2.x, fx2.y, 2, fx2.x, fx2.y, fr2);
        fg3.addColorStop(0, 'rgba(255,255,255,'+(0.98*fa2).toFixed(2)+')');
        fg3.addColorStop(0.5, 'rgba(254,249,195,'+(0.7*fa2).toFixed(2)+')');
        fg3.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = fg3; ctx.beginPath(); ctx.arc(fx2.x, fx2.y, fr2, 0, 7); ctx.fill();
      }
    }
    for (var fi=fxParts.length-1; fi>=0; fi--){
      var fp = fxParts[fi];
      fp.x += fp.vx*0.016; fp.y += fp.vy*0.016; fp.vy += (fp.grav||0)*0.016;
      fp.life -= 0.016*(fp.decay||1);
      if (fp.grow) fp.r += fp.grow*0.016;
      if (fp.life <= 0 || fp.y > H+40){ fxParts.splice(fi,1); continue; }
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, fp.life));
      ctx.fillStyle = fp.col;
      ctx.beginPath(); ctx.arc(fp.x, fp.y, Math.max(0.5, fp.r), 0, 7); ctx.fill();
      ctx.restore();
    }
    // Nhân vật sau vụ nổ: mặt xanh lè + tóc dựng đứng + ho sặc sụa, 15 giây sau hồi phục
    if (chemist.shockT >= 0){
      chemist.shockT += 0.016;
      var st = chemist.shockT;
      if (st >= 16.2){ chemist.shockT = -1; }
      else {
        var home = chemistHome(W,H);
        var bob = Math.sin(t*2.2+chemist.bobP)*1.5;
        var cx = home.x, cy = home.y + bob*0.4 - 228;
        var recover = st >= 15;
        ctx.fillStyle = recover ? '#bbf7d0' : '#4ade80';
        ctx.beginPath(); ctx.arc(cx, cy, 33, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx-33, cy+2, 7, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+33, cy+2, 7, 0, 7); ctx.fill();
        if (!recover){
          ctx.fillStyle = '#1d1414';
          for (var si=0; si<11; si++){
            var aa = Math.PI*(0.05 + 0.9*si/10);
            var bx = cx + Math.cos(aa)*30, by = cy - Math.sin(aa)*30;
            var tx3 = cx + Math.cos(aa)*54, ty3 = cy - Math.sin(aa)*54;
            var ex3 = cx + Math.cos(aa+0.16)*30, ey3 = cy - Math.sin(aa+0.16)*30;
            ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx3,ty3); ctx.lineTo(ex3,ey3); ctx.closePath(); ctx.fill();
          }
          ctx.strokeStyle = '#14532d'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          [[-13],[13]].forEach(function(o){
            var exx = cx+o[0], eyy = cy+2;
            ctx.beginPath(); ctx.moveTo(exx-6,eyy-6); ctx.lineTo(exx+6,eyy+6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(exx+6,eyy-6); ctx.lineTo(exx-6,eyy+6); ctx.stroke();
          });
          ctx.fillStyle = '#14532d';
          ctx.beginPath(); ctx.ellipse(cx, cy+17, 6, 8+Math.sin(t*30)*1.5, 0, 0, 7); ctx.fill();
          if (st > 0.5 && st < 5.5){
            chemist._coughAcc += 0.016;
            if (chemist._coughAcc > 0.13){
              chemist._coughAcc = 0; chemist._coughN++;
              for (var ci=0; ci<4; ci++)
                fxParts.push({x:cx+(Math.random()-0.5)*8, y:cy+17, vx:26+Math.random()*36, vy:-12-Math.random()*20,
                  r:4+Math.random()*5, life:1, decay:1.15, col:'rgba(148,163,184,0.8)', grav:-26, grow:9});
            }
            if (chemist._coughN % 8 !== 0){
              ctx.fillStyle = '#166534'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
              ctx.fillText('khụ khụ!', cx+64, cy-6-Math.sin(t*7)*3);
            }
          }
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.beginPath(); ctx.arc(cx-13, cy+2, 3.4, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(cx+13, cy+2, 3.4, 0, 7); ctx.fill();
          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx-7, cy+17); ctx.lineTo(cx+7, cy+17); ctx.stroke();
          ctx.font = '30px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('😮‍💨', cx, cy-54);
        }
      }
    }
  }
  // ---------- Kịch bản thí nghiệm mẫu: nhân vật tự thao tác trên bàn ----------
  var exBusy = false;
  function exSetup(items){
    resetBench();
    pour = null; pourQ = []; carryAnim = null; heatDemo = null;
    chemist.shockT = -1; boomFx = null; flashFx = null; fxParts = []; shakeT = 0;
    try { lamp.tx = null; } catch(e){}
    var made = [];
    items.forEach(function(it){
      var v = makeVessel(it[0], it[1], it[2]);
      v.pop = 1;
      vessels.push(v); made.push(v);
    });
    try { layout(); } catch(e2){}
    return made;
  }
  function exCarryTo(src, dst){
    var side = (src.x <= dst.x) ? -1 : 1;
    var tx = dst.x + side*(dst.w*0.5 + src.w*0.30 + 10);
    tx = Math.max(60, Math.min(G.w-60, tx));
    var ty = dst.y - dst.h - 16 + src.h;
    carryAnim = {a:src, b:dst, t:0, dur:0.85, fx:src.x, fy:src.y, tx:tx, ty:ty};
    src.carried = true; src.returning = false;
  }
  function exMsg(t){ var el = document.getElementById('ex-msg'); if (el) el.textContent = t; }
  window.__chemDemo = {
    na: function(){
      if (exBusy) return; exBusy = true;
      var vs = exSetup([['beaker','H2O',0.5],['bottle','Na',0.55]]);
      exMsg('🧑‍🔬 Nhân vật lấy natri và cốc nước...');
      setTimeout(function(){ exCarryTo(vs[1], vs[0]); flashMsg(vs[0], 'Thả natri vào nước...'); }, 700);
      setTimeout(function(){ exBusy = false; }, 9000);
    },
    mg: function(){
      if (exBusy) return; exBusy = true;
      var vs = exSetup([['tube','Mg',0.35],['bottle','HCl',0.55]]);
      exMsg('🧑‍🔬 Nhân vật rót axit clohiđric vào ống nghiệm chứa magie...');
      setTimeout(function(){ demoPourToTube(vs[1]); }, 700);
      setTimeout(function(){ demoHeatTube(vs[1]); exMsg('🔥 Đã sinh khí H₂ — đem đun để nghe tiếng nổ nhỏ!'); }, 7500);
      setTimeout(function(){ exBusy = false; }, 15000);
    },
    rainbow: function(){
      if (exBusy) return; exBusy = true;
      var vs = exSetup([['tube','CuSO4',0.5],['tube','FeCl3',0.5],['bottle','NaOH',0.6]]);
      exMsg('🧑‍🔬 Nhân vật rót NaOH vào 2 ống nghiệm CuSO₄ và FeCl₃...');
      setTimeout(function(){ exCarryTo(vs[2], vs[0]); }, 700);
      setTimeout(function(){ exCarryTo(vs[2], vs[1]); }, 7000);
      setTimeout(function(){ exBusy = false; exMsg('🌈 Hai kết tủa: xanh lam Cu(OH)₂ và nâu đỏ Fe(OH)₃!'); }, 14000);
    },
    burn: function(){
      if (exBusy) return; exBusy = true;
      var vs = exSetup([['tube','Mg',0.4]]);
      exMsg('🧑‍🔬 Nhân vật đem đèn cồn đun dải magie...');
      setTimeout(function(){ demoHeatTube(vs[0]); }, 700);
      setTimeout(function(){ exBusy = false; }, 9000);
    }
  };
  [['ex-na','na'],['ex-mg','mg'],['ex-rainbow','rainbow'],['ex-burn','burn']].forEach(function(pr){
    var b = document.getElementById(pr[0]);
    if (b) b.addEventListener('click', function(){ window.__chemDemo[pr[1]](); });
  });

  buildShelfCats();
  buildShelf();
  resetBench();
  draw();
})();


