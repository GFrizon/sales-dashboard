export const CONSULTOR_VIEW_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.hv { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
.hv * { box-sizing:border-box; }
.hv-row { transition:background 0.13s; cursor:pointer; }
.hv-row:active { filter:brightness(0.97); }
.hv-kids { overflow:hidden; max-height:0; transition:max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease; opacity:0; }
.hv-kids.open { max-height:99999px; opacity:1; }
.hv-chev { transition:transform 0.22s cubic-bezier(0.4,0,0.2,1); flex-shrink:0; }
.hv-chev.open { transform:rotate(90deg); }
.hv-lib { background:#dcfce7; color:#166534; }
.hv-blq { background:#fee2e2; color:#991b1b; }
.hv-ana { background:#fef9c3; color:#713f12; }
.mono { font-family:'DM Mono',monospace; }
@keyframes fadeUp { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
.hv-fi { animation:fadeUp 0.16s ease-out forwards; opacity:0; }
@keyframes spin { to{transform:rotate(360deg)} }
.spin { animation:spin 0.7s linear infinite; }
.tab-tr:hover td { background:#f0f4ff !important; }
.chip { transition:all 0.13s; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
.chip:hover { border-color:#6366f1 !important; color:#4f46e5 !important; }
.chip.on { background:#4f46e5 !important; color:#fff !important; border-color:#4f46e5 !important; }
.vtab { transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; }
.vtab.on { background:#1e293b; color:#f8fafc; box-shadow:0 2px 6px rgba(0,0,0,0.15); }
`;
