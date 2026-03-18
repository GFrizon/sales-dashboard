# 🚀 Como Rodar o Dashboard

## Pré-requisitos
- Node.js 18+ instalado
- Oracle Instant Client instalado (para oracledb)
- Acesso à rede onde está o servidor ORCL

---

## 1. Backend (API)

```bash
cd backend
npm install
npm run dev
```

> A API sobe em http://localhost:4000
> Credenciais Oracle já configuradas: bakof/bakof@ORCL

**Se o TNS não resolver "ORCL"**, edite o arquivo `backend/.env`:
```
DB_CONNECT=192.168.X.X:1521/ORCL
```
Substitua pelo IP real do servidor Oracle.

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

> O dashboard abre em http://localhost:3000

---

## 3. Verificar conexão Oracle

Acesse no browser:
```
http://localhost:4000/health
http://localhost:4000/api/sales/kpis
```

Se retornar `[]` vazio, o banco conectou mas sem dados no período.
Se retornar erro, verifique se o Oracle Instant Client está instalado.

---

## Instalar Oracle Instant Client (se necessário)

### Windows
1. Baixar em: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Extrair para `C:\oracle\instantclient`
3. Adicionar ao PATH do sistema
4. Rodar: `npm install oracledb`

### Linux
```bash
sudo apt install libaio1
# Baixar e extrair o instant client
export LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH
npm install oracledb
```

---

## Testar sem banco (modo mock)

Se quiser ver o dashboard sem banco Oracle:
```
# backend/.env
MOCK_DB=true
```
Isso retorna dados vazios mas sem erro de conexão.
