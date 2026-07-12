import "./styles.css";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const root = document.body.dataset.root || "./";
const page = document.body.dataset.page;
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const colors = ["#dfe4d8", "#9dbca9", "#559174", "#1e654d", "#efb84b", "#de6b42"];

const money = value => brl.format(value || 0);
const compactMoney = value => {
  if (value >= 1e12) return `R$ ${num.format(value / 1e12)} tri`;
  if (value >= 1e9) return `R$ ${num.format(value / 1e9)} bi`;
  if (value >= 1e6) return `R$ ${num.format(value / 1e6)} mi`;
  return money(value);
};
const change = (a, b) => b / a - 1;
const realChange = (a, b) => b / 1.0426 / a - 1;
const signed = value => `${value >= 0 ? "+" : ""}${num.format(value * 100)}%`;
const avg = (row, key) => row[key] / row.declarantes;
const byYear = (rows, year) => rows.find(row => row.exercicio === year);
const setLoading = () => document.querySelectorAll(".wide-figure,.region-figure,.data-ledger,.ranking-pair").forEach(el => { if (!el.children.length) el.innerHTML = '<div class="loading">Calculando o retrato…</div>'; });
setLoading();

async function loadData() {
  const response = await fetch(`${root}data/deep-analysis.json`);
  if (!response.ok) throw new Error("Falha ao carregar os agregados");
  return response.json();
}

async function loadExplorerManifest() {
  const response = await fetch(`${root}data/explorer-manifest.json`);
  if (!response.ok) throw new Error("Falha ao carregar o índice do Explorador");
  return response.json();
}

