from pathlib import Path

p = Path('/home/ubuntu/control-herramientas/client/src/pages/Home.tsx')
s = p.read_text()
old = 'const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: debouncedToolQuery }, { enabled: Boolean(me.data) && debouncedToolQuery.length >= 2, retry: false, staleTime: 30000, refetchOnWindowFocus: false, placeholderData: (previous) => previous });'
new = 'const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: debouncedToolQuery }, { enabled: Boolean(me.data) && debouncedToolQuery.length >= 2, retry: false, staleTime: 30000, refetchOnWindowFocus: false });'
if old not in s:
    raise SystemExit('search query declaration not found')
s = s.replace(old, new, 1)
old = '{toolQuery && <div className="suggestions">{toolMatches.length ? toolMatches.map((tool) => {'
new = '{toolQuery && <div className="suggestions">{toolSearchQuery.isFetching ? <span>Buscando herramientas…</span> : toolMatches.length ? toolMatches.map((tool) => {'
if old not in s:
    raise SystemExit('suggestions block not found')
s = s.replace(old, new, 1)
p.write_text(s)

p = Path('/home/ubuntu/control-herramientas/client/src/index.css')
s = p.read_text()
needle = '.suggestions {'
if needle not in s:
    raise SystemExit('suggestions styles not found')
# no style change required; preserve existing design
p.write_text(s)
