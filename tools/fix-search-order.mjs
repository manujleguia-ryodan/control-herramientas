import fs from 'node:fs';
const path='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let s=fs.readFileSync(path,'utf8');
const line='  const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: toolQuery }, { enabled: Boolean(me.data), retry: false });\n';
if (!s.includes(line)) throw new Error('search hook not found');
s=s.replace(line,'');
const marker='const [newUser, setNewUser] = useState({ nombre: "", pin: "" }); const [toolsFile, setToolsFile] = useState<File | null>(null); const [peopleFile, setPeopleFile] = useState<File | null>(null);';
s=s.replace(marker, marker+'\n  const toolSearchQuery = trpc.catalog.searchTools.useQuery({ query: toolQuery }, { enabled: Boolean(me.data), retry: false });');
fs.writeFileSync(path,s);
