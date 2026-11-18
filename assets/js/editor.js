/* =========================================================================
   EDITOR VISUAL DO SITE — todos os textos e imagens editáveis na página
   -------------------------------------------------------------------------
   Como usar:
     1. Abra qualquer página com ?editar=1  (ou pressione Ctrl+E)
     2. Clique nos textos para editar; clique nas imagens para trocar a
        foto, o texto alternativo (alt), o mapa ou os rótulos de um select
     3. As alterações ficam salvas neste navegador (localStorage)
     4. "Exportar" gera um JSON para levar as alterações a outro computador
     5. "Importar" carrega esse JSON de volta
     6. "Desfazer página" / "Limpar tudo" voltam ao conteúdo original

   As alterações têm prioridade sobre o que vem em config.js e nas páginas
   geradas pelo build.ps1.
   ========================================================================= */
(function () {
  "use strict";

  var PREFIXO = "anvet-edicoes:";
  var CHAVE_ATIVO = "anvet-editor-ativo";
  var EXCUIR_UI = "#editor-ui, #editor-modal, .editor-abrir";
  var EXCUIR = EXCUIR_UI + ", .honeypot, .visually-hidden, [aria-hidden='true'], .menu-toggle, .skip-link";

  /* tudo que pode receber texto */
  var TEXTO = [
    "h1", "h2", "h3", "h4", "h5",
    "p", "li", "figcaption", "blockquote", "label", "dt", "dd", "summary", "time",
    "a[href]", "button",
    "span[data-campo]", "span[data-rotulo]", "span.eyebrow", "span.rotulo",
    "span.membro-tag", "span.membro-cargo", "span.membro-registro",
    "span.selo", "span.post-categoria",
    ".depoimento-texto", ".depoimento-autor", ".post-data",
    ".aviso-form", ".lead", ".texto-suave", ".destaque-redondo"
  ].join(",");

  /* imagens disponíveis no projeto (para o seletor do modal) */
  var IMG_LOCAIS = [
    "assets/img/hero-cachorro.jpg", "assets/img/sobre-clinica.jpg", "assets/img/sobre-equipe.jpg",
    "assets/img/cta-pet.jpg", "assets/img/pata.svg",
    "assets/img/equipe-1.jpg", "assets/img/equipe-2.jpg", "assets/img/equipe-3.jpg", "assets/img/equipe-4.jpg",
    "assets/img/galeria-1.jpg", "assets/img/galeria-2.jpg", "assets/img/galeria-3.jpg",
    "assets/img/galeria-4.jpg", "assets/img/galeria-5.jpg", "assets/img/galeria-6.jpg",
    "assets/img/depoimento-1.jpg", "assets/img/depoimento-2.jpg", "assets/img/depoimento-3.jpg", "assets/img/depoimento-4.jpg",
    "assets/img/blog-1.jpg", "assets/img/blog-2.jpg", "assets/img/blog-3.jpg", "assets/img/blog-4.jpg",
    "assets/img/servico-consultas.jpg", "assets/img/servico-vacinacao.jpg", "assets/img/servico-exames.jpg",
    "assets/img/servico-imagem.jpg", "assets/img/servico-cirurgias.jpg", "assets/img/servico-dermatologia.jpg",
    "assets/img/servico-odontologia.jpg", "assets/img/servico-nutricao.jpg", "assets/img/servico-banho.jpg"
  ];

  var MODO = false;
  var originais = {};          /* caminho -> valor original da página */
  var relogioStatus = null;
  var relogioSalvar = null;
  var alvoModal = null;

  /* ---------------------------------------------------------------- utils */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function caminho(el) {
    var partes = [];
    while (el && el.nodeType === 1) {
      var tag = el.tagName.toLowerCase();
      var i = 1;
      var s = el.previousElementSibling;
      while (s) { if (s.tagName === el.tagName) i++; s = s.previousElementSibling; }
      partes.unshift(tag + "[" + i + "]");
      if (el === document.body) break;
      el = el.parentElement;
    }
    return partes.join(">");
  }

  function chavePagina() { return PREFIXO + location.pathname; }

  function lerPagina() {
    try { return JSON.parse(localStorage.getItem(chavePagina())) || {}; }
    catch (e) { return {}; }
  }

  function gravarPagina(mapa) {
    try { localStorage.setItem(chavePagina(), JSON.stringify(mapa)); } catch (e) {}
  }

  function gravarCampo(c, campos, silencioso) {
    var mapa = lerPagina();
    if (!mapa[c]) mapa[c] = {};
    for (var k in campos) { if (Object.prototype.hasOwnProperty.call(campos, k)) mapa[c][k] = campos[k]; }
    gravarPagina(mapa);
    if (!silencioso) avisar("Alteração salva");
    remarcar();
  }

  /* Salva o elemento e, se ele estiver dentro de outro elemento editável,
     salva os ancestrais também (assim nada se perde na restauração). */
  function gravarDoEl(el, campos, silencioso) {
    gravarCampo(caminho(el), campos, silencioso);
    var pai = el.parentElement;
    while (pai && pai !== document.body) {
      if (pai.hasAttribute("data-editavel")) {
        gravarCampo(caminho(pai), { t: htmlLimpo(pai) }, true);
      }
      pai = pai.parentElement;
    }
  }

  function removerCampo(c) {
    var mapa = lerPagina();
    delete mapa[c];
    gravarPagina(mapa);
    remarcar();
  }

  /* HTML vindo do editor passa por aqui antes de voltar para a página */
  function sanitizar(html) {
    var doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    var raiz = doc.body.firstChild;
    if (!raiz) return "";
    $$("script,iframe,object,embed,link,style", raiz).forEach(function (n) { n.parentNode.removeChild(n); });
    $$("*", raiz).forEach(function (n) { limparAtributos(n); });
    limparAtributos(raiz);
    return raiz.innerHTML;
  }

  /* remove tudo o que o modo de edição injeta nos elementos */
  function limparAtributos(n) {
    Array.prototype.slice.call(n.attributes).forEach(function (a) {
      var nome = a.name.toLowerCase();
      if (nome.charAt(0) === "o" && nome.charAt(1) === "n") n.removeAttribute(a.name);        /* onclick... */
      else if (nome === "contenteditable" || nome === "data-editavel" || nome === "spellcheck" ||
               nome === "data-edita-img" || nome === "data-edita-select" || nome === "data-edita-ph") n.removeAttribute(a.name);
      else if (nome === "title" && a.value === "Clique para editar este texto") n.removeAttribute(a.name);
      else if (/javascript:/i.test(a.value)) n.removeAttribute(a.name);
    });
  }

  /* HTML interno do elemento, sem as marcas do modo de edição */
  function htmlLimpo(el) {
    var clone = el.cloneNode(true);
    limparAtributos(clone);
    $$("*", clone).forEach(limparAtributos);
    return clone.innerHTML;
  }

  /* ------------------------------------------------------------ candidatos */
  function podeEditar(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest(EXCUIR)) return false;
    if (el.closest("svg")) return false;
    return true;
  }

  function candidatos() {
    var res = [];
    var vistos = [];
    function add(el) {
      if (!podeEditar(el) || vistos.indexOf(el) >= 0) return;
      vistos.push(el);
      res.push(el);
    }
    $$(TEXTO).forEach(add);
    $$("img").forEach(add);
    $$("iframe[data-mapa]").forEach(add);
    $$("select").forEach(add);
    $$("input[placeholder], textarea[placeholder]").forEach(add);
    return res;
  }

  function snapshot(el) {
    var tag = el.tagName;
    if (tag === "IMG") return { src: el.getAttribute("src"), alt: el.getAttribute("alt") };
    if (tag === "IFRAME") return { src: el.getAttribute("src") };
    if (tag === "SELECT") return { opts: Array.prototype.map.call(el.options, function (o) { return o.textContent; }) };
    if (tag === "INPUT" || tag === "TEXTAREA") return { ph: el.getAttribute("placeholder") };
    return { t: htmlLimpo(el) };
  }

  function aplicar(el, d) {
    if (!el || !d) return;
    if (typeof d.t === "string") el.innerHTML = sanitizar(d.t);
    if (typeof d.src === "string" && d.src) {
      if (el.tagName === "IFRAME") el.src = d.src; else el.setAttribute("src", d.src);
    }
    if (typeof d.alt === "string") el.setAttribute("alt", d.alt);
    if (typeof d.ph === "string") el.setAttribute("placeholder", d.ph);
    if (d.opts && el.tagName === "SELECT") {
      Array.prototype.forEach.call(el.options, function (o, i) {
        if (d.opts[i] != null) o.textContent = d.opts[i];
      });
    }
  }

  function restaurarEdicoes() {
    var mapa = lerPagina();
    candidatos().forEach(function (el) {
      var c = caminho(el);
      originais[c] = snapshot(el);
      if (mapa[c]) aplicar(el, mapa[c]);
    });
  }

  /* --------------------------------------------------------- modo edição */
  function marcar(el) {
    var tag = el.tagName;
    if (tag === "IMG" || tag === "IFRAME") { el.setAttribute("data-edita-img", ""); return; }
    if (tag === "SELECT") { el.setAttribute("data-edita-select", ""); return; }
    if (tag === "INPUT" || tag === "TEXTAREA") { el.setAttribute("data-edita-ph", ""); return; }
    if (el.getAttribute("contenteditable") === "true") return;
    el.setAttribute("contenteditable", "true");
    el.setAttribute("data-editavel", "");
    el.setAttribute("spellcheck", "false");
    el.setAttribute("title", "Clique para editar este texto");
  }

  function remarcar() {
    if (!MODO) return;
    candidatos().forEach(marcar);
  }

  function entrarModo() {
    if (MODO) return;
    MODO = true;
    try { localStorage.setItem(CHAVE_ATIVO, "1"); } catch (e) {}
    document.documentElement.classList.add("modo-edicao");
    $("#editor-abrir").hidden = false;
    candidatos().forEach(marcar);
    $("#editor-ui").hidden = false;
    $("#editor-abrir").setAttribute("aria-expanded", "true");
    avisar("Clique nos textos para editar e nas imagens para trocar.");
  }

  function sairModo() {
    if (!MODO) return;
    MODO = false;
    fecharModal();
    document.documentElement.classList.remove("modo-edicao");
    $$("[data-editavel],[data-edita-img],[data-edita-select],[data-edita-ph]").forEach(function (el) {
      el.removeAttribute("contenteditable");
      el.removeAttribute("data-editavel");
      el.removeAttribute("data-edita-img");
      el.removeAttribute("data-edita-select");
      el.removeAttribute("data-edita-ph");
      el.removeAttribute("spellcheck");
      el.removeAttribute("title");
    });
    $("#editor-ui").hidden = true;
    $("#editor-abrir").setAttribute("aria-expanded", "false");
  }

  /* ------------------------------------------------------------- avisos */
  function avisar(msg, erro) {
    var s = $("#editor-ui [data-status]");
    if (!s) return;
    s.textContent = msg || "";
    s.classList.toggle("is-erro", !!erro);
    clearTimeout(relogioStatus);
    if (msg) relogioStatus = setTimeout(function () { s.textContent = ""; }, 4500);
  }

  /* -------------------------------------------------------------- modal */
  function abrirModal(tipo, el) {
    alvoModal = { tipo: tipo, el: el };
    var modal = $("#editor-modal");
    var titulo = $("[data-titulo]", modal);
    var corpo = $("[data-corpo]", modal);
    var restaurar = $("[data-modal-restaurar]", modal);

    if (tipo === "img" || tipo === "iframe") {
      titulo.textContent = tipo === "img" ? "Trocar imagem" : "Trocar mapa incorporado";
      corpo.innerHTML =
        (tipo === "img" ? '<label>Arquivo do projeto ou URL da imagem<input data-campo="src" list="editor-lista-img" value="' + esc(el.getAttribute("src")) + '"></label>'
                        : '<label>URL do mapa (Google Maps)<input data-campo="src" value="' + esc(el.getAttribute("src")) + '"></label>') +
        (tipo === "img" ? '<label>Texto alternativo (alt) — descreve a foto para quem não vê<input data-campo="alt" value="' + esc(el.getAttribute("alt")) + '"></label>' : "");
      restaurar.hidden = false;
    } else if (tipo === "ph") {
      titulo.textContent = "Editar texto exibido";
      corpo.innerHTML = '<label>Texto de apoio (placeholder)<input data-campo="ph" value="' + esc(el.getAttribute("placeholder")) + '"></label>';
      restaurar.hidden = false;
    } else if (tipo === "select") {
      titulo.textContent = "Editar opções";
      corpo.innerHTML = Array.prototype.map.call(el.options, function (o, i) {
        return '<label>Opção ' + (i + 1) + '<input data-opt="' + i + '" value="' + esc(o.textContent) + '"></label>';
      }).join("");
      restaurar.hidden = false;
    }

    modal.hidden = false;
    var primeiro = $("input", corpo);
    if (primeiro) { primeiro.focus(); primeiro.select && primeiro.select(); }
  }

  function fecharModal() {
    var modal = $("#editor-modal");
    if (modal) modal.hidden = true;
    alvoModal = null;
  }

  function salvarModal() {
    if (!alvoModal) return;
    var el = alvoModal.el;
    var tipo = alvoModal.tipo;

    if (tipo === "img") {
      var src = $('[data-campo="src"]', $("#editor-modal")).value.trim();
      var alt = $('[data-campo="alt"]', $("#editor-modal")).value;
      if (src) el.setAttribute("src", src);
      el.setAttribute("alt", alt);
      gravarDoEl(el, { src: src, alt: alt });
    } else if (tipo === "iframe") {
      var url = $('[data-campo="src"]', $("#editor-modal")).value.trim();
      if (url) el.setAttribute("src", url);
      gravarDoEl(el, { src: url });
    } else if (tipo === "ph") {
      var ph = $('[data-campo="ph"]', $("#editor-modal")).value;
      el.setAttribute("placeholder", ph);
      gravarDoEl(el, { ph: ph });
    } else if (tipo === "select") {
      var vals = $$("[data-opt]", $("#editor-modal")).map(function (i) { return i.value; });
      Array.prototype.forEach.call(el.options, function (o, i) {
        if (vals[i] != null) o.textContent = vals[i];
      });
      gravarDoEl(el, { opts: vals });
    }

    fecharModal();
    avisar("Alteração salva.");
  }

  function restaurarModal() {
    if (!alvoModal) return;
    var c = caminho(alvoModal.el);
    aplicar(alvoModal.el, originais[c]);
    removerCampo(c);
    fecharModal();
    avisar("Original restaurado.");
  }

  /* --------------------------------------------------- exportar / importar */
  function todasAsEdicoes() {
    var paginas = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(PREFIXO) === 0) {
        try { paginas[k.slice(PREFIXO.length)] = JSON.parse(localStorage[k]); } catch (e) {}
      }
    }
    return paginas;
  }

  function exportar() {
    var pacote = { formato: "anvet-edicoes", versao: 1, geradoEm: new Date().toISOString(), paginas: todasAsEdicoes() };
    var blob = new Blob([JSON.stringify(pacote, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "edicoes-anvet.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.parentNode.removeChild(a); }, 800);
    avisar("Arquivo edicoes-anvet.json gerado.");
  }

  function importar(arquivo) {
    var leitor = new FileReader();
    leitor.onload = function () {
      var dados;
      try { dados = JSON.parse(String(leitor.result)); }
      catch (e) { avisar("Arquivo inválido: não é um JSON.", true); return; }

      var paginas = (dados && dados.paginas) ? dados.paginas : null;
      if (!paginas) {
        paginas = {};
        for (var k in dados) {
          if (Object.prototype.hasOwnProperty.call(dados, k) && k.indexOf(PREFIXO) === 0) {
            paginas[k.slice(PREFIXO.length)] = dados[k];
          }
        }
      }
      var total = 0;
      for (var p in paginas) {
        if (Object.prototype.hasOwnProperty.call(paginas, p)) {
          try { localStorage.setItem(PREFIXO + p, JSON.stringify(paginas[p])); total++; } catch (e) {}
        }
      }
      if (!total) { avisar("Nenhuma alteração encontrada no arquivo.", true); return; }
      avisar(total + " página(s) importadas. Recarregando...");
      setTimeout(function () { location.reload(); }, 600);
    };
    leitor.readAsText(arquivo);
  }

  function limparPagina() {
    if (!confirm("Remover todas as alterações feitas nesta página?")) return;
    try { localStorage.removeItem(chavePagina()); } catch (e) {}
    location.reload();
  }

  function limparTudo() {
    if (!confirm("Remover TODAS as alterações de todas as páginas neste navegador?")) return;
    Object.keys(todasAsEdicoes()).forEach(function (p) {
      try { localStorage.removeItem(PREFIXO + p); } catch (e) {}
    });
    location.reload();
  }

  /* ------------------------------------------------------------------ UI */
  var CSS = [
    ".editor-abrir{position:fixed;left:14px;bottom:14px;z-index:1300;display:inline-flex;align-items:center;gap:.45rem;",
    "padding:.62rem 1rem;border:0;border-radius:999px;background:#064C70;color:#fff;",
    "font:600 .85rem/1 var(--font-texto,'DM Sans',system-ui,sans-serif);cursor:pointer;",
    "box-shadow:0 10px 26px rgba(6,76,112,.35);transition:transform .2s ease,background .2s ease}",
    ".editor-abrir:hover{background:#0875A5;transform:translateY(-2px)}",
    ".editor-abrir[hidden]{display:none}",
    ".editor-painel{position:fixed;left:14px;bottom:68px;z-index:1300;width:min(340px,calc(100vw - 28px));",
    "background:#fff;border:1px solid rgba(6,76,112,.16);border-radius:18px;padding:14px 16px;",
    "box-shadow:0 20px 48px rgba(6,76,112,.28);color:#123;font-size:.9rem;line-height:1.5}",
    ".editor-painel[hidden]{display:none}",
    ".editor-titulo{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.4rem}",
    ".editor-titulo strong{font-family:var(--font-titulo,'Fredoka',sans-serif);color:#064C70;font-size:1rem}",
    ".editor-titulo button{border:0;background:transparent;font-size:1.4rem;line-height:1;cursor:pointer;color:#064C70;padding:0 .2rem}",
    ".editor-painel p{margin:.35rem 0;color:#33475b}",
    ".editor-botoes{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.7rem}",
    ".editor-botoes button{border:1px solid rgba(6,76,112,.28);background:#F5F0D9;color:#064C70;",
    "border-radius:999px;padding:.45rem .8rem;font:600 .8rem/1 var(--font-texto,'DM Sans',sans-serif);cursor:pointer}",
    ".editor-botoes button:hover{background:#E9D8A6}",
    ".editor-botoes button.editor-primario{background:#0875A5;border-color:#0875A5;color:#fff}",
    ".editor-botoes button.editor-primario:hover{background:#064C70}",
    ".editor-status{min-height:1.1em;font-size:.82rem;color:#0875A5;font-weight:600}",
    ".editor-status.is-erro{color:#b3261e}",
    ".editor-dica{font-size:.76rem;color:#5b6b7c;margin-top:.5rem}",
    ".editor-dica kbd{background:#eef3f6;border:1px solid #d3e0e8;border-radius:5px;padding:0 .3rem;font-size:.74rem}",
    ".editor-modal{position:fixed;inset:0;z-index:1400;background:rgba(6,76,112,.5);display:flex;align-items:center;justify-content:center;padding:16px}",
    ".editor-modal[hidden]{display:none}",
    ".editor-modal-caixa{background:#fff;border-radius:20px;padding:20px;width:min(470px,100%);max-height:86vh;overflow:auto;",
    "box-shadow:0 26px 64px rgba(0,0,0,.32)}",
    ".editor-modal-caixa h3{font-family:var(--font-titulo,'Fredoka',sans-serif);color:#064C70;margin:0 0 .3rem;font-size:1.15rem}",
    ".editor-modal label{display:block;font-size:.83rem;font-weight:600;color:#064C70;margin:.75rem 0 .25rem}",
    ".editor-modal input{width:100%;padding:.6rem .7rem;border:1px solid rgba(6,76,112,.28);border-radius:10px;font:inherit;font-size:.9rem}",
    ".editor-modal input:focus{outline:2px solid #13A9D1;outline-offset:1px}",
    "html.modo-edicao [data-editavel]{outline:1px dashed rgba(6,76,112,.5);outline-offset:3px;border-radius:4px;cursor:text}",
    "html.modo-edicao [data-editavel]:hover,html.modo-edicao [data-editavel]:focus{outline-color:#13A9D1;background:rgba(19,169,209,.09)}",
    "html.modo-edicao [data-edita-img]{cursor:pointer;outline:2px dashed rgba(19,169,209,.9);outline-offset:4px;border-radius:6px}",
    "html.modo-edicao [data-edita-select],html.modo-edicao [data-edita-ph]{cursor:pointer;outline:1px dashed rgba(19,169,209,.9);outline-offset:2px}",
    "@media (prefers-reduced-motion: reduce){.editor-abrir{transition:none}}"
  ].join("");

  function criarUI() {
    if ($("#editor-css")) return;

    var estilo = document.createElement("style");
    estilo.id = "editor-css";
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    var botao = document.createElement("button");
    botao.type = "button";
    botao.id = "editor-abrir";
    botao.className = "editor-abrir";
    botao.hidden = true;
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-controls", "editor-ui");
    botao.innerHTML = "&#9998; <span>Editar site</span>";
    botao.addEventListener("click", function () { MODO ? sairModo() : entrarModo(); });
    document.body.appendChild(botao);

    var painel = document.createElement("div");
    painel.className = "editor-painel";
    painel.id = "editor-ui";
    painel.hidden = true;
    painel.innerHTML =
      '<div class="editor-titulo"><strong>Modo de edição</strong>' +
      '<button type="button" data-acao="sair" aria-label="Sair da edição">&times;</button></div>' +
      '<p>Clique nos <strong>textos</strong> para editar. Clique nas <strong>imagens</strong> para trocar a foto, o texto alternativo (alt), o mapa ou as opções de um menu.</p>' +
      '<div class="editor-botoes">' +
      '<button type="button" data-acao="exportar">Exportar JSON</button>' +
      '<button type="button" data-acao="importar">Importar JSON</button>' +
      '<button type="button" data-acao="limpar">Desfazer esta página</button>' +
      '<button type="button" data-acao="limpar-tudo">Limpar tudo</button>' +
      '</div>' +
      '<p class="editor-status" data-status role="status"></p>' +
      '<p class="editor-dica">Atalho <kbd>Ctrl</kbd>+<kbd>E</kbd> · alterações salvas neste navegador.</p>' +
      '<input type="file" accept="application/json,.json" hidden data-importar>';
    document.body.appendChild(painel);

    var modal = document.createElement("div");
    modal.className = "editor-modal";
    modal.id = "editor-modal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="editor-modal-caixa" role="dialog" aria-modal="true" aria-labelledby="editor-modal-titulo">' +
      '<h3 id="editor-modal-titulo" data-titulo>Trocar imagem</h3>' +
      '<div data-corpo></div>' +
      '<div class="editor-botoes">' +
      '<button type="button" class="editor-primario" data-modal-salvar>Salvar</button>' +
      '<button type="button" data-modal-restaurar>Restaurar original</button>' +
      '<button type="button" data-modal-cancelar>Cancelar</button>' +
      '</div></div>';
    document.body.appendChild(modal);

    var lista = document.createElement("datalist");
    lista.id = "editor-lista-img";
    lista.innerHTML = IMG_LOCAIS.map(function (c) { return '<option value="' + c + '"></option>'; }).join("");
    document.body.appendChild(lista);

    painel.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acao]");
      if (!b) return;
      var a = b.getAttribute("data-acao");
      if (a === "sair") sairModo();
      else if (a === "exportar") exportar();
      else if (a === "importar") $("[data-importar]", painel).click();
      else if (a === "limpar") limparPagina();
      else if (a === "limpar-tudo") limparTudo();
    });

    $("[data-importar]", painel).addEventListener("change", function () {
      if (this.files && this.files[0]) importar(this.files[0]);
      this.value = "";
    });

    modal.addEventListener("click", function (ev) {
      if (ev.target === modal || ev.target.closest("[data-modal-cancelar]")) { fecharModal(); return; }
      if (ev.target.closest("[data-modal-salvar]")) salvarModal();
      else if (ev.target.closest("[data-modal-restaurar]")) restaurarModal();
    });

    modal.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" && ev.target.tagName === "INPUT") { ev.preventDefault(); salvarModal(); }
    });
  }

  /* ------------------------------------------------------------ eventos */
  document.addEventListener("input", function (ev) {
    if (!MODO) return;
    var el = ev.target.closest && ev.target.closest("[data-editavel]");
    if (!el) return;
    clearTimeout(relogioSalvar);
    relogioSalvar = setTimeout(function () { gravarDoEl(el, { t: htmlLimpo(el) }, true); }, 350);
  });

  document.addEventListener("focusout", function (ev) {
    if (!MODO) return;
    var el = ev.target.closest && ev.target.closest("[data-editavel]");
    if (!el) return;
    clearTimeout(relogioSalvar);
    gravarDoEl(el, { t: htmlLimpo(el) }, true);
  });

  document.addEventListener("click", function (ev) {
    if (!MODO) return;
    var alvo = ev.target;
    if (!alvo.closest) return;
    if (alvo.closest(EXCUIR_UI)) return;                 /* interface do editor funciona normal */

    var midia = alvo.closest("[data-edita-img]");
    if (midia) {
      ev.preventDefault(); ev.stopPropagation();
      abrirModal(midia.tagName === "IFRAME" ? "iframe" : "img", midia);
      return;
    }
    var sel = alvo.closest("[data-edita-select]");
    if (sel) { ev.preventDefault(); ev.stopPropagation(); abrirModal("select", sel); return; }

    var campo = alvo.closest("[data-edita-ph]");
    if (campo) { ev.preventDefault(); ev.stopPropagation(); abrirModal("ph", campo); return; }

    if (alvo.closest("a[href], button")) ev.preventDefault();   /* nada navega durante a edição */
  }, true);

  document.addEventListener("keydown", function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && String(ev.key).toLowerCase() === "e") {
      ev.preventDefault();
      MODO ? sairModo() : entrarModo();
      return;
    }
    if (ev.key === "Escape") {
      if (!$("#editor-modal").hidden) fecharModal();
      else if (MODO) sairModo();
    }
  });

  window.addEventListener("pagehide", function () {
    clearTimeout(relogioSalvar);
  });

  /* ---------------------------------------------------------- inicializar */
  function iniciar() {
    restaurarEdicoes();
    criarUI();

    var ativo = false;
    try { ativo = localStorage.getItem(CHAVE_ATIVO) === "1"; } catch (e) {}
    var local = location.protocol === "file:" ||
                /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

    if (/[?&]editar=1(&|$)/.test(location.search)) entrarModo();
    else if (ativo || local) $("#editor-abrir").hidden = false;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
