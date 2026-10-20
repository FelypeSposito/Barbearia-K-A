/* ============================================================
   CONFIGURAÇÃO DA BARBEARIA
   Tudo que é "do cliente" mora aqui. Troque os valores entre
   aspas e o site inteiro se ajusta (textos, serviços, sócios,
   horários de trabalho e regras do agendamento).
   Itens marcados com [CONFIRMAR] são placeholders.
   ============================================================ */
window.BARBEARIA_CONFIG = {
  nome: "Kaique & Ângelo",            // [CONFIRMAR] nome oficial da barbearia (Booksy / logo)
  nomeCurto: "Kaique e Ângelo",
  slogan: "Corte no detalhe. Horário no seu tempo.",
  cidade: "São Paulo, Zona Leste",    // tirado do Instagram do Ângelo [CONFIRMAR]
  endereco: "Rua Exemplo, 123, Centro", // [CONFIRMAR]
  instagram: "@suabarbearia",         // [CONFIRMAR]
  whatsapp: "(11) 90000-0000",        // [CONFIRMAR]
  booksyUrl: "https://booksy.com/pt-br/instant-experiences/widget/347412",
  desde: 2019,                        // [CONFIRMAR] ano de abertura
  notaBooksy: "4,9",                  // [CONFIRMAR]
  avaliacoes: "300+",                 // [CONFIRMAR]

  agendamento: {
    intervaloMin: 15,      // de quanto em quanto tempo abre um horário
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
      id: "angelo",
      nome: "Ângelo",
      desde: 2023,                               // Instagram: "Barbeiro desde 2023"
      papel: "Sócio · Barbeiro",
      instagram: "vn_barbeiiro",
      foto: "fotos/angelo-retrato.jpg",
      especialidades: ["Platinado", "Cacheado", "Moicano"],
      bio: "Na Zona Leste de São Paulo, conhecido no Instagram como VN Barbeiro.",
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
    },
    {
      id: "kaique",
      nome: "Kaique",
      desde: 2018,                               // [CONFIRMAR]
      papel: "Sócio · Barbeiro",
      instagram: "kaiquedoscorte",               // estúdio: @studio_kaiquedoscorte
      especialidades: ["Freestyle", "Navalhado", "Sobrancelha"],
      bio: "Placeholder: como começou, o que mais gosta de fazer e o estilo de corte que é a assinatura dele.",
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
    }
  ],

  // [CONFIRMAR] serviços e preços do Booksy
  servicos: [
    { id: "corte",      nome: "Corte",                duracao: 40, preco: 45, socios: ["angelo", "kaique"] },
    { id: "barba",      nome: "Barba",                duracao: 30, preco: 35, socios: ["angelo", "kaique"] },
    { id: "combo",      nome: "Corte + Barba",        duracao: 70, preco: 75, socios: ["angelo", "kaique"], destaque: true },
    { id: "sobrancelha",nome: "Sobrancelha",          duracao: 15, preco: 15, socios: ["angelo", "kaique"] },
    { id: "pigmentacao",nome: "Pigmentação",          duracao: 30, preco: 30, socios: ["kaique"] },
    { id: "freestyle",  nome: "Corte + Freestyle",    duracao: 60, preco: 60, socios: ["kaique"] }
  ],

  // Trabalhos: troque "foto" pelo caminho da imagem (ex.: "fotos/01.jpg")
  trabalhos: [
    // Kaique: @kaiquedoscorte só tem 2 posts públicos (1 de corte); @studio_kaiquedoscorte sem posts. Demais fotos dele pendentes.
    // Fotos do Ângelo baixadas do @vn_barbeiiro (posts originais, out/2026)
    { titulo: "Degradê no cacheado",  socio: "angelo", foto: "fotos/angelo-4.jpg" },
    { titulo: "Low fade, cabelo pra trás", socio: "kaique", foto: "fotos/kaique-1.jpg" },
    { titulo: "Moicano curtinho",     socio: "angelo", foto: "fotos/angelo-5.jpg" },
    { titulo: "Platinado com franja", socio: "angelo", foto: "fotos/angelo-1.jpg" },
    { titulo: "Freestyle lateral",    socio: "kaique", foto: "" },
    { titulo: "Cacheado com fade",    socio: "angelo", foto: "fotos/angelo-3.jpg" },
    { titulo: "Platinado, lateral",   socio: "angelo", foto: "fotos/angelo-2.jpg" },
    { titulo: "Taper + sobrancelha",  socio: "kaique", foto: "" }
  ],

  // História: marcos reais entram aqui
  historia: [
    { ano: 2018, texto: "Kaique entra na profissão. [CONFIRMAR]" },
    { ano: 2019, texto: "Abre o estúdio. [CONFIRMAR]" },
    { ano: 2023, texto: "Ângelo começa a cortar." },
    { ano: 2026, texto: "Os dois juntos na mesma cadeira. [CONFIRMAR]" }
  ]
};
