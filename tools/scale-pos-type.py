from pathlib import Path
p=Path('/home/ubuntu/control-herramientas/client/src/index.css')
s=p.read_text()
css=r'''
/* Escala de lectura para computadora y tablet: títulos se conservan, texto operativo aumenta */
.pos-app { font-size: 16px; }
.pos-app p, .pos-app span, .pos-app label, .pos-app td, .pos-app th, .pos-app input, .pos-app select, .pos-app textarea, .pos-app button { font-size: 15px; }
.pos-header { min-height: 78px; }
.pos-brand strong { font-size: 23px; }
.pos-brand small { font-size: 12px; }
.pos-session { font-size: 15px; }
.pos-tabs { gap: 8px; padding: 12px 28px; }
.pos-tabs button { min-height: 44px; padding: 11px 15px; font-size: 15px; }
.pos-tabs button b { min-width: 22px; height: 22px; font-size: 12px; }
.pos-main { max-width: 1520px; padding: 34px 42px 58px; }
.pos-title p { font-size: 16px; line-height: 1.5; }
.dispatch-card, .pos-card { border-radius: 14px; }
.typeahead > span { font-size: 15px; }
.typeahead .search-box { min-height: 48px; }
.typeahead .search-box input { min-height: 46px; font-size: 16px; }
.typeahead .search-box button { width: 38px; height: 38px; }
.suggestions button { padding: 12px 14px; }
.suggestions button b, .suggestions button small { font-size: 15px; }
.suggestions button small { margin-top: 4px; }
.selected-chip { padding: 8px 11px; font-size: 14px; }
.serial-notice, .dispatch-summary { padding: 13px 15px; font-size: 15px; }
.pos-primary, .pos-secondary, .pos-danger, .pos-small, .retire-button, .file-button, .inventory-toolbar button { min-height: 44px; padding: 10px 16px; font-size: 15px; }
.inventory-toolbar input, .report-toolbar > input, .report-toolbar label input { height: 48px; font-size: 15px; }
.inventory-toolbar button { min-height: 44px; }
.tool-card { gap: 13px; padding: 19px; }
.tool-card b { font-size: 16px !important; }
.tool-card span, .tool-card .tool-location { margin-top: 6px; font-size: 14px !important; }
.tool-card em { font-size: 14px; }
.tool-card p { font-size: 14px; }
.loan-detail, .audit-detail { font-size: 13px !important; }
.rotation-panel b { font-size: 15px; }
.rotation-panel div span, .rotation-panel > em, .rotation-panel > span { font-size: 13px; }
.rotation-panel > span { padding: 9px 11px; }
.table-wrap { overflow-x: auto; }
.table-wrap th { font-size: 13px; letter-spacing: .04em; }
.table-wrap td { font-size: 15px; }
.table-wrap td small { font-size: 13px; }
.add-form h3, .bulk-card h3 { font-size: 17px; }
.add-form input, .add-form select, .pos-login input, .pos-login select { height: 48px; padding: 0 13px; font-size: 15px; }
.bulk-card p { font-size: 14px; }
.bulk-actions > span { font-size: 13px; }
.empty-state { min-height: 150px; font-size: 15px; }
.pos-toast { padding: 14px 18px; font-size: 15px; }
.pos-modal { width: min(560px, 100%); padding: 30px; }
.pos-modal p { font-size: 15px; }
.pos-modal label { font-size: 14px; }
.pos-modal input, .pos-modal select, .pos-modal textarea { font-size: 15px; }
.pos-modal input, .pos-modal select { min-height: 46px; padding: 0 12px; }
.pos-modal textarea { padding: 12px; }
.pos-modal label small { font-size: 13px; }
.pos-login-card { width: min(470px, 100%); }
.pos-login-card p { font-size: 15px; }
.pos-login-card small { font-size: 13px; }
.pos-error { font-size: 14px; }
@media (max-width: 900px) and (min-width: 761px) {
  .pos-main { padding-left: 28px; padding-right: 28px; }
  .pos-tabs { padding-left: 20px; padding-right: 20px; overflow-x: auto; }
}
'''
if '/* Escala de lectura para computadora y tablet' not in s:
    s += '\n' + css
p.write_text(s)
