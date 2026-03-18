// ============================================================
// services/salesQuery.service.js
// Constrói a query principal com filtros dinâmicos
// TODAS as regras de negócio ficam centralizadas aqui
// ============================================================

const BASE_CTE = `
WITH PED_FILTRADO AS (
    SELECT 
        cd_unid_de_neg, cd_pedido, cd_material, quantidade,
        pr_unitario, cd_tipo_operaca, dt_item, controle,
        pe_comissao, pe_desconto
    FROM faitempe
    WHERE 
        controle NOT IN ('85','96','99')
        AND cd_especie = 'R'
        AND dt_item >= DATE '2020-01-01'
),
FAP_FILTRADO AS (SELECT * FROM fapedido),
DPA_FILTRADO AS (
    SELECT * FROM dexpara
    WHERE importar__sim_nao = 1
      AND cd_operacao_resultado_para NOT IN ('20','21')
),
BASE AS (
    SELECT 
        PED.cd_unid_de_neg               AS UNEG,
        FAP.desc_cond_pagto,
        PED.cd_pedido                    AS PEDIDO,
        REP.nome_completo || ' - ' || FAP.cd_representant AS REPRES,
        EMP.nome_completo                AS CLIENTE,
        EMP.cnpj_cpf                     AS CNPJ,
        EMP.uf                           AS UF,
        EMP.municipio                    AS MUNICIPIO,
        FAP.cd_cliente                   AS CLI,
        FAP.dt_pedido                    AS DATA,
        PED.cd_material                  AS ITEM,
        PED.quantidade                   AS QTDE,
        PED.pr_unitario                  AS PRECO,
        MAT.descricao                    AS MATERIAL,
        ESP.descricao                    AS ESPECIFICACAO,
        MAT.peso                         AS PESO,
        PED.pe_comissao,
        PED.pe_desconto,
        FAC.descricao                    AS CONTROLE,
        RTRIM(NOM.desc_categoria) || ' - ' || RTRIM(CON.categoria) AS CONSULTOR,
        EMP.tipo_de_empresa              AS TIPO,
        -- ── Regras de negócio calculadas na origem ──────
        (PED.quantidade * PED.pr_unitario)                              AS FATURAMENTO_BRUTO,
        (PED.quantidade * PED.pr_unitario) * (PED.pe_desconto / 100)    AS VALOR_DESCONTO,
        (PED.quantidade * PED.pr_unitario) * (1 - PED.pe_desconto/100)  AS RECEITA_LIQUIDA,
        (PED.quantidade * PED.pr_unitario) * (PED.pe_comissao / 100)    AS VALOR_COMISSAO,
        -- ── Classificação de qualidade ──────────────────
        CASE 
          WHEN UPPER(FAC.descricao) LIKE '%BLOQ%' THEN 'PROBLEMA'
          WHEN PED.pe_desconto > 15 THEN 'ATENCAO'
          ELSE 'SAUDAVEL'
        END AS QUALIDADE
    FROM PED_FILTRADO PED
    INNER JOIN FAP_FILTRADO FAP ON FAP.cd_pedido = PED.cd_pedido AND FAP.cd_unid_de_neg = PED.cd_unid_de_neg
    INNER JOIN DPA_FILTRADO DPA ON DPA.cd_operacao_resultado_de = PED.cd_tipo_operaca
    INNER JOIN esmateri MAT ON MAT.cd_material = PED.cd_material
    INNER JOIN eses4 ESP ON ESP.cd_grupo = MAT.cd_grupo AND ESP.especif4 = MAT.cd_especif4
    INNER JOIN geempres EMP ON EMP.cd_empresa = FAP.cd_cliente
       AND EMP.cd_empresa NOT IN ('008587','303038','299871','495140','015254','015255')
    INNER JOIN geempres REP ON REP.cd_empresa = FAP.cd_representant
    INNER JOIN geelemen CON ON CON.cd_tg = 634 AND CON.elemento = FAP.cd_representant
    INNER JOIN gecatego NOM ON NOM.cd_tg = 634 AND NOM.categoria = CON.categoria
    INNER JOIN facontro FAC ON FAC.controle = PED.controle
)
`;

/**
 * Constrói cláusula WHERE dinâmica a partir dos filtros recebidos
 * @param {Object} filters
 * @returns {{ whereClause: string, params: Object }}
 */
function buildWhereClause(filters = {}) {
  const conditions = [];
  const params = {};
  let idx = 1;

  if (filters.dataInicio) {
    conditions.push(`DATA >= :p${idx}`);
    params[`p${idx++}`] = new Date(filters.dataInicio);
  }
  if (filters.dataFim) {
    conditions.push(`DATA <= :p${idx}`);
    params[`p${idx++}`] = new Date(filters.dataFim);
  }
  if (filters.vendedor) {
    conditions.push(`REPRES = :p${idx}`);
    params[`p${idx++}`] = filters.vendedor;
  }
  if (filters.cliente) {
    conditions.push(`CLI = :p${idx}`);
    params[`p${idx++}`] = filters.cliente;
  }
  if (filters.uf) {
    conditions.push(`UF = :p${idx}`);
    params[`p${idx++}`] = filters.uf;
  }
  if (filters.material) {
    conditions.push(`ITEM = :p${idx}`);
    params[`p${idx++}`] = filters.material;
  }
  if (filters.tipo) {
    conditions.push(`TIPO = :p${idx}`);
    params[`p${idx++}`] = filters.tipo;
  }
  if (filters.controle) {
    conditions.push(`CONTROLE = :p${idx}`);
    params[`p${idx++}`] = filters.controle;
  }
  if (filters.uneg) {
    conditions.push(`UNEG = :p${idx}`);
    params[`p${idx++}`] = filters.uneg;
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  return { whereClause, params };
}

module.exports = { BASE_CTE, buildWhereClause };
