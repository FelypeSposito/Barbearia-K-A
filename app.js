/* Base do site: lógica de interface, disponibilidade e dados fictícios.
   Nada aqui fala com servidor: agendamentos, login e painel são simulados
   no navegador (localStorage) para validar a experiência antes do backend. */
(function () {
  "use strict";
  const cfg = window.BARBEARIA_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- armazenamento tolerante a falhas ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("bb_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("bb_" + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- utilidades de tempo ---------- */
  const DK = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  const DL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DLL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const ML = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const pad = n => String(n).padStart(2, "0");
  const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const fmt = m => pad(Math.floor(m / 60)) + ":" + pad(m % 60);
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const fromIso = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const brl = v => "R$ " + v.toFixed(0);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const dayLabel = ds => {
    const d = fromIso(ds), t = today();
    const diff = Math.round((d - t) / 864e5);
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Amanhã";
    return DL[d.getDay()] + ", " + d.getDate() + " " + ML[d.getMonth()];
  };

  const socioById = id => cfg.socios.find(s => s.id === id);
  const servById = id => cfg.servicos.find(s => s.id === id);

  /* jornada editável pelo painel (sobrepõe o config) */
  cfg.socios.forEach(s => { const o = store.get("jornada_" + s.id, null); if (o) s.jornada = o; });

  /* ---------- dados fictícios ---------- */
  const NOMES = ["Lucas M.", "Rafael S.", "Pedro H.", "Gabriel A.", "Mateus R.", "João V.", "Bruno C.", "Thiago L.", "Diego F.", "Caio P.", "Vitor N.", "André B."];
  const NOTAS = [
    "Mesmo do mês passado, só baixar mais a lateral.",
    "Quero tirar o volume de cima, tá pesado.",
    "Degradê na 0, risquinho do lado esquerdo.",
    "Barba só alinhar, não tirar comprimento.",
    "Primeira vez. Vou levar foto de referência.",
    "",
    "",
    "Sobrancelha bem natural, por favor."
  ];
  const mockCache = {};
  function mockAppointments(socioId, ds) {
    const key = socioId + ds;
    if (mockCache[key]) return mockCache[key];
    const s = socioById(socioId), d = fromIso(ds);
    const ranges = s.jornada[DK[d.getDay()]] || [];
    const list = [];
    const servs = cfg.servicos.filter(v => v.socios.includes(socioId));
    const step = cfg.agendamento.intervaloMin;
    ranges.forEach(([a, b]) => {
      let t = toMin(a);
      const end = toMin(b);
      while (t < end) {
        const h = hash(key + t);
        if (h % 100 < 38) {
          const sv = servs[h % servs.length];
          if (t + sv.duracao <= end) {
            list.push({ id: "m" + h, socio: socioId, date: ds, start: t, dur: sv.duracao, servico: sv.id, cliente: NOMES[h % NOMES.length], nota: NOTAS[(h >> 3) % NOTAS.length], mock: true });
            t += Math.ceil(sv.duracao / step) * step;
            continue;
          }
        }
        t += step;
      }
    });
    return (mockCache[key] = list);
  }
  const userBookings = () => store.get("bookings", []);
  function appointments(socioId, ds) {
    const u = userBookings().filter(b => b.socio === socioId && b.date === ds && !b.cancelado)
      .map(b => ({ ...b, start: toMin(b.time), dur: servById(b.servico).duracao }));
    return mockAppointments(socioId, ds).concat(u).sort((a, b) => a.start - b.start);
  }

  function freeSlots(socioId, ds, dur) {
    const s = socioById(socioId), d = fromIso(ds);
    const ranges = s.jornada[DK[d.getDay()]] || [];
    const busy = appointments(socioId, ds);
    const step = cfg.agendamento.intervaloMin;
    const now = new Date();
    const minStart = iso(now) === ds ? now.getHours() * 60 + now.getMinutes() + cfg.agendamento.antecedenciaMin : -1;
    const out = [];
    ranges.forEach(([a, b]) => {
      for (let t = toMin(a); t + dur <= toMin(b); t += step) {
        if (t < minStart) continue;
        if (busy.some(x => t < x.start + x.dur && x.start < t + dur)) continue;
        out.push(t);
      }
    });
    return out;
  }
  function nextFree(socioId, dur) {
    for (let i = 0; i < cfg.agendamento.diasAFrente; i++) {
      const ds = iso(addDays(today(), i));
      const f = freeSlots(socioId, ds, dur);
      if (f.length) return { date: ds, time: f[0], all: f };
    }
    return null;
  }

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.remove("show"); setTimeout(() => (t.hidden = true), 500); }, 2600);
  }

  /* ---------- controle segmentado ---------- */
  function seg(el, options, value, onChange) {
    el.innerHTML = '<span class="seg-thumb"></span>' + options.map(o => `<button type="button" role="tab" data-v="${esc(o.v)}" aria-selected="${o.v === value}">${esc(o.l)}</button>`).join("");
    const thumb = el.firstChild;
    const place = () => { const b = el.querySelector('[aria-selected="true"]'); if (!b) return; thumb.style.width = b.offsetWidth + "px"; thumb.style.transform = `translateX(${b.offsetLeft}px)`; };
    el.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", el).forEach(x => x.setAttribute("aria-selected", x === b));
      place(); onChange(b.dataset.v);
    };
    el._place = place;
    requestAnimationFrame(place);
  }
  addEventListener("resize", () => $$(".seg").forEach(s => s._place && s._place()));

  function phHtml(label, foto) {
    return foto ? `<div class="ph has-img" style="background-image:url('${esc(foto)}')"></div>` : `<div class="ph" data-ph="${esc(label)}"></div>`;
  }

  /* ================= SITE ================= */
  function bindTexts() {
    $$("[data-bind]").forEach(el => { const v = cfg[el.dataset.bind]; if (v != null) el.textContent = v; });
    if (cfg.fotoPrincipal) $(".hero-photo .ph").outerHTML = phHtml("Foto principal", cfg.fotoPrincipal);
    $("#booksy-link").href = cfg.booksyUrl;
    document.title = cfg.nome + " Barbearia";
  }

  function workCard(w, i) {
    const s = socioById(w.socio);
    return `<figure class="work" data-socio="${w.socio}">
      <div class="work-img">${phHtml("Foto " + (i + 1), w.foto)}</div>
      <figcaption><b>${esc(w.titulo)}</b>, por ${esc(s.nome)}</figcaption>
    </figure>`;
  }
  function renderWorks() {
    $("#works").innerHTML = cfg.trabalhos.map(workCard).join("");
    seg($("#filtro-trabalhos"), [{ v: "all", l: "Todos" }].concat(cfg.socios.map(s => ({ v: s.id, l: s.nome }))), "all", v => {
      $$("#works .work").forEach(w => w.classList.toggle("dim", v !== "all" && w.dataset.socio !== v));
      const rail = $("#works"), first = $(`#works .work${v === "all" ? "" : `[data-socio="${v}"]`}`);
      if (first && rail.scrollWidth > rail.clientWidth) rail.scrollTo({ left: first.offsetLeft - rail.offsetLeft - parseFloat(getComputedStyle(rail).paddingLeft), behavior: reduce ? "auto" : "smooth" });
    });
  }

  function renderSocios() {
    $("#socios-grid").innerHTML = cfg.socios.map(s => {
      const esp = s.especialidades.map(e => e.toLowerCase());
      const lista = esp.length > 1 ? esp.slice(0, -1).join(", ") + " e " + esp[esp.length - 1] : esp[0];
      return `<article class="socio">
        <div class="socio-photo">${s.foto ? phHtml("Retrato de " + s.nome, s.foto) : `<div class="ph ph-inicial" role="img" aria-label="${esc(s.nome)}, foto em breve"><span aria-hidden="true">${esc(s.nome.charAt(0))}</span></div>`}</div>
        <h3 class="socio-name">${esc(s.nome)}</h3>
        <p>Na máquina desde ${s.desde}. Manda bem em ${esc(lista)}.</p>
        <p>${esc(s.bio)}</p>
        <div class="socio-links">
          <button class="link" type="button" data-book-socio="${s.id}">Agendar com ${esc(s.nome)}</button>
          ${s.instagram ? `<a class="link muted" href="https://www.instagram.com/${encodeURIComponent(s.instagram)}/" target="_blank" rel="noopener">@${esc(s.instagram)}</a>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  /* faixas góticas: os cortes da casa e o nome, separados pelo K do logo */
  function renderFaixas() {
    const esp = [...new Set(cfg.socios.flatMap(s => s.especialidades).concat(cfg.servicos.map(s => s.nome)))];
    const linha = (palavras, n) => Array(n).fill(palavras.map(p => `<span>${esc(p)}</span><i>K</i>`).join("")).join("");
    $("#faixa-1").innerHTML = linha(["Corte na régua"].concat(esp, [cfg.cidade]), 3);
    $("#faixa-2").innerHTML = linha([cfg.nome, "Studio Kaique dos Corte", "Desde " + cfg.desde, cfg.cidade], 5);
  }

  function renderHistoria() {
    $("#timeline").innerHTML = cfg.historia.map(h => `<li><span class="ano">${h.ano}</span><span>${esc(h.texto)}</span></li>`).join("");
  }

  function renderServicos() {
    $("#lista-servicos").innerHTML = cfg.servicos.map(s => {
      const quem = s.socios.length === cfg.socios.length ? "" : ", só com " + s.socios.map(id => socioById(id).nome).join(" e ");
      return `<li><button class="price" type="button" data-book-serv="${s.id}" aria-label="Agendar ${esc(s.nome)}">
        <span class="price-n">${esc(s.nome)}<small>${s.duracao} min${quem}</small></span>
        <span class="price-dots" aria-hidden="true"></span>
        <span class="price-v">R$ ${s.preco}</span>
      </button></li>`;
    }).join("");
  }

  /* próximo horário + calendário de datas livres no topo */
  const corteDur = () => (servById("corte") || cfg.servicos[0]).duracao;
  function freeDays() {
    const out = {};
    for (let i = 0; i < cfg.agendamento.diasAFrente; i++) {
      const ds = iso(addDays(today(), i));
      const per = {};
      let n = 0;
      cfg.socios.forEach(s => { const f = freeSlots(s.id, ds, corteDur()); per[s.id] = f; n += f.length; });
      if (n) out[ds] = per;
    }
    return out;
  }
  const cal = { month: null, sel: null, days: {} };
  function renderAvailability() {
    cal.days = freeDays();
    const first = Object.keys(cal.days)[0];
    let best = null;
    if (first) cfg.socios.forEach(s => { const f = cal.days[first][s.id]; if (f.length && (!best || f[0] < best.t)) best = { t: f[0], s }; });
    $("#proximo").textContent = best ? `Próxima vaga: ${dayLabel(first).toLowerCase()}, ${fmt(best.t)}, com o ${best.s.nome}.` : "";
    $("#when-text").textContent = best ? `${dayLabel(first)}, ${fmt(best.t)}` : "Datas livres";
    $("#mbar-when").textContent = best ? `${dayLabel(first)}, ${fmt(best.t)}` : "Ver datas livres";
    if (!cal.sel || !cal.days[cal.sel]) cal.sel = first || null;
    if (!cal.month) { const d = first ? fromIso(first) : today(); cal.month = new Date(d.getFullYear(), d.getMonth(), 1); }
    if (!$("#cal").hidden) renderCal();
  }
  function renderCal() {
    const m = cal.month, y = m.getFullYear(), mo = m.getMonth();
    $("#cal-title").textContent = m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const keys = Object.keys(cal.days);
    const minM = keys.length ? fromIso(keys[0]) : today(), maxM = keys.length ? fromIso(keys[keys.length - 1]) : today();
    $("#cal-prev").disabled = y * 12 + mo <= minM.getFullYear() * 12 + minM.getMonth();
    $("#cal-next").disabled = y * 12 + mo >= maxM.getFullYear() * 12 + maxM.getMonth();
    let html = ["D", "S", "T", "Q", "Q", "S", "S"].map(d => `<span class="dow">${d}</span>`).join("");
    const startDow = new Date(y, mo, 1).getDay(), nDays = new Date(y, mo + 1, 0).getDate();
    for (let i = 0; i < startDow; i++) html += "<span></span>";
    for (let d = 1; d <= nDays; d++) {
      const ds = iso(new Date(y, mo, d));
      const per = cal.days[ds];
      if (per) {
        const n = Object.values(per).reduce((a, f) => a + f.length, 0);
        html += `<button type="button" class="d" data-cal-day="${ds}" aria-pressed="${cal.sel === ds}" aria-label="${dayLabel(ds)}, ${n} horários livres">${d}</button>`;
      } else html += `<span class="d" aria-hidden="true">${d}</span>`;
    }
    $("#cal-grid").innerHTML = html;
    renderCalDay();
  }
  function renderCalDay() {
    const box = $("#cal-day");
    if (!cal.sel) { box.innerHTML = `<h3>Sem datas livres nos próximos ${cfg.agendamento.diasAFrente} dias</h3><a class="link" href="${esc(cfg.booksyUrl)}" target="_blank" rel="noopener">Ver no Booksy</a>`; return; }
    const d = fromIso(cal.sel), per = cal.days[cal.sel];
    const titulo = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    box.innerHTML = `<h3>${esc(titulo.charAt(0).toUpperCase() + titulo.slice(1))}</h3>` + cfg.socios.map(s => {
      const f = (per[s.id] || []).filter(t => t % 30 === 0);
      const folga = !(s.jornada[DK[d.getDay()]] || []).length;
      return `<div class="cal-socio"><span>${esc(s.nome)}</span><div class="times">${f.length ? f.map(t => `<button type="button" class="time" data-cal-time="${s.id}|${t}">${fmt(t)}</button>`).join("") : `<span class="off">${folga ? "De folga" : "Agenda cheia"}</span>`}</div></div>`;
    }).join("") + `<p class="cal-note">Horários para corte (${corteDur()} min). Dá para trocar o serviço no próximo passo.</p>`;
  }
  function toggleCal(open) {
    const c = $("#cal"), b = $("#cal-toggle");
    open = open == null ? c.hidden : open;
    c.hidden = !open; b.setAttribute("aria-expanded", open);
    document.body.classList.toggle("cal-open", open);
    if (open) renderCal();
  }
  $("#cal-toggle").onclick = e => { e.stopPropagation(); toggleCal(); };
  $("#cal-prev").onclick = () => { cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() - 1, 1); renderCal(); };
  $("#cal-next").onclick = () => { cal.month = new Date(cal.month.getFullYear(), cal.month.getMonth() + 1, 1); renderCal(); };
  $("#cal").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.calDay) { cal.sel = t.dataset.calDay; $$("#cal-grid .d[aria-pressed]").forEach(b => b.setAttribute("aria-pressed", b === t)); renderCalDay(); }
    if (t.dataset.calTime) {
      const [id, tm] = t.dataset.calTime.split("|");
      toggleCal(false);
      openBooking({ servico: (servById("corte") || cfg.servicos[0]).id, socio: id, assigned: id, date: cal.sel, time: +tm, step: 3 });
    }
  });
  document.addEventListener("click", e => { if (!$("#cal").hidden && !e.target.closest("#cal, #cal-toggle, [data-cal-open]")) toggleCal(false); });
  document.addEventListener("click", e => { if (e.target.closest("[data-cal-open]")) { toggleMenu(false); toggleCal(true); } });

  /* menu do celular */
  function toggleMenu(open) {
    const m = $("#mnav"), b = $("#menu-btn");
    open = open == null ? m.hidden : open;
    m.hidden = !open; b.setAttribute("aria-expanded", open);
    b.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", open);
    if (open) toggleCal(false);
  }
  $("#menu-btn").onclick = e => { e.stopPropagation(); toggleMenu(); };
  $("#mnav").addEventListener("click", e => { if (e.target.closest("a")) toggleMenu(false); });

  /* bolinhas de posição nos carrosséis (celular) */
  function railDots(rail) {
    const dots = document.createElement("div");
    dots.className = "rail-dots"; dots.setAttribute("aria-hidden", "true");
    rail.after(dots);
    dots.innerHTML = Array.from(rail.children).map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("");
    let t;
    rail.addEventListener("scroll", () => {
      cancelAnimationFrame(t);
      t = requestAnimationFrame(() => {
        const items = rail.children, w = items[0].offsetWidth + parseFloat(getComputedStyle(rail).columnGap || 12);
        const idx = Math.min(items.length - 1, Math.round(rail.scrollLeft / w));
        Array.from(dots.children).forEach((d, i) => d.classList.toggle("on", i === idx));
      });
    }, { passive: true });
  }

  /* antes/depois */
  function initBA() {
    const r = $("#ba-range"), ba = $("#ba");
    const set = v => ba.style.setProperty("--pos", v + "%");
    r.addEventListener("input", () => set(r.value));
    set(r.value);
  }

  /* parallax da foto do topo, poste de barbeiro e botão flutuante */
  function initScroll() {
    const media = $("[data-parallax]"), bar = $("#topbar"), fab = $("#mbar"), photo = $("#inicio"), stripes = $("#pole-stripes");
    const PERIOD = 40; // altura de um ciclo das listras (-60deg, 20px)
    let target = 0, cur = 0, spinning = false, ticking = false;
    const spin = () => {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.05) cur = target;
      stripes.style.transform = `translate3d(0, ${(cur % PERIOD) - PERIOD}px, 0)`;
      if (cur !== target) requestAnimationFrame(spin); else spinning = false;
    };
    // parallax: cada [data-speed] anda conforme a distância do centro da tela; fotos andam dentro da moldura
    const mob = matchMedia("(max-width: 760px)");
    const parallax = () => {
      const k = mob.matches ? 0.5 : 1, mid = innerHeight / 2;
      $$("#view-site [data-speed]").forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const d = (r.top + r.height / 2 - mid) * el.dataset.speed * k;
        el.style.translate = el.dataset.axis === "x" ? `${d}px 0` : `0 ${d}px`;
      });
      $$("#view-site .work-img .ph, #view-site .socio-photo .ph").forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const room = r.height * 0.05;
        const d = Math.max(-room, Math.min(room, (r.top + r.height / 2 - mid) * -0.06 * k));
        el.style.translate = `0 ${d}px`;
      });
    };
    const run = () => {
      const y = scrollY;
      bar.classList.toggle("scrolled", y > 8);
      if (!reduce) { target = y * 0.35; if (!spinning) { spinning = true; requestAnimationFrame(spin); } }
      if (currentView === "site") {
        if (!reduce && y < innerHeight * 1.5) media.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
        if (!reduce) parallax();
        fab.classList.toggle("show", y > photo.offsetTop + photo.offsetHeight);
      }
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(run); ticking = true; } }, { passive: true });
    stripes.style.transform = `translate3d(0, ${-PERIOD}px, 0)`;
    run();
    initScroll.run = run;
  }

  /* ================= VIEWS ================= */
  let currentView = "site";
  function showView(v, anchor) {
    const apply = () => {
      currentView = v;
      ["site", "conta", "painel"].forEach(n => ($("#view-" + n).hidden = n !== v));
      document.body.classList.toggle("on-site", v === "site");
      $$(".nav a").forEach(a => a.classList.toggle("active", a.dataset.view === v));
      if (v === "conta") renderConta();
      if (v === "painel") renderPainel();
      if (v === "site") { refreshSite(); }
      if (anchor) { const t = document.getElementById(anchor); if (t) t.scrollIntoView(); } else scrollTo(0, 0);
      initScroll.run && initScroll.run();
      requestAnimationFrame(() => $$(".seg").forEach(s => s._place && s._place()));
    };
    if (document.startViewTransition && !reduce && v !== currentView) document.startViewTransition(apply); else apply();
  }
  function route() {
    const h = location.hash.replace("#", "");
    if (h === "conta" || h === "painel") showView(h);
    else if (currentView !== "site") showView("site", h || null);
  }
  addEventListener("hashchange", route);

  function refreshSite() { renderSocios(); renderAvailability(); }

  /* ================= AGENDAMENTO ================= */
  const STEPS = ["Serviço", "Profissional", "Dia e horário", "Detalhes"];
  let bk = null;

  function openBooking(preset = {}) {
    bk = Object.assign({ step: 0, servico: null, socio: null, date: null, time: null, assigned: null, nota: "" }, preset);
    if (bk.servico && bk.step === 0) bk.step = bk.socio ? 2 : 1;
    const sheet = $("#sheet"), bd = $("#sheet-backdrop");
    sheet.hidden = false; bd.hidden = false;
    requestAnimationFrame(() => { sheet.classList.add("open"); bd.classList.add("open"); });
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("sheet-open");
    renderStep();
    setTimeout(() => $("#sheet-close").focus(), 50);
  }
  function closeBooking() {
    const sheet = $("#sheet"), bd = $("#sheet-backdrop");
    sheet.classList.remove("open"); bd.classList.remove("open");
    sheet.style.transform = "";
    document.documentElement.style.overflow = "";
    document.body.classList.remove("sheet-open");
    setTimeout(() => { sheet.hidden = true; bd.hidden = true; }, 560);
  }

  function renderStep(dir) {
    const body = $("#sheet-body"), foot = $("#sheet-foot");
    $("#steps").textContent = bk.step < 4 ? `Passo ${bk.step + 1} de ${STEPS.length}` : "";
    $("#sheet-title").textContent = bk.step < 4 ? STEPS[bk.step] : "Agendado";
    $("#sheet-back").style.visibility = bk.step > 0 && bk.step < 4 ? "visible" : "hidden";
    const html = [stepServico, stepSocio, stepHorario, stepDetalhes, stepSucesso][bk.step]();
    body.innerHTML = `<div class="step-anim${dir === "back" ? " back" : ""}">${html}</div>`;
    body.scrollTop = 0;
    renderFoot(foot);
    const strip = $(".date-strip", body);
    if (strip) { const on = $('[aria-pressed="true"]', strip); if (on) on.scrollIntoView({ inline: "center", block: "nearest" }); }
  }

  function resumo() {
    const parts = [];
    if (bk.servico) { const s = servById(bk.servico); parts.push(`<strong>${esc(s.nome)}</strong>, ${s.duracao} min, ${brl(s.preco)}`); }
    const who = bk.assigned || (bk.socio && bk.socio !== "any" ? bk.socio : null);
    if (who) parts.push("com <strong>" + esc(socioById(who).nome) + "</strong>");
    else if (bk.socio === "any") parts.push("com quem estiver livre");
    if (bk.date && bk.time != null) parts.push(`<strong>${dayLabel(bk.date).toLowerCase()} às ${fmt(bk.time)}</strong>`);
    return parts.join(" ");
  }

  function renderFoot(foot) {
    if (bk.step === 4) { foot.innerHTML = `<span class="resume">Na versão real, o lembrete chega 2 horas antes.</span><button class="btn" type="button" data-act="done">Fechar</button>`; return; }
    const ok = [!!bk.servico, !!bk.socio, bk.time != null, true][bk.step];
    const last = bk.step === 3;
    const user = store.get("user", null);
    let label = "Continuar";
    if (last) label = cfg.agendamento.modo === "booksy" ? "Finalizar no Booksy" : (cfg.agendamento.exigirLogin && !user ? "Entrar e confirmar" : "Confirmar agendamento");
    foot.innerHTML = `<span class="resume">${resumo() || "Escolha um serviço para começar."}</span>
      <button class="btn" type="button" data-act="next" ${ok ? "" : "disabled"}>${label}</button>`;
  }

  function stepServico() {
    return `<div class="opt-list">${cfg.servicos.map(s => `<button type="button" class="opt" data-pick-serv="${s.id}" aria-pressed="${bk.servico === s.id}">
      <span class="o-t">${esc(s.nome)}</span>
      <span class="o-r">${brl(s.preco)}<small>${s.duracao} min</small></span>
      <span class="o-s">${s.socios.length === cfg.socios.length ? "Kaique ou Ângelo" : "Só com " + s.socios.map(id => socioById(id).nome).join(" e ")}</span></button>`).join("")}</div>`;
  }

  function stepSocio() {
    const sv = servById(bk.servico);
    const opts = cfg.socios.filter(s => sv.socios.includes(s.id)).map(s => {
      const nf = nextFree(s.id, sv.duracao);
      return `<button type="button" class="opt" data-pick-socio="${s.id}" aria-pressed="${bk.socio === s.id}">
        <span class="o-t">${esc(s.nome)}</span>
        <span class="o-r">${nf ? fmt(nf.time) + "<small>" + dayLabel(nf.date) + "</small>" : "<small>sem vagas</small>"}</span>
        <span class="o-s">${esc(s.especialidades.join(", "))}</span></button>`;
    });
    if (sv.socios.length > 1) opts.unshift(`<button type="button" class="opt" data-pick-socio="any" aria-pressed="${bk.socio === "any"}">
        <span class="o-t">Tanto faz</span><span class="o-r"><small>mais horários</small></span><span class="o-s">Mostra as vagas dos dois lado a lado</span></button>`);
    return `<div class="opt-list">${opts.join("")}</div>`;
  }

  function candidates() {
    const sv = servById(bk.servico);
    return bk.socio === "any" ? sv.socios : [bk.socio];
  }

  function stepHorario() {
    const sv = servById(bk.servico);
    const ids = candidates();
    const days = [];
    for (let i = 0; i < cfg.agendamento.diasAFrente; i++) {
      const ds = iso(addDays(today(), i));
      const n = ids.reduce((a, id) => a + freeSlots(id, ds, sv.duracao).length, 0);
      days.push({ ds, n });
    }
    if (!bk.date) { const f = days.find(d => d.n); bk.date = f ? f.ds : days[0].ds; }
    const avail = days.filter(d => d.n);
    if (bk.date && !avail.some(d => d.ds === bk.date) && avail.length) bk.date = avail[0].ds;
    const strip = avail.map(d => {
      const dt = fromIso(d.ds);
      return `<button type="button" class="day" data-pick-date="${d.ds}" aria-pressed="${bk.date === d.ds}" aria-label="${DLL[dt.getDay()]} ${dt.getDate()}, ${d.n} horários">
        <span class="dw">${DL[dt.getDay()]}</span><span class="dn">${dt.getDate()}</span></button>`;
    }).join("");
    const groups = ids.map(id => {
      const s = socioById(id);
      const sl = freeSlots(id, bk.date, sv.duracao);
      const body = sl.length ? `<div class="slots">${sl.map(t => `<button type="button" class="slot" data-pick-time="${id}|${t}" aria-pressed="${bk.time === t && bk.assigned === id}">${fmt(t)}</button>`).join("")}</div>`
        : `<p class="slot-empty">${(s.jornada[DK[fromIso(bk.date).getDay()]] || []).length ? "Sem vagas neste dia." : esc(s.nome) + " está de folga neste dia."}</p>`;
      return `<div class="slot-group"><h4>${esc(s.nome)} <span>${sl.length ? sl.length + " horários" : ""}</span></h4>${body}</div>`;
    }).join("");
    return `<div class="date-strip">${strip}</div>${groups}
      <p class="hint">Mostrando horários com ${sv.duracao} minutos livres.</p>`;
  }

  function stepDetalhes() {
    const user = store.get("user", null);
    const prefs = store.get("prefs", "");
    const chips = ["Mesmo da última vez", "Mais baixo na lateral", "Só aparar", "Vou levar foto de referência", "Sem máquina em cima"];
    return `<dl class="summary">
        <div><dt>Serviço</dt><dd>${esc(servById(bk.servico).nome)}</dd></div>
        <div><dt>Com</dt><dd>${esc(socioById(bk.assigned).nome)}</dd></div>
        <div><dt>Quando</dt><dd>${dayLabel(bk.date)}, ${fmt(bk.time)}</dd></div>
        <div><dt>Valor</dt><dd>${brl(servById(bk.servico).preco)}</dd></div>
      </dl>
      <div style="margin-top:18px">
        <label class="lbl" for="bk-nota">O que você quer neste corte?</label>
        <textarea id="bk-nota" rows="3" placeholder="Ex.: degradê na 1, manter o comprimento em cima">${esc(bk.nota)}</textarea>
        <div class="quick">${chips.map(c => `<button type="button" data-chip="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      </div>
      ${prefs ? `<p class="hint">Suas preferências vão junto: “${esc(prefs)}”</p>` : ""}
      ${cfg.agendamento.modo === "booksy" ? `<p class="hint">Você vai finalizar no Booksy. O horário escolhido aqui serve de guia.</p>` :
        user ? `<p class="hint">Agendando como <strong>${esc(user.nome)}</strong> (${esc(user.email)})</p>` :
        `<p class="hint">Para confirmar, entre com sua conta Google. Assim o histórico e as observações ficam salvos.</p>`}
      <p class="hint">Prefere o sistema atual? <a class="link" href="${esc(cfg.booksyUrl)}" target="_blank" rel="noopener">Agendar pelo Booksy</a></p>`;
  }

  function stepSucesso() {
    const s = socioById(bk.assigned);
    return `<div class="success">
      <div class="check"><svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3 class="h2">Horário marcado</h3>
      <p>${esc(servById(bk.servico).nome)} com ${esc(s.nome)}, ${dayLabel(bk.date).toLowerCase()} às ${fmt(bk.time)}.</p>
      <p class="muted">Na versão real, o horário entra direto na agenda Google de ${esc(s.nome)} e você recebe o convite por e-mail.</p>
      <a class="btn btn-line" href="#conta">Ver meus horários</a>
    </div>`;
  }

  function fakeGoogleLogin() {
    const u = { nome: "Cliente Exemplo", email: "cliente.exemplo@gmail.com" };
    store.set("user", u);
    return u;
  }

  function confirmBooking() {
    if (cfg.agendamento.modo === "booksy") { window.open(cfg.booksyUrl, "_blank", "noopener"); return; }
    let user = store.get("user", null);
    if (cfg.agendamento.exigirLogin && !user) { user = fakeGoogleLogin(); toast("Conectado com Google (simulação)"); }
    const list = userBookings();
    list.push({ id: "u" + Date.now(), socio: bk.assigned, servico: bk.servico, date: bk.date, time: fmt(bk.time), nota: bk.nota, cliente: user ? user.nome : "Cliente" });
    store.set("bookings", list);
    bk.step = 4; renderStep();
    refreshSite();
  }

  /* cliques dentro do sheet */
  $("#sheet").addEventListener("click", e => {
    const t = e.target.closest("button, a"); if (!t) return;
    const d = t.dataset;
    if (d.pickServ) { bk.servico = d.pickServ; const sv = servById(bk.servico); if (bk.socio && bk.socio !== "any" && !sv.socios.includes(bk.socio)) bk.socio = null; bk.time = null; bk.step = bk.socio ? 2 : 1; renderStep(); return; }
    if (d.pickSocio) { bk.socio = d.pickSocio; bk.time = null; bk.assigned = null; bk.step = 2; renderStep(); return; }
    if (d.pickDate) { bk.date = d.pickDate; bk.time = null; bk.assigned = null; const y = $("#sheet-body").scrollTop; renderStep(); $(".step-anim").classList.remove("step-anim"); $("#sheet-body").scrollTop = y; return; }
    if (d.pickTime) {
      const [id, tm] = d.pickTime.split("|"); bk.assigned = id; bk.time = +tm;
      $$(".slot", $("#sheet")).forEach(s => s.setAttribute("aria-pressed", s === t));
      renderFoot($("#sheet-foot")); return;
    }
    if (d.chip) { const ta = $("#bk-nota"); ta.value = (ta.value ? ta.value.trim() + ". " : "") + d.chip; bk.nota = ta.value; return; }
    if (d.act === "next") {
      if (bk.step === 3) { bk.nota = $("#bk-nota").value; confirmBooking(); return; }
      bk.step++; renderStep(); return;
    }
    if (d.act === "done") { closeBooking(); return; }
    if (t.matches('a[href="#conta"]')) closeBooking();
  });
  $("#sheet").addEventListener("input", e => { if (e.target.id === "bk-nota") bk.nota = e.target.value; });
  $("#sheet-close").onclick = closeBooking;
  $("#sheet-backdrop").onclick = closeBooking;
  $("#sheet-back").onclick = () => {
    if (bk.step === 2 && bk.socio && candidates().length === 1 && servById(bk.servico).socios.length === 1) bk.step = 0; else bk.step--;
    renderStep("back");
  };
  addEventListener("keydown", e => { if (e.key !== "Escape") return; if (!$("#sheet").hidden) closeBooking(); else toggleCal(false); });

  /* arrastar para fechar (celular) */
  (function dragToClose() {
    const sheet = $("#sheet"), head = $(".sheet-grab");
    let y0 = null, dy = 0;
    const start = e => { if (innerWidth >= 700) return; y0 = e.touches ? e.touches[0].clientY : e.clientY; sheet.style.transition = "none"; };
    const move = e => { if (y0 == null) return; dy = Math.max(0, (e.touches ? e.touches[0].clientY : e.clientY) - y0); sheet.style.transform = `translate(-50%, ${dy}px)`; };
    const end = () => { if (y0 == null) return; sheet.style.transition = ""; if (dy > 110) closeBooking(); else sheet.style.transform = ""; y0 = null; dy = 0; };
    [head, $(".sheet-head")].forEach(h => { h.addEventListener("touchstart", start, { passive: true }); });
    addEventListener("touchmove", move, { passive: true });
    addEventListener("touchend", end);
  })();

  /* gatilhos globais de agendamento */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-open-booking], [data-book-socio], [data-book-serv]");
    if (!t || t.closest("#sheet")) return;
    toggleCal(false);
    if (t.dataset.bookSocio) openBooking({ socio: t.dataset.bookSocio });
    else if (t.dataset.bookServ) openBooking({ servico: t.dataset.bookServ });
    else openBooking();
  });

  /* ================= MINHA CONTA ================= */
  const HIST = [
    { id: "h1", dias: 24, socio: "angelo", servico: "combo", nota: "Low fade na 0,5. Barba alinhada no pescoço.", obsBarbeiro: "Cabelo cresce rápido na nuca, voltar em 3 semanas." },
    { id: "h2", dias: 52, socio: "kaique", servico: "freestyle", nota: "Risco duplo do lado direito.", obsBarbeiro: "Gostou do risco mais fino." },
    { id: "h3", dias: 81, socio: "angelo", servico: "corte", nota: "Mid fade, tesoura em cima.", obsBarbeiro: "" }
  ];
  function renderConta() {
    const root = $("#conta-root");
    const user = store.get("user", null);
    if (!user) {
      root.innerHTML = `<section class="login">
        <h1 class="h2">Minha conta</h1>
        <p class="muted">Entre para ver seus últimos cortes, marcar os favoritos e deixar anotado como você gosta. Quem corta lê antes de você sentar.</p>
        <button class="g-btn" type="button" id="g-login">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
          Entrar com Google
        </button>
        <p class="small muted">Simulação. Nenhum dado sai do seu navegador.</p>
      </section>`;
      $("#g-login").onclick = () => { fakeGoogleLogin(); toast("Você entrou com Google (simulação)"); renderConta(); };
      return;
    }
    const liked = store.get("liked", { h1: true });
    const prefs = store.get("prefs", "");
    const up = userBookings().filter(b => !b.cancelado && b.date >= iso(today())).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    root.innerHTML = `<div class="page-head">
        <div><h1 class="h2">Olá, ${esc(user.nome.split(" ")[0])}</h1><p class="muted small">${esc(user.email)}</p></div>
        <div class="socio-foot"><button class="btn" type="button" data-open-booking>Agendar horário</button><button class="btn btn-line" type="button" id="logout">Sair</button></div>
      </div>
      <div class="conta-grid">
        <div class="conta-col">
          <section>
            <div class="sub-head"><h3>Últimos cortes</h3></div>
            <ul class="hist-list">${HIST.map(h => {
              const s = socioById(h.socio), sv = servById(h.servico), d = addDays(today(), -h.dias);
              return `<li class="hist-item">
                <div class="ph"></div>
                <div class="hist-info">
                  <div class="row"><strong>${esc(sv.nome)} com ${esc(s.nome)}</strong><span class="small muted">${d.getDate()} de ${ML[d.getMonth()]}</span></div>
                  <p>Você pediu: “${esc(h.nota)}”</p>
                  ${h.obsBarbeiro ? `<p>${esc(s.nome)} anotou: ${esc(h.obsBarbeiro)}</p>` : ""}
                  <div class="row"><button class="fav" type="button" data-like="${h.id}" aria-pressed="${!!liked[h.id]}">${liked[h.id] ? "Favorito" : "Marcar como favorito"}</button>
                  <button class="btn btn-sm btn-line" type="button" data-repeat="${h.id}">Repetir este corte</button></div>
                </div></li>`;
            }).join("")}</ul>
          </section>
        </div>
        <div class="conta-col">
          <section>
            <div class="sub-head"><h3>Próximos horários</h3></div>
            <ul class="upcoming">${up.length ? up.map(b => `<li class="up-item"><div><div class="when-t">${dayLabel(b.date)}, ${b.time}</div><span class="small muted">${esc(servById(b.servico).nome)} com ${esc(socioById(b.socio).nome)}</span>${b.nota ? `<div class="small">“${esc(b.nota)}”</div>` : ""}</div><button class="btn btn-sm btn-line" type="button" data-cancel="${b.id}">Cancelar</button></li>`).join("")
              : `<li class="empty">Nenhum horário marcado. Use Agendar horário para escolher um.</li>`}</ul>
          </section>
          <section>
            <div class="sub-head"><h3>Como eu gosto</h3></div>
            <label class="lbl" for="prefs" style="margin-top:16px">Vai junto em todo agendamento</label>
            <textarea id="prefs" rows="4" placeholder="Ex.: sem navalha no pescoço, cabelo enrola na nuca">${esc(prefs)}</textarea>
            <div style="margin-top:12px"><button class="btn btn-sm" type="button" id="save-prefs">Salvar</button></div>
          </section>
        </div>
      </div>`;
    $("#logout").onclick = () => { store.set("user", null); renderConta(); };
    $("#save-prefs").onclick = () => { store.set("prefs", $("#prefs").value.trim()); toast("Preferências salvas"); };
    root.onclick = e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.like) { const l = store.get("liked", {}); l[t.dataset.like] = !l[t.dataset.like]; store.set("liked", l); t.setAttribute("aria-pressed", !!l[t.dataset.like]); t.textContent = l[t.dataset.like] ? "Favorito" : "Marcar como favorito"; }
      if (t.dataset.repeat) { const h = HIST.find(x => x.id === t.dataset.repeat); openBooking({ servico: h.servico, socio: h.socio, nota: h.nota, step: 2 }); }
      if (t.dataset.cancel) { const l = userBookings().map(b => b.id === t.dataset.cancel ? { ...b, cancelado: true } : b); store.set("bookings", l); toast("Horário cancelado"); renderConta(); refreshSite(); }
    };
  }

  /* ================= PAINEL ================= */
  const pn = { socio: cfg.socios[0].id, date: iso(today()) };
  const status = store.get("status", {});
  function firstWorkday(id) {
    const s = socioById(id);
    for (let i = 0; i < 14; i++) { const d = addDays(today(), i); if ((s.jornada[DK[d.getDay()]] || []).length) return iso(d); }
    return iso(today());
  }
  let pnInit = false;
  function renderPainel() {
    if (!pnInit) { pn.date = firstWorkday(pn.socio); pnInit = true; }
    seg($("#painel-socio"), cfg.socios.map(s => ({ v: s.id, l: s.nome })), pn.socio, v => {
      pn.socio = v;
      const s = socioById(v);
      if (!(s.jornada[DK[fromIso(pn.date).getDay()]] || []).length) pn.date = firstWorkday(v);
      renderPainelBody();
    });
    renderPainelBody();
  }
  function renderPainelBody() {
    const s = socioById(pn.socio);
    const start = today();
    let strip = "";
    for (let i = -1; i < 13; i++) {
      const d = addDays(start, i), ds = iso(d);
      const off = !(s.jornada[DK[d.getDay()]] || []).length;
      strip += `<button type="button" class="day${off ? " off" : ""}" data-pdate="${ds}" aria-pressed="${pn.date === ds}"><span class="dw">${i === 0 ? "Hoje" : DL[d.getDay()]}</span><span class="dn">${d.getDate()}</span></button>`;
    }
    $("#painel-dias").innerHTML = strip;

    const ranges = s.jornada[DK[fromIso(pn.date).getDay()]] || [];
    const ap = appointments(pn.socio, pn.date);
    const prefs = store.get("prefs", "");
    const rows = [];
    ranges.forEach(([a, b]) => {
      let cur = toMin(a);
      const end = toMin(b);
      ap.filter(x => x.start >= toMin(a) && x.start < end).forEach(x => {
        if (x.start - cur >= 30) rows.push(livreRow(cur, x.start));
        rows.push(apRow(x, prefs));
        cur = x.start + x.dur;
      });
      if (end - cur >= 30) rows.push(livreRow(cur, end));
    });
    $("#painel-agenda").innerHTML = ranges.length ? rows.join("") : `<li class="empty">Dia de folga. Ligue o dia em Jornada para abrir horários.</li>`;
    const busy = ap.reduce((a, x) => a + x.dur, 0), total = ranges.reduce((a, [x, y]) => a + toMin(y) - toMin(x), 0);
    $("#painel-resumo").textContent = `${ap.length} clientes, ${total ? Math.round(busy / total * 100) : 0}% da jornada ocupada`;

    let wk = 0, wkBusy = 0, wkTotal = 0, fat = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), ds = iso(d);
      const a = appointments(pn.socio, ds);
      wk += a.length; wkBusy += a.reduce((x, y) => x + y.dur, 0);
      fat += a.reduce((x, y) => x + servById(y.servico).preco, 0);
      wkTotal += (s.jornada[DK[d.getDay()]] || []).reduce((x, [p, q]) => x + toMin(q) - toMin(p), 0);
    }
    $("#painel-stats").innerHTML = `<div class="stat"><b>${wk}</b><span>atendimentos</span></div>
      <div class="stat"><b>${wkTotal ? Math.round(wkBusy / wkTotal * 100) : 0}%</b><span>ocupação</span></div>
      <div class="stat"><b>${fat.toLocaleString("pt-BR")}</b><span>reais previstos</span></div>`;

    $("#painel-jornada").innerHTML = DK.slice(1).concat("dom").map(k => {
      const r = s.jornada[k] || [];
      const on = r.length > 0;
      const a = on ? r[0][0] : "09:00", b = on ? r[r.length - 1][1] : "18:00";
      return `<div class="jr"><span class="d">${DL[DK.indexOf(k)]}</span>
        <button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="Trabalha ${k}" data-jsw="${k}"></button>
        <span class="times-in"${on ? "" : ' style="opacity:.35"'}><input type="time" value="${a}" data-jt="${k}|0" aria-label="Início ${k}" ${on ? "" : "disabled"}><span class="small muted">até</span><input type="time" value="${b}" data-jt="${k}|1" aria-label="Fim ${k}" ${on ? "" : "disabled"}></span></div>`;
    }).join("") + `<p class="hint">O almoço segue o arquivo de configuração. Na versão real, cada mudança vira bloqueio na agenda Google.</p>`;
  }
  function livreRow(a, b) {
    return `<li class="ag livre"><span class="t">${fmt(a)}</span><span>Livre até ${fmt(b)}</span><button class="btn btn-sm btn-line ag-act" type="button" data-encaixe="${a}">Encaixar</button></li>`;
  }
  function apRow(x, prefs) {
    const sv = servById(x.servico), st = status[x.id];
    const isUser = !x.mock;
    const act = st === "done" ? '<span class="state ok">Concluído</span>'
      : st === "here" ? `<button class="btn btn-sm" type="button" data-st="${x.id}|done">Concluir</button>`
      : `<button class="btn btn-sm btn-line" type="button" data-st="${x.id}|here">Chegou</button>`;
    return `<li class="ag${st === "done" ? " done" : ""}">
      <span class="t">${fmt(x.start)}<small>${x.dur} min</small></span>
      <div class="who"><strong>${esc(x.cliente)}${isUser ? '<span class="tag">agendou pelo site</span>' : ""}</strong><span>${esc(sv.nome)}, ${brl(sv.preco)}${st === "here" ? ", na cadeira" : ""}</span>
        ${x.nota ? `<div class="note">${esc(x.nota)}</div>` : ""}
        ${isUser && prefs ? `<div class="pref">Preferência salva: ${esc(prefs)}</div>` : ""}</div>
      <div class="ag-act">${act}</div>
    </li>`;
  }
  $("#view-painel").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.pdate) { pn.date = t.dataset.pdate; renderPainelBody(); }
    if (t.dataset.st) { const [id, v] = t.dataset.st.split("|"); status[id] = v; store.set("status", status); renderPainelBody(); if (v === "done") toast("Concluído. O corte entrou no histórico do cliente."); }
    if (t.dataset.encaixe) toast("Na versão real, abre um agendamento rápido para cliente sem horário");
    if (t.dataset.jsw) {
      const s = socioById(pn.socio), k = t.dataset.jsw;
      s.jornada[k] = (s.jornada[k] || []).length ? [] : [["09:00", "18:00"]];
      saveJornada(s);
    }
  });
  $("#view-painel").addEventListener("change", e => {
    const t = e.target; if (!t.dataset.jt) return;
    const s = socioById(pn.socio), [k, idx] = t.dataset.jt.split("|");
    const r = s.jornada[k]; if (!r || !r.length || !t.value) return;
    if (idx === "0") r[0][0] = t.value; else r[r.length - 1][1] = t.value;
    saveJornada(s);
  });
  function saveJornada(s) {
    store.set("jornada_" + s.id, s.jornada);
    Object.keys(mockCache).forEach(k => delete mockCache[k]);
    renderPainelBody();
    toast("Jornada de " + s.nome + " atualizada");
  }

  /* ================= INÍCIO ================= */
  bindTexts();
  renderWorks();
  renderHistoria();
  renderFaixas();
  renderServicos();
  refreshSite();
  railDots($("#works")); railDots($("#socios-grid"));
  initBA();
  document.body.classList.add("on-site");
  if (!reduce) { document.body.classList.add("intro"); setTimeout(() => document.body.classList.remove("intro"), 2000); }
  initScroll();
  route();
})();
