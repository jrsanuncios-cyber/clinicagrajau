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
  nome: "Clínica Grajaú",
  nomeCompleto: "Clínica Veterinária Grajaú",
  descricao: "Clínica veterinária completa no Grajaú, em São Paulo: consultas, vacinas, exames, cirurgias e cuidado especializado para cães e gatos.",

  /* --- Contato ---
     Deixe `whatsapp` vazio para usar o telefone fixo em todos os CTAs.
     Se preencher (55 + DDD + número), os botões voltam a abrir o WhatsApp. */
  whatsapp: "",
  telefone: "(11) 5929-1545",
  telefoneLink: "+551159291545",
  email: "contato@clinicavetgrajau.com.br",
  mensagemZap: "Olá! Gostaria de agendar uma consulta para meu pet.",

  /* --- Endereço (conforme o Google Maps) --- */
  endereco: {
    rua: "Av. Dona Belmira Marin, 1920",
    bairro: "Grajaú",
    cidade: "São Paulo",
    uf: "SP",
    cep: "04846-000",
    /* consulta de texto (aparece na página de contato) */
    get linha1() { return this.rua + " - " + this.bairro; },
    get linha2() { return this.cidade + " - " + this.uf + ", " + this.cep; },
    /* busca usada pelo botão "Como chegar" (Google Maps) */
    get busca() { return this.rua + ", " + this.bairro + ", " + this.cidade + ", " + this.uf; }
  },

  /* --- Mapa incorporado (coordenadas do estabelecimento no Google Maps) --- */
  mapaEmbed: "https://www.google.com/maps?q=-23.7453098,-46.6897559&hl=pt-BR&z=16&output=embed",

  /* --- Horários (Google Maps) --- */
  horarios: [
    { dia: "Segunda a sábado", hora: "10h às 20h" },
    { dia: "Domingo", hora: "12h às 15h" }
  ],

  /* --- Redes / presença ---
     Deixe a URL vazia para o ícone não aparecer no rodapé. */
  redes: {
    instagram: "https://instagram.com/clinicavet_grajau",
    facebook: "",
    maps: "https://www.google.com/maps/place/Cl%C3%ADnica+Veterin%C3%A1ria+Graja%C3%BA/@-23.7453098,-46.6897559,17z/data=!4m6!3m5!1s0x94ce4f47639b86e1:0xbb0299aad8b0d80f!8m2!3d-23.7453098!4d-46.6897559!16s%2Fg%2F11g6q3g4mv"
  },

  /* --- Avaliação no Google (dado público do Maps) --- */
  avaliacao: { nota: "4,1", total: 299 },

  /* --- Analytics (deixe vazio para desativar) --- */
  analyticsId: ""
};
