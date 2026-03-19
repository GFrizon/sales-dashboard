// ============================================================
// services/hierarquia.service.js
// Queries Oracle otimizadas — uma por nível da hierarquia
//
// Princípios:
//  • SELECT apenas as colunas necessárias para a tela
//  • GROUP BY no nível correto (sem trazer linhas brutas)
//  • Bind variables sempre (nunca concatenar strings SQL)
//  • FETCH FIRST N ROWS para limitar resultados
//  • WHERE clause com as colunas indexadas primeiro
// ============================================================
const { query }   = require('../config/database');
const { buildWhereClause } = require('./salesQuery.service');

// ─────────────────────────────────────────────────────────────
// CTE BASE — mesma lógica do salesQuery.service, mas
// declarada aqui para reuso local
// ─────────────────────────────────────────────────────────────
const BASE_CTE = `
WITH PED_FILTRADO AS (
  SELECT cd_unid_de_neg, cd_pedido, cd_material, quantidade,
         pr_unitario, cd_tipo_operaca, dt_item, controle,
         pe_comissao, pe_desconto
  FROM   faitempe
  WHERE  controle NOT IN ('85','96','99')
    AND  cd_especie = 'R'
    AND  dt_item >= DATE '2020-01-01'
),
FAP_FILTRADO AS (SELECT * FROM fapedido),
DPA_FILTRADO AS (
  SELECT * FROM dexpara
  WHERE  importar__sim_nao = 1
    AND  cd_operacao_resultado_para NOT IN ('20','21')
),
BASE AS (
  SELECT
    PED.cd_unid_de_neg                                               AS UNEG,
    PED.cd_pedido                                                    AS PEDIDO,
    FAP.cd_cliente                                                   AS CLI,
    EMP.nome_completo                                                AS CLIENTE,
    EMP.uf                                                           AS UF,
    EMP.tipo_de_empresa                                              AS TIPO,
    FAP.cd_representant                                              AS CD_REP,
    REP.nome_completo || ' - ' || FAP.cd_representant               AS REPRES,
    NOM.desc_categoria || ' - ' || CON.categoria                    AS CONSULTOR,
    CON.categoria                                                    AS CD_CONSULTOR,
    PED.cd_material                                                  AS ITEM,
    MAT.descricao                                                    AS MATERIAL,
    ESP.descricao                                                    AS ESPECIFICACAO,
    PED.quantidade                                                   AS QTDE,
    PED.pr_unitario                                                  AS PRECO,
    MAT.peso                                                         AS PESO,
    PED.pe_comissao,
    PED.pe_desconto,
    FAP.dt_pedido                                                    AS DATA,
    FAC.descricao                                                    AS CONTROLE,
    (PED.quantidade * PED.pr_unitario)                               AS FATURAMENTO_BRUTO,
    (PED.quantidade * PED.pr_unitario) * (PED.pe_desconto  / 100)   AS VALOR_DESCONTO,
    (PED.quantidade * PED.pr_unitario) * (1 - PED.pe_desconto/100)  AS RECEITA_LIQUIDA,
    (PED.quantidade * PED.pr_unitario) * (PED.pe_comissao  / 100)   AS VALOR_COMISSAO,
    CASE
      WHEN UPPER(FAC.descricao) LIKE '%BLOQ%' THEN 'PROBLEMA'
      WHEN PED.pe_desconto > 15               THEN 'ATENCAO'
      ELSE 'SAUDAVEL'
    END                                                              AS QUALIDADE
  FROM PED_FILTRADO PED
  INNER JOIN FAP_FILTRADO FAP ON FAP.cd_pedido = PED.cd_pedido AND FAP.cd_unid_de_neg = PED.cd_unid_de_neg
  INNER JOIN DPA_FILTRADO DPA ON DPA.cd_operacao_resultado_de = PED.cd_tipo_operaca
  INNER JOIN esmateri  MAT ON MAT.cd_material  = PED.cd_material
  INNER JOIN eses4     ESP ON ESP.cd_grupo      = MAT.cd_grupo AND ESP.especif4 = MAT.cd_especif4
  INNER JOIN geempres  EMP ON EMP.cd_empresa    = FAP.cd_cliente
    AND EMP.cd_empresa NOT IN ('008587','303038','299871','495140','015254','015255')
  INNER JOIN geempres  REP ON REP.cd_empresa    = FAP.cd_representant
  INNER JOIN geelemen  CON ON CON.cd_tg = 634  AND CON.elemento = FAP.cd_representant
  INNER JOIN gecatego  NOM ON NOM.cd_tg = 634  AND NOM.categoria = CON.categoria
  INNER JOIN facontro  FAC ON FAC.controle       = PED.controle
)
`;

