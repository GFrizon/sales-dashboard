const target = process.env.FRONTEND_SMOKE_URL || 'http://127.0.0.1:3000';

async function main() {
  const res = await fetch(target, { redirect: 'manual' });
  if (res.status < 200 || res.status >= 400) {
    throw new Error(`HTTP ${res.status} em ${target}`);
  }

  const html = await res.text();
  if (!html || !html.toLowerCase().includes('<html')) {
    throw new Error('Resposta nao parece HTML valido');
  }

  console.log(`SMOKE OK: ${target} (${res.status})`);
}

main().catch((err) => {
  console.error(`SMOKE FAIL: ${err.message}`);
  process.exit(1);
});

