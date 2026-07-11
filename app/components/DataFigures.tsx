"use client";

import { useEffect, useState } from "react";

type Row = Record<string, string | number | null>;
type Analysis = Record<string, Row[] | Record<string, unknown>>;
type Metric = "contribuintes" | "rend_total" | "patrimonio";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

function useAnalysis() {
  const [data, setData] = useState<Analysis | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/data/analysis.json")
      .then((response) => response.json())
      .then((value) => active && setData(value));
    return () => {
      active = false;
    };
  }, []);
  return data;
}

function rows(data: Analysis | null, key: string): Row[] {
  const value = data?.[key];
  return Array.isArray(value) ? value : [];
}

function number(row: Row, key: string) {
  return Number(row[key] ?? 0);
}

function average(row: Row, metric: Metric) {
  if (metric === "contribuintes") return number(row, metric);
  const count = number(row, "contribuintes");
  return count ? number(row, metric) / count : 0;
}

function formatValue(value: number, metric: Metric) {
  return metric === "contribuintes" ? compact.format(value) : brl.format(value);
}

function LoadingFigure() {
  return (
    <div className="figure-loading" role="status">
      <span />
      <span />
      <span />
      Carregando os agregados…
    </div>
  );
}

function YearToggle({ year, setYear }: { year: number; setYear: (year: number) => void }) {
  return (
    <div className="segmented" aria-label="Escolha o exercício">
      {[2025, 2026].map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={year === value}
          onClick={() => setYear(value)}
        >
          Exercício {value}
        </button>
      ))}
    </div>
  );
}

