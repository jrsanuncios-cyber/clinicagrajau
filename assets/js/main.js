/* =========================================================================
   Anvet — comportamento do site
   Header, menu, animações de entrada, parallax, carrossel, formulário
   ========================================================================= */
(function () {
  "use strict";

  var cfg = window.VET_CONFIG || {};
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Dados da clínica aplicados à página (config.js é a fonte única)
     ------------------------------------------------------------------ */
  function campo(caminho) {
    return caminho.split(".").reduce(function (obj, chave) {
      return obj == null ? undefined : obj[chave];
    }, cfg);
  }

  function urlZap(mensagem) {
    /* sem WhatsApp publicado: todos os CTAs ligam direto para o fixo */
    if (!cfg.whatsapp) return "tel:" + (cfg.telefoneLink || "");
    var texto = mensagem || cfg.mensagemZap || "Olá!";
    return "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(texto);
  }

  function aplicarConfiguracao() {
    if (!window.VET_CONFIG) return;

    $$("a[data-zap]").forEach(function (a) {
      var destino = urlZap(a.getAttribute("data-zap"));
      a.href = destino;
      if (destino.indexOf("tel:") === 0) {
        a.removeAttribute("target");
        a.removeAttribute("rel");
        /* rótulo só quando o botão não tem texto visível (ícone apenas) */
        if (!a.getAttribute("aria-label") && !a.textContent.trim()) a.setAttribute("aria-label", "Ligar para " + (cfg.nomeCompleto || "a clínica"));
      } else if (!a.hasAttribute("target")) {
        a.rel = "noopener";
      }
    });

    $$("a[data-tel]").forEach(function (a) {
      if (cfg.telefoneLink) a.href = "tel:" + cfg.telefoneLink;
    });

    $$("a[data-maps]").forEach(function (a) {
      a.href = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent((cfg.endereco && cfg.endereco.busca) || "");
    });

    $$("iframe[data-mapa]").forEach(function (f) {
      if (cfg.mapaEmbed && f.getAttribute("src") !== cfg.mapaEmbed) f.setAttribute("src", cfg.mapaEmbed);
    });

    $$("[data-campo]").forEach(function (el) {
      var valor = campo(el.getAttribute("data-campo"));
      if (valor != null && valor !== "") el.textContent = valor;
    });

    $$("[data-clinica-nome]").forEach(function (el) {
      if (cfg.nomeCompleto) el.textContent = cfg.nomeCompleto;
    });

    $$("a[data-mail]").forEach(function (a) {
      if (cfg.email) {
        a.href = "mailto:" + cfg.email;
        if (!a.getAttribute("data-sem-texto")) a.textContent = cfg.email;
      }
    });

    $$("a[data-rede]").forEach(function (a) {
      var url = cfg.redes && cfg.redes[a.getAttribute("data-rede")];
      if (url) a.href = url;
    });

    var lista = $("[data-horarios]");
    if (lista && cfg.horarios && cfg.horarios.length) {
      lista.innerHTML = cfg.horarios.map(function (h) {
        return "<li><span>" + h.dia + "</span><strong>" + h.hora + "</strong></li>";
      }).join("");
    }

    $$("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------
     2. Header fixo ao rolar
     ------------------------------------------------------------------ */
  function iniciarHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var pendente = false;
    function atualizar() {
      header.classList.toggle("is-stuck", window.scrollY > 24);
      pendente = false;
    }
    atualizar();
    window.addEventListener("scroll", function () {
      if (!pendente) { pendente = true; window.requestAnimationFrame(atualizar); }
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. Menu mobile
     ------------------------------------------------------------------ */
  function iniciarMenu() {
    var botao = $("[data-menu]");
    var nav = $("[data-nav]");
    if (!botao || !nav) return;

    function alternar(abrir) {
      var aberto = typeof abrir === "boolean" ? abrir : !document.body.classList.contains("nav-aberta");
      document.body.classList.toggle("nav-aberta", aberto);
      botao.setAttribute("aria-expanded", String(aberto));
      botao.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    }

    botao.addEventListener("click", function () { alternar(); });
    $$(".nav-link, .nav .btn", nav).forEach(function (link) {
      link.addEventListener("click", function () { alternar(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-aberta")) {
        alternar(false);
        botao.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) alternar(false);
    });
  }

  /* ------------------------------------------------------------------
     4. Animações de entrada (revelação ao rolar)
     ------------------------------------------------------------------ */
  function iniciarRevelacoes() {
    var elementos = $$(".reveal");
    if (!elementos.length) return;

    // escalona automaticamente itens dentro de um mesmo grupo
    $$("[data-sequencia]").forEach(function (grupo) {
      $$(".reveal", grupo).forEach(function (item, i) {
        if (!item.style.getPropertyValue("--atraso")) {
          item.style.setProperty("--atraso", (i * 90) + "ms");
        }
      });
    });

    if (movimentoReduzido || !("IntersectionObserver" in window)) {
      elementos.forEach(function (el) { el.classList.add("is-visivel"); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visivel");
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });

    elementos.forEach(function (el) { obs.observe(el); });
  }

  /* ------------------------------------------------------------------
     5. Parallax discreto de formas decorativas
     ------------------------------------------------------------------ */
  function iniciarParallax() {
    if (movimentoReduzido) return;
    var itens = $$("[data-parallax]");
    if (!itens.length) return;
    var pendente = false;

    function mover() {
      var altura = window.innerHeight;
      itens.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > altura + 200) return;
        var velocidade = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var centro = rect.top + rect.height / 2 - altura / 2;
        el.style.transform = "translate3d(0," + (centro * velocidade * -1).toFixed(1) + "px,0)";
      });
      pendente = false;
    }

    window.addEventListener("scroll", function () {
      if (!pendente) { pendente = true; window.requestAnimationFrame(mover); }
    }, { passive: true });
    mover();
  }

  /* ------------------------------------------------------------------
     6. Carrossel de depoimentos
     ------------------------------------------------------------------ */
  function iniciarCarrossel() {
    var carrossel = $("[data-carrossel]");
    if (!carrossel) return;
    var trilha = $("[data-trilha]", carrossel);
    var slides = $$(".depoimento", trilha);
    var anterior = $("[data-ant]", carrossel);
    var proximo = $("[data-prox]", carrossel);
    var pontos = $("[data-pontos]", carrossel);
    if (!slides.length) return;

    var indice = 0;
    var temporizador = null;

    var botoes = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "carrossel-ponto";
      b.setAttribute("aria-label", "Ir para o depoimento " + (i + 1));
      b.addEventListener("click", function () { mostrar(i); reiniciar(); });
      pontos.appendChild(b);
      return b;
    });

    function mostrar(i) {
      indice = (i + slides.length) % slides.length;
      trilha.style.transform = "translateX(" + (-indice * 100) + "%)";
      slides.forEach(function (s, n) {
        s.setAttribute("aria-hidden", String(n !== indice));
      });
      botoes.forEach(function (b, n) {
        b.setAttribute("aria-current", String(n === indice));
      });
    }

    function proximoPasso() { mostrar(indice + 1); }

    function reiniciar() {
      if (temporizador) clearInterval(temporizador);
      if (!movimentoReduzido) temporizador = setInterval(proximoPasso, 7000);
    }

    anterior.addEventListener("click", function () { mostrar(indice - 1); reiniciar(); });
    proximo.addEventListener("click", function () { mostrar(indice + 1); reiniciar(); });

    carrossel.addEventListener("mouseenter", function () { if (temporizador) clearInterval(temporizador); });
    carrossel.addEventListener("mouseleave", reiniciar);
    carrossel.addEventListener("focusin", function () { if (temporizador) clearInterval(temporizador); });
    carrossel.addEventListener("focusout", reiniciar);
    carrossel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { mostrar(indice - 1); reiniciar(); }
      if (e.key === "ArrowRight") { mostrar(indice + 1); reiniciar(); }
    });

    mostrar(0);
    reiniciar();
  }

  /* ------------------------------------------------------------------
     7. Máscara simples de telefone
     ------------------------------------------------------------------ */
  function mascaraTelefone(entrada) {
    entrada.addEventListener("input", function () {
      var v = entrada.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6) {
        entrada.value = "(" + v.slice(0, 2) + ") " + v.slice(2, v.length - 4) + "-" + v.slice(-4);
      } else if (v.length > 2) {
        entrada.value = "(" + v.slice(0, 2) + ") " + v.slice(2);
      } else if (v.length) {
        entrada.value = "(" + v;
      } else {
        entrada.value = "";
      }
    });
  }

  /* ------------------------------------------------------------------
     8. Formulário de contato: validação e feedback
     ------------------------------------------------------------------ */
  function iniciarFormulario() {
    var form = $("[data-form]");
    if (!form) return;
    var status = $("[data-status]", form);
    var campos = $$("input, select, textarea", form).filter(function (c) { return c.type !== "hidden"; });

    function erroDe(campo) {
      return document.getElementById(campo.id + "-erro");
    }

    function validar(campo) {
      var valor = (campo.value || "").trim();
      var msg = "";

      if (campo.type === "checkbox") {
        if (campo.hasAttribute("required") && !campo.checked) {
          msg = "Marque esta opção para continuar.";
        }
      } else if (campo.hasAttribute("required") && !valor) {
        msg = "Preencha este campo.";
      } else if (valor && campo.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)) {
        msg = "Informe um e-mail válido.";
      } else if (valor && campo.dataset.tipo === "telefone" && valor.replace(/\D/g, "").length < 10) {
        msg = "Informe um telefone com DDD.";
      } else if (valor && campo.dataset.tipo === "texto" && valor.length < 3) {
        msg = "Escreva um pouco mais.";
      }

      var alvo = erroDe(campo);
      if (alvo) alvo.textContent = msg;
      campo.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    }

    campos.forEach(function (campo) {
      if (campo.dataset.tipo === "telefone") mascaraTelefone(campo);
      campo.addEventListener("blur", function () { if (campo.value || campo.type === "checkbox") validar(campo); });
      campo.addEventListener("input", function () {
        if (campo.getAttribute("aria-invalid") === "true") validar(campo);
      });
      if (campo.type === "checkbox") {
        campo.addEventListener("change", function () { validar(campo); });
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // proteção contra spam: campo invisível que só robôs preenchem
      if (form.querySelector("[name='site']").value) return;

      var valido = campos.map(validar).every(function (v) { return v; });
      if (!valido) {
        var primeiro = campos.filter(function (c) { return c.getAttribute("aria-invalid") === "true"; })[0];
        if (primeiro) primeiro.focus();
        return;
      }

      /* Sem servidor: simulamos o envio.
         Para enviar de verdade, troque o bloco abaixo por uma chamada
         fetch()/XMLHttpRequest para seu backend ou serviço de formulários. */
      if (status) {
        status.textContent = "Mensagem enviada com sucesso! Nossa equipe responde em até 1 dia útil. " +
          "Se preferir, ligue agora: " + (cfg.telefone || "") + ".";
        status.classList.add("is-visivel");
        status.setAttribute("role", "status");
      }
      form.reset();
      campos.forEach(function (c) { c.setAttribute("aria-invalid", "false"); });
      var botao = form.querySelector("[type='submit']");
      if (botao) {
        var original = botao.querySelector("[data-rotulo]") || botao;
        if (original.hasAttribute("data-rotulo")) {
          original.textContent = "Enviado!";
          setTimeout(function () { original.textContent = "Enviar mensagem"; }, 2600);
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     9. Blog: filtro por categoria
     ------------------------------------------------------------------ */
  function iniciarFiltroBlog() {
    var botoes = $$("[data-filtro]");
    var posts = $$("[data-categoria]");
    var vazio = $("[data-vazio]");
    if (!botoes.length || !posts.length) return;

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        var alvo = botao.getAttribute("data-filtro");
        var visiveis = 0;

        botoes.forEach(function (b) {
          var ativo = b === botao;
          b.setAttribute("aria-pressed", ativo ? "true" : "false");
          b.classList.toggle("btn--primario", ativo);
          b.classList.toggle("btn--contorno", !ativo);
        });

        posts.forEach(function (post) {
          var combina = alvo === "todos" || post.getAttribute("data-categoria") === alvo;
          post.hidden = !combina;
          if (combina) {
            visiveis++;
            post.classList.add("is-visivel");
          }
        });

        if (vazio) vazio.hidden = visiveis > 0;
      });
    });
  }

  /* ------------------------------------------------------------------
     10. Inicialização
     ------------------------------------------------------------------ */
  function iniciar() {
    aplicarConfiguracao();
    iniciarHeader();
    iniciarMenu();
    iniciarRevelacoes();
    iniciarParallax();
    iniciarCarrossel();
    iniciarFormulario();
    iniciarFiltroBlog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