function table(headers, rows) {
  return `<table class="metric-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function barChart(rows, { max, value = row => row.value, format = brl.format, secondary = null } = {}) {
  const ceiling = max || Math.max(...rows.map(value));
  return `<div class="bar-chart">${rows.map(row => {
    const v = value(row);
    const second = secondary ? secondary.value(row) : null;
    return `<div class="chart-row"><label>${row.label}${row.note ? `<small>${row.note}</small>` : ""}</label><div class="${secondary ? "paired-bars" : ""}"><span class="bar-track"><i style="width:${Math.min(100, v / ceiling * 100)}%"></i></span>${secondary ? `<span class="bar-track"><i class="secondary" style="width:${Math.min(100, second / ceiling * 100)}%"></i></span>` : ""}</div><b>${format(v)}${secondary ? `<small>${secondary.format(second)}</small>` : ""}</b></div>`;
  }).join("")}</div>`;
}

function renderHome(data) {
  const a = byYear(data.overview, 2025), b = byYear(data.overview, 2026);
  document.querySelector("#universe-comparison").innerHTML = `
    <div class="ledger-row heading"><span>Contagem</span><span>2025</span><span>2026</span><span>Mudança</span></div>
    <div class="ledger-row"><span>Declarantes no painel</span><b>${num.format(a.declarantes/1e6)} mi</b><b>${num.format(b.declarantes/1e6)} mi</b><em>${signed(change(a.declarantes,b.declarantes))}</em></div>
    <div class="ledger-row"><span>Entregas oficiais no prazo</span><b>${num.format(data.official_declarations["2025_deadline"]/1e6)} mi</b><b>${num.format(data.official_declarations["2026_deadline"]/1e6)} mi</b><em>${signed(change(data.official_declarations["2025_deadline"],data.official_declarations["2026_deadline"]))}</em></div>
    <div class="ledger-row"><span>Diferença painel − entregas</span><b>+${num.format((a.declarantes-data.official_declarations["2025_deadline"])/1e6)} mi</b><b>−${num.format((data.official_declarations["2026_deadline"]-b.declarantes)/1e6)} mi</b><em>universos divergem</em></div>`;

  const popA = data.national_population[2024], popB = data.national_population[2025];
  const rows = [
    ["Declarantes observados", `${num.format(a.declarantes/1e6)} mi`, `${num.format(b.declarantes/1e6)} mi`, `<span class="delta-down">${signed(change(a.declarantes,b.declarantes))}</span>`],
    ["Declarantes / população", pct.format(a.declarantes/popA), pct.format(b.declarantes/popB), `<span class="delta-down">${num.format((b.declarantes/popB-a.declarantes/popA)*100)} p.p.</span>`],
    ["Renda total", compactMoney(a.renda), compactMoney(b.renda), `<span class="delta-up">${signed(realChange(a.renda,b.renda))} real</span>`],
    ["Patrimônio declarado", compactMoney(a.patrimonio), compactMoney(b.patrimonio), `<span class="delta-up">${signed(realChange(a.patrimonio,b.patrimonio))} real</span>`],
    ["Renda média / declarante", money(avg(a,"renda")), money(avg(b,"renda")), `<span class="delta-up">${signed(realChange(avg(a,"renda"),avg(b,"renda")))} real</span>`],
    ["Patrimônio médio / declarante", money(avg(a,"patrimonio")), money(avg(b,"patrimonio")), `<span class="delta-up">${signed(realChange(avg(a,"patrimonio"),avg(b,"patrimonio")))} real</span>`],
  ];
  document.querySelector("#national-ledger").innerHTML = table(["Medida","Exercício 2025","Exercício 2026","Mudança"], rows);

  const regions = data.regions.filter(r => r.exercicio === 2026).sort((x,y)=>y.wealth_per_capita-x.wealth_per_capita);
  document.querySelector("#region-figure").innerHTML = `<div class="region-row region-head"><span>Região</span><span>Patrimônio declarado por habitante</span><span>Valor</span><span>Cobertura</span></div>${regions.map(r=>`<div class="region-row"><h3>${r.name}</h3><span class="bar-track"><i style="width:${r.wealth_per_capita/120000*100}%"></i></span><b>${money(r.wealth_per_capita)}</b><span>${pct.format(r.coverage)}</span></div>`).join("")}`;
  renderTaxFigure(data, "#tax-figure");
}

function renderTaxFigure(data, selector) {
  const rows = data.tax_bands.filter(r=>r.exercicio===2026).map(r=>({label:r.band,value:r.imposto/r.renda,note:`${pct.format(r.renda_tributavel/r.renda)} da renda aparece como tributável`}));
  document.querySelector(selector).innerHTML = `<div class="chart-title"><span>Imposto devido / renda total</span><span>Exercício 2026</span></div>${barChart(rows,{max:.10,format:pct.format})}`;
}

function renderTerritory(data) {
  const eligible = data.cities.filter(r=>r.exercicio===2026 && r.population>=100000 && r.declarantes>=5000);
  const ranking = (title, rows) => `<section><h3>${title}</h3>${rows.map((r,i)=>`<div class="rank-row"><i>${String(i+1).padStart(2,"0")}</i><span>${r.name} · ${r.uf}<small>${pct.format(r.coverage)} da população no painel</small></span><b>${money(r.wealth_per_capita)}</b></div>`).join("")}</section>`;
  document.querySelector("#city-rankings").innerHTML = ranking("Maior patrimônio por habitante", [...eligible].sort((a,b)=>b.wealth_per_capita-a.wealth_per_capita).slice(0,10)) + ranking("Menor patrimônio por habitante", [...eligible].sort((a,b)=>a.wealth_per_capita-b.wealth_per_capita).slice(0,10));
  initMap(data);
}

async function initMap(data) {
  const [topology] = await Promise.all([fetch(`${root}data/municipalities.topo.json`).then(r=>r.json())]);
  const object = topology.objects[Object.keys(topology.objects)[0]];
  const geo = feature(topology, object);
  const features = geo.features;
  const citiesByYear = new Map(data.cities.map(city=>[`${city.ibge}-${city.exercicio}`,city]));
  const yearEl=document.querySelector("#map-year"), metricEl=document.querySelector("#map-metric"), searchEl=document.querySelector("#city-search"), canvas=document.querySelector("#municipal-map"), detail=document.querySelector("#city-detail"), legend=document.querySelector("#map-legend"), list=document.querySelector("#city-list");
  const latest = data.cities.filter(r=>r.exercicio===2026).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  list.innerHTML=latest.map(r=>`<option value="${r.name} · ${r.uf}"></option>`).join("");
  const searchMap=new Map(latest.map(r=>[`${r.name} · ${r.uf}`.toLocaleLowerCase("pt-BR"),r.ibge]));
  let paths=[], selected=null;
  const labels={wealth_per_capita:"Patrimônio por habitante",income_per_capita:"Renda por habitante",coverage:"Declarantes / população",wealth_per_filer:"Patrimônio por declarante"};
  const formatMetric=(metric,value)=>metric==="coverage"?pct.format(value):money(value);

  function bins(metric){
    const values=data.cities.filter(r=>r.declarantes>=100).map(r=>r[metric]).filter(Number.isFinite).sort((a,b)=>a-b);
    return [0,.2,.4,.6,.8,1].map(q=>values[Math.min(values.length-1,Math.floor(q*(values.length-1)))]);
  }
  function colorFor(value,cuts){let idx=cuts.findLastIndex(c=>value>=c);return colors[Math.max(0,Math.min(colors.length-1,idx))];}
  function showCity(code){
    selected=code; const year=Number(yearEl.value), city=citiesByYear.get(`${code}-${year}`);
    if(!city){detail.innerHTML="<p>Sem observação municipal neste exercício.</p>";return;}
    const previous=citiesByYear.get(`${code}-${year===2026?2025:2026}`);
    detail.innerHTML=`<h3>${city.name}</h3><span>${city.uf} · exercício ${year}</span><dl><div><dt>Patrimônio por habitante</dt><dd>${money(city.wealth_per_capita)}</dd></div><div><dt>Renda por habitante</dt><dd>${money(city.income_per_capita)}</dd></div><div><dt>Patrimônio por declarante</dt><dd>${money(city.wealth_per_filer)}</dd></div><div><dt>Cobertura do painel</dt><dd>${pct.format(city.coverage)}</dd></div><div><dt>População usada</dt><dd>${integer.format(city.population)}</dd></div>${previous?`<div><dt>Mudança real patrimônio/hab.</dt><dd>${signed(year===2026?realChange(previous.wealth_per_capita,city.wealth_per_capita):realChange(city.wealth_per_capita,previous.wealth_per_capita))}</dd></div>`:""}</dl>`;
  }
  function draw(){
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
    const projection=geoMercator().fitExtent([[12,12],[rect.width-12,rect.height-44]],geo);const path=geoPath(projection);const metric=metricEl.value,year=Number(yearEl.value),cuts=bins(metric);paths=[];
    features.forEach(f=>{const city=citiesByYear.get(`${f.id}-${year}`), p=new Path2D(path(f));paths.push([p,f.id]);ctx.fillStyle=city?colorFor(city[metric],cuts):"#27443a";ctx.fill(p);ctx.strokeStyle="rgba(16,47,37,.34)";ctx.lineWidth=.25;ctx.stroke(p);if(selected===f.id){ctx.strokeStyle="#fffdf8";ctx.lineWidth=2;ctx.stroke(p);}});
    legend.innerHTML=cuts.map((c,i)=>`<span><i style="background:${colors[i]}"></i>${i===0?"até ":"≥ "}${formatMetric(metric,c)}</span>`).join("");
  }
  canvas.addEventListener("click",event=>{const rect=canvas.getBoundingClientRect(),ctx=canvas.getContext("2d"),x=(event.clientX-rect.left)*(canvas.width/rect.width),y=(event.clientY-rect.top)*(canvas.height/rect.height);const scale=canvas.width/rect.width;ctx.save();ctx.scale(scale,scale);for(let i=paths.length-1;i>=0;i--){if(ctx.isPointInPath(paths[i][0],x/scale,y/scale)){showCity(paths[i][1]);draw();break;}}ctx.restore();});
  searchEl.addEventListener("change",()=>{const code=searchMap.get(searchEl.value.toLocaleLowerCase("pt-BR"));if(code){showCity(code);draw();}});yearEl.addEventListener("change",()=>{if(selected)showCity(selected);draw();});metricEl.addEventListener("change",draw);window.addEventListener("resize",()=>requestAnimationFrame(draw));
  showCity("3550308");draw();
}

function renderRace(data){
  const known=data.race.filter(r=>r.exercicio===2026&&r.race!=="Não Informado"),total=known.reduce((s,r)=>s+r.declarantes,0);const order=["Branca","Parda","Preta","Amarela","Indígena"];
  document.querySelector("#race-composition").innerHTML=`<div class="composition-grid"><div class="comp-head">Cor ou raça</div><div class="comp-head">Censo 2022 · população</div><div class="comp-head">IRPF 2026 · raça conhecida</div>${order.map(label=>{const census=data.census_race_2022[label],ir=known.find(r=>r.race===label)?.declarantes/total||0;return `<div>${label}</div><div>${pct.format(census)}<div class="comp-bar"><i style="width:${census/0.65*100}%"></i></div></div><div>${pct.format(ir)}<div class="comp-bar"><i class="irpf" style="width:${ir/0.65*100}%"></i></div></div>`}).join("")}</div>`;
  const races=order.map(label=>data.race.find(r=>r.exercicio===2026&&r.race===label)).filter(Boolean);const gaps=(key,title)=>`<section><h3>${title}</h3>${races.map(r=>`<div class="gap-row"><div><span>${r.race}</span><b>${money(avg(r,key))}</b></div><span class="bar-track"><i style="width:${avg(r,key)/Math.max(...races.map(x=>avg(x,key)))*100}%"></i></span></div>`).join("")}</section>`;
  document.querySelector("#race-gaps").innerHTML=`<div class="race-gap-grid">${gaps("renda","Renda média")}${gaps("patrimonio","Patrimônio médio")}</div>`;
  renderRaceCities(data);
}

function renderRaceCities(data){
  const host=document.querySelector("#racial-city-table");let rows=[...data.municipal_race].sort((a,b)=>b.wealth_ratio-a.wealth_ratio);host.innerHTML=`<div class="city-race-toolbar"><p class="figure-note">${integer.format(rows.length)} cidades passam pelos critérios</p><input id="race-city-search" placeholder="Filtrar cidade ou UF" aria-label="Filtrar cidades"></div><div id="race-city-rows"></div>`;const target=host.querySelector("#race-city-rows");
  const draw=filter=>{const clean=filter.toLocaleLowerCase("pt-BR");const visible=rows.filter(r=>`${r.name} ${r.uf}`.toLocaleLowerCase("pt-BR").includes(clean)).slice(0,40);target.innerHTML=`<div class="race-city-row"><span>#</span><span>Cidade</span><span>Patrimônio branco</span><span>Patrimônio negro</span><span>Razão</span></div>${visible.map((r,i)=>`<div class="race-city-row"><span>${String(i+1).padStart(2,"0")}</span><span>${r.name} · ${r.uf}<small>${pct.format(r.missing_share)} outra/NI</small></span><span>${money(r.white_wealth)}</span><span>${money(r.black_wealth)}</span><span><b>${num.format(r.wealth_ratio)}×</b></span></div>`).join("")}`};draw("");host.querySelector("input").addEventListener("input",e=>draw(e.target.value));
}

