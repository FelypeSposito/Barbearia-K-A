# Studio Kaique dos Corte · base do site

Protótipo estático (HTML + CSS + JS puro, sem build). Abra `index.html` num servidor local (`python3 -m http.server`) ou suba a pasta no GitHub Pages / Vercel / Netlify.

| Arquivo | O que é |
|---|---|
| `config.js` | **Tudo que muda por cliente**: nome, contatos, serviços e preços, sócios, jornada de cada um, regras do agendamento, fotos e história. Itens `[CONFIRMAR]` são placeholders. |
| `index.html` | Estrutura das 3 telas: site, Minha conta, Painel dos sócios, e o sheet de agendamento. | Documento completo (doctype, viewport e head), pronto para GitHub Pages, Vercel ou Netlify. No artifact do Claude vale só o trecho do `<title>` em diante, porque o publicador monta o resto. |
| `styles.css` | Visual (tokens de cor no topo, tema claro/escuro automático). |
| `app.js` | Disponibilidade, fluxo de agendamento, login simulado, histórico e painel. Dados fictícios em `localStorage`. |
| `fx.js` | Entrada das seções ao rolar, foco de teclado nas fatias de Cortes e horário de funcionamento (calculado da jornada dos sócios). |

## O que já funciona (simulado)

- **Home**: hero com foto + botão grande, faixa de serviços, galeria com filtro por sócio, antes/depois arrastável, sócios com peso igual e "próximo horário livre", história, serviços clicáveis, CTA final com horários reais da agenda.
- **Agendamento** em 4 passos: serviço → profissional (ou "quem estiver livre", que mostra os dois lado a lado) → dia e horário → observações do corte. Os horários saem da jornada de cada sócio no `config.js`, descontando duração do serviço, horários ocupados e antecedência mínima.
- **Minha conta**: "Entrar com Google" (simulado), últimos cortes com o que foi pedido e nota do barbeiro, curtir, "repetir este corte", próximos horários com cancelar, preferências que vão junto em todo agendamento.
- **Painel dos sócios**: agenda do dia por sócio com observações do cliente, buracos livres para encaixe, chegou/concluído, números da semana e editor de jornada que muda a disponibilidade do site na hora.
- `agendamento.modo: "booksy"` troca o botão final para mandar ao Booksy, caso queiram manter o sistema atual no começo.

## Dá para automatizar? Sim. Três caminhos

**1. Manter o Booksy (zero backend).** O site vira a vitrine e todo botão de agendar leva ao link do Booksy. Rápido e sem custo, mas sem login Google, sem histórico próprio e sem a escolha "quem está livre" no site.

**2. Agenda Google de cada sócio + backend leve (recomendado).**
- Cada sócio tem um Google Calendar (o `googleCalendarId` já está no config).
- Backend: **Supabase** (Postgres + Auth com Google + Edge Functions) ou Firebase. Plano gratuito cobre uma barbearia.
- Login do cliente: Google OAuth via Supabase Auth.
- Disponibilidade: a função consulta `freeBusy` da Google Calendar API para o sócio e cruza com a jornada. Assim, se o Ângelo marcar um compromisso pessoal no celular, o horário some do site.
- Ao confirmar: a função cria o evento na agenda do sócio (`events.insert`) com serviço, cliente e observações na descrição, e convida o e-mail do cliente. O cliente recebe convite e lembrete do próprio Google.
- Tabelas: `clientes`, `agendamentos` (id do evento Google, observações, status), `historico` (o que foi feito, nota do barbeiro, foto opcional), `preferencias`.
- Painel dos sócios: mesma app, rota protegida para os dois e-mails deles.
- Lembretes/WhatsApp: a mensagem padrão atual pode passar a mandar o link do site. Lembrete automático por WhatsApp exige a API oficial (Meta/Twilio, pago por mensagem); dá para começar só com o e-mail do Google.
- Cuidado: a autorização da agenda dos sócios é feita uma vez (conta de serviço com a agenda compartilhada, ou OAuth dos sócios com refresh token guardado no backend).

**3. Integrar com o Booksy.** O Booksy não tem API pública aberta para isso; depende de parceria. Não recomendo como ponto de partida.

## Para levar ao briefing

1. Logo, cores e nome oficial (o Booksy não abriu daqui; o visual atual é neutro e troca pelos tokens do `styles.css`).
2. Fotos: 1 foto forte para o hero, 6+ trabalhos de cada um, retratos dos dois, 1–3 pares de antes/depois.
3. Serviços, durações e preços reais por sócio.
4. Jornada de cada um (dias, horários, almoço) e regras: antecedência mínima, cancelamento, intervalo entre clientes.
5. História real: quando cada um começou, quando abriram, marcos.
6. Decisão: continuar com Booksy no início ou migrar para agenda própria (caminho 2)?
7. Pagamento antecipado/sinal (Pix) para reduzir falta? Isso entra no caminho 2.
8. Domínio (ex.: `kaiqueeangelo.com.br`) e quem administra.

## Melhorias possíveis já na base

- Trocar placeholders por fotos (campo `foto` no config) e otimizar as imagens (WebP, `loading="lazy"`).
- Galeria em tela cheia com gesto de arrastar ao tocar num trabalho.
- PWA (ícone na tela inicial do celular) para virar um "app" da barbearia.
- Fila de espera quando o dia está lotado.
- Avaliação pós-corte que alimenta o histórico do cliente.
