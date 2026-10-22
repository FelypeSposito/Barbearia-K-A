/* Entrada das seções ao rolar. Serve para mostrar a hierarquia na ordem em que o olho lê:
   título, depois os blocos um a um. Sem IntersectionObserver, ou com movimento reduzido
   (o CSS nem esconde nada), tudo já aparece no lugar. */
(function () {
  "use strict";
  var els = [].slice.call(document.querySelectorAll("[data-reveal]"));
  // depois que a entrada termina o bloco sai do esquema de revelação, para que as transições próprias
  // dos filhos (como as fatias de Cortes) voltem a valer, sem atraso
  var show = function (e) {
    e.classList.add("in");
    setTimeout(function () { e.removeAttribute("data-reveal"); }, 1800);
  };
  if (!("IntersectionObserver" in window)) { els.forEach(show); return; }
  var io = new IntersectionObserver(function (list) {
    list.forEach(function (x) { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
  els.forEach(function (e) { io.observe(e); });
  // rede de segurança: o que já está na tela depois de 1,2s aparece, mesmo se o observador falhar
  setTimeout(function () {
    els.forEach(function (e) { if (e.getBoundingClientRect().top < innerHeight) show(e); });
  }, 1200);
})();

/* Funcionamento: junta a jornada dos dois sócios. Em cada dia vale o primeiro horário de entrada
   e o último de saída entre eles; dia em que nenhum trabalha aparece como fechado. */
(function () {
  "use strict";
  var cfg = window.BARBEARIA_CONFIG, box = document.getElementById("horas");
  if (!cfg || !box) return;
  var dias = [["seg", "Segunda"], ["ter", "Terça"], ["qua", "Quarta"], ["qui", "Quinta"], ["sex", "Sexta"], ["sab", "Sábado"], ["dom", "Domingo"]];
  var min = function (s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; };
  var hora = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + "h" + (r ? ("0" + r).slice(-2) : ""); };
  box.innerHTML = dias.map(function (d) {
    var inicio = null, fim = null;
    cfg.socios.forEach(function (s) {
      (s.jornada[d[0]] || []).forEach(function (r) {
        var a = min(r[0]), b = min(r[1]);
        if (inicio === null || a < inicio) inicio = a;
        if (fim === null || b > fim) fim = b;
      });
    });
    return inicio === null
      ? '<li class="off"><span>' + d[1] + "</span><span>Fechado</span></li>"
      : "<li><span>" + d[1] + "</span><span>" + hora(inicio) + " às " + hora(fim) + "</span></li>";
  }).join("");
})();

/* Cortes: cada fatia recebe foco de teclado, para abrir sem mouse. */
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("#works .work"), function (w) { w.tabIndex = 0; });
})();