function renderStructure(data){
  renderTaxFigure(data,"#class-tax-figure");
  const order=["até 29 anos","30 a 39 anos","40 a 49 anos","50 a 59 anos","60 a 79 anos","80 anos ou mais"];
  const ages=order.map(label=>data.age.find(r=>r.exercicio===2026&&r.age===label)).filter(Boolean).map(r=>({label:r.age,value:avg(r,"patrimonio"),note:`renda média ${money(avg(r,"renda"))}`}));
  document.querySelector("#age-figure").innerHTML=`<div class="chart-title"><span>Patrimônio médio por faixa etária</span><span>Exercício 2026</span></div>${barChart(ages)}`;
  const occ=data.occupations.filter(r=>r.exercicio===2026&&r.declarantes>=20000).sort((a,b)=>avg(b,"renda")-avg(a,"renda")).slice(0,12).map((r,i)=>[String(i+1).padStart(2,"0"),r.occupation,integer.format(r.declarantes),money(avg(r,"renda")),money(avg(r,"patrimonio"))]);
  document.querySelector("#occupation-table").innerHTML=table(["#","Ocupação principal","Declarantes","Renda média","Patrimônio médio"],occ);
}

const linkageShort = {
  "01":"Empregado do setor privado",
  "02":"Empregado de instituição financeira pública ou privada",
  "03":"Empregado de organismo internacional ou ONG",
  "11":"Profissional liberal ou autônomo",
  "12":"Proprietário de empresa ou empregador",
  "13":"Capitalista e recebedor de aluguéis",
  "14":"Microempreendedor individual (MEI)",
  "21":"Administração direta federal",
  "22":"Autarquia ou fundação federal",
  "23":"Empresa pública ou sociedade mista federal",
  "31":"Administração direta estadual e DF",
  "32":"Autarquia ou fundação estadual e DF",
  "33":"Empresa pública ou sociedade mista estadual",
  "41":"Administração direta municipal",
  "42":"Autarquia ou fundação municipal",
  "43":"Empresa pública ou sociedade mista municipal",
  "51":"Militar",
  "61":"Aposentado ou pensionista",
  "62":"Aposentado com moléstia grave",
  "71":"Beneficiário de pensão alimentícia",
  "72":"Bolsista",
  "81":"Espólio",
  "91":"Natureza não especificada",
};

