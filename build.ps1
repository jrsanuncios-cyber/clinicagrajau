# build.ps1 — gera as páginas estáticas a partir de build/base.html e build/conteudo/
# Uso: powershell.exe -NoProfile -ExecutionPolicy Bypass -File build.ps1

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $raiz) { $raiz = (Get-Location).Path }
$build = Join-Path $raiz 'build'

$base      = Get-Content -Raw -Encoding UTF8 (Join-Path $build 'base.html')
$dados     = Get-Content -Raw -Encoding UTF8 (Join-Path $build 'dados.json') | ConvertFrom-Json
$tplServ   = Get-Content -Raw -Encoding UTF8 (Join-Path $build 'tpl-servico.html')
$tplArt    = Get-Content -Raw -Encoding UTF8 (Join-Path $build 'tpl-artigo.html')
$conteudo  = Join-Path $build 'conteudo'

$dominio   = 'https://www.anvet.com.br'   # ajuste para o domínio final do site
$ano       = Get-Date -Format 'yyyy-MM-dd'

# ---------- JSON-LD do site (home) ----------
$ldSite = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VeterinaryCare",
  "name": "Clínica Veterinária Anvet",
  "description": "Clínica veterinária completa para cães e gatos em São Paulo: consultas, vacinação, exames, cirurgias e cuidado especializado.",
  "url": "$dominio/",
  "telephone": "+551159398706",
  "email": "contato@anvet.com.br",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Av. Dona Belmira Marin, 1801 - Parque Brasil",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "04846-010",
    "addressCountry": "BR"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": -23.7453835, "longitude": -46.6891857 },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], "opens": "09:00", "closes": "18:00" }
  ],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.5", "reviewCount": "899" },
  "sameAs": ["https://www.google.com/maps/place/Cl%C3%ADnica+Veterin%C3%A1ria+Anvet/@-23.7453835,-46.6891857,17z/data=!4m6!3m5!1s0x94ce4f4760488167:0x955659beb9cc203b!8m2!3d-23.7453835!4d-46.6891857!16s%2Fg%2F1ptylqh5q"]
}
</script>
"@

# ---------- helpers ----------
function Montar-Ativo([string]$ativo) {
    $m = @{
        'inicio'   = 'ATIVO-INICIO'
        'sobre'    = 'ATIVO-SOBRE'
        'servicos' = 'ATIVO-SERVICOS'
        'equipe'   = 'ATIVO-EQUIPE'
        'blog'     = 'ATIVO-BLOG'
        'contato'  = 'ATIVO-CONTATO'
    }
    $out = $base
    foreach ($k in $m.Keys) {
        $val = if ($k -eq $ativo) { 'class="nav-link ativo" aria-current="page"' } else { 'class="nav-link"' }
        $out = $out.Replace("{{" + $m[$k] + "}}", $val)
    }
    return $out
}

function Montar-Pagina {
    param(
        [string]$arquivo,
        [string]$titulo,
        [string]$descricao,
        [string]$ativo,
        [string]$conteudo,
        [string]$ld = '',
        [string]$ogImagem = 'assets/img/hero-cachorro.jpg',
        [string]$robots = 'index, follow'
    )
    $html = Montar-Ativo $ativo
    $html = $html.Replace('{{TITULO}}',      $titulo)
    $html = $html.Replace('{{DESCRICAO}}',    $descricao)
    $html = $html.Replace('{{OG-TITULO}}',    $titulo)
    $html = $html.Replace('{{OG-DESCRICAO}}', $descricao)
    $html = $html.Replace('{{OG-IMAGEM}}',    "$dominio/$ogImagem")
    $html = $html.Replace('{{ARQUIVO}}',      "$dominio/$arquivo")
    $html = $html.Replace('{{ROBOTS}}',       $robots)
    $html = $html.Replace('{{LD}}',           $ld)
    $html = $html.Replace('{{CONTEUDO}}',     $conteudo)
    $caminho = Join-Path $raiz $arquivo
    Set-Content -Path $caminho -Value $html -Encoding UTF8 -NoNewline
    Write-Host "  + $arquivo"
}

function Ler-Conteudo([string]$nome) {
    return Get-Content -Raw -Encoding UTF8 (Join-Path $conteudo $nome)
}

# ---------- páginas fixas ----------
Write-Host 'Gerando páginas fixas...'

$ldIndex = $ldSite
$ldPadrao = ''

