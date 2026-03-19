-- ============================================================
-- sql/indexes_hierarquia.sql
-- Execute no banco Oracle UMA ÚNICA VEZ para criar os índices
-- que aceleram as queries da hierarquia Consultor→Item
--
-- Modo de uso:
--   sqlplus bakof/bakof@ORCL @indexes_hierarquia.sql
-- ============================================================

-- ── faitempe — tabela de itens de pedido (a maior!) ────────

-- Filtro principal de data (usado em TODOS os relatórios)
CREATE INDEX IF NOT EXISTS idx_faitem_dtitem
  ON faitempe (dt_item)
  TABLESPACE USERS;

-- Join com fapedido
CREATE INDEX IF NOT EXISTS idx_faitem_pedido
  ON faitempe (cd_pedido, cd_unid_de_neg)
  TABLESPACE USERS;

-- Filtro de controle (excluir 85/96/99) + espécie
CREATE INDEX IF NOT EXISTS idx_faitem_controle_especie
  ON faitempe (controle, cd_especie)
  TABLESPACE USERS;

-- Filtro por material
CREATE INDEX IF NOT EXISTS idx_faitem_material
  ON faitempe (cd_material)
  TABLESPACE USERS;

-- Índice composto para a query de itens de pedido (nível 4)
-- Cobre WHERE cd_pedido = :p1 AND controle NOT IN (...) AND cd_especie = 'R'
CREATE INDEX IF NOT EXISTS idx_faitem_ped_ctrl_esp
  ON faitempe (cd_pedido, controle, cd_especie)
  TABLESPACE USERS;

-- ── fapedido — cabeçalho do pedido ────────────────────────

-- Join com faitempe
CREATE INDEX IF NOT EXISTS idx_fapedido_pedido
  ON fapedido (cd_pedido, cd_unid_de_neg)
  TABLESPACE USERS;

-- Filtro por representante (nível 1→2)
CREATE INDEX IF NOT EXISTS idx_fapedido_representant
  ON fapedido (cd_representant)
  TABLESPACE USERS;

-- Filtro por cliente (nível 2→3)
CREATE INDEX IF NOT EXISTS idx_fapedido_cliente
  ON fapedido (cd_cliente)
  TABLESPACE USERS;

-- Data do pedido
CREATE INDEX IF NOT EXISTS idx_fapedido_dtpedido
  ON fapedido (dt_pedido)
  TABLESPACE USERS;

-- ── geempres — clientes e representantes ──────────────────

CREATE INDEX IF NOT EXISTS idx_geempres_cd
  ON geempres (cd_empresa)
  TABLESPACE USERS;

CREATE INDEX IF NOT EXISTS idx_geempres_uf
  ON geempres (uf)
  TABLESPACE USERS;

CREATE INDEX IF NOT EXISTS idx_geempres_tipo
  ON geempres (tipo_de_empresa)
  TABLESPACE USERS;

-- ── geelemen — vínculo representante → consultor ──────────

CREATE INDEX IF NOT EXISTS idx_geelemen_cdtg_elemento
  ON geelemen (cd_tg, elemento)
  TABLESPACE USERS;

-- ── gecatego — nome do consultor ──────────────────────────

CREATE INDEX IF NOT EXISTS idx_gecatego_cdtg_cat
  ON gecatego (cd_tg, categoria)
  TABLESPACE USERS;

-- ── dexpara — filtro de tipo de operação ──────────────────

CREATE INDEX IF NOT EXISTS idx_dexpara_cd_op
  ON dexpara (cd_operacao_resultado_de)
  WHERE importar__sim_nao = 1
  TABLESPACE USERS;

-- ── facontro — descrição do controle ──────────────────────

CREATE INDEX IF NOT EXISTS idx_facontro_ctrl
  ON facontro (controle)
  TABLESPACE USERS;

-- ── esmateri — material ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_esmateri_cd
  ON esmateri (cd_material)
  TABLESPACE USERS;

-- ── eses4 — especificação ─────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_eses4_grupo_esp
  ON eses4 (cd_grupo, especif4)
  TABLESPACE USERS;

-- ============================================================
-- Estatísticas — rode após criar os índices
-- O Oracle usa essas estatísticas para escolher o plano ideal
-- ============================================================
BEGIN
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'BAKOF', tabname => 'FAITEMPE',  cascade => TRUE);
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'BAKOF', tabname => 'FAPEDIDO',  cascade => TRUE);
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'BAKOF', tabname => 'GEEMPRES',  cascade => TRUE);
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'BAKOF', tabname => 'GEELEMEN',  cascade => TRUE);
  DBMS_STATS.GATHER_TABLE_STATS(ownname => 'BAKOF', tabname => 'ESMATERI',  cascade => TRUE);
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Erro ao coletar estatísticas: ' || SQLERRM);
END;
/

-- ============================================================
-- Verifica os índices criados
-- ============================================================
SELECT index_name, table_name, status, uniqueness
FROM   user_indexes
WHERE  table_name IN ('FAITEMPE','FAPEDIDO','GEEMPRES','GEELEMEN','FACONTRO','ESMATERI','ESES4','DEXPARA','GECATEGO')
ORDER BY table_name, index_name;