function renderLinkages(data){
  const exercise=2026;
  const total=byYear(data.overview,exercise);
  const group=name=>data.employment_groups.find(row=>row.exercicio===exercise&&row.group===name);
  const comparison=[
    {name:"Trabalho privado",row:group("Assalariado privado"),tone:"private",thesis:"A maior massa de declarantes"},
    {name:"Setor público",row:group("Setor público"),tone:"public",thesis:"Renda média mais alta"},
    {name:"Proprietários e capitalistas",row:group("Proprietário ou capitalista"),tone:"capital",thesis:"O estoque de riqueza"},
  ];
  document.querySelector("#linkage-triangle").innerHTML=`<div class="linkage-cards">${comparison.map(item=>`<article class="linkage-card ${item.tone}"><span>${item.thesis}</span><h3>${item.name}</h3><strong>${money(avg(item.row,"renda"))}</strong><small>renda média anual</small><dl><div><dt>Patrimônio médio</dt><dd>${money(avg(item.row,"patrimonio"))}</dd></div><div><dt>Patrimônio total</dt><dd>${compactMoney(item.row.patrimonio)} · ${pct.format(item.row.patrimonio/total.patrimonio)}</dd></div><div><dt>Declarantes</dt><dd>${num.format(item.row.declarantes/1e6)} milhões</dd></div><div><dt>Imposto / renda total</dt><dd>${pct.format(item.row.imposto/item.row.renda)}</dd></div><div><dt>Renda que aparece tributável</dt><dd>${pct.format(item.row.renda_tributavel/item.row.renda)}</dd></div></dl></article>`).join("")}</div>`;

  const rankingHost=document.querySelector("#linkage-ranking");
  const drawRanking=year=>{
    const rows=data.employment_nature.filter(row=>row.exercicio===year).sort((a,b)=>b.patrimonio-a.patrimonio);
    rankingHost.innerHTML=`<div class="linkage-rank head"><span>#</span><span>Natureza da ocupação</span><span>Patrimônio total</span><span>Patrimônio médio</span><span>Declarantes</span></div>${rows.map((row,index)=>`<div class="linkage-rank"><i>${String(index+1).padStart(2,"0")}</i><span>${linkageShort[row.code]||row.vínculo}<small>código ${row.code}</small></span><b>${compactMoney(row.patrimonio)}</b><b>${money(avg(row,"patrimonio"))}</b><span>${integer.format(row.declarantes)}</span></div>`).join("")}`;
  };
  document.querySelectorAll("[data-linkage-year]").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll("[data-linkage-year]").forEach(peer=>peer.setAttribute("aria-pressed",String(peer===button)));drawRanking(Number(button.dataset.linkageYear));}));
  drawRanking(2026);

  const publicCodes=new Set(["21","22","23","31","32","33","41","42","43","51"]);
  const publicRows=data.employment_nature.filter(row=>row.exercicio===2026&&publicCodes.has(row.code)).sort((a,b)=>avg(b,"renda")-avg(a,"renda"));
  const maxIncome=Math.max(...publicRows.map(row=>avg(row,"renda")));
  document.querySelector("#public-ladder").innerHTML=`<div class="public-ladder-head"><span>Vínculo público</span><span>Renda média anual</span><span>Patrimônio médio</span><span>Imposto/renda</span></div>${publicRows.map(row=>`<div class="public-ladder-row"><span>${linkageShort[row.code]}<small>${integer.format(row.declarantes)} declarantes</small></span><div><i style="width:${avg(row,"renda")/maxIncome*100}%"></i><b>${money(avg(row,"renda"))}</b></div><b>${money(avg(row,"patrimonio"))}</b><b>${pct.format(row.imposto/row.renda)}</b></div>`).join("")}`;
}