Montar-Pagina -arquivo 'index.html' -titulo 'Anvet — Clínica Veterinária completa para cães e gatos em São Paulo' `
    -descricao 'Consultas, vacinas, exames, cirurgias e cuidado especializado para cães e gatos. Cuidado completo, humano e perto de você.' `
    -ativo 'inicio' -conteudo (Ler-Conteudo 'index.html') -ld $ldIndex

Montar-Pagina -arquivo 'sobre.html' -titulo 'Sobre a Anvet — Clínica Veterinária' `
    -descricao 'Conheça a história, a estrutura e a forma de cuidar da Clínica Veterinária Anvet.' `
    -ativo 'sobre' -conteudo (Ler-Conteudo 'sobre.html')

Montar-Pagina -arquivo 'servicos.html' -titulo 'Serviços veterinários — Clínica Veterinária Anvet' `
    -descricao 'Consultas, vacinação, exames laboratoriais, imagem, cirurgias, dermatologia, odontologia, nutrição e banho & tosa.' `
    -ativo 'servicos' -conteudo (Ler-Conteudo 'servicos.html')

Montar-Pagina -arquivo 'equipe.html' -titulo 'Nossa equipe — Clínica Veterinária Anvet' `
    -descricao 'Conheça a equipe da Anvet: médicos veterinários e profissionais dedicados ao cuidado do seu pet.' `
    -ativo 'equipe' -conteudo (Ler-Conteudo 'equipe.html')

Montar-Pagina -arquivo 'blog.html' -titulo 'Blog da Anvet — dicas de saúde e cuidado para o seu pet' `
    -descricao 'Artigos sobre saúde, alimentação, vacinas e comportamento de cães e gatos, escritos pela nossa equipe.' `
    -ativo 'blog' -conteudo (Ler-Conteudo 'blog.html')

Montar-Pagina -arquivo 'contato.html' -titulo 'Contato — Clínica Veterinária Anvet' `
    -descricao 'Fale com a Anvet por telefone, formulário ou venha nos visitar. Estamos na Av. Dona Belmira Marin, 1801, São Paulo - SP.' `
    -ativo 'contato' -conteudo (Ler-Conteudo 'contato.html')

Montar-Pagina -arquivo 'privacidade.html' -titulo 'Política de Privacidade — Clínica Veterinária Anvet' `
    -descricao 'Como a Anvet coleta, usa e protege as informações de você e do seu pet (LGPD).' `
    -ativo '' -conteudo (Ler-Conteudo 'privacidade.html') -robots 'index, follow'

# ---------- páginas de serviço ----------
Write-Host 'Gerando páginas de serviço...'
$urls = @()

foreach ($s in $dados.servicos) {
    $lista = ($s.detalhes | ForEach-Object { "                <li>$_</li>" }) -join "`n"

    $corpo = $s.corpo

    # relacionados: outros 3 serviços
    $relacionados = ''
    $outros = @($dados.servicos | Where-Object { $_.slug -ne $s.slug } | Select-Object -First 3)
    foreach ($r in $outros) {
        $relacionados += @"
      <li class="servico-card reveal">
        <span class="servico-icone"><svg class="ico" width="30" height="30" aria-hidden="true"><use href="#$($r.icone)"></use></svg></span>
        <h3>$($r.titulo)</h3>
        <p>$($r.resumo)</p>
        <a class="link-seta" href="servico-$($r.slug).html">Saiba mais <svg class="ico" width="16" height="16" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>
      </li>
"@
    }

    $conteudo = $tplServ.Replace('{{IMG}}', $s.img).Replace('{{ALT}}', $s.alt)
    $conteudo = $conteudo.Replace('{{TITULO}}', $s.titulo).Replace('{{RESUMO}}', $s.resumo)
    $conteudo = $conteudo.Replace('{{CONTEUDO}}', $corpo)
    $conteudo = $conteudo.Replace('{{LISTA}}', $lista)
    $conteudo = $conteudo.Replace('{{PARAQUEM}}', $s.paraQuem)
    $conteudo = $conteudo.Replace('{{RELACIONADOS}}', $relacionados)

    $resumoEsc = $s.resumo.Replace([char]34, [char]39)

    $ld = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "$($s.titulo)",
  "description": "$resumoEsc",
  "provider": { "@type": "VeterinaryCare", "name": "Clínica Veterinária Anvet", "url": "$dominio/" },
  "areaServed": { "@type": "City", "name": "São Paulo" },
  "serviceType": "$($s.titulo)"
}
</script>
"@

    $pag = "servico-$($s.slug).html"
    Montar-Pagina -arquivo $pag -titulo "$($s.titulo) — Clínica Veterinária Anvet" `
        -descricao ($s.resumo) -ativo 'servicos' -conteudo $conteudo -ld $ld `
        -ogImagem $s.img
    $urls += @{ url = $pag; prio = '0.8'; mudou = $ano }
}

