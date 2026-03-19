// ============================================================
// components/ConsultorView.jsx
// Visão hierárquica: Consultor → Representante → Cliente
// Filtros: Período, Tipo, UF, UNEG, Especificação, CNPJ Raiz
// Funcionalidades: Expandir tudo, Ordenar colunas, Exportar Excel
// ============================================================
'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Users, User, Building2,
  Search, Download, ArrowUp, ArrowDown, ArrowUpDown,
  Maximize2, Minimize2, X, BarChart3, TrendingUp,
  Filter, RefreshCw, Hash,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────
const UFS = ['SP', 'MG', 'RS', 'PR', 'SC', 'RJ', 'GO', 'MT', 'MS', 'BA', 'PE', 'CE'];
const TIPOS = ['INDUSTRIA', 'REVENDA', 'CONSUMO'];
const UNEGS = ['01 - PARAFUSOS', '02 - PORCAS', '03 - ARRUELAS', '04 - ESPECIAIS'];
const SPECS = ['INOX A2', 'INOX A4', 'CARBONO', 'GALVANIZADO', 'POLIPROPILENO', 'NYLON'];

const PERIODOS = [
  { label: 'Janeiro', value: '01' },
  { label: 'Fevereiro', value: '02' },
  { label: 'Março', value: '03' },
  { label: 'Abril', value: '04' },
  { label: 'Maio', value: '05' },
  { label: 'Junho', value: '06' },
  { label: 'Julho', value: '07' },
  { label: 'Agosto', value: '08' },
  { label: 'Setembro', value: '09' },
  { label: 'Outubro', value: '10' },
  { label: 'Novembro', value: '11' },
  { label: 'Dezembro', value: '12' },
  { label: '1º Trimestre', value: 'Q1' },
  { label: '2º Trimestre', value: 'Q2' },
  { label: '3º Trimestre', value: 'Q3' },
  { label: '4º Trimestre', value: 'Q4' },
  { label: '1º Semestre', value: 'S1' },
  { label: '2º Semestre', value: 'S2' },
  { label: '2024 (Ano)', value: '2024' },
  { label: '2025 (Ano)', value: '2025' },
];

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DE DADOS MOCK
// ─────────────────────────────────────────────────────────────
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

const NOMES_CONSULTORES = [
  'ALFREDO MENDES', 'BEATRIZ SANTOS', 'CARLOS RODRIGUES',
  'DANIELA LIMA', 'EDUARDO COSTA',
];

const NOMES_REPS = [
  'JOÃO SILVA - V001', 'MARIA OLIVEIRA - V002', 'PEDRO ALVES - V003',
  'ANA FERREIRA - V004', 'LUCAS SOUZA - V005', 'JULIA PEREIRA - V006',
  'ROBERTO CASTRO - V007', 'FERNANDA LIMA - V008', 'MARCOS SANTOS - V009',
  'PATRICIA NUNES - V010', 'THIAGO ROCHA - V011', 'AMANDA FARIAS - V012',
  'GABRIEL MOURA - V013', 'LETICIA DUARTE - V014',
];

const NOMES_CLIENTES = [
  'METALÚRGICA ALFA LTDA', 'CONSTRUTORA BETA S.A.', 'DISTRIBUIDORA GAMMA ME',
  'INDÚSTRIA DELTA EIRELI', 'COMÉRCIO EPSILON S.A.', 'FÁBRICA ZETA LTDA',
  'GRUPO ETA INDUSTRIAL', 'TRANSPORTES THETA ME', 'SERVIÇOS IOTA S.A.',
  'PRODUTOS KAPPA LTDA', 'MONTAGEM LAMBDA ME', 'SOLUÇÕES MU S.A.',
  'TÉCNICA NU EIRELI', 'LOGÍSTICA XI LTDA', 'SISTEMAS OMICRON ME',
  'ENGENHARIA PI S.A.', 'MATERIAIS RHO LTDA', 'AUTOMAÇÃO SIGMA ME',
  'PROJETOS TAU S.A.', 'COMPONENTES UPSILON LTDA',
  'FORÇA FIOS LTDA', 'METALFIX S.A.', 'INDU PESCA ME',
  'CONSTRU TOTAL EIRELI', 'PLÁSTICOS ORO LTDA',
];

