import fs from 'node:fs';
const path='/home/ubuntu/control-herramientas/client/src/pages/Home.tsx';
let s=fs.readFileSync(path,'utf8');
s=s.replace('const { user, loading: authLoading, isAuthenticated, refresh } = useAuth();','const { user, loading: authLoading, isAuthenticated, refresh: authRefresh } = useAuth();');
s=s.replace('onSuccess: () => refresh() });','onSuccess: () => authRefresh() });');
fs.writeFileSync(path,s);