function shortOccupation(label){
  const exact={
    "Titular de Cartório":"Titular de cartório",
    "Membro do Poder Judiciário (Ministro, Juiz e Desembargador) e de Tribunal de Contas (Ministro e Conselheiro)":"Magistratura e Tribunais de Contas",
    "Membro do Ministério Público (Procurador e Promotor)":"Ministério Público",
    "Diplomata e afins":"Diplomacia",
    "Dirigente, presidente e diretor de empresa industrial, comercial ou prestadora de serviços":"Dirigentes e diretores de empresas",
    "Produtor na exploração agropecuária":"Produtores agropecuários",
    "Gerente ou supervisor de empresa industrial, comercial ou prestadora de serviços":"Gerentes e supervisores de empresas",
    "Economista, administrador, contador, auditor e afins":"Economistas, administradores e contadores",
    "Bancário, economiário, escriturário, secretário, assistente e auxiliar administrativo":"Bancários e trabalhadores administrativos",
    "Analista de sistemas, desenvolvedor de software, administrador de redes e bancos de dados e outros especialistas em informática (exceto técnico)":"Especialistas em informática e software",
  };
  return exact[label]||label;
}

function renderExplorer(manifest){
  const segmentLabel=row=>{
    const female=row.gender==="Feminino";
    const feminine=female||!row.gender;
    const raceMap={"Branca":feminine?"brancas":"brancos","Preta":feminine?"pretas":"pretos","Parda":feminine?"pardas":"pardos","Amarela":feminine?"amarelas":"amarelos","Indígena":"indígenas"};
    let descriptor=row.gender?(female?"Mulheres":"Homens"):(row.race?"Pessoas":"");
    if(row.race) descriptor+=`${descriptor?" ":""}${raceMap[row.race]||row.race}`;
    if(row.age) descriptor+=`${descriptor?", ":""}${row.age}`;
    const place=row.municipality?` · ${row.municipality}/${row.uf}`:"";
    return `${descriptor?`${descriptor} · `:""}${shortOccupation(row.occupation)}${place}`;
  };
  const outlierHost=document.querySelector("#segment-outliers");
  const searchInput=document.querySelector("#outlier-search");
  const searchStatus=document.querySelector("#outlier-search-status");
  const profileSelect=document.querySelector("#outlier-profile");
  const edition=document.querySelector("#explorer-edition");
  const segmentCount=document.querySelector("#explorer-segment-count");
  const profileCount=document.querySelector("#explorer-profile-count");
  const yearNote=document.querySelector("#explorer-year-note");
  const conditionalNote=document.querySelector("#conditional-ranking-note");
  const yearButtons=[...document.querySelectorAll("[data-explorer-year]")];
  const economicSelects=Object.fromEntries([...document.querySelectorAll("[data-economic-filter]")].map(select=>[select.dataset.economicFilter,select]));
  Object.entries(manifest.bands).forEach(([name,config])=>economicSelects[name].insertAdjacentHTML("beforeend",config.options.map(option=>`<option value="${option.id}">${option.label}</option>`).join("")));
  const groups=[
    ["Maior renda média","income_top","income_average","income_rank"],
    ["Maior patrimônio médio","wealth_top","wealth_average","wealth_rank"],
    ["Menor renda média","income_bottom","income_average","income_bottom_rank"],
    ["Menor patrimônio médio","wealth_bottom","wealth_average","wealth_bottom_rank"],
  ];
  const normalizeSearch=value=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const initialParams=new URLSearchParams(window.location.search);
  let year=["2025","2026"].includes(initialParams.get("ano"))?initialParams.get("ano"):"2026";
  let selectedProfile=initialParams.get("perfil")||"all";
  searchInput.value=initialParams.get("q")||"";
  Object.entries(manifest.bands).forEach(([name,config])=>{
    const requested=initialParams.get(config.param);
    economicSelects[name].value=config.options.some(option=>option.id===requested)?requested:"all";
  });
  const datasetCache=new Map();
  let requestVersion=0;
  const activeEconomic=()=>Object.keys(manifest.bands).filter(name=>economicSelects[name].value!=="all");
  const activeBandSelections=()=>Object.fromEntries(activeEconomic().map(name=>{
    const config=manifest.bands[name],id=economicSelects[name].value;
    return [name,config.options.find(option=>option.id===id)];
  }));
  const maskKey=()=>activeEconomic().join("+")||"base";
  const loadDataset=()=>{
    const mask=maskKey(),cacheKey=`${year}:${mask}`;
    if(!datasetCache.has(cacheKey)){
      const filename=manifest.years[year].files[mask];
      const promise=fetch(`${root}data/${filename}`).then(async response=>{
      if(!response.ok) throw new Error("Falha ao carregar o universo de busca");
      const bytes=new Uint8Array(await response.arrayBuffer());
      let jsonText;
      if(bytes[0]===0x1f&&bytes[1]===0x8b){
        if(typeof DecompressionStream==="undefined") throw new Error("O navegador não oferece descompressão gzip");
        const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        jsonText=await new Response(stream).text();
      }else jsonText=new TextDecoder().decode(bytes);
        return JSON.parse(jsonText);
      }).catch(error=>{datasetCache.delete(cacheKey);throw error;});
      datasetCache.set(cacheKey,promise);
    }
    return datasetCache.get(cacheKey);
  };
  const scopedProfiles=(profiles,rows=null)=>{
    const counts=rows?rows.reduce((acc,row)=>(acc[row.profile]=(acc[row.profile]||0)+1,acc),{}):null;
    return profiles.map(profile=>({...profile,eligible:counts?counts[profile.id]||0:profile.eligible})).filter(profile=>profile.eligible>0);
  };
  const populateProfiles=(profiles,rows=null)=>{
    const available=scopedProfiles(profiles,rows);
    if(selectedProfile!=="all"&&!available.some(profile=>profile.id===selectedProfile))selectedProfile="all";
    profileSelect.innerHTML=`<option value="all">Todas as ${available.length} combinações</option>`+available.map(profile=>`<option value="${profile.id}">${profile.label} · ${integer.format(profile.eligible)}</option>`).join("");
    profileSelect.value=selectedProfile;
    return available;
  };
  const updateEdition=(eligible,profiles)=>{
    edition.textContent=`Explorador · exercício ${year}`;
    segmentCount.textContent=integer.format(eligible);
    profileCount.textContent=integer.format(profiles.length);
    yearButtons.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.explorerYear===year)));
    yearNote.textContent=manifest.years[year].race_available?"Em 2026, raça/cor permite 16 combinações demográficas.":"Em 2025, raça/cor veio integralmente como não informada; por isso há 8 combinações.";
  };
  const syncExplorerUrl=()=>{
    const url=new URL(window.location.href),query=searchInput.value.trim();
    if(query)url.searchParams.set("q",query);else url.searchParams.delete("q");
    if(selectedProfile!=="all")url.searchParams.set("perfil",selectedProfile);else url.searchParams.delete("perfil");
    if(year!=="2026")url.searchParams.set("ano",year);else url.searchParams.delete("ano");
    Object.entries(manifest.bands).forEach(([name,config])=>{const value=economicSelects[name].value;if(value!=="all")url.searchParams.set(config.param,value);else url.searchParams.delete(config.param);});
    window.history.replaceState({},"",`${url.pathname}${url.search}${url.hash}`);
    document.title=query?`${query} | Explorador ${year} | Brasil declarado`:`Explorador ${year} | Brasil declarado`;
  };
  const drawOutliers=({base=null,scopeRows=null,profiles,query=""})=>{
    const profileLabels=Object.fromEntries(profiles.map(profile=>[profile.id,profile.label]));
    const tokens=normalizeSearch(query).split(/\s+/).filter(Boolean);
    const filtered=scopeRows?scopeRows.filter(row=>{if(selectedProfile!=="all"&&row.profile!==selectedProfile)return false;const haystack=normalizeSearch(`${segmentLabel(row)} ${profileLabels[row.profile]||""}`);return tokens.every(token=>haystack.includes(token));}):null;
    const visibleCount=filtered?filtered.length:base.eligible;
    const scope=selectedProfile==="all"?`Todas as ${profiles.length} combinações`:profileLabels[selectedProfile];
    if(filtered)searchStatus.textContent=`${integer.format(visibleCount)} segmentos encontrados. A numeração preserva a posição dentro do recorte econômico ativo.`;
    else searchStatus.textContent=`O ranking reúne ${integer.format(base.eligible)} segmentos e exibe os 200 extremos de cada métrica.`;
    const incomeRows=filtered?[...filtered].sort((a,b)=>a.income_rank-b.income_rank):base.income_top;
    const leader=incomeRows[0];
    const selections=activeBandSelections();
    const conditionedIncome=Boolean(selections.income_total);
    const conditionedWealth=Boolean(selections.wealth);
    outlierHost.innerHTML=`<div class="outlier-summary"><span>Exercício ${year} · ${scope} · ${integer.format(visibleCount)} grupos</span>${leader?`<strong>${segmentLabel(leader)}</strong><p>lidera a renda média observada: ${money(leader.income_average)} por ano.</p>`:`<strong>Nenhum segmento encontrado</strong><p>Remova filtros ou tente outra busca.</p>`}</div><div class="outlier-grid">${groups.map(([title,key,metric,rankField])=>{const allRows=filtered?[...filtered].filter(row=>row[rankField]).sort((a,b)=>a[rankField]-b[rankField]):base[key];const rows=allRows.slice(0,200);const circular=(metric==="income_average"&&conditionedIncome)||(metric==="wealth_average"&&conditionedWealth);const countLabel=filtered?(allRows.length>200?`200 de ${integer.format(allRows.length)}`:`${integer.format(allRows.length)} resultados`):"200 extremos";return `<section class="outlier-panel${circular?" is-conditioned":""}"><h3>${title}${circular?" dentro da faixa":""}<small>${countLabel}</small></h3>${circular?`<p class="circular-warning">Condicionado pela própria variável</p>`:""}<div class="outlier-scroll" role="region" tabindex="0" aria-label="Ranking: ${title}">${rows.length?rows.map(row=>`<div class="outlier-row"><i>#${integer.format(row[rankField])}</i><span>${segmentLabel(row)}<small>${integer.format(row.declarantes)} declarantes · ${profileLabels[row.profile]||row.profile}</small></span><b>${money(row[metric])}</b></div>`).join(""):`<p class="outlier-empty">Nenhum segmento corresponde a esta busca.</p>`}</div></section>`;}).join("")}</div>`;
  };
  const updateConditionalNote=(scopeCount=null)=>{
    const selections=activeBandSelections(),entries=Object.entries(selections);
    conditionalNote.hidden=!entries.length;
    if(!entries.length){conditionalNote.innerHTML="";return;}
    const labels=entries.map(([name,option])=>`${manifest.bands[name].label}: <b>${option.label}</b>`).join(" · ");
    const warnings=[];
    if(selections.income_total)warnings.push("os rankings de renda estão condicionados pela própria renda");
    if(selections.wealth)warnings.push("os rankings de patrimônio estão condicionados pelo próprio patrimônio");
    conditionalNote.innerHTML=`<strong>Ranking condicionado${scopeCount===null?"":` · ${integer.format(scopeCount)} segmentos`}.</strong><span>${labels}.</span>${warnings.length?`<em>Atenção: ${warnings.join("; ")}.</em>`:""}`;
  };
  const showLoadError=()=>{
    searchStatus.textContent="Não foi possível carregar o índice deste recorte.";
    outlierHost.innerHTML=`<div class="explorer-error"><strong>O recorte não pôde ser carregado.</strong><p>Verifique a conexão ou tente novamente.</p><button type="button" id="retry-explorer">Tentar novamente</button></div>`;
    document.querySelector("#retry-explorer").addEventListener("click",()=>runExplorer({syncUrl:false}));
  };
  const runExplorer=async({syncUrl=true}={})=>{
    const version=++requestVersion,query=searchInput.value.trim(),economic=activeEconomic();
    if(syncUrl)syncExplorerUrl();
    const base=manifest.years[year].base;
    if(!query&&selectedProfile==="all"&&!economic.length){const profiles=populateProfiles(base.profiles);updateEdition(base.eligible,profiles);updateConditionalNote();drawOutliers({base,profiles});return;}
    searchStatus.textContent=`Carregando o índice de ${year}…`;
    updateConditionalNote();
    try{
      const dataset=await loadDataset();
      if(version!==requestVersion)return;
      const selections=activeBandSelections();
      const scopeRows=dataset.segments.filter(row=>Object.entries(selections).every(([name,option])=>row[manifest.bands[name].key]===option.value));
      const profiles=populateProfiles(dataset.profiles,scopeRows);
      updateEdition(scopeRows.length,profiles);
      updateConditionalNote(scopeRows.length);
      drawOutliers({scopeRows,profiles,query});
      if(syncUrl)syncExplorerUrl();
    }catch{if(version===requestVersion)showLoadError();}
  };
  let searchTimer;
  searchInput.addEventListener("input",()=>{syncExplorerUrl();clearTimeout(searchTimer);searchTimer=setTimeout(()=>runExplorer({syncUrl:false}),180);});
  profileSelect.addEventListener("change",()=>{selectedProfile=profileSelect.value;runExplorer();});
  yearButtons.forEach(button=>button.addEventListener("click",()=>{year=button.dataset.explorerYear;runExplorer();}));
  Object.values(economicSelects).forEach(select=>select.addEventListener("change",()=>runExplorer()));
  document.querySelector("#clear-economic-filters").addEventListener("click",()=>{Object.values(economicSelects).forEach(select=>{select.value="all";});runExplorer();});
  document.querySelectorAll("[data-outlier-query]").forEach(button=>button.addEventListener("click",()=>{searchInput.value=button.dataset.outlierQuery;runExplorer();}));
  const copyButton=document.querySelector("#copy-explorer-link");
  copyButton.addEventListener("click",async()=>{syncExplorerUrl();try{await navigator.clipboard.writeText(window.location.href);copyButton.textContent="Link copiado";}catch{copyButton.textContent="Copie a URL do navegador";}setTimeout(()=>{copyButton.textContent="Copiar link";},2200);});
  populateProfiles(manifest.years[year].base.profiles);
  runExplorer({syncUrl:false});
}