const MESES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function generateMockData() {
  let repCounter = 0;
  let cliCounter = 0;

  return NOMES_CONSULTORES.map((nome, ci) => {
    const numReps = randInt(2, 4);
    const representantes = Array.from({ length: numReps }, (_, ri) => {
      const repNome = NOMES_REPS[(repCounter++) % NOMES_REPS.length];
      const numClientes = randInt(4, 8);

      const clientes = Array.from({ length: numClientes }, (_, cliI) => {
        const receita = rand(25000, 950000);
        const cnpjBase = String(randInt(10000000, 99999999)).padStart(8, '0');
        return {
          id: `cli-${cliCounter++}`,
          nome: NOMES_CLIENTES[(cliCounter) % NOMES_CLIENTES.length],
          cnpj: `${cnpjBase.slice(0, 2)}.${cnpjBase.slice(2, 5)}.${cnpjBase.slice(5, 8)}/0001-${String(randInt(1, 99)).padStart(2, '0')}`,
          cnpjRaiz: cnpjBase,
          uf: pick(UFS),
          tipo: pick(TIPOS),
          uneg: pick(UNEGS),
          spec: pick(SPECS),
          mes: pick(MESES),
          TOTAL: receita,
          PMK: rand(8, 62),
          MEDIA_COMISSAO: rand(2, 9),
          MEDIA_DESCONTO: rand(3, 28),
          pedidos: randInt(5, 80),
        };
      });

      const n = clientes.length || 1;
      return {
        id: `rep-${ci}-${ri}`,
        nome: repNome,
        clientes,
        TOTAL: clientes.reduce((s, c) => s + c.TOTAL, 0),
        PMK: clientes.reduce((s, c) => s + c.PMK, 0) / n,
        MEDIA_COMISSAO: clientes.reduce((s, c) => s + c.MEDIA_COMISSAO, 0) / n,
        MEDIA_DESCONTO: clientes.reduce((s, c) => s + c.MEDIA_DESCONTO, 0) / n,
      };
    });

    const n = representantes.length || 1;
    return {
      id: `cons-${ci}`,
      nome,
      representantes,
      TOTAL: representantes.reduce((s, r) => s + r.TOTAL, 0),
      PMK: representantes.reduce((s, r) => s + r.PMK, 0) / n,
      MEDIA_COMISSAO: representantes.reduce((s, r) => s + r.MEDIA_COMISSAO, 0) / n,
      MEDIA_DESCONTO: representantes.reduce((s, r) => s + r.MEDIA_DESCONTO, 0) / n,
    };
  });
}

// Gerado uma única vez por sessão
const MOCK_DATA = generateMockData();

// ─────────────────────────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────────────────────────
const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    notation: 'compact', maximumFractionDigits: 1,
  }).format(v || 0);

const fmtCurrencyFull = (v) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(v || 0);

const fmtPct = (v) => `${Number(v || 0).toFixed(1)}%`;
const fmtPMK = (v) => `R$ ${Number(v || 0).toFixed(2)}/kg`;

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────────────────────

function SortIcon({ field, sort }) {
  if (sort.field !== field) return <ArrowUpDown className="w-3 h-3 opacity-25 flex-shrink-0" />;
  return sort.dir === 'asc'
    ? <ArrowUp className="w-3 h-3 text-blue-500 flex-shrink-0" />
    : <ArrowDown className="w-3 h-3 text-blue-500 flex-shrink-0" />;
}

function MetricCell({ value, type }) {
  const fmt = type === 'currency' ? fmtCurrency(value)
    : type === 'pmk' ? fmtPMK(value)
    : fmtPct(value);

  const color =
    type === 'desconto' ? value > 20 ? 'text-red-600' : value > 12 ? 'text-amber-600' : 'text-emerald-600'
    : type === 'comissao' ? 'text-blue-700'
    : 'text-gray-900';

  return (
    <span className={`text-sm font-bold tabular-nums ${color}`}>{fmt}</span>
  );
}

