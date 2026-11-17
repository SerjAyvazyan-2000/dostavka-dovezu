/* =========================================================
   ДОВЕЗУ — шаблон «Курьерская доставка». Чистый JS, без библиотек.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("ru-RU");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const countTo = (el, to, dur = 1400, suffix = "") => {
    if (reduce) { el.textContent = fmt(to) + suffix; return; }
    const from = parseFloat(el.dataset.v || 0), t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4), v = from + (to - from) * e;
      el.textContent = fmt(v) + suffix; el.dataset.v = v;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- заголовок по словам ---------- */
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "word";
            const s = document.createElement("span"); s.textContent = part; s.style.setProperty("--i", i++);
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-in")));
  });

  /* ---------- появление ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  $$("[data-reveal]").forEach((el) => {
    if (el.closest(".hero")) requestAnimationFrame(() => el.classList.add("is-in")); else io.observe(el);
  });

  /* ---------- меню ---------- */
  const burger = $("#burger"), nav = $("#nav");
  const closeMenu = () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); };
  burger.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });
  $$("a", nav).forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) closeMenu(); });

  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) $$(".nav > a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => navIO.observe(s));

  /* ---------- скролл: шапка, параллакс, горизонтальный блок ---------- */
  const header = $("#header"), callbar = $(".callbar");
  const para = $$("[data-parallax]");
  const boxes = $$(".pbox");
  const how = $("#how"), howTrack = $(".how__track"), howBar = $(".how__progress");
  const desktop = matchMedia("(min-width: 961px)");
  let mx = 0, my = 0, ticking = false;

  const sizeHow = () => {
    if (!desktop.matches) { how.style.height = ""; return; }
    const extra = howTrack.scrollWidth - innerWidth;
    how.style.height = (innerHeight + Math.max(0, extra)) + "px";
  };

  const frame = () => {
    ticking = false;
    const sy = scrollY, vh = innerHeight;
    header.classList.toggle("is-scrolled", sy > 10);
    callbar.classList.toggle("is-show", sy > vh * 0.7);

    if (!reduce && sy < vh * 1.2) {
      para.forEach((el) => { el.style.transform = `translate3d(0, ${sy * (+el.dataset.parallax || .2)}px, 0)`; });
      boxes.forEach((b) => {
        const d = +b.dataset.depth || .5;
        b.style.transform = `translate3d(${mx * 30 * d}px, ${my * 24 * d - sy * d * .5}px, 0)`;
      });
    }

    if (desktop.matches && how) {
      const r = how.getBoundingClientRect();
      const total = how.offsetHeight - vh;
      const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
      const extra = howTrack.scrollWidth - innerWidth;
      howTrack.style.transform = `translate3d(${-p * extra}px, 0, 0)`;
      howBar.style.setProperty("--hp", p.toFixed(3));
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", () => { sizeHow(); req(); }, { passive: true });
  if (fine && !reduce) addEventListener("pointermove", (e) => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req();
  }, { passive: true });
  sizeHow(); frame();
  addEventListener("load", () => { sizeHow(); frame(); });
  if (document.fonts) document.fonts.ready.then(() => { sizeHow(); frame(); });

  /* ---------- живые цифры в первом экране ---------- */
  const today = $("[data-today]"), eta = $("[data-eta]");
  let todayN = 248, etaN = 18;
  setInterval(() => {
    if (Math.random() > .5) { todayN += 1; today.textContent = todayN; }
    etaN = etaN > 4 ? etaN - 1 : 18; eta.textContent = etaN;
  }, 6000);

  /* ---------- «Что везём?» + 3D-коробка ----------
     Размеры коробки (px) и данные — меняйте здесь */
  const SIZES = [
    { w: 160, h: 10,  d: 112, label: "до 1 кг",   car: "Легковой автомобиль", for: "документы, ключи, договоры", time: "от 45 минут", price: 390 },
    { w: 120, h: 92,  d: 100, label: "до 10 кг",  car: "Легковой автомобиль", for: "посылки, цветы, техника",    time: "от 50 минут", price: 490 },
    { w: 190, h: 150, d: 160, label: "до 300 кг", car: "Каблук",              for: "мебель, стройматериалы",     time: "от 60 минут", price: 1290 },
    { w: 230, h: 190, d: 210, label: "до 1,5 т",  car: "Газель 3 м",          for: "переезды, оптовые партии",   time: "от 90 минут", price: 2490 }
  ];
  const cube = $("#cube"), stage = $(".stage"), cubeLabel = $("#cubeLabel"), match = $(".match");
  const priceEl = $('[data-m="price"]');
  const setSize = (i, first) => {
    const s = SIZES[i];
    cube.style.setProperty("--w", s.w + "px");
    cube.style.setProperty("--h", s.h + "px");
    cube.style.setProperty("--d", s.d + "px");
    stage.style.setProperty("--sw", Math.round(s.w * 1.5) + "px");
    cubeLabel.textContent = s.label;
    if (first) { priceEl.textContent = fmt(s.price); priceEl.dataset.v = s.price; return; }
    match.classList.add("is-swap");
    setTimeout(() => {
      $('[data-m="car"]').textContent = s.car; $('[data-m="for"]').textContent = s.for; $('[data-m="time"]').textContent = s.time;
      match.classList.remove("is-swap");
    }, 220);
    countTo(priceEl, s.price, 700);
  };
  $$(".size").forEach((b) => b.addEventListener("click", () => {
    $$(".size").forEach((x) => { x.classList.toggle("is-active", x === b); x.setAttribute("aria-selected", String(x === b)); });
    setSize(+b.dataset.size);
  }));
  setSize(0, true);

  /* ---------- демо отслеживания ---------- */
  const steps = $$("#trackSteps li"), prog = $(".tracker__progress"), trackEta = $("#trackEta");
  const ETAS = ["≈ 38 мин", "≈ 21 мин", "≈ 18 мин", "Доставлено"];
  const PROG = [8, 40, 70, 100];
  let timers = [];
  const runTrack = () => {
    timers.forEach(clearTimeout); timers = [];
    steps.forEach((li) => li.classList.remove("done", "now"));
    prog.style.setProperty("--p", 0); trackEta.textContent = "Ищем заказ…";
    steps.forEach((li, i) => {
      timers.push(setTimeout(() => {
        steps.forEach((x, j) => { x.classList.toggle("done", j < i || (i === steps.length - 1 && j <= i)); x.classList.toggle("now", j === i && i < steps.length - 1); });
        prog.style.setProperty("--p", PROG[i]);
        trackEta.textContent = ETAS[i];
      }, reduce ? 0 : 500 + i * 1100));
    });
  };
  $("#trackForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("#trackInput").value.trim() || "DL-4821";
    $("#trackNo").textContent = v.toUpperCase();
    runTrack();
  });
  const trackIO = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { runTrack(); trackIO.disconnect(); }
  }, { threshold: .4 });
  trackIO.observe($(".tracker"));

  /* ---------- счётчики ---------- */
  const cIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    cIO.unobserve(e.target);
    countTo(e.target, +e.target.dataset.count, 1600, e.target.dataset.suffix || "");
  }), { threshold: .6 });
  $$("[data-count]").forEach((el) => cIO.observe(el));

  /* ---------- калькулятор дохода водителя ---------- */
  const RATE = 520;      // ₽ в час (примерно) — поменяйте под свой город
  const WEEKS = 4.3;
  const hIn = $("#earnHours"), dIn = $("#earnDays"), earnOut = $("#earnOut");
  const fill = (r) => r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%");
  const earn = () => {
    fill(hIn); fill(dIn);
    $("#earnHoursOut").textContent = hIn.value; $("#earnDaysOut").textContent = dIn.value;
    countTo(earnOut, Math.round(hIn.value * dIn.value * WEEKS * RATE / 1000) * 1000, 500);
  };
  [hIn, dIn].forEach((r) => r.addEventListener("input", earn));
  earn();
  $("[data-driver]").addEventListener("click", () => {
    $('#orderForm textarea[name="comment"]').value = `Хочу стать водителем: ${hIn.value} ч/день, ${dIn.value} дн/неделю`;
  });

  /* ---------- бегущие отзывы: дублируем карточки для бесшовной ленты ---------- */
  $$(".rv-track").forEach((t) => [...t.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); t.append(k); }));

  /* ---------- аккордеон ---------- */
  $$(".acc__btn").forEach((btn) => btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    $$(".acc__btn").forEach((b) => b.setAttribute("aria-expanded", "false"));
    btn.setAttribute("aria-expanded", String(!open));
  }));

  /* ---------- модалка политики ---------- */
  const modal = $("#privacy");
  $$("[data-open]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    const a = b.dataset.anchor && modal.querySelector("#" + b.dataset.anchor);
    if (a) setTimeout(() => a.scrollIntoView({ block: "start" }), 50); else modal.scrollTop = 0;
  }));
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", () => modal.close()));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  /* ---------- маска телефона ---------- */
  const tel = $('#orderForm input[name="phone"]');
  tel.addEventListener("input", () => {
    let d = tel.value.replace(/\D/g, "");
    if (d.startsWith("8")) d = "7" + d.slice(1);
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
    let out = "+7";
    if (p[0]) out += " (" + p[0]; if (p[0].length === 3) out += ")";
    if (p[1]) out += " " + p[1]; if (p[2]) out += "-" + p[2]; if (p[3]) out += "-" + p[3];
    tel.value = d.length > 1 ? out : "";
  });

  /* ---------- форма ----------
     Чтобы заявки приходили в Telegram / CRM — отправьте FormData на свой
     обработчик в месте с пометкой TODO */
  const form = $("#orderForm"), status = $("#formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name, consent = form.elements.consent;
    let ok = true;
    [name, tel].forEach((f) => f.closest(".field").classList.remove("is-error"));
    consent.closest(".check").classList.remove("is-error");
    if (name.value.trim().length < 2) { name.closest(".field").classList.add("is-error"); ok = false; }
    if (tel.value.replace(/\D/g, "").length < 11) { tel.closest(".field").classList.add("is-error"); ok = false; }
    if (!consent.checked) { consent.closest(".check").classList.add("is-error"); ok = false; }
    if (!ok) { status.className = "form__status err"; status.textContent = "Проверьте имя, телефон и согласие на обработку данных."; return; }
    // TODO: fetch("/send.php", { method: "POST", body: new FormData(form) })
    status.className = "form__status ok";
    status.textContent = "Заявка принята! Перезвоним в течение 2 минут.";
    form.reset();
  });

  /* ---------- cookie (152-ФЗ) ----------
     Аналитика запускается только после согласия — в loadAnalytics() */
  const KEY = "cookie-consent-v1";
  const banner = $("#cookie"), opts = $("#cookieOpts"), ckA = $("#ckAnalytics"), acceptLabel = $("#ckAccept span");
  const loadAnalytics = () => { /* код Яндекс Метрики / GA */ };
  const save = (analytics) => {
    store.set(KEY, { necessary: true, analytics, date: new Date().toISOString() });
    banner.hidden = true;
    if (analytics) loadAnalytics();
  };
  const saved = store.get(KEY);
  if (saved) { if (saved.analytics) loadAnalytics(); } else setTimeout(() => { banner.hidden = false; }, 1400);
  $("#ckAccept").addEventListener("click", () => save(opts.hidden ? true : ckA.checked));
  $("#ckNecessary").addEventListener("click", () => save(false));
  $("#ckSettings").addEventListener("click", () => { opts.hidden = !opts.hidden; acceptLabel.textContent = opts.hidden ? "Принять все" : "Сохранить выбор"; });
  $("#cookieSettingsLink").addEventListener("click", () => {
    const s = store.get(KEY); ckA.checked = !!(s && s.analytics);
    opts.hidden = false; acceptLabel.textContent = "Сохранить выбор"; banner.hidden = false;
  });
})();
