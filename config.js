/* ============================================================
   CONFIGURAÇÃO DA BARBEARIA
   Tudo que é "do cliente" mora aqui. Troque os valores entre
   aspas e o site inteiro se ajusta (textos, serviços, sócios,
   horários de trabalho e regras do agendamento).
   Itens marcados com [CONFIRMAR] são placeholders.
   ============================================================ */
window.BARBEARIA_CONFIG = {
  nome: "Studio Kaique dos Corte",    // mesmo nome do Instagram @studio_kaiquedoscorte
  nomeCurto: "Studio Kaique dos Corte",
  slogan: "Corte no detalhe. Horário no seu tempo.",
  cidade: "Zona Leste de SP",         // aparece como "na Zona Leste de SP" [CONFIRMAR bairro]
  endereco: "Rua Exemplo, 123, Centro", // [CONFIRMAR]
  instagram: "@studio_kaiquedoscorte",
  whatsapp: "(11) 90000-0000",        // [CONFIRMAR]
  fotoPrincipal: "fotos/studio-logo.jpg", // foto grande do início (logo do @studio_kaiquedoscorte)
  booksyUrl: "https://booksy.com/pt-br/instant-experiences/widget/347412",
  desde: 2019,                        // [CONFIRMAR] ano de abertura
  notaBooksy: "4,9",                  // [CONFIRMAR]
  avaliacoes: "300+",                 // [CONFIRMAR]

  agendamento: {
    intervaloMin: 60,      // de quanto em quanto tempo abre um horário (cortes de 1 em 1 hora)
    diasAFrente: 14,       // quantos dias o cliente enxerga
    antecedenciaMin: 60,   // não deixa agendar em cima da hora
    exigirLogin: true,     // pede "Entrar com Google" antes de confirmar
    // "booksy"  -> o botão final manda pro Booksy (hoje)
    // "proprio" -> confirma no próprio site (futuro, com backend)
    modo: "proprio"
  },

  // Jornada: dias seg..dom, cada dia com faixas [início, fim]. Dia sem faixa = folga.
  socios: [
    {
      id: "kaique",
      nome: "Kaique",
      desde: 2018,                               // [CONFIRMAR]
      papel: "Dono do estúdio",
      instagram: "kaiquedoscorte",               // estúdio: @studio_kaiquedoscorte
      foto: "",                                  // sem foto boa ainda: mostra a inicial no lugar. Coloque aqui um retrato nítido (pelo menos 600px de largura)
      especialidades: ["Freestyle", "Navalhado", "Sobrancelha"],
      bio: "O estúdio leva o nome dele e o K do logo também. É quem toca a casa.", // [CONFIRMAR] contar como começou e o corte que é a marca dele
      googleCalendarId: "kaique@exemplo.com",
      jornada: {
        seg: [["10:00", "19:00"]],
        ter: [["10:00", "19:00"]],
        qua: [],
        qui: [["10:00", "20:00"]],
        sex: [["10:00", "20:00"]],
        sab: [["08:00", "17:00"]],
        dom: []
      }
    },
    {
      id: "angelo",
      nome: "Ângelo",
      desde: 2023,                               // Instagram: "Barbeiro desde 2023"
      papel: "Sócio",
      instagram: "vn_barbeiiro",
      foto: "fotos/angelo-retrato.jpg",
      especialidades: ["Platinado", "Cacheado", "Moicano"],
      bio: "Sócio do Kaique no estúdio. Posta os cortes no Instagram como VN Barbeiro.",
      googleCalendarId: "angelo@exemplo.com",    // usado na automação futura
      jornada: {
        seg: [],
        ter: [["09:00", "12:00"], ["13:00", "19:00"]],
        qua: [["09:00", "12:00"], ["13:00", "19:00"]],
        qui: [["09:00", "12:00"], ["13:00", "20:00"]],
        sex: [["09:00", "12:00"], ["13:00", "20:00"]],
        sab: [["08:00", "16:00"]],
        dom: []
      }
    }
  ],

  // Tabela do Booksy (out/2026). Duração em minutos. Quem faz cada serviço: [CONFIRMAR], hoje os dois fazem tudo
  servicos: [
    { id: "combo-cavanhaque",      nome: "Combo: corte + cavanhaque + sobrancelha", duracao: 90, preco: 55, socios: ["angelo", "kaique"] },
    { id: "combo",                 nome: "Combo: corte + barba + sobrancelha",      duracao: 90, preco: 70, socios: ["angelo", "kaique"], destaque: true },
    { id: "corte",                 nome: "Corte social",                            duracao: 60, preco: 40, socios: ["angelo", "kaique"] },
    { id: "corte-sobrancelha",     nome: "Corte social + sobrancelha",              duracao: 60, preco: 50, socios: ["angelo", "kaique"] },
    { id: "zero",                  nome: "Corte na zero",                           duracao: 60, preco: 40, socios: ["angelo", "kaique"] },
    { id: "zero-sobrancelha",      nome: "Corte na zero + sobrancelha",             duracao: 60, preco: 50, socios: ["angelo", "kaique"] },
    { id: "navalhado",             nome: "Corte navalhado",                         duracao: 60, preco: 50, socios: ["angelo", "kaique"] },
    { id: "navalhado-sobrancelha", nome: "Corte navalhado + sobrancelha",           duracao: 60, preco: 60, socios: ["angelo", "kaique"] },
    { id: "barba",                 nome: "Barba",                                   duracao: 30, preco: 30, socios: ["angelo", "kaique"] },
    { id: "cavanhaque",            nome: "Cavanhaque",                              duracao: 30, preco: 15, socios: ["angelo", "kaique"] },
    { id: "penteado",              nome: "Penteado",                                duracao: 30, preco: 15, socios: ["angelo", "kaique"] },
    { id: "alisamento",            nome: "Alisamento",                              duracao: 30, preco: 15, socios: ["angelo", "kaique"] }
  ],

  // Trabalhos: troque "foto" pelo caminho da imagem (ex.: "fotos/01.jpg")
  trabalhos: [
    // Kaique: @kaiquedoscorte só tem 2 posts públicos (1 de corte); @studio_kaiquedoscorte sem posts. Demais fotos dele pendentes.
    // Fotos do Ângelo baixadas do @vn_barbeiiro (posts originais, out/2026)
    { titulo: "Degradê no cacheado",  socio: "angelo", foto: "fotos/angelo-4.jpg" },
    { titulo: "Low fade, cabelo pra trás", socio: "kaique", foto: "fotos/kaique-1.jpg" },
    { titulo: "Moicano curtinho",     socio: "angelo", foto: "fotos/angelo-5.jpg" },
    { titulo: "Platinado com franja", socio: "angelo", foto: "fotos/angelo-2.jpg" }
    // Fora por enquanto: fotos borradas ou faltando (angelo-1, angelo-3, freestyle e taper do Kaique).
    // Só volte com fotos nítidas, de pelo menos 720px de largura.
  ],

  // História: marcos reais entram aqui
  historia: [
    { ano: 2018, texto: "Kaique pega na máquina pela primeira vez." }, // [CONFIRMAR]
    { ano: 2019, texto: "Abre o estúdio no bairro." }, // [CONFIRMAR]
    { ano: 2023, texto: "Ângelo começa a cortar." },
    { ano: 2026, texto: "Os dois passam a dividir o mesmo espaço." } // [CONFIRMAR]
  ]
};
