(function(){
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var loader = $('#loader');
  var failsafe = setTimeout(function(){ if (loader) loader.style.display = 'none'; }, 6000);
  var vessel = { p: 0, mx: 0, my: 0 };

  /* Grano */
  (function(){
    try {
      var c = document.createElement('canvas'); c.width = c.height = 160;
      var x = c.getContext('2d'), d = x.createImageData(160, 160);
      for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255; }
      x.putImageData(d, 0, 0);
      $('.grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
    } catch (e) {}
  })();

  /* Modo claro / oscuro */
  function isLight(){ var a = document.documentElement.getAttribute('data-theme'); return a ? a === 'light' : matchMedia('(prefers-color-scheme: light)').matches; }
  $('#themeBtn').addEventListener('click', function(){
    var next = isLight() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('arq-tema', next); } catch (e) {}
    if (vessel.retheme) vessel.retheme();
  });
  try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(){ if (vessel.retheme) vessel.retheme(); }); } catch (e) {}

  /* Preguntas frecuentes */
  $$('#faq .qa').forEach(function(qa){
    var b = $('button', qa), a = $('.qa-a', qa);
    if (!qa.classList.contains('open')) a.style.height = '0px';
    b.addEventListener('click', function(){
      var open = qa.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      if (G && !RM) {
        if (open) G.fromTo(a, { height: 0 }, { height: 'auto', duration: .6, ease: 'expo.out', onComplete: function(){ if (ST) ST.refresh(); } });
        else G.to(a, { height: 0, duration: .5, ease: 'expo.inOut', onComplete: function(){ if (ST) ST.refresh(); } });
      } else { a.style.height = open ? 'auto' : '0px'; }
    });
  });

  /* Formulario (demostración) */
  if ($('#form')) $('#form').addEventListener('submit', function(e){
    e.preventDefault();
    var n = $('#f-nombre').value.trim(), m = $('#f-correo').value.trim(), msg = $('#fMsg');
    if (!n || !/^\S+@\S+\.\S+$/.test(m)) { msg.textContent = 'Escribe tu nombre y un correo válido para que podamos responderte.'; return; }
    msg.textContent = 'Gracias, ' + n + '. Esta es una demostración: en el sitio final tu solicitud llegará directo al equipo de ARQ.';
  });

  /* Regla de profundidad */
  var D = [0, .3, .8, 1.6, 2.0], P = [10, 25, 45, 80, 100];
  function depthToPos(d){ for (var i = 0; i < 4; i++) if (d <= D[i+1]) return P[i] + (d - D[i]) / (D[i+1] - D[i]) * (P[i+1] - P[i]); return 100; }
  function posToDepth(p){ if (p <= 10) return 0; for (var i = 0; i < 4; i++) if (p <= P[i+1]) return D[i] + (p - P[i]) / (P[i+1] - P[i]) * (D[i+1] - D[i]); return 2; }
  (function(){
    var r = $('#ruler'); if (!r) return;
    for (var k = 0; k <= 20; k++) {
      var d = k / 10, t = document.createElement('span');
      t.className = 'tick' + (k % 5 === 0 ? ' big' : '');
      t.style.top = depthToPos(d) + '%';
      if (k % 5 === 0) { var i = document.createElement('i'); i.textContent = d.toFixed(1).replace('.', ',') + ' m'; t.appendChild(i); }
      r.appendChild(t);
    }
  })();

  /* Vasija 3D: 32 fragmentos que se arman al bajar */
  (function(){
    var canvas = $('#vCanvas'); if (!window.THREE || !canvas) return;
    var T = window.THREE, sec = $('#vasija'), renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, .1, 60); cam.position.set(0, .2, 8.4);

    // Textura: engobe, greca, puntos y desgaste
    var tc = document.createElement('canvas'); tc.width = 2048; tc.height = 1024;
    var x = tc.getContext('2d');
    x.fillStyle = '#8f421d'; x.fillRect(0, 0, 2048, 1024);
    for (var i = 0; i < 40000; i++) { x.fillStyle = Math.random() < .55 ? 'rgba(0,0,0,.08)' : 'rgba(255,214,170,.06)'; x.fillRect(Math.random()*2048, Math.random()*1024, 1 + Math.random()*3, 1 + Math.random()*3); }
    for (var b2 = 0; b2 < 60; b2++) { var gx0 = Math.random()*2048, gy0 = Math.random()*1024, rr = 20 + Math.random()*90; var gr = x.createRadialGradient(gx0, gy0, 0, gx0, gy0, rr); gr.addColorStop(0, Math.random() < .5 ? 'rgba(30,10,2,.22)' : 'rgba(230,180,130,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(gx0 - rr, gy0 - rr, rr*2, rr*2); }
    function band(y0, y1, col){ x.fillStyle = col; x.fillRect(0, y0, 2048, y1 - y0); }
    band(30, 74, '#d6a172'); band(74, 86, '#3a1508');
    band(206, 360, '#d1966a'); band(196, 208, '#3a1508'); band(358, 370, '#3a1508');
    x.strokeStyle = '#3a1508'; x.lineWidth = 12; x.lineJoin = 'miter';
    for (var gx = 0; gx < 2048; gx += 128) { x.beginPath(); x.moveTo(gx + 10, 346); x.lineTo(gx + 10, 226); x.lineTo(gx + 104, 226); x.lineTo(gx + 104, 318); x.lineTo(gx + 40, 318); x.lineTo(gx + 40, 258); x.lineTo(gx + 76, 258); x.lineTo(gx + 76, 288); x.stroke(); }
    x.fillStyle = '#d6a172'; for (var dx = 32; dx < 2048; dx += 64) { x.beginPath(); x.arc(dx, 440, 10, 0, Math.PI*2); x.fill(); }
    band(500, 508, '#3a1508');
    for (var sc = 0; sc < 260; sc++) { x.strokeStyle = 'rgba(240,200,160,' + (.05 + Math.random()*.1) + ')'; x.lineWidth = 1 + Math.random()*2; x.beginPath(); var sx = Math.random()*2048, sy = Math.random()*1024; x.moveTo(sx, sy); x.lineTo(sx + (Math.random() - .5)*60, sy + (Math.random() - .5)*20); x.stroke(); }
    var grd = x.createLinearGradient(0, 600, 0, 1024); grd.addColorStop(0, 'rgba(36,12,3,0)'); grd.addColorStop(1, 'rgba(36,12,3,.6)'); x.fillStyle = grd; x.fillRect(0, 600, 2048, 424);
    var tex = new T.CanvasTexture(tc); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;

    // Perfil suave de la vasija
    var raw = [[.001,0],[.34,0],[.43,.05],[.41,.13],[.58,.28],[.88,.58],[1.02,.92],[.99,1.2],[.85,1.45],[.6,1.64],[.42,1.76],[.36,1.9],[.41,2.03],[.53,2.13],[.51,2.19]];
    var prof = new T.SplineCurve(raw.map(function(p){ return new T.Vector2(p[0], p[1]); })).getPoints(56);
    var HT = 2.19, SEG = 8, cutsY = [0, .5, 1.1, 1.62, HT + .01];
    function nearest(y){ var bi = 0, bd = 9; prof.forEach(function(p, i){ var d = Math.abs(p.y - y); if (d < bd) { bd = d; bi = i; } }); return bi; }
    var cuts = cutsY.map(function(y, i){ return i === cutsY.length - 1 ? prof.length - 1 : nearest(y); });
    var outer = new T.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: .03, roughness: .86, metalness: 0, side: T.FrontSide });
    var innerM = new T.MeshStandardMaterial({ color: 0x4a2010, roughness: .95, metalness: 0, side: T.BackSide });
    var edgeM = new T.MeshStandardMaterial({ color: 0xb0764a, roughness: .95, metalness: 0, side: T.DoubleSide });
    var vase = new T.Group(); scene.add(vase);
    var pieces = [];
    function seeded(n){ var v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); }
    for (var bnd = 0; bnd < 4; bnd++) {
      var sub = prof.slice(cuts[bnd], cuts[bnd + 1] + 1);
      var shift = seeded(bnd + 1) * (Math.PI * 2 / SEG);
      for (var k = 0; k < SEG; k++) {
        var phi0 = shift + k * Math.PI * 2 / SEG, phiL = Math.PI * 2 / SEG, segs = 10;
        var gO = new T.LatheGeometry(sub, segs, phi0, phiL);
        var uv = gO.attributes.uv, n = sub.length;
        for (var ii = 0; ii <= segs; ii++) for (var jj = 0; jj < n; jj++) { var ix = ii * n + jj; uv.setXY(ix, ((phi0 + ii / segs * phiL) / (Math.PI * 2)) % 1.0001, sub[jj].y / HT); }
        uv.needsUpdate = true;
        var subIn = sub.map(function(p){ return new T.Vector2(Math.max(.001, p.x * .94 - .01), p.y); });
        var gI = new T.LatheGeometry(subIn, segs, phi0, phiL);
        // canto: tapa la grieta entre la cara externa y la interna
        var midPhi = phi0 + phiL / 2, rMid = 0, yMid = 0;
        sub.forEach(function(p){ rMid += p.x; yMid += p.y; }); rMid /= n; yMid /= n;
        var c = new T.Vector3(Math.sin(midPhi) * rMid, yMid - HT / 2, Math.cos(midPhi) * rMid);
        gO.translate(0, -HT / 2, 0); gI.translate(0, -HT / 2, 0);
        gO.translate(-c.x, -c.y, -c.z); gI.translate(-c.x, -c.y, -c.z);
        var g = new T.Group();
        g.add(new T.Mesh(gO, outer)); g.add(new T.Mesh(gI, innerM));
        [phi0, phi0 + phiL].forEach(function(ph){
          var pts = []; sub.forEach(function(p){ pts.push(new T.Vector3(Math.sin(ph) * p.x, p.y - HT / 2, Math.cos(ph) * p.x)); });
          subIn.slice().reverse().forEach(function(p){ pts.push(new T.Vector3(Math.sin(ph) * p.x, p.y - HT / 2, Math.cos(ph) * p.x)); });
          var shape = new T.BufferGeometry().setFromPoints(pts);
          var idx = []; for (var q = 0; q < n - 1; q++) { var a1 = q, a2 = q + 1, b1 = 2 * n - 1 - q, b2b = 2 * n - 2 - q; idx.push(a1, a2, b1, a2, b2b, b1); }
          shape.setIndex(idx); shape.computeVertexNormals(); shape.translate(-c.x, -c.y, -c.z);
          g.add(new T.Mesh(shape, edgeM));
        });
        g.position.copy(c);
        var r1 = seeded(bnd * 31 + k * 7 + 3), r2 = seeded(bnd * 17 + k * 13 + 5), r3 = seeded(bnd * 11 + k * 19 + 9);
        var dir = new T.Vector3(c.x, c.y * .7 + (r1 - .5) * .8, c.z).normalize();
        var ex = c.clone().add(dir.multiplyScalar(1.4 + r2 * 1.8)).add(new T.Vector3((r3 - .5) * 1.2, (r1 - .5) * 1.4, (r2 - .5) * 1.2));
        var rot = new T.Euler((r1 - .5) * 3, (r2 - .5) * 3, (r3 - .5) * 3);
        vase.add(g);
        pieces.push({ g: g, home: c, ex: ex, rot: rot, delay: bnd * .1 + r3 * .3 });
      }
    }
    scene.add(new T.AmbientLight(0x3a2214, .95));
    var key = new T.DirectionalLight(0xffc690, 2.3); key.position.set(3.5, 4, 3); scene.add(key);
    var rim = new T.DirectionalLight(0xff6a1f, 2.6); rim.position.set(-4, 1.5, -3); scene.add(rim);
    var fill = new T.DirectionalLight(0xffe2c4, .5); fill.position.set(-2, -1, 4); scene.add(fill);
    var mouseL = new T.PointLight(0xffe0bd, 1.3, 14); mouseL.position.set(0, 0, 3); scene.add(mouseL);
    var N = 380, pg = new T.BufferGeometry(), arr = new Float32Array(N * 3);
    for (var kk = 0; kk < N; kk++) { arr[kk*3] = (Math.random() - .5) * 10; arr[kk*3+1] = (Math.random() - .5) * 6; arr[kk*3+2] = (Math.random() - .5) * 4; }
    pg.setAttribute('position', new T.BufferAttribute(arr, 3));
    var dust = new T.Points(pg, new T.PointsMaterial({ color: 0xffd9b0, size: .02, transparent: true, opacity: .4, depthWrite: false })); scene.add(dust);
    function size(){ var w = sec.clientWidth, h = sec.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); var s2 = w < 860 ? .62 : .9; vase.scale.set(s2, s2, s2); }
    size(); addEventListener('resize', size);
    var fragEl = $('#fragN'), card = $('#vCard'), lastN = -1;
    function ease(t){ return 1 - Math.pow(1 - t, 3); }
    var visible = true, t0 = performance.now(), raf = 0;
    function loop(){
      cancelAnimationFrame(raf);
      (function f(){
        var t = (performance.now() - t0) / 1000;
        var P = RM ? 1 : vessel.p;
        var A = Math.min(1, Math.max(0, (P - .04) / .78)), joined = 0;
        pieces.forEach(function(pc){
          var lt = Math.min(1, Math.max(0, (A - pc.delay) / .45)), e = ease(lt);
          if (lt >= 1) joined++;
          var fl = (1 - e) * Math.sin(t * .8 + pc.delay * 20) * .06;
          pc.g.position.set(pc.ex.x + (pc.home.x - pc.ex.x) * e, pc.ex.y + (pc.home.y - pc.ex.y) * e + fl, pc.ex.z + (pc.home.z - pc.ex.z) * e);
          pc.g.rotation.set(pc.rot.x * (1 - e), pc.rot.y * (1 - e), pc.rot.z * (1 - e));
        });
        if (joined !== lastN) { lastN = joined; if (fragEl) fragEl.textContent = joined; if (card) card.classList.toggle('show', joined === pieces.length); }
        vase.rotation.y = (RM ? .5 : t * .12) + P * Math.PI * .9;
        vase.rotation.x = .1 + vessel.my * .08;
        vase.position.y = RM ? 0 : Math.sin(t * 1.1) * .04;
        mouseL.position.set(vessel.mx * 4, -vessel.my * 3 + .5, 3);
        dust.rotation.y = t * .02;
        renderer.render(scene, cam);
        if (visible && !RM) raf = requestAnimationFrame(f);
      })();
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) loop(); }, { rootMargin: '100px' }).observe(sec);
    loop();
    vessel.retheme = function(){ var l = isLight(); dust.material.color.set(l ? 0x7a4a26 : 0xffd9b0); dust.material.opacity = l ? .3 : .4; renderer.toneMappingExposure = l ? 1.2 : 1.05; if (RM) loop(); };
    vessel.retheme();
    addEventListener('pointermove', function(e){ vessel.mx = e.clientX / innerWidth * 2 - 1; vessel.my = e.clientY / innerHeight * 2 - 1; });
  })();

  /* Mapa de proyectos */
  (function(){
    if (!$('#pins')) return;
    var pinsEl = $$('#pins .pin'), items = $$('#plist .pitem'), chips = $$('.chip-f'), deps = $$('#deps path');
    function show(i){
      var p = pinsEl[i]; if (!p) return;
      pinsEl.forEach(function(x){ x.classList.toggle('sel', x === p); });
      items.forEach(function(x){ x.classList.toggle('sel', +x.getAttribute('data-i') === i); });
      $('#pcSec').textContent = p.getAttribute('data-sec');
      $('#pcName').textContent = p.getAttribute('data-name');
      $('#pcPlace').textContent = p.getAttribute('data-place');
      $('#pcPhase').textContent = p.getAttribute('data-phase');
      $('#pcYear').textContent = p.getAttribute('data-year');
      var dep = p.getAttribute('data-place').split(', ')[1].normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
      deps.forEach(function(d){ d.classList.toggle('hot', d.getAttribute('data-n') === dep); });
      if (window.gsap && !RM) gsap.fromTo('#pcard', { y: 8, opacity: .4 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out' });
    }
    pinsEl.forEach(function(p, i){ p.addEventListener('click', function(){ show(i); }); });
    items.forEach(function(b){ b.addEventListener('click', function(){ show(+b.getAttribute('data-i')); }); });
    chips.forEach(function(c){
      c.addEventListener('click', function(){
        var f = c.getAttribute('data-f');
        chips.forEach(function(x){ x.setAttribute('aria-pressed', String(x === c)); });
        var first = -1;
        pinsEl.forEach(function(p, i){ var ok = f === 'all' || p.getAttribute('data-f') === f; p.classList.toggle('dim', !ok); if (ok && first < 0) first = i; });
        items.forEach(function(b){ var ok = f === 'all' || b.getAttribute('data-f') === f; b.classList.toggle('dim', !ok); });
        if (first >= 0) show(first);
      });
    });
    show(0);
  })();

  /* Prueba rápida */
  (function(){
    if (!$('#quiz')) return;
    var qs = $$('#quiz .q'), res = $('#qRes'), back = $('#qBack'), bar = $('#qBar'), stepEl = $('#qStep'), ans = [], cur = 0;
    function go(i){
      cur = i;
      qs.forEach(function(q, k){ q.classList.toggle('cur', k === i); });
      res.hidden = i < qs.length;
      back.hidden = i === 0 || i >= qs.length;
      bar.style.transform = 'scaleX(' + Math.min(1, (i + 1) / qs.length) + ')';
      stepEl.textContent = i < qs.length ? 'Pregunta ' + (i + 1) + ' de ' + qs.length : 'Listo';
      var target = i < qs.length ? qs[i] : res;
      if (window.gsap && !RM) gsap.fromTo(target, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: 'expo.out' });
      if (i >= qs.length) { result(); var tt = $('#qTitle'); if (tt) tt.focus({ preventScroll: true }); }
    }
    function result(){
      var earth = ans[1], lic = ans[2], area = ans[3], l, t, x;
      if (earth === 'no') { l = 1; t = 'Probablemente no lo necesitas.'; x = 'Si la obra no mueve tierra, el riesgo de afectar el patrimonio es bajo. Aun así, conviene confirmarlo, sobre todo si la zona tiene antecedentes arqueológicos.'; }
      else if (earth === 'si' && lic === 'si') { l = 3; t = 'Sí, lo necesitas.'; x = 'Tu obra mueve tierra y requiere licencia o permisos. En estos casos se exige un Programa de Arqueología Preventiva registrado ante el ICANH.'; }
      else if (earth === 'si') { l = 3; t = 'Muy probablemente lo necesitas.'; x = 'Toda obra que mueve tierra puede afectar el patrimonio arqueológico. Revisemos juntos si tu caso exige registrar un programa ante el ICANH.'; }
      else { l = 2; t = 'Hay que revisarlo.'; x = 'Con unos pocos datos del proyecto podemos decirte si aplica y qué fase corresponde.'; }
      if (area === 'Más de 10 ha' && earth !== 'no') x += ' Por el tamaño del área, conviene empezar el diagnóstico cuanto antes.';
      $('.meter3').setAttribute('data-l', l);
      $('#qTitle').textContent = t; $('#qText').textContent = x;
    }
    qs.forEach(function(q, i){
      $$('.opt', q).forEach(function(o){
        o.addEventListener('click', function(){
          $$('.opt', q).forEach(function(z){ z.classList.toggle('picked', z === o); });
          ans[i] = o.getAttribute('data-v');
          setTimeout(function(){ go(i + 1); }, 220);
        });
      });
    });
    back.addEventListener('click', function(){ if (cur > 0) go(cur - 1); });
    $('#qAgain').addEventListener('click', function(){ ans = []; $$('#quiz .opt').forEach(function(z){ z.classList.remove('picked'); }); go(0); });
    $('#qGo').addEventListener('click', function(){
      var sel = $('#f-tipo'); if (sel && ans[0]) sel.value = ans[0];
      var lab = { si: 'Sí', no: 'No', nose: 'No lo sé' };
      var msgTxt = 'Resultado de la prueba rápida: ' + $('#qTitle').textContent + '\nTipo de obra: ' + (ans[0] || '-') + '\nMovimiento de tierra: ' + (lab[ans[1]] || '-') + '\nLicencia o permisos: ' + (lab[ans[2]] || '-') + '\nÁrea: ' + (ans[3] || '-');
      if ($('#f-msg')) $('#f-msg').value = msgTxt;
      var el = $('#contacto');
      if (!el) { try { sessionStorage.setItem('arq-prueba', JSON.stringify({ tipo: ans[0] || '', msg: msgTxt })); } catch (e) {} window.__go('contacto.html#contacto'); return; }
      if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(function(){ $('#f-nombre').focus({ preventScroll: true }); }, 1500);
    });
    go(0);
  })();

  /* Numeración de secciones y libreta de campo */
  var CO = ['N 01°53′ · O 76°17′', 'N 02°56′ · O 75°17′', 'N 08°18′ · O 73°37′', 'N 05°01′ · O 72°45′', 'N 04°19′ · O 72°05′', 'N 07°05′ · O 74°42′',
            'N 09°40′ · O 73°45′', 'N 04°36′ · O 74°04′', 'N 06°33′ · O 73°08′', 'N 03°48′ · O 75°11′', 'N 10°25′ · O 75°31′', 'N 11°43′ · O 72°20′'];
  var numbered = $$('main > section').filter(function(sc){ return $('.lbl', sc); });
  var TOT = (numbered.length < 10 ? '0' : '') + numbered.length;
  numbered.forEach(function(sc, i){
    var l = $('.lbl', sc), nm = l.textContent.trim(), no = document.createElement('span');
    no.className = 'no'; no.textContent = (i < 9 ? '0' : '') + (i + 1);
    l.insertBefore(no, l.firstChild); l.setAttribute('data-no', '');
    sc.__rail = { no: no.textContent + ' / ' + TOT, nm: nm, co: CO[i] || CO[0] };
  });
  function scramble(el, txt){
    if (RM) { el.textContent = txt; return; }
    var f = 0; clearInterval(el.__t);
    el.__t = setInterval(function(){
      f++;
      el.textContent = txt.replace(/\d/g, function(d){ return f > 7 ? d : String(Math.floor(Math.random() * 10)); });
      if (f > 7) clearInterval(el.__t);
    }, 40);
  }
  function setRail(){}

  /* Curvas de nivel */
  function topo(host, seed, cx, cy){
    var NS = 'http://www.w3.org/2000/svg', W = 1200, H = 800, svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'topo'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); svg.setAttribute('aria-hidden', 'true');
    [[cx, cy, 11], [1 - cx * .9, 1 - cy * .8, 6]].forEach(function(c, ci){
      for (var k = 1; k <= c[2]; k++) {
        var r = k * (ci ? 38 : 44), d = '';
        for (var a = 0; a <= 120; a++) {
          var t = a / 120 * Math.PI * 2;
          var rr = r * (1 + .16 * Math.sin(3 * t + seed + k * .35) + .09 * Math.sin(5 * t - seed * 1.7 + k * .2) + .05 * Math.sin(8 * t + seed * 3 - k * .4)) + k * 4 * Math.sin(2 * t + seed);
          d += (a ? 'L' : 'M') + (c[0] * W + Math.cos(t) * rr * 1.25).toFixed(1) + ' ' + (c[1] * H + Math.sin(t) * rr).toFixed(1);
        }
        var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d + 'Z');
        if (k % 5 === 0) p.setAttribute('class', 'ix');
        if (ci === 0 && k === 3) p.setAttribute('class', 'em');
        p.setAttribute('pathLength', '1');
        svg.appendChild(p);
      }
    });
    host.classList.add('has-topo'); host.insertBefore(svg, host.firstChild);
    return svg;
  }
  var topos = [];
  [['#nosotros', 1.3, .82, .28], ['#cifras', 2.7, .12, .7], ['.cta-box', 4.1, .88, .82], ['footer', 5.9, .78, .3], ['.phero', 3.3, .9, .25], ['.cta-band', 6.6, .85, .7]].forEach(function(t){
    var h = $(t[0]); if (h) topos.push(topo(h, t[1], t[2], t[3]));
  });

  /* Cifras: gráficos */
  var vizItems = [];
  $$('.viz').forEach(function(v){
    var n = +v.getAttribute('data-n'), h = '', i;
    if (v.classList.contains('vz-years')) { for (i = 0; i <= n; i++) h += '<i style="height:' + (8 + i * 3.4) + 'px"></i>'; h += '<span class="a">Inicio</span><span class="b">Hoy</span>'; }
    else if (v.classList.contains('vz-ring')) {
      h = '<svg viewBox="-34 -34 68 68">';
      for (i = 0; i < n; i++) { var a0 = (i / n) * Math.PI * 2 - Math.PI / 2 + .07, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - .07, R = 28;
        h += '<path d="M' + (Math.cos(a0) * R).toFixed(2) + ' ' + (Math.sin(a0) * R).toFixed(2) + 'A' + R + ' ' + R + ' 0 0 1 ' + (Math.cos(a1) * R).toFixed(2) + ' ' + (Math.sin(a1) * R).toFixed(2) + '"/>'; }
      h += '</svg>';
    } else { for (i = 0; i < n; i++) h += '<i></i>'; }
    v.innerHTML = h;
    vizItems.push(v);
  });

  /* Menú del celular */
  (function(){
    var b = $('#mBtn'), m = $('#mnav'); if (!b || !m) return;
    var lb = $('.mb-l', b);
    function set(o){
      b.setAttribute('aria-expanded', String(o));
      document.documentElement.classList.toggle('menu-open', o);
      if (lb) lb.textContent = o ? 'Cerrar' : 'Menú';
      if (o) { m.hidden = false; requestAnimationFrame(function(){ requestAnimationFrame(function(){ m.classList.add('open'); }); }); if (window.__lenis) window.__lenis.stop(); }
      else { m.classList.remove('open'); setTimeout(function(){ if (!m.classList.contains('open')) m.hidden = true; }, 600); if (window.__lenis) window.__lenis.start(); }
    }
    b.addEventListener('click', function(){ set(b.getAttribute('aria-expanded') !== 'true'); });
    addEventListener('keydown', function(e){ if (e.key === 'Escape' && m.classList.contains('open')) { set(false); b.focus(); } });
    $$('a', m).forEach(function(a){ a.addEventListener('click', function(){ set(false); }); });
  })();

  /* Ir a otra página con la cortina */
  window.__go = function(href){
    var c = $('#curtain');
    try { sessionStorage.setItem('arq-visto', '1'); } catch (e) {}
    if (!G || RM || !c) { location.href = href; return; }
    G.set(c, { display: 'flex', transformOrigin: '50% 100%' });
    G.fromTo(c, { scaleY: 0 }, { scaleY: 1, duration: .55, ease: 'expo.inOut', onComplete: function(){ location.href = href; } });
  };

  /* Contacto: el formulario llega lleno con el resultado de la prueba */
  (function(){
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem('arq-prueba') || 'null'); if (d) sessionStorage.removeItem('arq-prueba'); } catch (e) {}
    if (!d || !$('#form')) return;
    if (d.tipo && $('#f-tipo')) $('#f-tipo').value = d.tipo;
    if ($('#f-msg')) $('#f-msg').value = d.msg || '';
  })();

  /* Servicios: el índice marca el servicio que se está viendo */
  (function(){
    var chips = $$('.srv-idx a'); if (!chips.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) chips.forEach(function(c){ c.classList.toggle('on', c.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.srv').forEach(function(s){ io.observe(s); });
  })();

  /* Al llegar a una página, empezar arriba. El visor de claude.ai restaura el desplazamiento
     de la página anterior; mientras la persona no se mueva, cualquier salto se devuelve al inicio. */
  (function(){
    if (location.hash) return;
    var lock = true;
    function top(){ if (!lock) return; if ((window.scrollY || document.documentElement.scrollTop) > 0) { window.scrollTo(0, 0); if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true }); } }
    function release(){ lock = false; }
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function(ev){ addEventListener(ev, release, { once: true, passive: true }); });
    addEventListener('scroll', top, { passive: true });
    top();
    addEventListener('load', function(){ top(); setTimeout(top, 60); setTimeout(top, 300); setTimeout(release, 3000); });
  })();


  function staticMode(){
    clearTimeout(failsafe);
    if (loader) loader.style.display = 'none';
    var cu = $('#curtain'); if (cu) cu.style.display = 'none';
    vizItems.forEach(function(v){ v.classList.add('lit'); });
    $$('.v-states').forEach(function(el){ el.style.minHeight = '0'; el.style.display = 'flex'; el.style.flexDirection = 'column'; el.style.gap = '14px'; });
    $$('.v-st').forEach(function(el){ el.style.position = 'static'; el.style.opacity = 1; el.style.transform = 'none'; });
  }
  if (!G || !ST || RM) { staticMode(); return; }
  G.registerPlugin(ST);
  document.documentElement.classList.add('anim');

  /* Desplazamiento suave */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: .09, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function(t){ lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    lenis.stop();
    window.__lenis = lenis;
  }
  /* Navegación entre páginas: la cortina cubre y la siguiente página la retira */
  var curtain = $('#curtain');
  $$('a[href$=".html"], a[href*=".html#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var href = a.getAttribute('href'), here = location.pathname.split('/').pop() || 'index.html';
      var file = href.split('#')[0], hash = href.split('#')[1];
      if (file === here && hash) { e.preventDefault(); var el = $('#' + hash); if (el) { if (lenis) lenis.scrollTo(el, { duration: 1.4, offset: -70 }); else el.scrollIntoView({ behavior: 'smooth' }); } return; }
      if (file === here) { e.preventDefault(); if (lenis) lenis.scrollTo(0, { duration: 1.2 }); else scrollTo(0, 0); return; }
      e.preventDefault();
      try { sessionStorage.setItem('arq-visto', '1'); } catch (er) {}
      G.set(curtain, { display: 'flex', transformOrigin: '50% 100%' });
      G.fromTo(curtain, { scaleY: 0 }, { scaleY: 1, duration: .55, ease: 'expo.inOut', onComplete: function(){ location.href = href; } });
    });
  });
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href'), el = id.length > 1 && $(id);
      if (!el) return; e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 1.4 }); else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* Cabecera: sólida al bajar, se esconde al bajar y vuelve al subir */
  var hdr = $('#hdr');
  ST.create({ start: 0, end: 'max', onUpdate: function(s){
    var y = s.scroll();
    hdr.classList.toggle('solid', y > 40);
    hdr.classList.toggle('hide', s.direction === 1 && y > 320);
  } });

  /* Separar palabras de títulos (respeta etiquetas internas) */
  function splitWords(el){
    var out = [];
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          parts.forEach(function(p){
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var o = document.createElement('span'); o.className = 'wm';
            var i = document.createElement('span'); i.className = 'wi'; i.textContent = p;
            o.appendChild(i); frag.appendChild(o); out.push(i);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    return out;
  }
  var heroWords = [];
  $$('[data-split]').forEach(function(el){
    var ws = splitWords(el);
    if (el.id === 'hero-t') { heroWords = ws; return; }
    if (el.closest('.phero')) return;
    G.from(ws, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .045, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* Portada: la foto del marco crece hasta cubrir la pantalla */
  var hero = $('#hero'), frame = $('#heroFrame'), bg = $('#heroBg');
  if (hero) {
  // El marco real se oculta y una copia absoluta toma su lugar y crece (la foto siempre recorta bien al rostro)
  function fr(k){ var s = hero.getBoundingClientRect(), r = frame.getBoundingClientRect(); return { top: r.top - s.top, left: r.left - s.left, width: r.width, height: r.height }[k]; }
  G.set(bg, { top: fr('top'), left: fr('left'), width: fr('width'), height: fr('height'), borderRadius: 24 });
  G.set(frame, { visibility: 'hidden' });
  var heroTl = G.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=120%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
  heroTl.fromTo(bg, { top: function(){ return fr('top'); }, left: function(){ return fr('left'); }, width: function(){ return fr('width'); }, height: function(){ return fr('height'); }, borderRadius: 24 },
                    { top: 0, left: 0, width: function(){ return hero.clientWidth; }, height: function(){ return hero.clientHeight; }, borderRadius: 0, ease: 'none' }, 0)
        .fromTo('#heroBg img', { scale: 1.15 }, { scale: 1, ease: 'none' }, 0)
        .fromTo(bg, { '--shade': 0 }, { '--shade': 1, ease: 'none' }, .3)
        .to('.hero-txt, .facts', { opacity: 0, yPercent: -8, ease: 'none' }, 0)
        .to('.hero-after', { opacity: 1, ease: 'none' }, .55);
  }

  /* Quiénes somos */
  if ($('#nosotros')) {
  G.fromTo('.am1 img', { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: true } });
  G.fromTo('.am2', { y: 70 }, { y: -24, ease: 'none', scrollTrigger: { trigger: '#nosotros', start: 'top bottom', end: 'bottom top', scrub: true } });
  G.fromTo('.am1', { clipPath: 'inset(100% 0 0 0 round 16px)' }, { clipPath: 'inset(0% 0 0 0 round 16px)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: '.about-media', start: 'top 80%' } });
  (function(){
    var p = $('#aboutText'), words = p.textContent.trim().split(/\s+/); p.textContent = '';
    var spans = words.map(function(w, i){ var s = document.createElement('span'); s.textContent = w; p.appendChild(s); if (i < words.length - 1) p.appendChild(document.createTextNode(' ')); return s; });
    G.fromTo(spans, { opacity: .18 }, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 45%', scrub: true } });
  })();
  G.from('.principles li', { y: 24, opacity: 0, stagger: .08, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.principles', start: 'top 92%' } });
  }

  /* Banda Teyuna */
  if ($('.band')) G.timeline({ scrollTrigger: { trigger: '.band', start: 'top top', end: '+=100%', scrub: 1, pin: true, anticipatePin: 1 } })
   .to('.band-media', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
   .to('.band-media img', { scale: 1, ease: 'none' }, 0);

  /* Vasija */
  (function(){
    if (!$('#vasija')) return;
    var L = $$('.v-left .v-st'), R = $$('.v-right .v-st');
    var tl = G.timeline({ scrollTrigger: { trigger: '#vasija', start: 'top top', end: '+=240%', scrub: 1, pin: true, anticipatePin: 1,
      onUpdate: function(s){ vessel.p = s.progress; G.set('#vProg', { scaleX: s.progress }); $('#vCount').textContent = '0' + Math.min(3, Math.floor(s.progress * 3) + 1) + ' / 03'; } } });
    for (var i = 0; i < 2; i++) {
      var at = i + .4;
      tl.to([L[i], R[i]], { opacity: 0, y: -36, filter: 'blur(6px)', duration: .5, ease: 'power2.in' }, at)
        .fromTo([L[i+1], R[i+1]], { opacity: 0, y: 36, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .5, ease: 'power2.out' }, at + .45);
    }
    tl.to({}, { duration: .6 });
  })();

  /* Excavación */
  (function(){
    if (!$('#digInner')) return;
    var inner = $('#digInner'), phs = $$('#phases .ph'), desc = $('#phDesc'), depth = $('#depth');
    var fx = { diag: $('.fx-diag'), pros: $('.fx-pros'), moni: $('.fx-moni'), resc: $('.fx-resc') };
    G.set([fx.pros, fx.moni, fx.resc], { opacity: 0 });
    G.set(fx.moni, { clipPath: 'inset(0 0 100% 0)' });
    G.set('.find', { scale: 0 });
    var cur = -1;
    function setPhase(i){
      if (i === cur) return; cur = i;
      phs.forEach(function(p, k){ p.classList.toggle('on', k === i); });
      G.to(desc, { opacity: 0, y: 8, duration: .2, onComplete: function(){ desc.textContent = phs[i].getAttribute('data-d'); G.to(desc, { opacity: 1, y: 0, duration: .45, ease: 'expo.out' }); } });
      G.to(fx.diag, { opacity: i === 0 ? 1 : .35, duration: .5 });
      G.to(fx.pros, { opacity: i >= 1 ? 1 : 0, duration: .6 });
      G.to(fx.moni, { opacity: i >= 2 ? 1 : 0, clipPath: i >= 2 ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', duration: 1, ease: 'expo.out' });
      G.to(fx.resc, { opacity: i >= 3 ? 1 : 0, duration: .6 });
      G.to('.find', { scale: i >= 2 ? 1 : 0, duration: .8, ease: 'back.out(2)', stagger: .08 });
    }
    setPhase(0);
    G.to(inner, { yPercent: -80, ease: 'none', scrollTrigger: { trigger: '#proceso', start: 'top top', end: '+=340%', scrub: 1, pin: '.dig-pin', anticipatePin: 1,
      onUpdate: function(s){
        depth.textContent = posToDepth(10 + 80 * s.progress).toFixed(2).replace('.', ',');
        setPhase(s.progress < .15 ? 0 : s.progress < .42 ? 1 : s.progress < .68 ? 2 : 3);
      } } });
  })();

  /* Servicios: recorrido horizontal con indicador */
  var mm = G.matchMedia();
  mm.add('(min-width: 861px)', function(){
    var track = $('#hsTrack'); if (!track) return;
    var dist = function(){ return Math.max(0, track.scrollWidth - innerWidth); };
    var tw = G.to(track, { x: function(){ return -dist(); }, ease: 'none', scrollTrigger: { trigger: '#servicios', start: 'top top', end: function(){ return '+=' + dist(); }, scrub: 1, pin: '.hs-pin', invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function(s){ G.set('#hsBar', { scaleX: s.progress }); $('#hsNum').textContent = '0' + Math.min(6, Math.floor(s.progress * 5.99) + 1) + ' / 06'; } } });
    $$('.svc').forEach(function(card){
      G.fromTo($('img', card), { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      G.fromTo($('.svc-m', card), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', ease: 'expo.out', duration: 1.3, scrollTrigger: { trigger: card, containerAnimation: tw, start: 'left 95%' } });
    });
  });
  mm.add('(max-width: 860px)', function(){
    $$('.svc').forEach(function(card){
      G.fromTo($('.svc-m', card), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    });
  });

  /* Sectores */
  (function(){
    var row = $('#mq1'), xp = 0, vel = 0; if (!row) return;
    G.ticker.add(function(){
      var v = lenis ? lenis.velocity : 0;
      vel += (v - vel) * .1;
      xp -= .022 + Math.min(Math.abs(vel), 40) * .003;
      if (xp <= -50) xp += 50;
      G.set(row, { xPercent: xp });
    });
  })();

  /* Cifras */
  $$('.cnt').forEach(function(el){
    var to = +el.getAttribute('data-to'), o = { v: 0 };
    G.to(o, { v: to, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: function(){ el.textContent = Math.round(o.v); } });
  });

  /* Mapa: departamentos y puntos entran */
  if ($('#map')) G.from('#deps path', { opacity: 0, duration: .8, ease: 'power2.out', stagger: { each: .02, from: 'random' }, scrollTrigger: { trigger: '#map', start: 'top 80%' } });
  if ($('#map')) G.from('#pins .pin', { scale: 0, duration: .7, ease: 'back.out(3)', stagger: .07, scrollTrigger: { trigger: '#map', start: 'top 70%' } });

  /* Ruta */
  (function(){
    if (!$('#steps')) return;
    var steps = $$('#steps .step'), docs = $$('#docs .doc');
    steps.forEach(function(s){ s.classList.remove('on'); });
    docs.forEach(function(d){ d.classList.remove('ok'); });
    G.fromTo('#stFill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 62%', end: 'bottom 62%', scrub: true,
      onUpdate: function(s){
        var p = s.progress;
        steps.forEach(function(st, i){ st.classList.toggle('on', p >= i / (steps.length - 1) - .02); });
        var n = Math.round(p * docs.length);
        docs.forEach(function(d, i){ d.classList.toggle('ok', i < n); });
      } } });
  })();

  /* Equipo y preguntas */
  if ($('#teamM')) G.timeline({ scrollTrigger: { trigger: '#teamM', start: 'top 82%' } })
   .fromTo('#teamM', { clipPath: 'inset(0 100% 0 0 round 16px)' }, { clipPath: 'inset(0 0% 0 0 round 16px)', duration: 1.5, ease: 'expo.inOut' })
   .fromTo('#teamM img', { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, .2);
  if ($('#why')) G.from('#why li', { y: 24, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '#why', start: 'top 88%' } });
  if ($('#faq')) G.from('#faq .qa', { y: 20, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '#faq', start: 'top 88%' } });

  /* Pie: el logo grande se descubre al llegar al final */
  if ($('#ftWord')) G.fromTo('#ftWord > *', { clipPath: 'inset(100% 0 0 0)', y: 30 }, { clipPath: 'inset(0% 0 0 0)', y: 0, ease: 'none', stagger: .15, scrollTrigger: { trigger: '#ftWord', start: 'top 98%', end: 'bottom 88%', scrub: 1 } });

  /* Libreta de campo: el riel cambia con cada sección */

  /* Curvas de nivel que se dibujan */
  topos.forEach(function(svg){
    var ps = $$('path', svg);
    G.set(ps, { strokeDasharray: '1 1', strokeDashoffset: 1 });
    G.to(ps, { strokeDashoffset: 0, ease: 'none', stagger: .04, scrollTrigger: { trigger: svg.parentNode, start: 'top 85%', end: 'center 45%', scrub: 1.2 } });
  });

  /* Cifras: cada gráfico se llena */
  vizItems.forEach(function(v){
    var it = $$('i, path', v), dots = v.classList.contains('vz-dots');
    G.to(it, { opacity: 1, duration: .01, stagger: { each: dots ? 1.6 / it.length : 1.4 / it.length, from: dots ? 'random' : 'start', onStart: function(){ this.targets()[0].classList.add('on'); } },
      scrollTrigger: { trigger: v, start: 'top 88%' } });
  });
  if ($('.vz-years')) G.from('.vz-years i', { scaleY: 0, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.vz-years', start: 'top 88%' } });

  /* Fotos: la segunda foto de Nosotros entra con una máscara */
  if ($('.am2')) G.fromTo('.am2', { clipPath: 'inset(0 0 100% 0 round 16px)' }, { clipPath: 'inset(0 0 0% 0 round 16px)', duration: 1.4, ease: 'expo.inOut', delay: .3, scrollTrigger: { trigger: '.about-media', start: 'top 80%' } });

  /* Páginas: entradas */
  $$('.srv').forEach(function(r){
    var m = $('.srv-m', r);
    if (m) G.fromTo(m, { clipPath: 'inset(0 0 100% 0 round 24px)' }, { clipPath: 'inset(0 0 0% 0 round 24px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: r, start: 'top 78%' } });
    G.from($$('.srv-t > *', r), { y: 30, autoAlpha: 0, stagger: .06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 78%' } });
  });
  ['.pill3', '.comp', '.vals', '.team2', '.allies', '.phase4', '.mv'].forEach(function(sel){
    $$(sel).forEach(function(g){ if (g.closest('.phero')) return; G.from(g.children, { y: 28, autoAlpha: 0, stagger: .07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 88%' } }); });
  });
  $$('.cta-band').forEach(function(b){ G.from(b, { y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 92%' } }); });

  /* Cargador */
  (function(){
    var paths = $$('#ldLogo .lp');
    paths.forEach(function(p){ var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; if (p.getAttribute('fill') && p.getAttribute('fill') !== 'none') p.style.fillOpacity = 0; });
    G.set(heroWords, { yPercent: 110 });
    G.set('.hero-txt .lbl, .hero-txt .t4, .hero-txt .acts, .fact', { y: 24, autoAlpha: 0 });
    if (document.documentElement.classList.contains('nointro') || !hero) {
      if (!location.hash) { scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); }
      clearTimeout(failsafe); loader.style.display = 'none';
      G.set(heroWords, { yPercent: 0 }); G.set('.hero-txt .lbl, .hero-txt .t4, .hero-txt .acts, .fact', { y: 0, autoAlpha: 1 });
      var tl0 = G.timeline({ onComplete: function(){ if (lenis) lenis.start(); ST.refresh(); var hh = location.hash && document.getElementById(location.hash.slice(1)); if (hh) { if (lenis) lenis.scrollTo(hh, { offset: -70, duration: 1.3 }); else hh.scrollIntoView({ behavior: 'smooth' }); } } });
      tl0.set(curtain, { display: 'flex', transformOrigin: '50% 0%', scaleY: 1 })
         .to(curtain, { scaleY: 0, duration: .7, ease: 'expo.inOut' }, .1)
         .set(curtain, { display: 'none' })
         .from('.phero .crumbs, .phero .lbl, .phero .t1 .wi, .phero .t4, .phero .acts', { y: 26, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .035 }, .35).from('.ccards > *', { y: 30, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08 }, .5)
         .from('.phero-media', { clipPath: 'inset(0 0 100% 0 round 16px)', duration: 1.4, ease: 'expo.inOut' }, .3);
      try { sessionStorage.setItem('arq-visto', '1'); } catch (er) {}
      return;
    }
    try { sessionStorage.setItem('arq-visto', '1'); } catch (er) {}
    var tl = G.timeline({ onComplete: function(){ clearTimeout(failsafe); loader.style.display = 'none'; if (lenis) lenis.start(); ST.refresh(); } });
    tl.fromTo('#ldLogo', { clipPath: 'inset(100% 0 0 0)', y: 16 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.2, ease: 'expo.inOut' }, 0)
      .to('#ldBar i', { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0)
      .to(loader, { opacity: 0, duration: .6, ease: 'power2.out' }, 1.45)
      .fromTo('#heroBg img', { scale: 1.3 }, { scale: 1.15, duration: 1.8, ease: 'expo.out' }, 1.5)
      .to('.hero-txt .lbl', { y: 0, autoAlpha: 1, duration: .9, ease: 'expo.out' }, 1.6)
      .to(heroWords, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .05 }, 1.65)
      .to('.hero-txt .t4, .hero-txt .acts, .fact', { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: .08 }, 1.9);
  })();

  addEventListener('load', function(){ ST.refresh(); });
  addEventListener('pageshow', function(e){ if (e.persisted && curtain) G.set(curtain, { display: 'none', scaleY: 0 }); });
})();