# ---------- páginas de artigo ----------
Write-Host 'Gerando páginas de artigo...'

foreach ($p in $dados.posts) {
    $relacionados = ''
    $outros = @($dados.posts | Where-Object { $_.slug -ne $p.slug } | Select-Object -First 3)
    foreach ($r in $outros) {
        $relacionados += @"
        <article class="post-card reveal">
          <a href="artigo-$($r.slug).html" aria-label="Ler: $($r.titulo)">
            <div class="post-capa">
              <img src="$($r.img)" width="900" height="560" loading="lazy" alt="$($r.alt)">
              <span class="post-categoria">$(if ($r.categoriaNome) { $r.categoriaNome } else { $r.categoria })</span>
            </div>
          </a>
          <div class="post-corpo">
            <p class="post-data"><svg class="ico" width="16" height="16" aria-hidden="true"><use href="#i-calendar"></use></svg> $($r.dataTexto)</p>
            <h3><a href="artigo-$($r.slug).html">$($r.titulo)</a></h3>
            <a class="link-seta" href="artigo-$($r.slug).html">Ler artigo <svg class="ico" width="16" height="16" aria-hidden="true"><use href="#i-arrow-right"></use></svg></a>
          </div>
        </article>
"@
    }

    $conteudo = $tplArt.Replace('{{IMG}}', $p.img).Replace('{{ALT}}', $p.alt)
    $conteudo = $conteudo.Replace('{{TITULO}}', $p.titulo).Replace('{{RESUMO}}', $p.resumo)
    $catNome = if ($p.categoriaNome) { $p.categoriaNome } else { $p.categoria }
    $conteudo = $conteudo.Replace('{{CATEGORIA}}', $catNome)
    $conteudo = $conteudo.Replace('{{DATA-ISO}}', $p.data).Replace('{{DATA-TEXTO}}', $p.dataTexto)
    $conteudo = $conteudo.Replace('{{TEMPO}}', $p.tempo).Replace('{{AUTOR}}', $p.autor)
    $conteudo = $conteudo.Replace('{{CONTEUDO}}', $p.corpo)
    $conteudo = $conteudo.Replace('{{RELACIONADOS}}', $relacionados)

    $resumoEsc = $p.resumo.Replace([char]34, [char]39)

    $ld = @"
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "$($p.titulo)",
  "description": "$resumoEsc",
  "image": "$dominio/$($p.img)",
  "datePublished": "$($p.data)",
  "author": { "@type": "Person", "name": "$($p.autor)" },
  "publisher": { "@type": "Organization", "name": "Clínica Veterinária Anvet" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "$dominio/artigo-$($p.slug).html" }
}
</script>
"@

    $pag = "artigo-$($p.slug).html"
    Montar-Pagina -arquivo $pag -titulo "$($p.titulo) — Blog da Anvet" `
        -descricao ($p.resumo) -ativo 'blog' -conteudo $conteudo -ld $ld -ogImagem $p.img
    $urls += @{ url = $pag; prio = '0.6'; mudou = $p.data }
}

# ---------- sitemap ----------
Write-Host 'Gerando sitemap.xml...'
$fixos = @(
    @{ url = 'index.html'; prio = '1.0'; mudou = $ano },
    @{ url = 'sobre.html'; prio = '0.8'; mudou = $ano },
    @{ url = 'servicos.html'; prio = '0.9'; mudou = $ano },
    @{ url = 'equipe.html'; prio = '0.7'; mudou = $ano },
    @{ url = 'blog.html'; prio = '0.8'; mudou = $ano },
    @{ url = 'contato.html'; prio = '0.8'; mudou = $ano },
    @{ url = 'privacidade.html'; prio = '0.3'; mudou = $ano }
)
$todo = $fixos + $urls
$xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
$($todo | ForEach-Object { "  <url>`n    <loc>$dominio/$($_.url)</loc>`n    <lastmod>$($_.mudou)</lastmod>`n    <priority>$($_.prio)</priority>`n  </url>" } | Out-String)
</urlset>
"@
Set-Content -Path (Join-Path $raiz 'sitemap.xml') -Value $xml -Encoding UTF8 -NoNewline
Write-Host '  + sitemap.xml'

Write-Host ''
Write-Host "Pronto. $($todo.Count) páginas geradas."
