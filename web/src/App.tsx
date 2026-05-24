import { useState, useCallback, useEffect } from "react";
import { Shell, type NavItem } from "./components/Shell";

// ── Types ────────────────────────────────────────────────────────────────────

type Unit = { label: string; symbol: string; toBase: (v: number) => number; fromBase: (v: number) => number };
type Category = { id: string; label: string; icon: string; units: Unit[] };

type HistoryEntry = {
  id: string;
  category: string;
  from: string;
  to: string;
  fromVal: string;
  toVal: string;
  ts: number;
};

// ── Conversion data ───────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: "length",
    label: "Length",
    icon: "📏",
    units: [
      { label: "Millimetre",  symbol: "mm",  toBase: v => v / 1000,        fromBase: v => v * 1000 },
      { label: "Centimetre",  symbol: "cm",  toBase: v => v / 100,         fromBase: v => v * 100 },
      { label: "Metre",       symbol: "m",   toBase: v => v,               fromBase: v => v },
      { label: "Kilometre",   symbol: "km",  toBase: v => v * 1000,        fromBase: v => v / 1000 },
      { label: "Inch",        symbol: "in",  toBase: v => v * 0.0254,      fromBase: v => v / 0.0254 },
      { label: "Foot",        symbol: "ft",  toBase: v => v * 0.3048,      fromBase: v => v / 0.3048 },
      { label: "Yard",        symbol: "yd",  toBase: v => v * 0.9144,      fromBase: v => v / 0.9144 },
      { label: "Mile",        symbol: "mi",  toBase: v => v * 1609.344,    fromBase: v => v / 1609.344 },
      { label: "Nautical mi", symbol: "nmi", toBase: v => v * 1852,        fromBase: v => v / 1852 },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    icon: "⚖️",
    units: [
      { label: "Milligram",  symbol: "mg",  toBase: v => v / 1_000_000, fromBase: v => v * 1_000_000 },
      { label: "Gram",       symbol: "g",   toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { label: "Kilogram",   symbol: "kg",  toBase: v => v,             fromBase: v => v },
      { label: "Tonne",      symbol: "t",   toBase: v => v * 1000,      fromBase: v => v / 1000 },
      { label: "Ounce",      symbol: "oz",  toBase: v => v * 0.028349,  fromBase: v => v / 0.028349 },
      { label: "Pound",      symbol: "lb",  toBase: v => v * 0.453592,  fromBase: v => v / 0.453592 },
      { label: "Stone",      symbol: "st",  toBase: v => v * 6.35029,   fromBase: v => v / 6.35029 },
    ],
  },
  {
    id: "temperature",
    label: "Temp",
    icon: "🌡️",
    units: [
      { label: "Celsius",    symbol: "°C", toBase: v => v,                    fromBase: v => v },
      { label: "Fahrenheit", symbol: "°F", toBase: v => (v - 32) * 5 / 9,    fromBase: v => v * 9 / 5 + 32 },
      { label: "Kelvin",     symbol: "K",  toBase: v => v - 273.15,           fromBase: v => v + 273.15 },
    ],
  },
  {
    id: "area",
    label: "Area",
    icon: "▦",
    units: [
      { label: "mm²",        symbol: "mm²",  toBase: v => v / 1e6,       fromBase: v => v * 1e6 },
      { label: "cm²",        symbol: "cm²",  toBase: v => v / 1e4,       fromBase: v => v * 1e4 },
      { label: "m²",         symbol: "m²",   toBase: v => v,             fromBase: v => v },
      { label: "Hectare",    symbol: "ha",   toBase: v => v * 1e4,       fromBase: v => v / 1e4 },
      { label: "km²",        symbol: "km²",  toBase: v => v * 1e6,       fromBase: v => v / 1e6 },
      { label: "in²",        symbol: "in²",  toBase: v => v * 0.000645,  fromBase: v => v / 0.000645 },
      { label: "ft²",        symbol: "ft²",  toBase: v => v * 0.092903,  fromBase: v => v / 0.092903 },
      { label: "Acre",       symbol: "ac",   toBase: v => v * 4046.86,   fromBase: v => v / 4046.86 },
      { label: "mi²",        symbol: "mi²",  toBase: v => v * 2.59e6,    fromBase: v => v / 2.59e6 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    icon: "🧪",
    units: [
      { label: "Millilitre", symbol: "mL",   toBase: v => v / 1000,      fromBase: v => v * 1000 },
      { label: "Litre",      symbol: "L",    toBase: v => v,             fromBase: v => v },
      { label: "m³",         symbol: "m³",   toBase: v => v * 1000,      fromBase: v => v / 1000 },
      { label: "Teaspoon",   symbol: "tsp",  toBase: v => v * 0.004929,  fromBase: v => v / 0.004929 },
      { label: "Tablespoon", symbol: "tbsp", toBase: v => v * 0.014787,  fromBase: v => v / 0.014787 },
      { label: "Fl oz (US)", symbol: "fl oz",toBase: v => v * 0.029574,  fromBase: v => v / 0.029574 },
      { label: "Cup (US)",   symbol: "cup",  toBase: v => v * 0.236588,  fromBase: v => v / 0.236588 },
      { label: "Pint (US)",  symbol: "pt",   toBase: v => v * 0.473176,  fromBase: v => v / 0.473176 },
      { label: "Gallon (US)",symbol: "gal",  toBase: v => v * 3.78541,   fromBase: v => v / 3.78541 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    icon: "💨",
    units: [
      { label: "m/s",   symbol: "m/s",  toBase: v => v,            fromBase: v => v },
      { label: "km/h",  symbol: "km/h", toBase: v => v / 3.6,      fromBase: v => v * 3.6 },
      { label: "mph",   symbol: "mph",  toBase: v => v * 0.44704,  fromBase: v => v / 0.44704 },
      { label: "Knot",  symbol: "kn",   toBase: v => v * 0.514444, fromBase: v => v / 0.514444 },
      { label: "ft/s",  symbol: "ft/s", toBase: v => v * 0.3048,   fromBase: v => v / 0.3048 },
    ],
  },
  {
    id: "data",
    label: "Data",
    icon: "💾",
    units: [
      { label: "Bit",      symbol: "b",   toBase: v => v,              fromBase: v => v },
      { label: "Byte",     symbol: "B",   toBase: v => v * 8,          fromBase: v => v / 8 },
      { label: "Kilobyte", symbol: "KB",  toBase: v => v * 8 * 1024,   fromBase: v => v / (8 * 1024) },
      { label: "Megabyte", symbol: "MB",  toBase: v => v * 8 * 1024**2,fromBase: v => v / (8 * 1024**2) },
      { label: "Gigabyte", symbol: "GB",  toBase: v => v * 8 * 1024**3,fromBase: v => v / (8 * 1024**3) },
      { label: "Terabyte", symbol: "TB",  toBase: v => v * 8 * 1024**4,fromBase: v => v / (8 * 1024**4) },
    ],
  },
  {
    id: "time",
    label: "Time",
    icon: "⏱️",
    units: [
      { label: "Millisecond", symbol: "ms",  toBase: v => v / 1000,        fromBase: v => v * 1000 },
      { label: "Second",      symbol: "s",   toBase: v => v,               fromBase: v => v },
      { label: "Minute",      symbol: "min", toBase: v => v * 60,          fromBase: v => v / 60 },
      { label: "Hour",        symbol: "hr",  toBase: v => v * 3600,        fromBase: v => v / 3600 },
      { label: "Day",         symbol: "d",   toBase: v => v * 86400,       fromBase: v => v / 86400 },
      { label: "Week",        symbol: "wk",  toBase: v => v * 604800,      fromBase: v => v / 604800 },
      { label: "Month (avg)", symbol: "mo",  toBase: v => v * 2629800,     fromBase: v => v / 2629800 },
      { label: "Year",        symbol: "yr",  toBase: v => v * 31557600,    fromBase: v => v / 31557600 },
    ],
  },
  {
    id: "energy",
    label: "Energy",
    icon: "⚡",
    units: [
      { label: "Joule",     symbol: "J",    toBase: v => v,           fromBase: v => v },
      { label: "Kilojoule", symbol: "kJ",   toBase: v => v * 1000,    fromBase: v => v / 1000 },
      { label: "Calorie",   symbol: "cal",  toBase: v => v * 4.184,   fromBase: v => v / 4.184 },
      { label: "Kilocalorie",symbol:"kcal", toBase: v => v * 4184,    fromBase: v => v / 4184 },
      { label: "Watt-hour", symbol: "Wh",   toBase: v => v * 3600,    fromBase: v => v / 3600 },
      { label: "kWh",       symbol: "kWh",  toBase: v => v * 3.6e6,   fromBase: v => v / 3.6e6 },
      { label: "BTU",       symbol: "BTU",  toBase: v => v * 1055.06, fromBase: v => v / 1055.06 },
    ],
  },
  {
    id: "pressure",
    label: "Pressure",
    icon: "🔵",
    units: [
      { label: "Pascal",      symbol: "Pa",   toBase: v => v,           fromBase: v => v },
      { label: "Kilopascal",  symbol: "kPa",  toBase: v => v * 1000,    fromBase: v => v / 1000 },
      { label: "Bar",         symbol: "bar",  toBase: v => v * 1e5,     fromBase: v => v / 1e5 },
      { label: "Atmosphere",  symbol: "atm",  toBase: v => v * 101325,  fromBase: v => v / 101325 },
      { label: "PSI",         symbol: "psi",  toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
      { label: "mmHg (Torr)", symbol: "mmHg", toBase: v => v * 133.322, fromBase: v => v / 133.322 },
    ],
  },
];

const NAV_ITEMS: NavItem[] = CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatResult(v: number): string {
  if (!isFinite(v)) return "—";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) return v.toExponential(6);
  if (abs >= 1000) return parseFloat(v.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  return parseFloat(v.toPrecision(10)).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function convert(value: number, from: Unit, to: Unit): number {
  return to.fromBase(from.toBase(value));
}

const HISTORY_KEY = "unitconverter_history";
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
}

// ── Components ────────────────────────────────────────────────────────────────

function UnitSelect({ units, value, onChange }: { units: Unit[]; value: string; onChange: (s: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none cursor-pointer"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        borderColor: "var(--line-strong)",
        fontFamily: "Manrope, sans-serif",
      }}
    >
      {units.map(u => (
        <option key={u.symbol} value={u.symbol}>
          {u.label} ({u.symbol})
        </option>
      ))}
    </select>
  );
}

function ConverterPanel({ category }: { category: Category }) {
  const [fromSymbol, setFromSymbol] = useState(category.units[0].symbol);
  const [toSymbol, setToSymbol] = useState(category.units[1].symbol);
  const [inputVal, setInputVal] = useState("1");
  const [copied, setCopied] = useState(false);

  const fromUnit = category.units.find(u => u.symbol === fromSymbol) ?? category.units[0];
  const toUnit   = category.units.find(u => u.symbol === toSymbol)   ?? category.units[1];

  const numInput = parseFloat(inputVal);
  const result   = isNaN(numInput) ? null : convert(numInput, fromUnit, toUnit);

  // Save to history on valid conversion
  useEffect(() => {
    if (result === null || inputVal === "") return;
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      category: category.label,
      from: fromUnit.symbol,
      to: toUnit.symbol,
      fromVal: inputVal,
      toVal: formatResult(result),
      ts: Date.now(),
    };
    const h = loadHistory();
    // Deduplicate consecutive identical entries
    if (h[0]?.fromVal === entry.fromVal && h[0]?.from === entry.from && h[0]?.to === entry.to) return;
    saveHistory([entry, ...h]);
  }, [result, inputVal, fromUnit.symbol, toUnit.symbol, category.label]);

  const swap = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    if (result !== null) setInputVal(formatResult(result).replace(/,/g, ""));
  }, [fromSymbol, toSymbol, result]);

  const copyResult = useCallback(() => {
    if (result === null) return;
    navigator.clipboard.writeText(formatResult(result)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [result]);

  // All-units table
  const allResults = category.units.map(u => ({
    unit: u,
    value: isNaN(numInput) ? null : convert(numInput, fromUnit, u),
  }));

  return (
    <div className="space-y-5">
      {/* Main converter card */}
      <div
        className="rounded-2xl p-5 border space-y-4"
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
      >
        {/* From */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            From
          </label>
          <UnitSelect units={category.units} value={fromSymbol} onChange={setFromSymbol} />
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Enter value…"
            className="w-full px-4 py-3 rounded-xl text-2xl font-bold border outline-none"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              borderColor: "var(--accent)",
              fontFamily: "Fraunces, serif",
            }}
          />
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={swap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 active:scale-95"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line-strong)",
              color: "var(--ink)",
            }}
          >
            <span className="text-base">⇅</span> Swap
          </button>
        </div>

        {/* To */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            To
          </label>
          <UnitSelect units={category.units} value={toSymbol} onChange={setToSymbol} />
          <div
            className="w-full px-4 py-3 rounded-xl border flex items-center justify-between gap-3"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line)",
              minHeight: "3.5rem",
            }}
          >
            <span
              className="text-2xl font-bold break-all"
              style={{ fontFamily: "Fraunces, serif", color: result !== null ? "var(--accent)" : "var(--muted)" }}
            >
              {result !== null ? formatResult(result) : "—"}
            </span>
            {result !== null && (
              <button
                onClick={copyResult}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: copied ? "var(--success)" : "var(--line)",
                  color: copied ? "#fff" : "var(--ink)",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            )}
          </div>
        </div>

        {/* Formula hint */}
        {result !== null && (
          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            {inputVal} {fromUnit.symbol} = {formatResult(result)} {toUnit.symbol}
          </p>
        )}
      </div>

      {/* All units table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className="px-5 py-3 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: "var(--line)", background: "var(--panel)", color: "var(--muted)" }}
        >
          All {category.label} Units
        </div>
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {allResults.map(({ unit, value }) => (
            <div
              key={unit.symbol}
              className="flex items-center justify-between px-5 py-3 transition-colors"
              style={{
                background: unit.symbol === fromSymbol ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--paper)",
              }}
            >
              <div>
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{unit.label}</span>
                <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>{unit.symbol}</span>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: unit.symbol === fromSymbol ? "var(--ink)" : "var(--accent)" }}
              >
                {value !== null ? formatResult(value) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryPanel() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    const onStorage = () => setHistory(loadHistory());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const clear = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: "var(--muted)" }}>
        <span className="text-5xl">🕐</span>
        <p className="text-sm font-medium">No conversions yet</p>
        <p className="text-xs">Your recent conversions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
          Last {history.length} conversions
        </h2>
        <button
          onClick={clear}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
          style={{ background: "var(--line)", color: "var(--ink)" }}
        >
          Clear all
        </button>
      </div>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="divide-y" style={{ borderColor: "var(--line)" }}>
          {history.map(entry => (
            <div
              key={entry.id}
              className="px-5 py-3 flex items-center justify-between gap-4"
              style={{ background: "var(--paper)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                  {entry.fromVal} {entry.from} → {entry.toVal} {entry.to}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {entry.category} · {new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const ALL_NAV: NavItem[] = [
  ...NAV_ITEMS,
  { id: "history", label: "History", icon: "🕐" },
];

export default function App() {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);

  const activeCategory = CATEGORIES.find(c => c.id === activeId);

  return (
    <Shell navItems={ALL_NAV} activeId={activeId} onNav={setActiveId}>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            {activeId === "history"
              ? "History"
              : `${ALL_NAV.find(n => n.id === activeId)?.icon} ${activeCategory?.label ?? ""}`}
          </h1>
          {activeId !== "history" && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {activeCategory?.units.length} units available
            </p>
          )}
        </div>

        {/* Content */}
        {activeId === "history" ? (
          <HistoryPanel />
        ) : activeCategory ? (
          <ConverterPanel key={activeCategory.id} category={activeCategory} />
        ) : null}
      </div>
    </Shell>
  );
}
