# 📊 Dashboard de Vendas Executivo

Sistema web de análise de vendas com drag-and-drop, filtros globais e widgets personalizáveis.

---

## 🗂️ Estrutura do Projeto

```
sales-dashboard/
├── backend/                         ← API REST (Node.js + Express)
│   ├── .env.example                 ← Variáveis de ambiente (copiar para .env)
│   ├── package.json
│   └── src/
│       ├── server.js                ← Entrada da aplicação
│       ├── config/
│       │   └── database.js          ← Pool Oracle/PostgreSQL
│       ├── routes/
│       │   ├── sales.routes.js      ← GET /api/sales/*
│       │   ├── filters.routes.js    ← GET /api/filters/options
│       │   └── dashboard.routes.js  ← GET/POST /api/dashboard/preferences/:id
│       ├── controllers/
│       │   ├── sales.controller.js  ← KPIs, gráficos, rankings
│       │   ├── filters.controller.js
│       │   └── dashboard.controller.js
│       ├── services/
│       │   └── salesQuery.service.js ← BASE_CTE + buildWhereClause()
│       ├── middleware/
│       │   └── errorHandler.js
│       └── utils/
│           └── cache.js             ← Cache em memória (TTL configurável)
│
└── frontend/                        ← Next.js 14 + Tailwind + Recharts
    ├── .env.local.example
    ├── next.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── app/
        │   ├── layout.jsx           ← Root layout (DashboardProvider aqui)
        │   └── page.jsx             ← Rota raiz → renderiza Dashboard
        ├── context/
        │   └── DashboardContext.jsx ← Estado global (filtros, layout, widgets)
        ├── hooks/
        │   └── useApiData.js        ← Fetch + cache + AbortController
        ├── pages/
        │   └── Dashboard.jsx        ← Grid drag-and-drop principal
        ├── styles/
        │   └── globals.css
        └── components/
            ├── layout/
            │   ├── WidgetWrapper.jsx  ← Título + drag handle + remover
            │   └── WidgetSelector.jsx ← Painel de ativação (modo edição)
            ├── filters/
            │   └── FilterBar.jsx      ← Todos os filtros globais
            └── widgets/
                ├── KpiCard.jsx        ← Cards de indicador
                ├── EvolucaoChart.jsx  ← Linha/área temporal
                ├── RankingChart.jsx   ← Barras horizontais
                ├── StatusChart.jsx    ← Donut de status/qualidade
                └── CurvaAbcChart.jsx  ← Pareto ABC de produtos
```

---

## 🚀 Como rodar

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edite .env com seus dados de banco
npm run dev
# API disponível em http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# App disponível em http://localhost:3000
```

### 3. Banco de dados — tabela de preferências

Execute no seu banco Oracle:

```sql
CREATE TABLE dashboard_preferences (
  user_id     VARCHAR2(100) PRIMARY KEY,
  preferences CLOB,
  created_at  DATE DEFAULT SYSDATE,
  updated_at  DATE DEFAULT SYSDATE
);
```

---

## 🔌 Endpoints da API

| Método | Endpoint                              | Descrição                          |
|--------|---------------------------------------|------------------------------------|
| GET    | /api/sales/kpis                       | Todos os KPIs de uma vez           |
| GET    | /api/sales/evolucao                   | Receita por período (linha)        |
| GET    | /api/sales/ranking/vendedores         | Top vendedores                     |
| GET    | /api/sales/ranking/clientes           | Top clientes                       |
| GET    | /api/sales/ranking/produtos           | Top produtos                       |
| GET    | /api/sales/status                     | Distribuição por status            |
| GET    | /api/sales/qualidade                  | Saudável / Atenção / Problema      |
| GET    | /api/sales/curva-abc                  | Curva ABC de produtos              |
| GET    | /api/filters/options                  | Opções para dropdowns              |
| GET    | /api/dashboard/preferences/:userId    | Carregar layout salvo              |
| POST   | /api/dashboard/preferences/:userId    | Salvar layout                      |

### Filtros disponíveis em todos os endpoints GET /api/sales/*

```
?dataInicio=2024-01-01
&dataFim=2024-12-31
&vendedor=JOAO SILVA - V001
&cliente=001234
&uf=SP
&material=MAT001
&tipo=INDUSTRIA
&controle=LIBERADO
&uneg=01
```

---

## 🎨 Widgets disponíveis

### KPIs
| Widget ID         | Campo                 | Formato  |
|-------------------|-----------------------|----------|
| kpi-receita       | RECEITA_LIQUIDA       | Moeda    |
| kpi-faturamento   | FATURAMENTO_BRUTO     | Moeda    |
| kpi-ticket        | TICKET_MEDIO          | Moeda    |
| kpi-clientes      | CLIENTES_UNICOS       | Número   |
| kpi-desconto      | DESCONTO_MEDIO        | %        |
| kpi-bloqueado     | VALOR_BLOQUEADO       | Moeda    |

### Gráficos
| Widget ID          | Tipo          | Fonte de dados              |
|--------------------|---------------|-----------------------------|
| chart-evolucao     | Área/Linha    | /api/sales/evolucao         |
| chart-status       | Donut         | /api/sales/status           |
| chart-qualidade    | Donut         | /api/sales/qualidade        |
| chart-vendedores   | Barras horiz. | /api/sales/ranking/vendedores|
| chart-clientes     | Barras horiz. | /api/sales/ranking/clientes |
| chart-produtos     | Barras horiz. | /api/sales/ranking/produtos |
| chart-abc          | Pareto        | /api/sales/curva-abc        |

---

## 🧮 Regras de negócio (calculadas no SQL)

```sql
FATURAMENTO_BRUTO = QTDE * PRECO
VALOR_DESCONTO    = FATURAMENTO_BRUTO * (pe_desconto / 100)
RECEITA_LIQUIDA   = FATURAMENTO_BRUTO * (1 - pe_desconto / 100)
VALOR_COMISSAO    = FATURAMENTO_BRUTO * (pe_comissao / 100)

QUALIDADE = CASO
  WHEN CONTROLE LIKE '%BLOQ%' THEN 'PROBLEMA'
  WHEN pe_desconto > 15       THEN 'ATENCAO'
  ELSE                             'SAUDAVEL'
```

---

## ⚡ Performance

- **Cache no backend**: KPIs e rankings ficam em memória por 5 min
- **Cache no frontend**: Cada URL fica em cache por 60s no módulo
- **AbortController**: Requests cancelados ao trocar filtros
- **Lazy loading**: Gráficos carregam via `React.lazy()` sob demanda
- **Debounce**: Preferências salvas 2s após última mudança

Para produção, substitua o cache em memória por **Redis**:
```bash
npm install ioredis
```

---

## 📦 Dependências principais

### Backend
- `express` — servidor HTTP
- `oracledb` — driver Oracle (troque por `pg` para PostgreSQL)
- `helmet` + `cors` — segurança
- `express-rate-limit` — proteção contra abuso

### Frontend
- `next` 14 — framework React
- `recharts` — gráficos (AreaChart, BarChart, PieChart, ComposedChart)
- `react-grid-layout` — drag-and-drop responsivo
- `tailwindcss` — estilização utility-first
- `lucide-react` — ícones