// Helper — adiciona filtros globais passados via query string
function globalWhere(filters) {
  const { whereClause, params } = buildWhereClause(filters);
  return { whereClause, params };
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 0 — Consultores
// Retorna: lista de consultores com métricas agregadas
// ─────────────────────────────────────────────────────────────
async function getConsultores(filters = {}) {
  const { whereClause, params } = globalWhere(filters);

  const sql = `
    ${BASE_CTE}
    SELECT
      CD_CONSULTOR,
      RTRIM(CONSULTOR)                                                              AS CONSULTOR,
      ROUND(SUM(RECEITA_LIQUIDA),    2)                                             AS REC,
      ROUND(SUM(FATURAMENTO_BRUTO),  2)                                             AS FAT,
      ROUND(AVG(PE_DESCONTO),        2)                                             AS DESC_MED,
      ROUND(AVG(PE_COMISSAO),        2)                                             AS COM_MED,
      ROUND(SUM(RECEITA_LIQUIDA) /
            NULLIF(SUM(QTDE * PESO), 0), 2)                                        AS PMK,
      COUNT(DISTINCT CLI)                                                           AS TOTAL_CLIENTES,
      COUNT(DISTINCT CD_REP)                                                        AS TOTAL_REPS,
      COUNT(DISTINCT PEDIDO)                                                        AS TOTAL_PEDIDOS
    FROM BASE
    ${whereClause}
    GROUP BY CD_CONSULTOR, RTRIM(CONSULTOR)
    ORDER BY REC DESC
  `;

  const rows = await query(sql, params);
  return rows.map(r => ({
    id:            r.CD_CONSULTOR,
    nome:          r.CONSULTOR,
    REC:           +r.REC  || 0,
    FAT:           +r.FAT  || 0,
    DESC:          +r.DESC_MED || 0,
    COM:           +r.COM_MED  || 0,
    PMK:           +r.PMK      || 0,
    totalClientes: +r.TOTAL_CLIENTES || 0,
    totalReps:     +r.TOTAL_REPS     || 0,
    totalPedidos:  +r.TOTAL_PEDIDOS  || 0,
    hasChildren:   true,
  }));
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 1 — Representantes de um Consultor
// ─────────────────────────────────────────────────────────────
async function getRepresentantes(cdConsultor, filters = {}) {
  const { whereClause, params } = globalWhere(filters);

  // Adiciona filtro de consultor
  const paramIdx = Object.keys(params).length + 1;
  const consClause = whereClause
    ? `${whereClause} AND CD_CONSULTOR = :p${paramIdx}`
    : `WHERE CD_CONSULTOR = :p${paramIdx}`;
  params[`p${paramIdx}`] = cdConsultor;

  const sql = `
    ${BASE_CTE}
    SELECT
      CD_REP,
      REPRES,
      ROUND(SUM(RECEITA_LIQUIDA),   2)  AS REC,
      ROUND(SUM(FATURAMENTO_BRUTO), 2)  AS FAT,
      ROUND(AVG(PE_DESCONTO),       2)  AS DESC_MED,
      ROUND(AVG(PE_COMISSAO),       2)  AS COM_MED,
      ROUND(SUM(RECEITA_LIQUIDA) /
            NULLIF(SUM(QTDE * PESO), 0), 2) AS PMK,
      COUNT(DISTINCT CLI)               AS TOTAL_CLIENTES,
      COUNT(DISTINCT PEDIDO)            AS TOTAL_PEDIDOS
    FROM BASE
    ${consClause}
    GROUP BY CD_REP, REPRES
    ORDER BY REC DESC
  `;

  const rows = await query(sql, params);
  return rows.map(r => ({
    id:            r.CD_REP,
    nome:          r.REPRES,
    REC:           +r.REC     || 0,
    FAT:           +r.FAT     || 0,
    DESC:          +r.DESC_MED || 0,
    COM:           +r.COM_MED  || 0,
    PMK:           +r.PMK      || 0,
    totalClientes: +r.TOTAL_CLIENTES || 0,
    totalPedidos:  +r.TOTAL_PEDIDOS  || 0,
    hasChildren:   true,
  }));
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 2 — Clientes de um Representante
// ─────────────────────────────────────────────────────────────
async function getClientes(cdRep, filters = {}) {
  const { whereClause, params } = globalWhere(filters);

  const paramIdx = Object.keys(params).length + 1;
  const repClause = whereClause
    ? `${whereClause} AND CD_REP = :p${paramIdx}`
    : `WHERE CD_REP = :p${paramIdx}`;
  params[`p${paramIdx}`] = cdRep;

  const sql = `
    ${BASE_CTE}
    SELECT
      CLI,
      CLIENTE,
      UF,
      TIPO,
      ROUND(SUM(RECEITA_LIQUIDA),   2)  AS REC,
      ROUND(SUM(FATURAMENTO_BRUTO), 2)  AS FAT,
      ROUND(AVG(PE_DESCONTO),       2)  AS DESC_MED,
      ROUND(AVG(PE_COMISSAO),       2)  AS COM_MED,
      ROUND(SUM(RECEITA_LIQUIDA) /
            NULLIF(SUM(QTDE * PESO), 0), 2) AS PMK,
      COUNT(DISTINCT PEDIDO)            AS TOTAL_PEDIDOS
    FROM BASE
    ${repClause}
    GROUP BY CLI, CLIENTE, UF, TIPO
    ORDER BY REC DESC
  `;

  const rows = await query(sql, params);
  return rows.map(r => ({
    id:          r.CLI,
    codigo:      r.CLI,
    nome:        r.CLIENTE,
    uf:          r.UF,
    tipo:        r.TIPO,
    REC:         +r.REC     || 0,
    FAT:         +r.FAT     || 0,
    DESC:        +r.DESC_MED || 0,
    COM:         +r.COM_MED  || 0,
    PMK:         +r.PMK      || 0,
    totalPedidos:+r.TOTAL_PEDIDOS || 0,
    hasChildren: true,
  }));
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 3 — Pedidos de um Cliente
// ─────────────────────────────────────────────────────────────
async function getPedidos(cdCliente, filters = {}) {
  const { whereClause, params } = globalWhere(filters);

  const paramIdx = Object.keys(params).length + 1;
  const cliClause = whereClause
    ? `${whereClause} AND CLI = :p${paramIdx}`
    : `WHERE CLI = :p${paramIdx}`;
  params[`p${paramIdx}`] = cdCliente;

  const sql = `
    ${BASE_CTE}
    SELECT
      PEDIDO,
      TO_CHAR(MAX(DATA), 'DD/MM/YYYY')  AS DATA_PED,
      MAX(CONTROLE)                      AS STATUS,
      ROUND(SUM(RECEITA_LIQUIDA),   2)  AS REC,
      ROUND(SUM(FATURAMENTO_BRUTO), 2)  AS FAT,
      ROUND(AVG(PE_DESCONTO),       2)  AS DESC_MED,
      ROUND(AVG(PE_COMISSAO),       2)  AS COM_MED,
      ROUND(SUM(RECEITA_LIQUIDA) /
            NULLIF(SUM(QTDE * PESO), 0), 2) AS PMK,
      COUNT(1)                           AS TOTAL_ITENS
    FROM BASE
    ${cliClause}
    GROUP BY PEDIDO
    ORDER BY MAX(DATA) DESC
    FETCH FIRST 100 ROWS ONLY
  `;

  const rows = await query(sql, params);
  return rows.map(r => ({
    id:         r.PEDIDO,
    numero:     r.PEDIDO,
    data:       r.DATA_PED,
    status:     r.STATUS,
    REC:        +r.REC     || 0,
    FAT:        +r.FAT     || 0,
    DESC:       +r.DESC_MED || 0,
    COM:        +r.COM_MED  || 0,
    PMK:        +r.PMK      || 0,
    totalItens: +r.TOTAL_ITENS || 0,
    hasChildren:true,
  }));
}

// ─────────────────────────────────────────────────────────────
// NÍVEL 4 — Itens de um Pedido
// Não usa BASE CTE — query direta nas tabelas para performance
// ─────────────────────────────────────────────────────────────
async function getItens(cdPedido, cdUneg = null) {
  // Parâmetros bind
  const params = { p1: cdPedido };
  let unegFilter = '';
  if (cdUneg) {
    params.p2  = cdUneg;
    unegFilter = 'AND PED.cd_unid_de_neg = :p2';
  }

  const sql = `
    SELECT
      PED.cd_material                                                      AS COD,
      MAT.descricao                                                        AS MATERIAL,
      ESP.descricao                                                        AS ESPECIFICACAO,
      PED.cd_unid_de_neg                                                   AS UNEG,
      PED.quantidade                                                       AS QTDE,
      PED.pr_unitario                                                      AS PRECO,
      MAT.peso                                                             AS PESO,
      PED.pe_desconto,
      PED.pe_comissao,
      ROUND(PED.quantidade * PED.pr_unitario, 2)                          AS FAT,
      ROUND(PED.quantidade * PED.pr_unitario * (1 - PED.pe_desconto/100), 2) AS REC,
      ROUND(PED.quantidade * PED.pr_unitario * (PED.pe_comissao/100), 2)  AS COM,
      ROUND(
        (PED.quantidade * PED.pr_unitario * (1 - PED.pe_desconto/100)) /
        NULLIF(PED.quantidade * MAT.peso, 0),
      2)                                                                   AS PMK
    FROM faitempe PED
    INNER JOIN esmateri  MAT ON MAT.cd_material = PED.cd_material
    INNER JOIN eses4     ESP ON ESP.cd_grupo     = MAT.cd_grupo
                             AND ESP.especif4    = MAT.cd_especif4
    WHERE PED.cd_pedido = :p1
      AND PED.controle  NOT IN ('85','96','99')
      AND PED.cd_especie = 'R'
      ${unegFilter}
    ORDER BY PED.cd_material
  `;

  const rows = await query(sql, params);
  return rows.map(r => ({
    id:    `${cdPedido}-${r.COD}`,
    cod:   r.COD,
    nome:  r.MATERIAL,
    spec:  r.ESPECIFICACAO,
    uneg:  r.UNEG,
    qtde:  +r.QTDE   || 0,
    preco: +r.PRECO  || 0,
    peso:  +r.PESO   || 0,
    FAT:   +r.FAT    || 0,
    DESC:  +r.PE_DESCONTO || 0,
    COM:   +r.PE_COMISSAO || 0,
    REC:   +r.REC    || 0,
    PMK:   +r.PMK    || 0,
  }));
}

// ─────────────────────────────────────────────────────────────
// RESUMO GERAL — para os cards de KPI no topo
// ─────────────────────────────────────────────────────────────
async function getResumo(filters = {}) {
  const { whereClause, params } = globalWhere(filters);

  const sql = `
    ${BASE_CTE}
    SELECT
      COUNT(DISTINCT CD_CONSULTOR)  AS TOTAL_CONS,
      COUNT(DISTINCT CD_REP)        AS TOTAL_REPS,
      COUNT(DISTINCT CLI)           AS TOTAL_CLIS,
      COUNT(DISTINCT PEDIDO)        AS TOTAL_PEDS,
      ROUND(SUM(RECEITA_LIQUIDA),2) AS REC,
      ROUND(AVG(PE_DESCONTO),2)     AS DESC_MED,
      ROUND(AVG(PE_COMISSAO),2)     AS COM_MED,
      ROUND(SUM(RECEITA_LIQUIDA)/NULLIF(SUM(QTDE*PESO),0),2) AS PMK
    FROM BASE
    ${whereClause}
  `;

  const rows = await query(sql, params);
  const r    = rows[0] || {};
  return {
    totalConsultores:   +r.TOTAL_CONS || 0,
    totalRepresentantes:+r.TOTAL_REPS || 0,
    totalClientes:      +r.TOTAL_CLIS || 0,
    totalPedidos:       +r.TOTAL_PEDS || 0,
    REC:  +r.REC     || 0,
    DESC: +r.DESC_MED || 0,
    COM:  +r.COM_MED  || 0,
    PMK:  +r.PMK      || 0,
  };
}

module.exports = {
  getConsultores,
  getRepresentantes,
  getClientes,
  getPedidos,
  getItens,
  getResumo,
};
