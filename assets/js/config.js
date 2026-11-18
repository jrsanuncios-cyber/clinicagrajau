/* =========================================================================
   CONFIGURAÇÃO DA CLÍNICA — edite apenas este arquivo
   -------------------------------------------------------------------------
   Aqui ficam nome, telefone, endereço, horários e mapa.
   Depois de alterar, salve: todos os botões de telefone e os textos de
   contato do site passam a usar os novos valores automaticamente.

   Obs.: esta clínica não publica número de WhatsApp no Google. Enquanto
   `whatsapp` estiver vazio, todos os botões [data-zap] viram links
   `tel:` (ligação direta para o telefone fixo).
   ========================================================================= */

window.VET_CONFIG = {
  /* --- Identidade --- */
  nome: "Anvet",
  nomeCompleto: "Clínica Veterinária Anvet",
  descricao: "Clínica veterinária completa em São Paulo: consultas, vacinas, exames, cirurgias e cuidado especializado para cães e gatos.",

  /* --- Contato ---
     Deixe `whatsapp` vazio para usar o telefone fixo em todos os CTAs.
     Se preencher (55 + DDD + número), os botões voltam a abrir o WhatsApp. */
  whatsapp: "",
  telefone: "(11) 5939-8706",
  telefoneLink: "+551159398706",
  email: "contato@anvet.com.br",
  mensagemZap: "Olá! Gostaria de agendar uma consulta para meu pet.",

  /* --- Endereço (conforme o Google Maps) --- */
  endereco: {
    rua: "Av. Dona Belmira Marin, 1801",
    bairro: "Parque Brasil",
    cidade: "São Paulo",
    uf: "SP",
    cep: "04846-010",
    /* consulta de texto (aparece na página de contato) */
    get linha1() { return this.rua + " - " + this.bairro; },
    get linha2() { return this.cidade + " - " + this.uf + ", " + this.cep; },
    /* busca usada pelo botão "Como chegar" (Google Maps) */
    get busca() { return this.rua + ", " + this.bairro + ", " + this.cidade + ", " + this.uf; }
  },

  /* --- Mapa incorporado (coordenadas do estabelecimento no Google Maps) --- */
  mapaEmbed: "https://www.google.com/maps?q=-23.7453835,-46.6891857&hl=pt-BR&z=16&output=embed",

  /* --- Horários (Google Maps) --- */
  horarios: [
    { dia: "Segunda a sábado", hora: "09h às 18h" },
    { dia: "Domingo", hora: "Fechado" }
  ],

  /* --- Redes / presença --- */
  redes: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    maps: "https://www.google.com/maps/place/Cl%C3%ADnica+Veterin%C3%A1ria+Anvet/@-23.7453835,-46.6891857,17z/data=!4m6!3m5!1s0x94ce4f4760488167:0x955659beb9cc203b!8m2!3d-23.7453835!4d-46.6891857!16s%2Fg%2F1ptylqh5q"
  },

  /* --- Avaliação no Google (dado público do Maps) --- */
  avaliacao: { nota: "4,5", total: 899 },

  /* --- Analytics (deixe vazio para desativar) --- */
  analyticsId: ""
};
