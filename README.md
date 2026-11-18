# Clínica Grajaú — Clínica Veterinária (site institucional)

Site institucional completo para a **Clínica Veterinária Grajaú**, em **HTML/CSS/JS puro** — sem build, sem dependências. Basta abrir no navegador ou servir qualquer pasta estática.

> **Dados:** endereço (Av. Dona Belmira Marin, 1920 — Grajaú, São Paulo/SP, 04846-000), telefone ((11) 5929-1545), horários (seg–sáb 10h–20h, dom 12h–15h) e nota (4,1 · 299 avaliações) conforme o **Google Maps**. Fotos e demais textos da equipe são ilustrativos; e-mail é de demonstração.

## Estrutura

```
index.html          Início (hero, serviços, equipe, depoimentos, CTA, mapa)
sobre.html          A clínica (editorial + estrutura)
servicos.html       Lista dos 9 serviços
servico-*.html      9 páginas individuais de serviço (geradas)
equipe.html         Nossa equipe
blog.html           Blog com filtro por categoria (4 artigos)
artigo-*.html       4 páginas de artigo (geradas)
contato.html        Contato, formulário validado e mapa
privacidade.html    Política de privacidade (LGPD)
robots.txt          Regras de rastreamento
sitemap.xml         Mapa do site (gerado)
assets/css/style.css
assets/js/config.js ← fonte única de dados editáveis
assets/js/main.js   comportamento, animações, validação
assets/js/editor.js editor visual na página (textos e imagens editáveis)
assets/img/         fotos + SVGs (favicon, pata)
build.ps1           gerador das páginas estáticas
build/              base, dados e templates do gerador
```

## Como rodar

Duplo clique em `index.html` funciona, mas o ideal é servir a pasta:

```powershell
# opção simples (PowerShell)
python -m http.server 8777     # ou qualquer servidor estático
```

Depois abra `http://localhost:8777/`.

## Editando os dados da clínica

Tudo que muda com frequência está em **`assets/js/config.js`**:

- nome, nome completo, telefone, e-mail
- endereço (linhas, busca para o Google Maps)
- horários de funcionamento
- links de redes sociais (Google Maps aponta para o perfil real)
- nota de avaliação no Google
- embed do mapa do Google

O JavaScript aplica esses valores em todos os páginas automaticamente (links `data-zap`, `data-tel`, `data-maps`, textos `data-campo`, etc).

## Editando conteúdo das páginas

- **Páginas fixas** (início, sobre, serviços, equipe, blog, contato, privacidade): edite o corpo em `build/conteudo/*.html` e rode o gerador.
- **Serviços e artigos**: edite `build/dados.json` (slug, título, resumo, imagem, corpo, itens) e rode o gerador.

## Editando na própria página (editor visual)

O site inclui um editor visual embutido (`assets/js/editor.js`) que deixa **todos os textos e imagens editáveis direto no navegador**, sem servidor e sem rodar o gerador.

**Como ativar**

- abra qualquer página com `?editar=1` — ex.: `http://localhost:8777/index.html?editar=1`
- ou pressione `Ctrl`+`E` em qualquer página
- ou clique no botão **✎ Editar site** (canto inferior esquerdo). Ele aparece automaticamente no seu navegador depois da primeira ativação e sempre em `localhost`/`file:`; visitantes normais não o veem.

**O que dá para editar**

- **Textos**: clique no texto e digite (títulos, parágrafos, botões, links do menu e do rodapé, depoimentos, etc). O texto fica com um contorno tracejado para você ver o que é editável.
- **Imagens**: clique na foto para trocar o `src` (URL ou caminho do projeto) e o texto alternativo (`alt`). Uma lista suspensa sugere as fotos que já existem em `assets/img/`.
- **Mapa incorporado**: clique no iframe para trocar a URL do Google Maps.
- **Placeholders do formulário**: clique no campo (em modo de edição) para editar o texto de apoio.
- **Opções de menus suspensos**: clique no `<select>` para renomear cada opção.

**Salvamento e portabilidade**

- Tudo é salvo automaticamente no `localStorage` deste navegador, por página.
- **Exportar JSON** gera um arquivo `edicoes-anvet.json` para levar as alterações a outra máquina; **Importar JSON** carrega de volta.
- **Desfazer esta página** remove as alterações da página atual; **Limpar tudo** restaura o site inteiro.
- **Esc** sai do modo de edição (ou `Ctrl`+`E` de novo).

**Importante**

- As edições ficam **apenas no seu navegador** — elas não alteram os arquivos publicados. Para mudar o site de verdade (para todos), edite `build/conteudo/*.html`, `build/dados.json` ou `config.js` e rode o gerador.
- As edições têm prioridade sobre o `config.js` e sobre o HTML gerado; "Limpar tudo" devolve o comportamento original.
- Em modo de edição os links não navegam e o formulário não envia — é só para editar. Visite a página normalmente (sem `?editar=1`) para testar.

## Regenerando as páginas

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File build.ps1
```

Isso regrava as 20 páginas + `sitemap.xml` a partir de `build/base.html` (cabeçalho/rodapé únicos) e `build/conteudo/`.

## Animações

- Fade-up / scale / stagger via IntersectionObserver (`.reveal`)
- Parallax leve nas formas decorativas (`data-parallax`)
- Microinterações 200–700 ms em botões e cards
- Tudo desativado quando o sistema pede **reduzir movimento** (`prefers-reduced-motion`)

## Acessibilidade e SEO

- HTML semântico, skip-link, `aria-*`, foco visível, contraste AA
- JSON-LD (`VeterinaryCare`, `Service`, `Article`), Open Graph, canonical, robots
- `sitemap.xml` + `robots.txt`
- Formulário com validação em português, honeypot anti-spam e consentimento LGPD

## Botões de contato

Todos os CTAs usam o atributo `data-zap` e são preenchidos pelo `config.js`. Como `whatsapp` está vazio, eles viram links `tel:+551159291545` (ligação direta para o fixo) e o botão flutuante vira "Ligar agora". Para reativar o WhatsApp, basta preencher `whatsapp: "5511999999999"` em `config.js`.

## Domínio

O domínio usado em `canonical`, `sitemap.xml`, `robots.txt` e JSON-LD é `https://www.clinicavetgrajau.com.br` (placeholder) — ajuste `$dominio` no topo de `build.ps1` antes de publicar.

## Git e publicação

- Repositório: **https://github.com/jrsanuncios-cyber/siteanvet** (branch `main`).
- O Git foi instalado via `winget`. Em um terminal novo ele já está no PATH; em sessões antigas use `C:\Program Files\Git\cmd\git.exe` ou adicione ao PATH.
- Para enviar alterações:
  ```powershell
  git add .
  git commit -m "descricao do que mudou"
  git push
  ```
- Identidade usada nos commits: `jrsanuncios-cyber <jrsanuncios-cyber@users.noreply.github.com>` (troque com `git config user.name` / `user.email`).
- O site é 100% estático: para publicar, aponte o servidor/hospedagem para a pasta do projeto ou use o **GitHub Pages** (Settings → Pages → branch `main`). Todos os links e assets são relativos, então funciona em subcaminho — mas lembre de ajustar `$dominio` no `build.ps1` se o endereço final for outro.

## Imagens

Fotos do Wikimedia Commons (licenças livres), otimizadas para ≤1600px. Ao trocar por fotos próprias, mantenha os nomes ou atualize os `src`/`alt` em `build/conteudo/` e `build/dados.json`.