function renderReadings(data){
  const overview=byYear(data.overview,2026);
  const population=data.national_population[2025];
  const official=data.official_declarations["2026_deadline"];
  document.querySelector("#visibility-check").innerHTML=`<div class="visibility-metrics"><article><span>Entregas oficiais no prazo</span><strong>${num.format(official/1e6)} mi</strong><b>${pct.format(official/population)} da população</b><p>Contagem anunciada pela Receita para a campanha de 2026.</p></article><article><span>Declarantes no Painel de Perfil</span><strong>${num.format(overview.declarantes/1e6)} mi</strong><b>${pct.format(overview.declarantes/population)} da população</b><p>Universo efetivamente usado nos cruzamentos deste relatório.</p></article><article><span>Diferença sem reconciliação</span><strong>${num.format((official-overview.declarantes)/1e6)} mi</strong><b>não explicada pela documentação</b><p>Cobertura fiscal não deve ser apresentada sem dizer qual contagem foi usada.</p></article></div>`;

  const occupationRows=data.occupations.filter(row=>row.exercicio===2026&&row.occupation&&row.occupation!=="Outras ocupações não especificadas anteriormente");
  const averageTop=[...occupationRows].sort((a,b)=>avg(b,"patrimonio")-avg(a,"patrimonio")).slice(0,10);
  const totalTop=[...occupationRows].sort((a,b)=>b.patrimonio-a.patrimonio).slice(0,10);
  const rankList=(title,subtitle,rows,mode)=>`<section aria-label="${title}"><header><span>${subtitle}</span><h3>${title}</h3></header>${rows.map((row,index)=>`<div class="truth-rank-row"><i>${String(index+1).padStart(2,"0")}</i><span>${shortOccupation(row.occupation)}<small>${integer.format(row.declarantes)} declarantes · ${pct.format(row.patrimonio/overview.patrimonio)} do patrimônio nacional</small></span><b>${mode==="average"?money(avg(row,"patrimonio")):compactMoney(row.patrimonio)}</b></div>`).join("")}</section>`;
  document.querySelector("#mean-total-occupations").innerHTML=rankList("Maior patrimônio médio","A cifra que viraliza",averageTop,"average")+rankList("Maior patrimônio total","A escala que costuma desaparecer",totalTop,"total");

  const names={notary:"Titular de Cartório",judge:"Membro do Poder Judiciário (Ministro, Juiz e Desembargador) e de Tribunal de Contas (Ministro e Conselheiro)",prosecutor:"Membro do Ministério Público (Procurador e Promotor)",diplomat:"Diplomata e afins",director:"Dirigente, presidente e diretor de empresa industrial, comercial ou prestadora de serviços"};

  const findOccupation=name=>occupationRows.find(row=>row.occupation===name);
  const combine=(label,list)=>({label,declarantes:list.reduce((s,r)=>s+r.declarantes,0),patrimonio:list.reduce((s,r)=>s+r.patrimonio,0)});
  const publicElite=combine("Magistratura + MP + diplomacia",[findOccupation(names.judge),findOccupation(names.prosecutor),findOccupation(names.diplomat)]);
  const withNotary=combine("As quatro ocupações do ranking viral",[findOccupation(names.notary),findOccupation(names.judge),findOccupation(names.prosecutor),findOccupation(names.diplomat)]);
  const directors=combine("Dirigentes e diretores de empresas",[findOccupation(names.director)]);
  const scaleRows=[publicElite,withNotary,directors];
  document.querySelector("#elite-scale").innerHTML=`<div class="elite-scale-head"><span>Grupo comparado</span><span>Declarantes</span><span>Patrimônio total</span><span>Participação nacional</span></div>${scaleRows.map(row=>`<div class="elite-scale-row"><span>${row.label}</span><b>${integer.format(row.declarantes)}</b><div><i style="width:${row.patrimonio/directors.patrimonio*100}%"></i></div><b>${compactMoney(row.patrimonio)} · ${pct.format(row.patrimonio/overview.patrimonio)}</b></div>`).join("")}<p class="figure-note">A barra usa o patrimônio dos dirigentes empresariais como escala de 100%. Cartório é mostrado na linha intermediária apenas para reproduzir o agrupamento retórico dos rankings; juridicamente, é atividade privada delegada.</p>`;

  const variable=data.variable_income.find(row=>row.exercicio===2026&&row.value==="S");
  document.querySelector("#variable-income-claim").innerHTML=`O painel marca ${integer.format(variable.declarantes)} declarantes — ${pct.format(variable.declarantes/overview.declarantes)} do recorte — com o indicador de renda variável. O campo sinaliza operações ou enquadramento, não inventaria todas as ações e fundos mantidos. Portanto, não mede diretamente a “cultura de investimentos”.`;
  renderTaxFigure(data,"#readings-tax-figure");
}

const initialize=async()=>{
  if(page==="metodo")return;
  if(page==="explorador"){renderExplorer(await loadExplorerManifest());return;}
  const data=await loadData();
  if(page==="home")renderHome(data);
  if(page==="territorio")renderTerritory(data);
  if(page==="raca")renderRace(data);
  if(page==="estrutura")renderStructure(data);
  if(page==="vinculos")renderLinkages(data);
  if(page==="leituras")renderReadings(data);
};
initialize().catch(error=>{console.error(error);document.querySelectorAll(".loading").forEach(el=>{el.classList.add("error");el.textContent="Não foi possível carregar os dados locais.";});const explorer=document.querySelector("#segment-outliers");if(explorer)explorer.innerHTML='<div class="explorer-error"><strong>O Explorador não pôde ser iniciado.</strong><p>Tente recarregar a página.</p></div>';});
