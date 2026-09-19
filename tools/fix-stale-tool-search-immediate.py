from pathlib import Path
p = Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s = p.read_text()
old = '{toolQuery && <div className="suggestions">{toolSearchQuery.isFetching ? <span>Buscando herramientas…</span> : toolMatches.length ? toolMatches.map((tool) => {'
new = '{toolQuery && <div className="suggestions">{toolSearchQuery.isFetching || debouncedToolQuery !== toolQuery.trim() ? <span>Buscando herramientas…</span> : toolMatches.length ? toolMatches.map((tool) => {'
if old not in s:
    raise SystemExit('suggestions loading expression not found')
s = s.replace(old, new, 1)
p.write_text(s)
