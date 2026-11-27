export const STYLES = `
.ebs{--card:#faf7ea;--line:#e6e1cc;--line2:#e0dbc4;--ink:#151515;--muted:#6b6a5e;--ok:#35500a;--okbg:#e5eed2;--warn:#5c3a00;--warnbg:#fbf1d6;--bad:#8a1c14;--badbg:#fbeceb;--info:#234e78;--infobg:#dde8f3;
  box-sizing:border-box;max-width:1280px;margin:0 auto;padding:32px;display:flex;flex-direction:column;gap:20px;font-size:13px;color:var(--ink)}
.ebs *{box-sizing:border-box}
.ebs button,.ebs select,.ebs input,.ebs textarea{font-family:inherit;color:inherit}
.ebs h1{margin:0;font-size:26px;font-weight:700;letter-spacing:-.5px}
.ebs-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.ebs-between{justify-content:space-between}
.ebs-col{display:flex;flex-direction:column;gap:6px}
.ebs-muted{color:var(--muted)}
.ebs-small{font-size:12px}
.ebs-label{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--muted)}
.ebs-card{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:14px}
.ebs-card-strong{border-color:var(--ink)}
.ebs-grid{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}
.ebs-main{flex:2 1 600px;min-width:0;display:flex;flex-direction:column;gap:16px}
.ebs-side{flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:20px}
.ebs-kpis{display:flex;flex-wrap:wrap;gap:14px}
.ebs-kpi{flex:1 1 220px;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:6px}
.ebs-kpi strong{font-size:28px;letter-spacing:-1px}
.ebs-btn{min-height:44px;padding:0 18px;border-radius:10px;border:1px solid var(--line2);background:var(--card);font-size:13px;cursor:pointer}
.ebs-btn:disabled{opacity:.5;cursor:default}
.ebs-btn-primary{background:var(--ink);border-color:var(--ink);color:#fffcf0 !important;font-weight:500}
.ebs-btn-outline{border-color:var(--ink);background:transparent}
.ebs-btn-danger{border-color:#b3261e;background:transparent;color:var(--bad)}
.ebs-btn-icon{width:44px;min-height:44px;padding:0;display:inline-flex;align-items:center;justify-content:center}
.ebs-pill{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:500;white-space:nowrap}
.ebs-ok{background:var(--okbg);color:var(--ok)}
.ebs-warn{background:var(--warnbg);color:var(--warn)}
.ebs-info{background:var(--infobg);color:var(--info)}
.ebs-bad{background:var(--badbg);color:var(--bad)}
.ebs-input{min-height:44px;width:100%;border-radius:10px;border:1px solid #cfc9ae;background:#fffcf0;padding:0 12px;font-size:12px}
.ebs-textarea{width:100%;border-radius:10px;border:1px solid #cfc9ae;background:#fffcf0;padding:10px 12px;font-size:12px;min-height:110px}
.ebs-chip{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 14px 0 8px;border-radius:999px;border:1px solid var(--line2);background:var(--card);font-size:12px}
.ebs-chip-warn{background:var(--warnbg);border-color:#e3c98f;color:var(--warn)}
.ebs-avatar{flex:none;width:28px;height:28px;padding:0;border:0;background:transparent;cursor:pointer;display:block;position:relative}
.ebs-avatar .pen{opacity:0;transition:opacity .15s}
.ebs-avatar:hover .pen,.ebs-avatar:focus-visible .pen{opacity:1}
.ebs-avatar:hover .ini,.ebs-avatar:focus-visible .ini{opacity:0}
.ebs-tip{position:relative}
.ebs-tip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:var(--ink);color:#fffcf0;font-size:11px;line-height:1;padding:7px 10px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s;z-index:5}
.ebs-tip:hover::after,.ebs-tip:focus-visible::after{opacity:1}
.ebs-account{display:flex;flex-wrap:nowrap;align-items:center;gap:16px;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:12px 16px}
.ebs-account>.ebs-name{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:2px}
.ebs-ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ebs-bar{height:8px;border-radius:4px;background:var(--line)}
.ebs-bar>div{height:8px;border-radius:4px}
.ebs-note{display:flex;gap:10px;border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.5}
.ebs-overlay{position:fixed;inset:0;z-index:50;background:rgba(21,21,21,.5);display:flex;align-items:center;justify-content:center;padding:24px}
.ebs-modal{width:100%;max-width:600px;max-height:calc(100vh - 48px);overflow:auto;background:#fffcf0;border:1px solid var(--ink);border-radius:16px;padding:26px;display:flex;flex-direction:column;gap:20px}
.ebs-swatch{width:44px;height:44px;border-radius:50%;border:0;cursor:pointer}
.ebs-swatch[aria-pressed=true]{box-shadow:0 0 0 2px #fffcf0,0 0 0 4px var(--ink)}
.ebs-table-row{border-bottom:1px solid #eee9d3}
.ebs-table-head,.ebs-entry{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 16px}
.ebs-pre{margin:0;border:1px solid var(--line2);background:#fffcf0;border-radius:10px;padding:14px;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.ebs-tabs{display:flex;flex-wrap:wrap;gap:8px}
.ebs-tab{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line2);background:var(--card);font-size:12px;cursor:pointer}
.ebs-tab[aria-selected=true]{background:var(--ink);border-color:var(--ink);color:#fffcf0}
.ebs-switch{width:44px;height:26px;border-radius:13px;border:0;padding:0;cursor:pointer;background:#cfc9ae;position:relative}
.ebs-switch[aria-checked=true]{background:var(--ink)}
.ebs-switch::after{content:'';position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:50%;background:#fffcf0;transition:left .12s}
.ebs-switch[aria-checked=true]::after{left:22px}
@media (max-width:720px){.ebs{padding:16px}.ebs-account{flex-wrap:wrap}}
`;
