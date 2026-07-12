import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { feature } from "topojson-client";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const read = file => fs.readFileSync(path.join(dist, file), "utf8");

test("gera oito capítulos estáticos com a tese editorial", () => {
  const expected = [
    ["index.html", /O Brasil que/],
    ["explorador/index.html", /Explore os extremos/],
    ["territorio/index.html", /O CEP da/],
    ["raca/index.html", /Propriedade/],
    ["estrutura/index.html", /Capital escolhe/],
    ["vinculos/index.html", /Quem recebe/],
    ["leituras/index.html", /Média não/],
    ["metodo/index.html", /Como não/],
  ];
  for (const [file, pattern] of expected) {
    assert.ok(fs.existsSync(path.join(dist, file)), file);
    const html = read(file);
    assert.match(html, pattern, file);
    assert.match(html, /Painel de Perfil dos Declarantes do IRPF/, `${file}: fonte visível`);
    assert.match(html, /app\.powerbi\.com\/view/, `${file}: link para a fonte`);
    assert.match(html, /[>.]Explorador</, `${file}: explorador na navegação`);
  }
});

test("contrasta média, escala e alegações sem espantalhos", () => {
  const html = read("leituras/index.html");
  assert.match(html, /Quem lidera a média/);
  assert.match(html, /Cartório não é/);
  assert.match(html, /cerca de 56%/);
  assert.match(html, /atualizado pela Selic/);
  assert.match(html, /Fora desta base/);
  assert.match(html, /Não demonstrado/);
  assert.match(html, /Outliers interseccionais/);
  assert.match(html, /ferramenta própria/);
  assert.match(html, /href="\.\.\/explorador\//);
});

test("ranqueia conjuntamente as 16 combinações de granularidade", () => {
  const data = JSON.parse(read("data/deep-analysis.json"));
  assert.equal(data.outliers.threshold, 100);
  const universe = data.outliers.universe;
  assert.equal(universe.eligible, 223857);
  assert.equal(universe.profiles.length, 16);
  for (const key of ["income_top", "income_bottom", "wealth_top", "wealth_bottom"]) {
    assert.equal(universe[key].length, 200);
    assert.ok(universe[key].every(row => row.declarantes >= 100));
  }
  assert.ok(universe.wealth_bottom.every(row => row.wealth_average >= 0));
  const leader = universe.income_top[0];
  assert.equal(leader.occupation, "Titular de Cartório");
  assert.equal(leader.race, "Branca");
  assert.equal(leader.municipality, "São Paulo");
  assert.equal(leader.profile, "city_race");
  assert.equal(leader.declarantes, 139);
  assert.equal(leader.income_average, 11629194.6);
});

test("oferece rankings extensos com rolagem interna acessível", () => {
  const html = read("explorador/index.html");
  const runtime = fs.readdirSync(path.join(dist, "assets"))
    .filter(name => name.endsWith(".js"))
    .map(name => read(path.join("assets", name))).join("\n");
  assert.match(html, /posição global/);
  assert.match(html, /Pesquisar segmentos/);
  assert.match(runtime, /outlier-scroll/);
  assert.match(runtime, /tabindex="0"/);
  assert.match(runtime, /role="region"/);
  assert.match(runtime, /outlier-universe\.json\.gz/);
  assert.match(runtime, /DecompressionStream/);
});

test("dá centralidade ao explorador sem transformar a home em painel", () => {
  const home = read("index.html");
  const readings = read("leituras/index.html");
  const explorer = read("explorador/index.html");
  assert.match(home, /Novo instrumento central/);
  assert.match(home, /223\.857/);
  assert.match(home, /href="\.\/explorador\//);
  assert.doesNotMatch(home, /id="segment-outliers"/);
  assert.doesNotMatch(readings, /id="segment-outliers"/);
  assert.match(explorer, /id="segment-outliers"/);
  assert.match(explorer, /Agregações se sobrepõem/);
  assert.doesNotMatch(explorer, /inner-hero|class="lede/);
  assert.match(explorer, /explorer-workbench explorer-first/);
});

test("serializa busca e perfil na URL para compartilhamento", () => {
  const html = read("explorador/index.html");
  const runtime = fs.readdirSync(path.join(dist, "assets"))
    .filter(name => name.endsWith(".js"))
    .map(name => read(path.join("assets", name))).join("\n");
  const source = fs.readFileSync(path.join(root, "src/site.js"), "utf8");
  assert.match(html, /id="copy-explorer-link"/);
  assert.match(runtime, /URLSearchParams/);
  assert.match(runtime, /history\.replaceState/);
  assert.match(source, /searchParams\.set\("q"/);
  assert.match(source, /searchParams\.set\("perfil"/);
  assert.match(runtime, /navigator\.clipboard/);
});

test("indexa o universo completo em gzip com posições globais", () => {
  const compressed = fs.readFileSync(path.join(dist, "data/outlier-universe.json.gz"));
  const index = JSON.parse(gunzipSync(compressed).toString("utf8"));
  assert.equal(index.threshold, 100);
  assert.equal(index.profiles.length, 16);
  assert.equal(index.segments.length, 223857);
  assert.ok(index.segments.every(row => row.income_rank && row.wealth_rank));
  assert.equal(index.segments.reduce((minimum, row) => Math.min(minimum, row.income_rank), Infinity), 1);
  assert.equal(index.segments.reduce((maximum, row) => Math.max(maximum, row.income_rank), 0), index.segments.length);
  const beloHorizonte = index.segments.filter(row => row.municipality === "Belo Horizonte" && row.gender === "Masculino");
  assert.ok(beloHorizonte.length > 0);
  const notary80 = index.segments.find(row => row.profile === "age_gender_race" && row.occupation === "Titular de Cartório" && row.gender === "Masculino" && row.race === "Branca" && row.age === "80 anos ou mais");
  assert.equal(notary80.income_rank, 3);
  assert.equal(notary80.income_average, 6817923.54);
});

test("recalibra a tipografia sem extremos ilegíveis ou monumentais", () => {
  const css = fs.readdirSync(path.join(dist, "assets"))
    .filter(name => name.endsWith(".css"))
    .map(name => read(path.join("assets", name))).join("\n");
  assert.doesNotMatch(css, /font-size:(?:[0-9]|1[01])px/);
  assert.doesNotMatch(css, /148px/);
  assert.match(css, /104px/);
});

test("reconcilia os vínculos e preserva a categoria financeira mista", () => {
  const data = JSON.parse(read("data/deep-analysis.json"));
  for (const year of [2025, 2026]) {
    const overview = data.overview.find(row => row.exercicio === year);
    const groups = data.employment_groups.filter(row => row.exercicio === year);
    const natures = data.employment_nature.filter(row => row.exercicio === year);
    assert.equal(groups.length, 9);
    assert.equal(natures.length, 23);
    assert.equal(groups.reduce((sum, row) => sum + row.declarantes, 0), overview.declarantes);
    assert.ok(groups.some(row => row.group === "Financeiro público/privado" && row.codes.length === 1 && row.codes[0] === "02"));
  }
  const groups2026 = data.employment_groups.filter(row => row.exercicio === 2026);
  const publicSector = groups2026.find(row => row.group === "Setor público");
  const privateSector = groups2026.find(row => row.group === "Assalariado privado");
  const owners = groups2026.find(row => row.group === "Proprietário ou capitalista");
  assert.ok(publicSector.renda / publicSector.declarantes > privateSector.renda / privateSector.declarantes);
  assert.ok(owners.patrimonio / owners.declarantes > 6 * (publicSector.patrimonio / publicSector.declarantes));
});

test("explicita a discrepância sem inventar uma causa", () => {
  const home = read("index.html");
  const method = read("metodo/index.html");
  assert.match(home, /Não existe, a priori, uma explicação documentada/);
  assert.match(home, /Não sabemos por quê/);
  assert.match(method, /Não encontramos nota técnica que reconcilie os universos/);
  assert.match(method, /43\.344\.108/);
  assert.match(method, /44\.393\.571/);
});

test("usa o favicon de leão editorial em todos os capítulos", () => {
  assert.ok(fs.existsSync(path.join(dist, "favicon-lion-v2.png")));
  for (const file of ["index.html", "explorador/index.html", "territorio/index.html", "raca/index.html", "estrutura/index.html", "vinculos/index.html", "leituras/index.html", "metodo/index.html"]) {
    const html = read(file);
    assert.match(html, /rel="icon" type="image\/png"/);
    assert.match(html, /favicon-lion-v2\.png/);
    assert.match(html, /name="theme-color" content="#123f31"/);
  }
});

test("não contém vestígios de hospedagem Sites nem dependências externas em runtime", () => {
  assert.equal(fs.existsSync(path.join(root, ".openai", "hosting.json")), false);
  const runtime = fs.readdirSync(path.join(dist, "assets"))
    .filter(name => /\.(js|css)$/.test(name))
    .map(name => read(path.join("assets", name))).join("\n");
  assert.doesNotMatch(runtime, /chatgpt\.site|fonts\.googleapis|unpkg\.com|cdn\.jsdelivr|esm\.sh/);
});

test("reconcilia anos, municípios, população e limiares do recorte racial", () => {
  const data = JSON.parse(read("data/deep-analysis.json"));
  assert.deepEqual(data.overview.map(row => row.exercicio), [2025, 2026]);
  assert.equal(data.cities.filter(row => row.exercicio === 2025).length, 5570);
  assert.equal(data.cities.filter(row => row.exercicio === 2026).length, 5571);
  assert.ok(data.municipal_race.length >= 500);
  for (const row of data.municipal_race) {
    assert.ok(row.white_n >= 1000);
    assert.ok(row.black_n >= 1000);
    assert.ok(row.missing_share <= 0.60);
  }
  assert.ok(data.official_declarations["2026_deadline"] > data.official_declarations["2025_deadline"]);
  assert.ok(data.overview[1].declarantes < data.overview[0].declarantes);
  for (const year of [2025, 2026]) {
    const overview = data.overview.find(row => row.exercicio === year);
    const variable = data.variable_income.filter(row => row.exercicio === year);
    assert.equal(variable.reduce((sum, row) => sum + row.declarantes, 0), overview.declarantes);
  }
});

test("todo município analisado possui geometria oficial no mapa", () => {
  const data = JSON.parse(read("data/deep-analysis.json"));
  const topo = JSON.parse(read("data/municipalities.topo.json"));
  const object = topo.objects[Object.keys(topo.objects)[0]];
  const ids = new Set(feature(topo, object).features.map(item => String(item.id)));
  const missing = [...new Set(data.cities.map(row => row.ibge))].filter(code => !ids.has(code));
  assert.deepEqual(missing, []);
});
