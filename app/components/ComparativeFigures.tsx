"use client";

import { useEffect, useState } from "react";

type Row = Record<string, string | number | null>;
type Analysis = Record<string, Row[] | Record<string, unknown>>;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const one = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const regionNames: Record<string, string> = {
  N: "Norte",
  NE: "Nordeste",
  SE: "Sudeste",
  S: "Sul",
  CO: "Centro-Oeste",
};

function useAnalysis() {
  const [data, setData] = useState<Analysis | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/data/analysis.json").then((response) => response.json()).then((value) => active && setData(value));
    return () => { active = false; };
  }, []);
  return data;
}

function rows(data: Analysis, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value : [];
}

function n(row: Row | undefined, key: string) {
  return Number(row?.[key] ?? 0);
}

function change(before: number, after: number) {
  return after / before - 1;
}

function realChange(before: number, after: number) {
  return (after / 1.0426) / before - 1;
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${one.format(value * 100)}%`;
}

function moneyScale(value: number) {
  if (value >= 1e12) return `R$ ${one.format(value / 1e12)} tri`;
  if (value >= 1e9) return `R$ ${one.format(value / 1e9)} bi`;
  if (value >= 1e6) return `R$ ${one.format(value / 1e6)} mi`;
  return brl.format(value);
}

function Loading() {
  return <div className="essay-loading" role="status">Preparando a comparação dos dois exercícios…</div>;
}

function population(data: Analysis, year: number, level: string, name: string) {
  return n(rows(data, "population").find((row) => n(row, "year") === year && row.level === level && row.name === name), "population");
}

export function NationalComparison() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const a = rows(data, "overview").find((row) => n(row, "exercicio") === 2025)!;
  const b = rows(data, "overview").find((row) => n(row, "exercicio") === 2026)!;
  const popA = population(data, 2024, "country", "Brasil");
  const popB = population(data, 2025, "country", "Brasil");
  const ledger = [
    { label: "Declarantes observados", a: n(a, "contribuintes"), b: n(b, "contribuintes"), fa: (v: number) => `${one.format(v / 1e6)} mi`, delta: change(n(a, "contribuintes"), n(b, "contribuintes")), note: "mudança do universo" },
    { label: "Declarantes a cada 100 habitantes", a: n(a, "contribuintes") / popA * 100, b: n(b, "contribuintes") / popB * 100, fa: (v: number) => one.format(v), delta: change(n(a, "contribuintes") / popA, n(b, "contribuintes") / popB), note: "cobertura populacional" },
    { label: "Renda total declarada", a: n(a, "rend_total"), b: n(b, "rend_total"), fa: moneyScale, delta: realChange(n(a, "rend_total"), n(b, "rend_total")), nominal: change(n(a, "rend_total"), n(b, "rend_total")), note: "variação real*" },
    { label: "Patrimônio informado", a: n(a, "patrimonio"), b: n(b, "patrimonio"), fa: moneyScale, delta: realChange(n(a, "patrimonio"), n(b, "patrimonio")), nominal: change(n(a, "patrimonio"), n(b, "patrimonio")), note: "variação real*" },
    { label: "Renda média por declarante", a: n(a, "rend_total") / n(a, "contribuintes"), b: n(b, "rend_total") / n(b, "contribuintes"), fa: brl.format, delta: realChange(n(a, "rend_total") / n(a, "contribuintes"), n(b, "rend_total") / n(b, "contribuintes")), nominal: change(n(a, "rend_total") / n(a, "contribuintes"), n(b, "rend_total") / n(b, "contribuintes")), note: "variação real*" },
    { label: "Patrimônio médio por declarante", a: n(a, "patrimonio") / n(a, "contribuintes"), b: n(b, "patrimonio") / n(b, "contribuintes"), fa: brl.format, delta: realChange(n(a, "patrimonio") / n(a, "contribuintes"), n(b, "patrimonio") / n(b, "contribuintes")), nominal: change(n(a, "patrimonio") / n(a, "contribuintes"), n(b, "patrimonio") / n(b, "contribuintes")), note: "variação real*" },
  ];
  return <div className="comparison-ledger" aria-label="Comparação nacional entre os exercícios 2025 e 2026">
    <div className="ledger-head"><span>Medida</span><span>Exercício 2025<br /><small>ano-calendário 2024</small></span><span>Exercício 2026<br /><small>ano-calendário 2025</small></span><span>Mudança</span></div>
    {ledger.map((item) => <div className="ledger-row" key={item.label}>
      <strong>{item.label}</strong>
      <span className="ledger-value">{item.fa(item.a)}</span>
      <span className="ledger-value">{item.fa(item.b)}</span>
      <span className={`delta ${item.delta < 0 ? "negative" : "positive"}`}><b>{signed(item.delta)}</b><small>{item.note}{item.nominal !== undefined ? ` · ${signed(item.nominal)} nominal` : ""}</small></span>
    </div>)}
    <p className="ledger-foot">* Valores de 2026 deflacionados pelo IPCA de 2025 (4,26%) para comparação com 2025. As pessoas não são acompanhadas individualmente entre exercícios.</p>
  </div>;
}

export function CompositionShift() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const datasets = [
    { key: "income_bands", title: "Faixas de renda total" },
    { key: "wealth_bands", title: "Faixas de patrimônio" },
  ];
  return <div className="composition-shift">
    {datasets.map((dataset) => {
      const all = rows(data, dataset.key);
      const labels = [...new Set(all.map((row) => String(row.faixa)))];
      return <section key={dataset.key}>
        <h3>{dataset.title}</h3>
        {labels.map((label) => {
          const a = all.find((row) => n(row, "exercicio") === 2025 && row.faixa === label)!;
          const b = all.find((row) => n(row, "exercicio") === 2026 && row.faixa === label)!;
          const delta = change(n(a, "contribuintes"), n(b, "contribuintes"));
          const max = Math.max(...all.map((row) => n(row, "contribuintes")));
          return <div className="shift-row" key={label}>
            <div className="shift-label"><strong>{label}</strong><span className={delta < 0 ? "negative-text" : "positive-text"}>{signed(delta)}</span></div>
            <div className="year-bars">
              <div><small>2025</small><span style={{ width: `${n(a, "contribuintes") / max * 100}%` }} /><b>{one.format(n(a, "contribuintes") / 1e6)} mi</b></div>
              <div><small>2026</small><span className="new" style={{ width: `${n(b, "contribuintes") / max * 100}%` }} /><b>{one.format(n(b, "contribuintes") / 1e6)} mi</b></div>
            </div>
          </div>;
        })}
      </section>;
    })}
  </div>;
}

export function RegionalCoverage() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  return <div className="regional-coverage">
    <div className="coverage-head"><span>Região</span><span>2025</span><span>2026</span><span>Variação</span></div>
    {Object.entries(regionNames).map(([code, name]) => {
      const a = rows(data, "regions").find((row) => n(row, "exercicio") === 2025 && row.regiao === code)!;
      const b = rows(data, "regions").find((row) => n(row, "exercicio") === 2026 && row.regiao === code)!;
      const ca = n(a, "contribuintes") / population(data, 2024, "region", name);
      const cb = n(b, "contribuintes") / population(data, 2025, "region", name);
      return <div className="coverage-row" key={code}>
        <strong>{name}</strong>
        <span>{one.format(ca * 100)} a cada 100</span>
        <span>{one.format(cb * 100)} a cada 100</span>
        <span className="negative-text">{one.format((cb - ca) * 100)} p.p.</span>
      </div>;
    })}
  </div>;
}

export function RegionPopulationBalance() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const overview = (year: number) => rows(data, "overview").find((row) => n(row, "exercicio") === year)!;
  const nationalPopulation = (year: number) => population(data, year, "country", "Brasil");
  return <div className="balance-grid">
    {Object.entries(regionNames).map(([code, name]) => <article key={code}>
      <h3>{name}</h3>
      {[2025, 2026].map((exercise) => {
        const popYear = exercise - 1;
        const region = rows(data, "regions").find((row) => n(row, "exercicio") === exercise && row.regiao === code)!;
        const total = overview(exercise);
        const metrics = [
          ["população", population(data, popYear, "region", name) / nationalPopulation(popYear)],
          ["declarantes", n(region, "contribuintes") / n(total, "contribuintes")],
          ["patrimônio", n(region, "patrimonio") / n(total, "patrimonio")],
        ] as const;
        return <div className="balance-year" key={exercise}>
          <strong>Exercício {exercise}</strong>
          {metrics.map(([label, value]) => <div key={label}><span>{label}</span><i><em style={{ width: `${value * 100}%` }} /></i><b>{pct.format(value)}</b></div>)}
        </div>;
      })}
    </article>)}
  </div>;
}

export function RegionalPerCapita() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  return <div className="percapita-grid">
    {Object.entries(regionNames).map(([code, name]) => {
      const a = rows(data, "regions").find((row) => n(row, "exercicio") === 2025 && row.regiao === code)!;
      const b = rows(data, "regions").find((row) => n(row, "exercicio") === 2026 && row.regiao === code)!;
      const popA = population(data, 2024, "region", name);
      const popB = population(data, 2025, "region", name);
      const wealthResidentA = n(a, "patrimonio") / popA;
      const wealthResidentB = n(b, "patrimonio") / popB;
      return <article key={code}>
        <p className="eyebrow">{name}</p>
        <h3>{brl.format(wealthResidentB)}</h3>
        <p>patrimônio declarado por habitante em 2026</p>
        <dl>
          <div><dt>Em 2025</dt><dd>{brl.format(wealthResidentA)}</dd></div>
          <div><dt>Mudança real</dt><dd>{signed(realChange(wealthResidentA, wealthResidentB))}</dd></div>
          <div><dt>Por declarante, 2026</dt><dd>{brl.format(n(b, "patrimonio") / n(b, "contribuintes"))}</dd></div>
        </dl>
      </article>;
    })}
  </div>;
}

export function StatePerCapitaTable() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const statePopulation = (year: number, name: string) => population(data, year, "state", name);
  const states = rows(data, "states").filter((row) => n(row, "exercicio") === 2026 && row.uf !== "EX").map((b) => {
    const a = rows(data, "states").find((row) => n(row, "exercicio") === 2025 && row.uf === b.uf)!;
    const popA = statePopulation(2024, String(a.nome_uf));
    const popB = statePopulation(2025, String(b.nome_uf));
    return {
      uf: String(b.uf), name: String(b.nome_uf),
      a: n(a, "patrimonio") / popA,
      b: n(b, "patrimonio") / popB,
      coverageA: n(a, "contribuintes") / popA,
      coverageB: n(b, "contribuintes") / popB,
    };
  }).sort((x, y) => y.b - x.b);
  return <div className="state-percapita">
    <div className="state-table-head"><span>UF</span><span>Patrimônio/hab. 2025</span><span>Patrimônio/hab. 2026</span><span>Cobertura 2026</span></div>
    {states.map((state, index) => <div className={`state-table-row ${index === 10 ? "table-break" : ""}`} key={state.uf}>
      <strong><i>{String(index + 1).padStart(2, "0")}</i>{state.uf}<small>{state.name}</small></strong>
      <span>{brl.format(state.a)}</span>
      <span>{brl.format(state.b)}<small>{signed(realChange(state.a, state.b))} real</small></span>
      <span>{pct.format(state.coverageB)}<small>{one.format((state.coverageB - state.coverageA) * 100)} p.p.</small></span>
    </div>)}
  </div>;
}

export function ConcentrationComparison() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const total = (year: number) => rows(data, "overview").find((row) => n(row, "exercicio") === year)!;
  const entries = [
    { title: "Patrimônio acima de R$ 1 milhão", dataset: "wealth_bands", order: 4, shareKey: "patrimonio", shareLabel: "do patrimônio" },
    { title: "Renda acima de R$ 1,2 milhão/ano", dataset: "income_bands", order: 4, shareKey: "rend_total", shareLabel: "da renda" },
  ];
  return <div className="concentration-comparison">
    {entries.map((entry) => <article key={entry.dataset}>
      <h3>{entry.title}</h3>
      <div className="concentration-years">
        {[2025, 2026].map((year) => {
          const row = rows(data, entry.dataset).find((item) => n(item, "exercicio") === year && n(item, "ordem") === entry.order)!;
          const all = total(year);
          return <div key={year}><span>Exercício {year}</span><strong>{pct.format(n(row, "contribuintes") / n(all, "contribuintes"))}</strong><p>dos declarantes concentram <b>{pct.format(n(row, entry.shareKey) / n(all, entry.shareKey))}</b> {entry.shareLabel}</p></div>;
        })}
      </div>
    </article>)}
  </div>;
}

export function GenderComparison() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const gender = (year: number, label: string) => rows(data, "gender").find((row) => n(row, "exercicio") === year && row.genero === label)!;
  return <div className="gender-comparison">
    <div className="gender-head"><span>Medida</span><span>Mulheres 2025 → 2026</span><span>Homens 2025 → 2026</span><span>Mulheres / homens em 2026</span></div>
    {[
      ["Renda média", "rend_total"],
      ["Patrimônio médio", "patrimonio"],
    ].map(([label, key]) => {
      const fa = gender(2025, "Feminino"), fb = gender(2026, "Feminino"), ma = gender(2025, "Masculino"), mb = gender(2026, "Masculino");
      const fA = n(fa, key) / n(fa, "contribuintes"), fB = n(fb, key) / n(fb, "contribuintes"), mA = n(ma, key) / n(ma, "contribuintes"), mB = n(mb, key) / n(mb, "contribuintes");
      return <div className="gender-row" key={key}><strong>{label}</strong><span>{brl.format(fA)} → <b>{brl.format(fB)}</b><small>{signed(realChange(fA, fB))} real</small></span><span>{brl.format(mA)} → <b>{brl.format(mB)}</b><small>{signed(realChange(mA, mB))} real</small></span><span><b>{pct.format(fB / mB)}</b></span></div>;
    })}
  </div>;
}

export function WorkComparison() {
  const data = useAnalysis();
  if (!data) return <Loading />;
  const rows2026 = rows(data, "occupations").filter((row) => n(row, "exercicio") === 2026 && n(row, "contribuintes") >= 20_000).sort((a, b) => n(b, "rend_total") / n(b, "contribuintes") - n(a, "rend_total") / n(a, "contribuintes")).slice(0, 10);
  return <div className="work-comparison">
    <div className="work-head"><span>Ocupação</span><span>Renda média 2025</span><span>Renda média 2026</span><span>Mudança real</span></div>
    {rows2026.map((b, index) => {
      const a = rows(data, "occupations").find((row) => n(row, "exercicio") === 2025 && row.ocupacao === b.ocupacao)!;
      const av = n(a, "rend_total") / n(a, "contribuintes"), bv = n(b, "rend_total") / n(b, "contribuintes");
      return <div className="work-row" key={String(b.ocupacao)}><strong><i>{String(index + 1).padStart(2, "0")}</i>{String(b.ocupacao)}</strong><span>{brl.format(av)}</span><span>{brl.format(bv)}</span><span>{signed(realChange(av, bv))}</span></div>;
    })}
  </div>;
}