// Badge de tipo de cliente
function TipoBadge({ tipo }) {
  const map = {
    INDUSTRIA: 'bg-blue-100 text-blue-700',
    REVENDA: 'bg-purple-100 text-purple-700',
    CONSUMO: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${map[tipo] || 'bg-gray-100 text-gray-500'}`}>
      {tipo}
    </span>
  );
}

// ── Linha de CLIENTE ──────────────────────────────────────────
function ClienteRow({ cliente }) {
  return (
    <tr className="group hover:bg-blue-50/30 border-b border-gray-50 transition-colors">
      <td className="py-2.5 pr-3" style={{ paddingLeft: 80 }}>
        <div className="flex items-center gap-2.5">
          <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-700 truncate" title={cliente.nome}>
              {cliente.nome}
            </div>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-[10px] text-gray-400 font-mono">{cliente.cnpj}</span>
              <TipoBadge tipo={cliente.tipo} />
              <span className="text-[10px] text-gray-400 font-semibold">{cliente.uf}</span>
              <span className="text-[10px] text-gray-400">{cliente.pedidos} pedidos</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-right">
        <MetricCell value={cliente.TOTAL} type="currency" />
      </td>
      <td className="px-4 py-2.5 text-right">
        <MetricCell value={cliente.PMK} type="pmk" />
      </td>
      <td className="px-4 py-2.5 text-right">
        <MetricCell value={cliente.MEDIA_COMISSAO} type="comissao" />
      </td>
      <td className="px-4 py-2.5 text-right pr-5">
        <MetricCell value={cliente.MEDIA_DESCONTO} type="desconto" />
      </td>
    </tr>
  );
}

// ── Linha de REPRESENTANTE ────────────────────────────────────
function RepresentanteRow({ rep, isExpanded, onToggle }) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-indigo-50/60 border-b border-gray-100 transition-colors select-none"
        onClick={onToggle}
      >
        <td className="py-2.5 pr-3" style={{ paddingLeft: 40 }}>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
              isExpanded ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              {isExpanded
                ? <ChevronDown className="w-3 h-3 text-indigo-500" />
                : <ChevronRight className="w-3 h-3 text-gray-400" />
              }
            </div>
            <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-gray-800">{rep.nome}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {rep.clientes.length} cliente{rep.clientes.length !== 1 ? 's' : ''}
                {' · '}
                {fmtCurrencyFull(rep.TOTAL)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-2.5 text-right">
          <MetricCell value={rep.TOTAL} type="currency" />
        </td>
        <td className="px-4 py-2.5 text-right">
          <MetricCell value={rep.PMK} type="pmk" />
        </td>
        <td className="px-4 py-2.5 text-right">
          <MetricCell value={rep.MEDIA_COMISSAO} type="comissao" />
        </td>
        <td className="px-4 py-2.5 text-right pr-5">
          <MetricCell value={rep.MEDIA_DESCONTO} type="desconto" />
        </td>
      </tr>

      {isExpanded && rep.clientes.map(c => (
        <ClienteRow key={c.id} cliente={c} />
      ))}
    </>
  );
}

// Paleta de cores por índice de consultor
const CONS_PALETTES = [
  { rowBg: 'bg-blue-50', border: 'border-l-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', titleColor: 'text-blue-800' },
  { rowBg: 'bg-indigo-50', border: 'border-l-indigo-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', titleColor: 'text-indigo-800' },
  { rowBg: 'bg-violet-50', border: 'border-l-violet-500', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', titleColor: 'text-violet-800' },
  { rowBg: 'bg-emerald-50', border: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', titleColor: 'text-emerald-800' },
  { rowBg: 'bg-orange-50', border: 'border-l-orange-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', titleColor: 'text-orange-800' },
];

// ── Linha de CONSULTOR ────────────────────────────────────────
function ConsultorRow({ consultor, index, expandedReps, onToggleConsultor, onToggleRep, isExpanded }) {
  const pal = CONS_PALETTES[index % CONS_PALETTES.length];
  const totalClientes = consultor.representantes.reduce((s, r) => s + r.clientes.length, 0);

  return (
    <>
      <tr
        className={`cursor-pointer border-b border-gray-200 border-l-4 ${pal.rowBg} ${pal.border} transition-colors select-none`}
        onClick={onToggleConsultor}
      >
        <td className="pl-4 pr-3 py-3.5">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
              isExpanded ? pal.iconBg : 'bg-gray-200'
            } transition-colors`}>
              {isExpanded
                ? <ChevronDown className={`w-3.5 h-3.5 ${pal.iconColor}`} />
                : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              }
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pal.iconBg}`}>
              <Users className={`w-4.5 h-4.5 ${pal.iconColor}`} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className={`text-sm font-black ${pal.titleColor}`}>{consultor.nome}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                <span className="font-semibold">{consultor.representantes.length}</span> representante{consultor.representantes.length !== 1 ? 's' : ''}
                {' · '}
                <span className="font-semibold">{totalClientes}</span> cliente{totalClientes !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5 text-right">
          <MetricCell value={consultor.TOTAL} type="currency" />
        </td>
        <td className="px-4 py-3.5 text-right">
          <MetricCell value={consultor.PMK} type="pmk" />
        </td>
        <td className="px-4 py-3.5 text-right">
          <MetricCell value={consultor.MEDIA_COMISSAO} type="comissao" />
        </td>
        <td className="px-4 py-3.5 text-right pr-5">
          <MetricCell value={consultor.MEDIA_DESCONTO} type="desconto" />
        </td>
      </tr>

      {isExpanded && consultor.representantes.map(rep => (
        <RepresentanteRow
          key={rep.id}
          rep={rep}
          isExpanded={expandedReps.has(rep.id)}
          onToggle={() => onToggleRep(rep.id)}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────
function SummaryCards({ data }) {
  const { TOTAL, PMK, COMISSAO, DESCONTO, n } = data.reduce((acc, c) => ({
    TOTAL: acc.TOTAL + c.TOTAL,
    PMK: acc.PMK + c.PMK,
    COMISSAO: acc.COMISSAO + c.MEDIA_COMISSAO,
    DESCONTO: acc.DESCONTO + c.MEDIA_DESCONTO,
    n: acc.n + 1,
  }), { TOTAL: 0, PMK: 0, COMISSAO: 0, DESCONTO: 0, n: 0 });

  const div = n || 1;
  const totalClientes = data.reduce((s, c) =>
    s + c.representantes.reduce((sr, r) => sr + r.clientes.length, 0), 0);

  const cards = [
    {
      label: 'Receita Total',
      value: fmtCurrency(TOTAL),
      sub: `${data.length} consultores`,
      icon: '💰',
      bg: 'bg-emerald-50 border-emerald-200',
      val: 'text-emerald-900',
    },
    {
      label: 'PMK Médio',
      value: fmtPMK(PMK / div),
      sub: 'Preço médio / kg',
      icon: '⚖️',
      bg: 'bg-blue-50 border-blue-200',
      val: 'text-blue-900',
    },
    {
      label: 'Comissão Média',
      value: fmtPct(COMISSAO / div),
      sub: 'Média geral',
      icon: '📊',
      bg: 'bg-indigo-50 border-indigo-200',
      val: 'text-indigo-900',
    },
    {
      label: 'Desconto Médio',
      value: fmtPct(DESCONTO / div),
      sub: 'Média geral',
      icon: '🏷️',
      bg: 'bg-amber-50 border-amber-200',
      val: 'text-amber-900',
    },
    {
      label: 'Total de Clientes',
      value: String(totalClientes),
      sub: `Em ${data.reduce((s, c) => s + c.representantes.length, 0)} representantes`,
      icon: '🏢',
      bg: 'bg-violet-50 border-violet-200',
      val: 'text-violet-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {cards.map(card => (
        <div key={card.label} className={`rounded-xl border px-4 py-3 ${card.bg}`}>
          <div className="text-base mb-1">{card.icon}</div>
          <div className={`text-xl font-black leading-none ${card.val}`}>{card.value}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium leading-tight">{card.label}</div>
          <div className="text-[10px] text-gray-400 leading-tight">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HEADER FILTER BAR
// ─────────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, valueKey = null, labelKey = null }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`text-xs border rounded-lg px-2.5 py-1.5 outline-none transition-all cursor-pointer font-medium ${
          value
            ? 'border-blue-400 bg-blue-50 text-blue-800 ring-1 ring-blue-200'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
        }`}
      >
        <option value="">Todos</option>
        {options.map(o => {
          const v = valueKey ? o[valueKey] : o;
          const l = labelKey ? o[labelKey] : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COLUNA HEADER
// ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'TOTAL', label: 'Total', hint: 'Receita total' },
  { key: 'PMK', label: 'PMK', hint: 'Preço médio/kg' },
  { key: 'MEDIA_COMISSAO', label: 'Méd. Comissão', hint: 'Comissão média %' },
  { key: 'MEDIA_DESCONTO', label: 'Méd. Desconto', hint: 'Desconto médio %' },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function ConsultorView() {
  // Filtros
  const [periodo, setPeriodo] = useState('');
  const [tipo, setTipo]       = useState('');
  const [uf, setUf]           = useState('');
  const [uneg, setUneg]       = useState('');
  const [spec, setSpec]       = useState('');
  const [cnpjSearch, setCnpjSearch] = useState('');

  // Estado de expansão (Set de IDs abertos)
  const [expandedConsultores, setExpandedConsultores] = useState(new Set());
  const [expandedReps, setExpandedReps]               = useState(new Set());

  // Ordenação
  const [sort, setSort] = useState({ field: 'TOTAL', dir: 'desc' });

  // ── Toggle consultor ────────────────────────────────────────
  const toggleConsultor = useCallback((id) => {
    setExpandedConsultores(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  // ── Toggle representante ────────────────────────────────────
  const toggleRep = useCallback((id) => {
    setExpandedReps(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  // ── Filtrar + calcular métricas + ordenar ───────────────────
  const filtered = useMemo(() => {
    // Período → meses incluídos
    const mesIncluso = (mes) => {
      if (!periodo) return true;
      if (periodo.length === 2 && !periodo.startsWith('Q') && !periodo.startsWith('S')) return mes === periodo;
      if (periodo === 'Q1') return ['01','02','03'].includes(mes);
      if (periodo === 'Q2') return ['04','05','06'].includes(mes);
      if (periodo === 'Q3') return ['07','08','09'].includes(mes);
      if (periodo === 'Q4') return ['10','11','12'].includes(mes);
      if (periodo === 'S1') return parseInt(mes) <= 6;
      if (periodo === 'S2') return parseInt(mes) > 6;
      return true; // ano → todos
    };

    let data = MOCK_DATA.map(consultor => {
      const representantes = consultor.representantes.map(rep => {
        const clientes = rep.clientes.filter(cli => {
          if (!mesIncluso(cli.mes)) return false;
          if (tipo && cli.tipo !== tipo) return false;
          if (uf && cli.uf !== uf) return false;
          if (uneg && cli.uneg !== uneg) return false;
          if (spec && cli.spec !== spec) return false;
          const q = cnpjSearch.replace(/\D/g, '');
          if (q && !cli.cnpjRaiz.includes(q)) return false;
          return true;
        });
        return { ...rep, clientes };
      }).filter(r => r.clientes.length > 0);

      return { ...consultor, representantes };
    }).filter(c => c.representantes.length > 0);

    // Recalcular métricas baseado nos clientes filtrados
    data = data.map(c => {
      const reps = c.representantes.map(r => {
        const clientes = r.clientes;
        const n = clientes.length || 1;
        return {
          ...r,
          TOTAL:          clientes.reduce((s, x) => s + x.TOTAL, 0),
          PMK:            clientes.reduce((s, x) => s + x.PMK, 0) / n,
          MEDIA_COMISSAO: clientes.reduce((s, x) => s + x.MEDIA_COMISSAO, 0) / n,
          MEDIA_DESCONTO: clientes.reduce((s, x) => s + x.MEDIA_DESCONTO, 0) / n,
        };
      });
      const n = reps.length || 1;
      return {
        ...c,
        representantes: reps,
        TOTAL:          reps.reduce((s, r) => s + r.TOTAL, 0),
        PMK:            reps.reduce((s, r) => s + r.PMK, 0) / n,
        MEDIA_COMISSAO: reps.reduce((s, r) => s + r.MEDIA_COMISSAO, 0) / n,
        MEDIA_DESCONTO: reps.reduce((s, r) => s + r.MEDIA_DESCONTO, 0) / n,
      };
    });

    // Ordenar
    data.sort((a, b) => {
      const va = a[sort.field] || 0;
      const vb = b[sort.field] || 0;
      if (sort.field === 'nome') return sort.dir === 'asc'
        ? a.nome.localeCompare(b.nome)
        : b.nome.localeCompare(a.nome);
      return sort.dir === 'asc' ? va - vb : vb - va;
    });

    return data;
  }, [periodo, tipo, uf, uneg, spec, cnpjSearch, sort]);

  // ── Expandir / Recolher tudo ────────────────────────────────
  const allExpanded = expandedConsultores.size === filtered.length && filtered.length > 0;

  const handleExpandAll = useCallback(() => {
    if (allExpanded) {
      setExpandedConsultores(new Set());
      setExpandedReps(new Set());
    } else {
      setExpandedConsultores(new Set(filtered.map(c => c.id)));
      setExpandedReps(new Set(
        filtered.flatMap(c => c.representantes.map(r => r.id))
      ));
    }
  }, [allExpanded, filtered]);

  // ── Ordenação ───────────────────────────────────────────────
  const toggleSort = useCallback((field) => {
    setSort(prev => ({
      field,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  // ── Exportar para Excel ─────────────────────────────────────
  const handleExport = useCallback(async () => {
    const rows = [];
    filtered.forEach(c => {
      c.representantes.forEach(r => {
        r.clientes.forEach(cli => {
          rows.push({
            'Consultor':        c.nome,
            'Representante':    r.nome,
            'Cliente':          cli.nome,
            'CNPJ':             cli.cnpj,
            'UF':               cli.uf,
            'Tipo':             cli.tipo,
            'Unid. Negócio':    cli.uneg,
            'Especificação':    cli.spec,
            'Total (R$)':       cli.TOTAL.toFixed(2),
            'PMK (R$/kg)':      cli.PMK.toFixed(2),
            'Comissão Média (%)': cli.MEDIA_COMISSAO.toFixed(2),
            'Desconto Médio (%)': cli.MEDIA_DESCONTO.toFixed(2),
            'Pedidos':          cli.pedidos,
          });
        });
      });
    });

    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Consultores');
      XLSX.writeFile(wb, `consultores-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  }, [filtered]);

  // ── Contadores ──────────────────────────────────────────────
  const activeFilters = [periodo, tipo, uf, uneg, spec, cnpjSearch].filter(Boolean).length;
  const totalReps     = filtered.reduce((s, c) => s + c.representantes.length, 0);
  const totalClientes = filtered.reduce((s, c) =>
    s + c.representantes.reduce((sr, r) => sr + r.clientes.length, 0), 0);

  function clearFilters() {
    setPeriodo(''); setTipo(''); setUf(''); setUneg(''); setSpec(''); setCnpjSearch('');
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── BARRA DE FILTROS ────────────────────────────────── */}
      <div
        className="bg-white border-b border-gray-100 sticky top-14 z-[100]"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        {/* Linha 1: Título + Ações */}
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Visão por Consultor</h2>
              <p className="text-[10px] text-gray-400 leading-tight">
                <span className="font-semibold text-gray-600">{filtered.length}</span> consultor{filtered.length !== 1 ? 'es' : ''}
                {' · '}
                <span className="font-semibold text-gray-600">{totalReps}</span> representantes
                {' · '}
                <span className="font-semibold text-gray-600">{totalClientes}</span> clientes
                {activeFilters > 0 && (
                  <span className="ml-1.5 text-blue-600 font-bold">
                    · {activeFilters} filtro{activeFilters > 1 ? 's' : ''} ativo{activeFilters > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Expandir / Recolher tudo */}
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title={allExpanded ? 'Recolher tudo' : 'Expandir tudo'}
            >
              {allExpanded
                ? <Minimize2 className="w-3.5 h-3.5" />
                : <Maximize2 className="w-3.5 h-3.5" />
              }
              <span className="hidden sm:block">{allExpanded ? 'Recolher' : 'Expandir'} tudo</span>
            </button>

            {/* Exportar */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Filtros */}
        <div className="flex items-end gap-3 px-4 pb-2.5 flex-wrap">
          {/* CNPJ Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Busca CNPJ Raiz
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="00.000.000"
                value={cnpjSearch}
                onChange={e => setCnpjSearch(e.target.value)}
                className={`text-xs border rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all w-36 font-medium ${
                  cnpjSearch
                    ? 'border-blue-400 bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              />
              {cnpjSearch && (
                <button
                  onClick={() => setCnpjSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <FilterSelect
            label="Período"
            value={periodo}
            onChange={setPeriodo}
            options={PERIODOS}
            valueKey="value"
            labelKey="label"
          />

          <FilterSelect label="Tipo Cliente" value={tipo} onChange={setTipo} options={TIPOS} />
          <FilterSelect label="UF" value={uf} onChange={setUf} options={UFS} />
          <FilterSelect label="Unid. Negócio" value={uneg} onChange={setUneg} options={UNEGS} />
          <FilterSelect label="Especificação" value={spec} onChange={setSpec} options={SPECS} />

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-2.5 py-1.5 rounded-lg font-semibold transition-colors self-end"
            >
              <X className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────── */}
      <div className="p-4">

        {/* Cards de resumo */}
        {filtered.length > 0 && <SummaryCards data={filtered} />}

        {/* Tabela hierárquica */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Nenhum resultado encontrado</p>
              <p className="text-xs text-gray-300 mt-1">Tente ajustar os filtros</p>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-500 hover:text-blue-700 font-semibold border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              {/* Cabeçalho */}
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left pl-4 pr-3 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider" style={{ width: '42%' }}>
                    Hierarquia
                  </th>
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="text-right px-4 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors last:pr-5 select-none group"
                      onClick={() => toggleSort(col.key)}
                      title={col.hint}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{col.label}</span>
                        <SortIcon field={col.key} sort={sort} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Corpo */}
              <tbody>
                {filtered.map((consultor, i) => (
                  <ConsultorRow
                    key={consultor.id}
                    consultor={consultor}
                    index={i}
                    isExpanded={expandedConsultores.has(consultor.id)}
                    expandedReps={expandedReps}
                    onToggleConsultor={() => toggleConsultor(consultor.id)}
                    onToggleRep={toggleRep}
                  />
                ))}
              </tbody>

              {/* Rodapé de totais */}
              <tfoot>
                <tr className="bg-gray-900 text-white">
                  <td className="pl-4 pr-3 py-3">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                      TOTAL GERAL · {filtered.length} consultor{filtered.length !== 1 ? 'es' : ''}
                    </span>
                  </td>
                  {(() => {
                    const totals = filtered.reduce((acc, c) => ({
                      TOTAL: acc.TOTAL + c.TOTAL,
                      PMK: acc.PMK + c.PMK,
                      COMISSAO: acc.COMISSAO + c.MEDIA_COMISSAO,
                      DESCONTO: acc.DESCONTO + c.MEDIA_DESCONTO,
                      n: acc.n + 1,
                    }), { TOTAL: 0, PMK: 0, COMISSAO: 0, DESCONTO: 0, n: 0 });
                    const n = totals.n || 1;
                    return (
                      <>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-black text-white tabular-nums">
                            {fmtCurrency(totals.TOTAL)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-gray-300 tabular-nums">
                            {fmtPMK(totals.PMK / n)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-blue-300 tabular-nums">
                            {fmtPct(totals.COMISSAO / n)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right pr-5">
                          <span className={`text-sm font-bold tabular-nums ${
                            totals.DESCONTO / n > 20 ? 'text-red-400'
                            : totals.DESCONTO / n > 12 ? 'text-amber-400'
                            : 'text-emerald-400'
                          }`}>
                            {fmtPct(totals.DESCONTO / n)}
                          </span>
                        </td>
                      </>
                    );
                  })()}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Legenda de cores */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Legenda Desconto:</span>
          {[
            { color: 'text-emerald-600', label: '≤ 12% (Saudável)' },
            { color: 'text-amber-600', label: '12–20% (Atenção)' },
            { color: 'text-red-600', label: '> 20% (Crítico)' },
          ].map(l => (
            <span key={l.label} className={`text-[10px] font-semibold ${l.color}`}>{l.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