function MetricToggle({ metric, setMetric, people = true }: { metric: Metric; setMetric: (m: Metric) => void; people?: boolean }) {
  const options: [Metric, string][] = [
    ...(people ? ([["contribuintes", "Pessoas"]] as [Metric, string][]) : []),
    ["rend_total", "Renda média"],
    ["patrimonio", "Patrimônio médio"],
  ];
  return (
    <div className="metric-toggle" aria-label="Escolha a medida">
      {options.map(([value, label]) => (
        <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Bars({ items, labelKey, metric, color = "green" }: { items: Row[]; labelKey: string; metric: Metric; color?: string }) {
  const values = items.map((row) => average(row, metric));
  const max = Math.max(...values, 1);
  return (
    <div className="bars">
      {items.map((row, index) => {
        const value = values[index];
        const label = String(row[labelKey] ?? "Não informado");
        return (
          <div className="bar-row" key={`${label}-${index}`}>
            <div className="bar-label">{label}</div>
            <div className="bar-track" aria-hidden="true">
              <span className={`bar-fill ${color}`} style={{ width: `${Math.max((value / max) * 100, 0.8)}%` }} />
            </div>
            <div className="bar-value">{formatValue(value, metric)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function WealthFigure() {
  const data = useAnalysis();
  const [year, setYear] = useState(2025);
  if (!data) return <LoadingFigure />;
  const items = rows(data, "wealth_bands").filter((row) => number(row, "exercicio") === year);
  const total = rows(data, "overview").find((row) => number(row, "exercicio") === year)!;
  const top = items.reduce((best, row) => number(row, "ordem") > number(best, "ordem") ? row : best, items[0]);
  return (
    <div className="figure-card feature-figure">
      <div className="figure-head">
        <div>
          <p className="figure-kicker">Concentração declarada</p>
          <h2>Quem está acima de R$ 1 milhão</h2>
        </div>
        <YearToggle year={year} setYear={setYear} />
      </div>
      <div className="concentration-grid">
        <div className="concentration-number">
          <strong>{percent.format(number(top, "contribuintes") / number(total, "contribuintes"))}</strong>
          <span>dos declarantes</span>
        </div>
        <div className="concentration-arrow" aria-hidden="true">→</div>
        <div className="concentration-number accent">
          <strong>{percent.format(number(top, "patrimonio") / number(total, "patrimonio"))}</strong>
          <span>do patrimônio informado</span>
        </div>
      </div>
      <p className="figure-note">
        Esse grupo também concentra {percent.format(number(top, "rend_total") / number(total, "rend_total"))} da renda total declarada. Valores patrimoniais não equivalem a preços de mercado.
      </p>
    </div>
  );
}

export function DistributionFigure({ dataset, labelKey, initialMetric = "contribuintes", color = "green" }: { dataset: string; labelKey: string; initialMetric?: Metric; color?: string }) {
  const data = useAnalysis();
  const [year, setYear] = useState(2025);
  const [metric, setMetric] = useState<Metric>(initialMetric);
  if (!data) return <LoadingFigure />;
  const items = rows(data, dataset).filter((row) => number(row, "exercicio") === year);
  return (
    <div className="figure-card">
      <div className="figure-controls">
        <YearToggle year={year} setYear={setYear} />
        <MetricToggle metric={metric} setMetric={setMetric} />
      </div>
      <Bars items={items} labelKey={labelKey} metric={metric} color={color} />
      {year === 2026 && <p className="figure-note">O exercício 2026 tem universo menor no arquivo extraído e não deve ser lido como série perfeitamente comparável.</p>}
    </div>
  );
}

export function GenderFigure() {
  const data = useAnalysis();
  const [year, setYear] = useState(2025);
  const [metric, setMetric] = useState<Metric>("rend_total");
  if (!data) return <LoadingFigure />;
  const items = rows(data, "gender").filter((row) => number(row, "exercicio") === year);
  return (
    <div className="figure-card">
      <div className="figure-controls">
        <YearToggle year={year} setYear={setYear} />
        <MetricToggle metric={metric} setMetric={setMetric} />
      </div>
      <Bars items={items} labelKey="genero" metric={metric} color="orange" />
      <p className="figure-note">Médias anuais por declarante, reconstruídas como soma do grupo ÷ número de contribuintes.</p>
    </div>
  );
}

export function RaceFigure() {
  const data = useAnalysis();
  const [metric, setMetric] = useState<Metric>("rend_total");
  if (!data) return <LoadingFigure />;
  const all = rows(data, "race").filter((row) => number(row, "exercicio") === 2026);
  const total = all.reduce((sum, row) => sum + number(row, "contribuintes"), 0);
  const missing = all.find((row) => String(row.raca).toLowerCase().includes("não informado"));
  const items = all.filter((row) => row !== missing);
  return (
    <div className="figure-card race-figure">
      <div className="figure-head">
        <div>
          <p className="figure-kicker">Somente exercício 2026</p>
          <h2>Entre quem informou raça/cor</h2>
        </div>
        <MetricToggle metric={metric} setMetric={setMetric} people={false} />
      </div>
      <div className="missing-banner">
        <strong>{percent.format(number(missing ?? {}, "contribuintes") / total)}</strong>
        <span>dos declarantes estão sem raça/cor informada</span>
      </div>
      <Bars items={items} labelKey="raca" metric={metric} color="blue" />
      <p className="figure-note">As diferenças descrevem o subconjunto identificado no cadastro. A ausência pode ser seletiva e impede extrapolação direta para o conjunto dos declarantes ou da população.</p>
    </div>
  );
}

export function IntersectionFigure() {
  const data = useAnalysis();
  const [metric, setMetric] = useState<Metric>("rend_total");
  if (!data) return <LoadingFigure />;
  const items = rows(data, "race_gender").filter((row) => number(row, "exercicio") === 2026 && row.raca !== "Não Informado");
  const races = [...new Set(items.map((row) => String(row.raca)))];
  return (
    <div className="figure-card">
      <div className="figure-head">
        <div>
          <p className="figure-kicker">Intersecções</p>
          <h2>Gênero dentro de cada registro racial</h2>
        </div>
        <MetricToggle metric={metric} setMetric={setMetric} people={false} />
      </div>
      <div className="comparison-table" role="table" aria-label="Médias por raça e gênero">
        <div className="comparison-row heading" role="row"><span>Raça/cor</span><span>Mulheres</span><span>Homens</span></div>
        {races.map((race) => {
          const female = items.find((row) => row.raca === race && row.genero === "Feminino");
          const male = items.find((row) => row.raca === race && row.genero === "Masculino");
          return <div className="comparison-row" role="row" key={race}><strong>{race}</strong><span>{female ? formatValue(average(female, metric), metric) : "—"}</span><span>{male ? formatValue(average(male, metric), metric) : "—"}</span></div>;
        })}
      </div>
    </div>
  );
}

export function TerritoryExplorer() {
  const data = useAnalysis();
  const [year, setYear] = useState(2025);
  const [metric, setMetric] = useState<Metric>("rend_total");
  const [mode, setMode] = useState<"states" | "municipalities">("states");
  const [query, setQuery] = useState("");
  if (!data) return <LoadingFigure />;
  const labelKey = mode === "states" ? "nome_uf" : "municipio_uf";
  const min = mode === "states" ? 100_000 : 50_000;
  const items = rows(data, mode)
    .filter((row) => number(row, "exercicio") === year && number(row, "contribuintes") >= min)
    .filter((row) => String(row[labelKey]).toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))
    .sort((a, b) => average(b, metric) - average(a, metric))
    .slice(0, 15);
  return (
    <div className="figure-card territory-explorer">
      <div className="figure-controls wrap">
        <YearToggle year={year} setYear={setYear} />
        <MetricToggle metric={metric} setMetric={setMetric} />
      </div>
      <div className="explorer-toolbar">
        <div className="segmented">
          <button type="button" aria-pressed={mode === "states"} onClick={() => setMode("states")}>Estados</button>
          <button type="button" aria-pressed={mode === "municipalities"} onClick={() => setMode("municipalities")}>Municípios</button>
        </div>
        <label className="search-field">
          <span>Filtrar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === "states" ? "Nome do estado" : "Cidade ou UF"} />
        </label>
      </div>
      <div className="ranking-table">
        <div className="ranking-row heading"><span>#</span><span>Local</span><span>Declarantes</span><span>{metric === "contribuintes" ? "Total" : metric === "rend_total" ? "Renda média" : "Patrimônio médio"}</span></div>
        {items.map((row, index) => <div className="ranking-row" key={String(row[labelKey])}><span>{String(index + 1).padStart(2, "0")}</span><strong>{String(row[labelKey])}</strong><span>{integer.format(number(row, "contribuintes"))}</span><span>{formatValue(average(row, metric), metric)}</span></div>)}
      </div>
      <p className="figure-note">Ranking restrito a {mode === "states" ? "100 mil" : "50 mil"} declarantes ou mais para reduzir instabilidade e exposição de células pequenas.</p>
    </div>
  );
}

export function WorkExplorer() {
  const data = useAnalysis();
  const [year, setYear] = useState(2025);
  const [metric, setMetric] = useState<Metric>("rend_total");
  const [kind, setKind] = useState<"occupations" | "employment_nature">("occupations");
  if (!data) return <LoadingFigure />;
  const labelKey = kind === "occupations" ? "ocupacao" : "natureza";
  const min = kind === "occupations" ? 20_000 : 100_000;
  const items = rows(data, kind)
    .filter((row) => number(row, "exercicio") === year && number(row, "contribuintes") >= min)
    .sort((a, b) => average(b, metric) - average(a, metric))
    .slice(0, 12);
  return (
    <div className="figure-card work-explorer">
      <div className="figure-controls wrap">
        <YearToggle year={year} setYear={setYear} />
        <MetricToggle metric={metric} setMetric={setMetric} />
      </div>
      <div className="segmented subsection-toggle">
        <button type="button" aria-pressed={kind === "occupations"} onClick={() => setKind("occupations")}>Ocupações</button>
        <button type="button" aria-pressed={kind === "employment_nature"} onClick={() => setKind("employment_nature")}>Natureza do vínculo</button>
      </div>
      <Bars items={items} labelKey={labelKey} metric={metric} color="gold" />
      <p className="figure-note">Ocupação é autodeclarada e não equivale necessariamente ao trabalho exercido durante todo o ano. O corte mínimo evita rankings de grupos diminutos.</p>
    </div>
  );
}

export function SourceScale() {
  const data = useAnalysis();
  if (!data) return <LoadingFigure />;
  const overview = rows(data, "overview");
  return (
    <div className="source-scale">
      {overview.map((row) => <div key={number(row, "exercicio")}><span>Exercício {number(row, "exercicio")}</span><strong>{compact.format(number(row, "contribuintes"))}</strong><small>declarantes representados</small></div>)}
      <div><span>Cubo extraído</span><strong>50,1 mi</strong><small>células agregadas, não pessoas</small></div>
    </div>
  );
}
