/* Deejay Piaoan — CRO theme: motion + interactions. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('dc-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- live world clocks (digital readout: hh : mm meridiem) ---- */
  function tickClocks() {
    document.querySelectorAll('.dc-clock').forEach(function (el) {
      var tz = el.getAttribute('data-tz');
      var h12 = el.getAttribute('data-h') !== 'h24';
      var t = el.querySelector('.dc-clock__time');
      if (!t) return;
      try {
        var parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: h12
        }).formatToParts(new Date());
        var hh = '', mm = '', mer = '';
        parts.forEach(function (p) {
          if (p.type === 'hour') hh = p.value;
          else if (p.type === 'minute') mm = p.value;
          else if (p.type === 'dayPeriod') mer = p.value;
        });
        var html = '<span class="dc-clock__hh">' + hh + '</span>' +
                   '<span class="dc-clock__sep">:</span>' +
                   '<span class="dc-clock__mm">' + mm + '</span>';
        if (mer) html += '<span class="dc-clock__mer">' + mer + '</span>';
        t.innerHTML = html;
      } catch (e) {}
    });
  }

  /* ---- count-up ---- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    var raw = el.getAttribute('data-raw') || String(to);
    var decimals = (raw.split('.')[1] || '').length;
    var hasComma = raw.indexOf(',') !== -1;
    if (reduce) { el.textContent = raw; return; }
    var dur = 1400, start = null;
    function fmt(v) {
      var n = decimals ? v.toFixed(decimals) : Math.round(v).toString();
      if (hasComma) n = Number(n).toLocaleString('en-US');
      return n;
    }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = raw;
    }
    requestAnimationFrame(step);
  }

  /* ---- reveal on scroll ---- */
  function setupReveals() {
    var els = document.querySelectorAll('.reveal-fade, .reveal-text');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('is-in'); });
      document.querySelectorAll('.dc-count').forEach(countUp);
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          en.target.querySelectorAll('.dc-count').forEach(countUp);
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });

    // counters that aren't inside a reveal-* wrapper
    var statWrap = document.querySelector('.dc-hero__proof');
    if (statWrap) {
      var cio = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            statWrap.querySelectorAll('.dc-count').forEach(countUp);
            obs.disconnect();
          }
        });
      }, { threshold: 0.2 });
      cio.observe(statWrap);
    }
  }

  /* ---- hero headline split reveal ---- */
  function heroTitle() {
    var h = document.querySelector('.dc-hero__title[data-split]');
    if (!h) return;
    if (reduce || !hasGSAP || typeof window.SplitType === 'undefined') return;
    h.classList.add('is-split');
    try {
      var st = new window.SplitType(h, { types: 'chars' });
      window.gsap.to(st.chars, {
        y: 0, stagger: 0.014, delay: 0.15, duration: 0.5, ease: 'power3.out'
      });
    } catch (e) { h.classList.remove('is-split'); }
  }

  /* ---- image clip reveal (works + about) ---- */
  function clipReveals() {
    if (reduce || !hasGSAP || typeof window.ScrollTrigger === 'undefined') return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    document.querySelectorAll('.reveal-clip').forEach(function (c) {
      var img = c.querySelector('img');
      var tl = window.gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 82%', toggleActions: 'play none none none' } });
      tl.from(c, { xPercent: -8, autoAlpha: 0, duration: 0.9, ease: 'power2.out' });
      if (img) tl.from(img, { scale: 1.18, duration: 1.1, ease: 'power2.out' }, '-=0.9');
    });
  }

  /* ---- cards stack slider ---- */
  function cardsSlider() {
    var wrap = document.querySelector('[data-cards]');
    if (!wrap) return;
    var cards = Array.prototype.slice.call(wrap.querySelectorAll('.dc-card'));
    if (cards.length < 2) return;
    function off(){ return window.innerWidth <= 767 ? 11 : 16; }
    var animating = false;
    var VMAX = 4;
    // Where a card at clamped depth d (0 = front, VMAX = back) sits.
    function slot(d) {
      var o = off(), mobile = window.innerWidth <= 767;
      if (mobile) {
        return { left: 'auto', right: '0', tx: -(VMAX - d) * o, ty: (VMAX - d) * o };
      }
      return { left: '0', right: 'auto', tx: d * o, ty: (VMAX - d) * o };
    }
    function place(c, d, z, op) {
      var s = slot(d);
      c.style.left = s.left; c.style.right = s.right;
      c.style.transform = 'translateX(' + s.tx + 'px) translateY(' + s.ty + 'px)';
      c.style.zIndex = String(z);
      c.style.opacity = op;
    }
    function layout() {
      var n = cards.length;
      cards.forEach(function (c, i) {
        var depth = n - 1 - i;
        place(c, Math.min(depth, VMAX), i + 1, depth > VMAX ? '0' : '1');
      });
    }
    // Photocard shuffle: pick up the front card, lift it and pull it out to the left,
    // then carry it (still fully visible) round to the BACK of the stack and drop it
    // behind the others. No fading — the card physically travels to the back.
    function advance() {
      if (animating || cards.length < 2) return;
      animating = true;
      var n = cards.length;
      var front = cards[n - 1];
      var fs = slot(0);
      var EASE = 'cubic-bezier(.45,.05,.25,1)';
      // the rest of the stack eases one step forward over the whole move
      for (var i = 0; i < n - 1; i++) {
        var c = cards[i];
        var newDepth = (n - 1 - i) - 1;
        c.style.transition = 'transform .9s ' + EASE;
        place(c, Math.min(newDepth, VMAX), i + 2, newDepth > VMAX ? '0' : '1');
      }
      // phase 1 — pick it up: lift toward the viewer and pull to the left
      front.style.zIndex = '999';
      front.style.transition = 'transform .36s cubic-bezier(.34,1.1,.64,1), box-shadow .36s ease';
      front.style.transform = 'translateX(calc(' + fs.tx + 'px - 46%)) translateY(' + (fs.ty - 42) + 'px) rotate(-9deg) scale(1.06)';
      front.style.boxShadow = '0 46px 76px -22px rgba(4,12,34,.66)';
      setTimeout(function () {
        // phase 2 — carry it round to the back slot and drop it behind everyone (no fade)
        var bs = slot(VMAX);
        front.style.zIndex = '1';
        front.style.left = bs.left; front.style.right = bs.right;
        front.style.transition = 'transform .6s ' + EASE + ', box-shadow .6s ease';
        front.style.transform = 'translateX(' + bs.tx + 'px) translateY(' + bs.ty + 'px) rotate(0deg) scale(1)';
        front.style.boxShadow = '';
        setTimeout(function () {
          // normalize DOM + z-order; the card is already sitting in the back slot, so nothing jumps
          wrap.insertBefore(front, cards[0]);
          cards.unshift(cards.pop());
          front.style.transition = 'none';
          layout();
          void front.offsetWidth;
          front.style.transition = '';
          animating = false;
        }, 600);
      }, 360);
    }
    function back() {                     // reverse, for the prev arrow
      if (animating || cards.length < 2) return;
      wrap.appendChild(cards[0]); cards.push(cards.shift()); layout();
    }
    layout();
    var nb = wrap.querySelector('[data-next]'), pb = wrap.querySelector('[data-prev]');
    var timer = null;
    function autostart(){ if (!reduce && !timer) timer = setInterval(advance, 4600); }
    function autostop(){ if (timer) { clearInterval(timer); timer = null; } }
    if (nb) nb.addEventListener('click', function(){ autostop(); advance(); autostart(); });
    if (pb) pb.addEventListener('click', function(){ autostop(); back(); autostart(); });
    wrap.addEventListener('mouseenter', autostop);
    wrap.addEventListener('mouseleave', autostart);
    window.addEventListener('resize', layout);
    autostart();
  }

  /* ---- sticky header shadow + mobile menu ---- */
  function header() {
    var h = document.querySelector('.dc-header');
    var burger = document.querySelector('.dc-burger');
    if (burger && h) {
      burger.addEventListener('click', function () {
        var open = h.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        var mn = document.querySelector('.dc-mobile-nav');
        if (mn) mn.hidden = !open;
      });
      document.querySelectorAll('.dc-mobile-nav a').forEach(function (a) {
        a.addEventListener('click', function () {
          h.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          var mn = document.querySelector('.dc-mobile-nav'); if (mn) mn.hidden = true;
        });
      });
    }
  }

  /* ---- contact form -> mailto compose (no backend needed) ---- */
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbylSSdMXWwdCophzDTIM1IUcMG3MB-c-HKg6OAlPZGg3MeyZO55eE3eGUwsJcc6ZHO1_g/exec';
  var SHEET_SECRET = 'deejay-leads-8f3kq-2026-xyz';
  function contactForm() {
    var f = document.querySelector('[data-contact]');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(f);
      var name = (d.get('name') || '').toString().trim();
      var email = (d.get('email') || '').toString().trim();
      var svc = (d.get('service') || '').toString();
      if (svc.indexOf('Choose') !== -1) svc = '';
      var msg = (d.get('message') || '').toString().trim();
      var whatsapp = (d.get('whatsapp') || '').toString().trim();
      var calltime = (d.get('calltime') || '').toString().trim();
      var note = f.querySelector('[data-note]');
      var btn = f.querySelector('.dc-submit');
      if (!name || !email) {
        if (note) { note.hidden = false; note.style.color = '#b00000'; note.textContent = 'Please add your name and email.'; }
        return;
      }
      if (btn) { btn.disabled = true; }
      // A chosen call time turns this into a booking; otherwise it's a plain enquiry.
      var payload = {
        type: calltime ? 'booking' : 'enquiry', secret: SHEET_SECRET,
        name: name, email: email, phone: '', country: '',
        service: svc, budget: '', whatsapp: whatsapp, calltime: calltime, message: msg
      };
      // Browser-direct post: the Apps Script writes the row to the Google Sheet
      // and emails deejaydpiaoan@gmail.com. no-cors, so we can't read the reply.
      fetch(SHEET_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(function () {});
      var firstName = name.split(/\s+/)[0] || 'there';
      var successEl = f.parentNode.querySelector('[data-success]');
      var successMsg = successEl ? successEl.querySelector('[data-success-msg]') : null;
      setTimeout(function () {
        f.reset();
        if (btn) { btn.disabled = false; }
        if (note) { note.hidden = true; note.textContent = ''; }
        if (successEl && successMsg) {
          successMsg.textContent = calltime
            ? 'Thanks ' + firstName + '! Your call request is in. You will get a calendar invite with the meeting link shortly.'
            : 'Thanks ' + firstName + '! Your message is on its way. I will get back to you shortly.';
          // swap: hide the form, show the success card (re-triggers the check animation)
          f.hidden = true;
          successEl.hidden = false;
          setTimeout(function () {
            successEl.hidden = true;
            f.hidden = false;
          }, 2600);
        } else if (note) {
          note.hidden = false; note.style.color = '#111721';
          note.textContent = 'Thanks ' + firstName + '! Your message is on its way.';
        }
      }, 500);
    });
  }

  /* ---- services: cycle the grey brand logos as the ring turns ---- */
  function serviceLogos() {
    if (reduce) return;
    document.querySelectorAll('.dc-svc__glyph[data-logos]').forEach(function (g, gi) {
      var logos = Array.prototype.slice.call(g.querySelectorAll('.dc-svc__logo'));
      if (logos.length < 2) return;
      var idx = 0;
      setTimeout(function () {
        setInterval(function () {
          logos[idx].classList.remove('is-on');
          idx = (idx + 1) % logos.length;
          logos[idx].classList.add('is-on');
        }, 2000);
      }, gi * 550);
    });
  }

  /* ---- Selected Works: See More / Show Less toggle ---- */
  /* ---- certificate lightbox (multi-image gallery + auto-advance) ---- */
  function certModal() {
    var modal = document.querySelector('[data-cert-modal]');
    if (!modal) { return; }
    var img = modal.querySelector('[data-cert-img]');
    var prevBtn = modal.querySelector('[data-cert-prev]');
    var nextBtn = modal.querySelector('[data-cert-next]');
    var dotsWrap = modal.querySelector('[data-cert-dots]');
    var inner = modal.querySelector('.dc-certmodal__inner');
    var openers = Array.prototype.slice.call(document.querySelectorAll('[data-cert-images]'));
    var AUTO_MS = 2000;

    var stage = modal.querySelector('.dc-certmodal__stage');
    var images = [], baseAlt = '', idx = 0, timer = null, lastFocus = null, verifyUrl = '';

    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function startAuto() {
      stopAuto();
      if (images.length > 1) { timer = setInterval(function () { go(idx + 1); }, AUTO_MS); }
    }
    function renderDots() {
      if (!dotsWrap) { return; }
      dotsWrap.innerHTML = '';
      if (images.length < 2) { return; }
      images.forEach(function (_, i) {
        var d = document.createElement('span');
        d.className = 'dc-certmodal__dot' + (i === idx ? ' is-on' : '');
        dotsWrap.appendChild(d);
      });
    }
    function show(i) {
      idx = (i + images.length) % images.length;
      if (img) {
        img.setAttribute('src', images[idx]);
        img.setAttribute('alt', baseAlt + (images.length > 1 ? ' (' + (idx + 1) + ' of ' + images.length + ')' : ''));
      }
      renderDots();
    }
    // manual navigation resets the auto-advance timer
    function go(i) { show(i); }
    function nav(i) { show(i); startAuto(); }

    function open(list, alt, verify) {
      lastFocus = document.activeElement;
      images = list; baseAlt = alt || 'Certificate'; idx = 0;
      verifyUrl = verify || '';
      var multi = images.length > 1;
      if (prevBtn) { prevBtn.hidden = !multi; }
      if (nextBtn) { nextBtn.hidden = !multi; }
      modal.classList.toggle('is-multi', multi);
      modal.classList.toggle('is-verifiable', !!verifyUrl);
      show(0);
      modal.hidden = false;
      document.body.classList.add('dc-certmodal-open');
      startAuto();
      var x = modal.querySelector('[data-cert-close]');
      if (x && x.focus) { setTimeout(function () { x.focus(); }, 30); }
    }
    function close() {
      stopAuto();
      modal.hidden = true;
      document.body.classList.remove('dc-certmodal-open');
      if (img) { img.setAttribute('src', ''); }
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }

    openers.forEach(function (el) {
      el.addEventListener('click', function () {
        var list = (el.getAttribute('data-cert-images') || '').split('|').filter(Boolean);
        if (!list.length) { return; }
        open(list, el.getAttribute('data-cert-alt'), el.getAttribute('data-cert-verify'));
      });
    });
    // clicking a verifiable certificate opens its verification page (same tab)
    if (img) {
      img.addEventListener('click', function () {
        if (verifyUrl) { window.location.href = verifyUrl; }
      });
    }
    modal.querySelectorAll('[data-cert-close]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); close(); });
    });
    if (prevBtn) { prevBtn.addEventListener('click', function (e) { e.preventDefault(); nav(idx - 1); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function (e) { e.preventDefault(); nav(idx + 1); }); }
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) { return; }
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft' && images.length > 1) { nav(idx - 1); }
      else if (e.key === 'ArrowRight' && images.length > 1) { nav(idx + 1); }
    });
  }

  /* ---- flip badge: auto-flip between the two Cisco credentials ---- */
  function badgeFlip() {
    var flip = document.querySelector('[data-flip]');
    if (!flip) { return; }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { return; } // hover/focus reveals the back face instead (CSS)
    setInterval(function () { flip.classList.toggle('is-flipped'); }, 3000);
  }

  /* ---- Certifications: expand full section / collapse back to compact ---- */
  function certsReveal() {
    var sec = document.getElementById('certs');
    var compact = document.querySelector('[data-certs-compact]');
    if (!sec) { return; }
    function expand(scroll) {
      sec.hidden = false;
      if (compact) { compact.hidden = true; }
      document.querySelectorAll('[data-certs-expand]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      if (scroll) {
        window.requestAnimationFrame(function () { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      }
    }
    function collapse() {
      sec.hidden = true;
      if (compact) { compact.hidden = false; }
      document.querySelectorAll('[data-certs-expand]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      // bring the reappeared compact block back into view
      var target = compact || document.getElementById('about') || sec;
      window.requestAnimationFrame(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    }
    document.querySelectorAll('[data-certs-expand]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); expand(true); });
    });
    document.querySelectorAll('[data-certs-collapse]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); collapse(); });
    });
    // nav / any in-page link to #certs expands the section first
    document.querySelectorAll('a[href="#certs"]').forEach(function (a) {
      a.addEventListener('click', function () { expand(true); });
    });
  }

  function worksMore() {
    var btn = document.querySelector('[data-work-more]');
    if (!btn) { return; }
    var more = Array.prototype.slice.call(document.querySelectorAll('.dc-proj--more'));
    var label = btn.querySelector('.dc-btn__t');
    var expanded = false;
    btn.addEventListener('click', function () {
      expanded = !expanded;
      if (expanded) {
        more.forEach(function (el) { el.hidden = false; });
        if (label) { label.textContent = 'Show Less'; }
        btn.setAttribute('aria-expanded', 'true');
      } else {
        more.forEach(function (el) { el.hidden = true; });
        if (label) { label.textContent = 'See More Works'; }
        btn.setAttribute('aria-expanded', 'false');
        var sec = document.getElementById('work');
        if (sec) { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  }

  /* ---- flashcard contact quiz (stepped, submits to the same Google Sheet) ---- */
  function contactQuiz() {
    var quiz = document.querySelector('[data-quiz]');
    if (!quiz) { return; }
    var panes = Array.prototype.slice.call(quiz.querySelectorAll('.dc-quiz__pane'));
    var data = {};
    var idx = 0;
    var lastFocus = null;

    function setStep(i) {
      idx = i;
      panes.forEach(function (p, n) {
        p.classList.toggle('is-active', n === i);
        p.classList.toggle('is-past', n < i);
      });
      var input = panes[i] && panes[i].querySelector('.dc-quiz__input');
      if (input) { setTimeout(function () { input.focus(); }, 340); }
    }
    function open() {
      lastFocus = document.activeElement;
      quiz.hidden = false;
      document.body.classList.add('dc-quiz-open');
      // reset
      data = {};
      panes.forEach(function (p) {
        var f = p.querySelector('.dc-quiz__input'); if (f) { f.value = ''; }
        var e = p.querySelector('[data-err]'); if (e) { e.hidden = true; }
      });
      void quiz.offsetWidth;
      quiz.classList.add('is-open');
      setStep(0);
    }
    function close() {
      quiz.classList.remove('is-open');
      document.body.classList.remove('dc-quiz-open');
      setTimeout(function () { quiz.hidden = true; setStep(0); }, 400);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }
    function showErr(pane, msg) {
      var e = pane.querySelector('[data-err]');
      if (e) { e.hidden = false; e.textContent = msg; }
    }
    function clearErr(pane) {
      var e = pane.querySelector('[data-err]'); if (e) { e.hidden = true; }
    }
    function validStep(i) {
      var pane = panes[i];
      var input = pane.querySelector('.dc-quiz__input');
      var field = input.getAttribute('data-field');
      var val = (input.value || '').trim();
      if (field === 'storeurl') {
        if (!val) { showErr(pane, 'Please add your store or website URL.'); return false; }
        if (!/^https?:\/\//i.test(val)) { val = 'https://' + val; }
        data.storeurl = val;
      } else if (field === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showErr(pane, 'Please enter a valid email address.'); return false; }
        data.email = val;
      } else if (field === 'message') {
        data.message = val;
      }
      clearErr(pane);
      return true;
    }
    function submit() {
      if (!validStep(2)) { return; }
      var btn = panes[2].querySelector('[data-submit]');
      if (btn) { btn.disabled = true; }
      var payload = {
        type: 'enquiry', secret: SHEET_SECRET,
        name: '', email: data.email || '', phone: '', country: '',
        service: 'Quick enquiry', budget: '', whatsapp: '', calltime: '',
        message: 'Store URL: ' + (data.storeurl || '-') + '\n\n' + (data.message || '')
      };
      fetch(SHEET_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch(function () {});
      setStep(3);
      if (btn) { btn.disabled = false; }
    }

    // open from any CTA that points at the contact section
    document.querySelectorAll('a[href="#form"]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    // controls
    quiz.querySelectorAll('[data-quiz-close]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); close(); });
    });
    quiz.querySelectorAll('[data-next]').forEach(function (b) {
      b.addEventListener('click', function () { if (validStep(idx)) { setStep(idx + 1); } });
    });
    var submitBtn = quiz.querySelector('[data-submit]');
    if (submitBtn) { submitBtn.addEventListener('click', submit); }
    // keyboard
    quiz.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      var pane = panes[idx];
      if (!pane) { return; }
      var input = pane.querySelector('.dc-quiz__input');
      if (e.target !== input) { return; }
      if (input.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) { e.preventDefault(); submit(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (validStep(idx)) { setStep(idx + 1); }
      }
    });
    // auto-grow the textarea
    var area = quiz.querySelector('.dc-quiz__area');
    if (area) {
      area.addEventListener('input', function () {
        area.style.height = 'auto';
        area.style.height = Math.min(area.scrollHeight, window.innerHeight * 0.4) + 'px';
      });
    }
  }

  /* ---- scrollspy: light up the nav item for the section in view ---- */
  function scrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.dc-nav a[href^="#"]'));
    var secs = links.map(function (a) {
      var s = document.getElementById(a.getAttribute('href').slice(1));
      return s ? { a: a, s: s } : null;
    }).filter(Boolean);
    if (!secs.length) { return; }
    function update() {
      var line = window.innerHeight * 0.4; // viewport-relative activation line
      var cur = null;
      secs.forEach(function (o) {
        if (o.s.getBoundingClientRect().top <= line) { cur = o; }
      });
      links.forEach(function (a) { a.classList.remove('is-active'); });
      if (cur) { cur.a.classList.add('is-active'); }
    }
    update();
    window.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
  }

  ready(function () {
    tickClocks();
    setInterval(tickClocks, 1000 * 20);
    setupReveals();
    heroTitle();
    clipReveals();
    cardsSlider();
    header();
    serviceLogos();
    worksMore();
    scrollSpy();
    contactQuiz();
    contactForm();
    certModal();
    certsReveal();
    badgeFlip();
  });
})();
