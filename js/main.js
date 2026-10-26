// Escasi: menú, estado de la exposición, formulario a WhatsApp, hero con parallax, visor de comparadores,
// fases de obra, manifiesto palabra a palabra, contadores, scroll suave, parallax y entradas de texto
(function () {
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
  var g = window.gsap, ST = window.ScrollTrigger;
  var raiz = document.documentElement;

  // ---------- menú ----------
  var bm = document.querySelector('[data-menu]'), pm = document.querySelector('[data-menu-panel]');
  function menu(abrir) { if (!bm) return; bm.setAttribute('aria-expanded', abrir ? 'true' : 'false'); bm.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú'); pm.hidden = !abrir; document.body.style.overflow = abrir ? 'hidden' : ''; }
  if (bm) { bm.addEventListener('click', function () { menu(bm.getAttribute('aria-expanded') !== 'true'); }); pm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); }); }
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && pm && !pm.hidden) menu(false); });

  // ---------- exposición abierta ahora (hora de Madrid) ----------
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function ahora() {
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + (+p.minute) };
  }
  var min = function (t) { var a = t.split(':'); return +a[0] * 60 + (+a[1]); };
  var hora = function (t) { return t.replace(/^0/, ''); };
  function estado(el) {
    var H = JSON.parse(el.dataset.horario), n = ahora(), hoy = H[n.d] || [], txt, abierto = false;
    for (var i = 0; i < hoy.length; i++) if (n.m >= min(hoy[i][0]) && n.m < min(hoy[i][1])) { abierto = true; txt = 'Abierta ahora · cierra a las ' + hora(hoy[i][1]); }
    if (!abierto) {
      var luego = hoy.filter(function (t) { return min(t[0]) > n.m; })[0];
      if (luego) txt = 'Cerrada · abre hoy a las ' + hora(luego[0]);
      else for (var k = 1; k <= 7; k++) { var d = (n.d + k) % 7; if ((H[d] || []).length) { txt = 'Cerrada · abre ' + (k === 1 ? 'mañana' : 'el ' + DIAS[d]) + ' a las ' + hora(H[d][0][0]); break; } }
    }
    el.classList.toggle('es-abierto', abierto); el.querySelector('[data-estado-txt]').textContent = txt;
  }
  var estados = document.querySelectorAll('[data-estado]');
  var pinta = function () { estados.forEach(estado); };
  pinta(); setInterval(pinta, 60000);

  // ---------- formulario → WhatsApp ----------
  document.querySelectorAll('form[data-whatsapp]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f), l = ['Hola, quiero pedir presupuesto para una reforma.'];
      if (d.get('nombre')) l.push('Nombre: ' + d.get('nombre')); if (d.get('telefono')) l.push('Teléfono: ' + d.get('telefono'));
      l.push('Tipo: ' + d.get('tipo')); if (d.get('mensaje')) l.push(d.get('mensaje'));
      open('https://wa.me/' + f.dataset.whatsapp + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
    });
  });

  // ---------- comparadores (arrastrar en cualquier punto, teclado con el rango oculto) ----------
  document.querySelectorAll('[data-comp]').forEach(function (c) {
    var marco = c.querySelector('.comp__marco'), rango = c.querySelector('.comp__rango');
    var pon = function (v) { v = Math.max(0, Math.min(100, v)); marco.style.setProperty('--pos', v + '%'); rango.value = v; };
    rango.addEventListener('input', function () { pon(+rango.value); });
    var activo = false, mueve = function (e) { var r = marco.getBoundingClientRect(); pon((e.clientX - r.left) / r.width * 100); };
    marco.addEventListener('pointerdown', function (e) { activo = true; mueve(e); });
    addEventListener('pointermove', function (e) { if (activo) mueve(e); }, { passive: true });
    addEventListener('pointerup', function () { activo = false; });
    addEventListener('pointercancel', function () { activo = false; });
    // barrido de muestra: la línea va a un lado y vuelve al centro
    c._barre = function () {
      if (reducido) return; var t0 = null;
      var io = function (k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };
      var paso = function (t) {
        if (!t0) t0 = t; var s = (t - t0) / 1000;
        pon(s < .9 ? 50 - 30 * io(s / .9) : s < 2 ? 20 + 30 * io((s - .9) / 1.1) : 50);
        if (s < 2) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    c._pon = pon;
  });

  // ---------- visor de antes/después con pestañas ----------
  document.querySelectorAll('[data-visor]').forEach(function (v) {
    var tabs = [].slice.call(v.querySelectorAll('[data-tab]')), pares = v.querySelectorAll('[data-par]');
    var muestra = function (i, foco) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', j === i ? 'true' : 'false'); t.tabIndex = j === i ? 0 : -1; });
      pares.forEach(function (p, j) {
        var ya = !p.hidden; p.hidden = j !== i;
        if (j === i && !ya) { p.classList.remove('entra'); void p.offsetWidth; p.classList.add('entra'); var c = p.querySelector('[data-comp]'); if (c) { c._pon(50); setTimeout(c._barre, 250); } }
      });
      if (foco) tabs[i].focus();
      if (ST) ST.refresh();
    };
    // las fotos de las otras estancias se descargan cuando la página ya ha cargado, para que el cambio sea instantáneo
    addEventListener('load', function () { setTimeout(function () { v.querySelectorAll('[data-par][hidden] img').forEach(function (im) { im.loading = 'eager'; }); }, 1200); });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { muestra(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!k) return;
        e.preventDefault(); muestra((i + k + tabs.length) % tabs.length, true);
      });
    });
  });

  // ---------- carruseles: flechas que avanzan una tarjeta (se ocultan si todo cabe) ----------
  document.querySelectorAll('[data-carrusel]').forEach(function (c) {
    var p = c.querySelector('[data-carrusel-pista]'), ant = c.querySelector('[data-prev]'), sig = c.querySelector('[data-next]');
    var paso = function (d) { var t = p.firstElementChild; p.scrollBy({ left: d * (t ? t.getBoundingClientRect().width + 14 : p.clientWidth * .8), behavior: reducido ? 'auto' : 'smooth' }); };
    var est = function () { var max = p.scrollWidth - p.clientWidth; c.classList.toggle('sin-desborde', max <= 2); ant.disabled = p.scrollLeft <= 4; sig.disabled = p.scrollLeft >= max - 4; };
    ant.addEventListener('click', function () { paso(-1); }); sig.addEventListener('click', function () { paso(1); });
    p.addEventListener('scroll', est, { passive: true }); addEventListener('resize', est); est();
  });

  // ---------- la obra paso a paso: la fase que cruza el centro cambia la foto fija ----------
  document.querySelectorAll('[data-fases]').forEach(function (sec) {
    var fases = sec.querySelectorAll('[data-fase]'), fotos = sec.querySelectorAll('[data-foto]'), segs = sec.querySelectorAll('.fases__barra i');
    var n = sec.querySelector('[data-fase-n]'), t = sec.querySelector('[data-fase-t]');
    var activa = function (i) {
      fases.forEach(function (f, j) { f.classList.toggle('es-activa', j === i); });
      fotos.forEach(function (f, j) { f.classList.toggle('es-activa', j === i); });
      segs.forEach(function (s, j) { s.classList.toggle('hecho', j <= i); });
      if (n) n.textContent = 'Fase ' + (i + 1) + ' de ' + fases.length;
      if (t) t.textContent = fases[i].querySelector('h3').textContent;
    };
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) activa(+e.target.dataset.fase); }); }, { rootMargin: '-48% 0px -48% 0px' });
    fases.forEach(function (f) { io.observe(f); });
  });

  // ---------- manifiesto: cada palabra en su span (se tiñe con el scroll) ----------
  var palabras = [];
  document.querySelectorAll('[data-palabras]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="pal">' + w + '</span>'; }).join(' ');
    palabras.push(el);
  });

  var hero = document.querySelector('[data-hero]'), hf = hero && hero.querySelector('[data-hero-fotos]');

  // ---------- cabecera: sólida al bajar, se oculta al bajar rápido y vuelve al subir ----------
  var cab = document.querySelector('[data-cab]'), ultimo = 0;
  function cabecera(y) {
    if (!cab) return;
    cab.classList.toggle('es-solida', y > 40 || !hero);
    cab.classList.toggle('se-oculta', y > ultimo + 2 && y > innerHeight && !(pm && !pm.hidden));
    if (Math.abs(y - ultimo) > 2) ultimo = y;
  }
  cabecera(scrollY);

  if (reducido || !g || !ST) {
    raiz.classList.add('sin-mov');
    addEventListener('scroll', function () { cabecera(scrollY); }, { passive: true });
    document.querySelectorAll('[data-revela]').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  g.registerPlugin(ST); if (window.SplitText) g.registerPlugin(window.SplitText);

  // ---------- scroll suave (solo con ratón o trackpad) ----------
  var lenis = null, alScroll = function (y) { cabecera(y); };
  if (window.Lenis && !tactil) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1 });
    lenis.on('scroll', function (e) { ST.update(); alScroll(e.scroll); });
    g.ticker.add(function (t) { lenis.raf(t * 1000); }); g.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash || u.hash.length < 2) return;
        var t = document.querySelector(u.hash); if (!t) return; ev.preventDefault(); lenis.scrollTo(t, { offset: -10, duration: 1.4 });
      });
    });
  } else addEventListener('scroll', function () { alScroll(scrollY); }, { passive: true });

  // ---------- hero: entrada y parallax de la foto ----------
  if (hf) {
    g.fromTo(hf, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
    g.to(hf, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    g.from('.hero__entrada, .hero__cta, .hero .etq', { y: 28, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, delay: .35 });
    var fi = document.querySelector('.ficha');
    if (fi && getComputedStyle(fi).display !== 'none') g.from(fi, { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', delay: .7 });
  }

  // ---------- titulares por líneas ----------
  var splits = function () {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (!window.SplitText) return;
      var s = new SplitText(el, { type: 'lines', linesClass: 'ln' });
      s.lines.forEach(function (l) { l.innerHTML = '<span class="ln__in">' + l.innerHTML + '</span>'; });
      var enHero = el.closest('.hero');
      g.from(el.querySelectorAll('.ln__in'), enHero ? { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .09, delay: .15 }
        : { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    ST.refresh();
  };
  if (document.fonts) document.fonts.ready.then(splits); else splits();

  // ---------- manifiesto palabra a palabra ----------
  palabras.forEach(function (el) {
    g.to(el.querySelectorAll('.pal'), { opacity: 1, stagger: .06, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: .6 } });
  });

  // ---------- contadores ----------
  document.querySelectorAll('[data-cuenta]').forEach(function (el) {
    var fin = +el.dataset.cuenta, o = { v: 0 };
    if (fin < 2) return;
    el.textContent = '0';
    ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: function () { g.to(o, { v: fin, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } }); } });
  });

  // ---------- tarjetas y filas que entran al verse ----------
  g.utils.toArray('[data-revela]').forEach(function (el, i) {
    g.to(el, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: (i % 4) * .07, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  // ---------- parallax interior de las fotos ----------
  g.utils.toArray('[data-parallax-caja]').forEach(function (caja) {
    var im = caja.querySelector('.parallax'); if (!im) return;
    g.fromTo(im, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: caja, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- lema gigante de fondo: se desliza en horizontal al bajar ----------
  g.utils.toArray('[data-lema] span').forEach(function (el) {
    g.fromTo(el, { xPercent: 0 }, { xPercent: -22, ease: 'none', scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- comparadores: barrido de muestra la primera vez que se ven ----------
  document.querySelectorAll('[data-comp]').forEach(function (c) {
    ST.create({ trigger: c, start: 'top 70%', once: true, onEnter: function () { if (!c.closest('[hidden]')) c._barre(); } });
  });

  addEventListener('load', function () { ST.refresh(); });
})();
