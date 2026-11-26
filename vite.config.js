import {defineConfig} from 'vite';
import {captureWebsite, listCaptures} from './scripts/capture-core.mjs';

export default defineConfig({server:{host:'127.0.0.1'},plugins:[{name:'social-factory-local-harvest',configureServer(server){server.middlewares.use('/api',async(req,res,next)=>{
 if(req.method==='GET'&&req.url?.startsWith('/captures?')){try{const u=new URL(req.url,'http://localhost');const name=u.searchParams.get('project')||'';const result=await listCaptures(name);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}return}
 if(req.method!=='POST'||req.url!=='/harvest')return next();
 let data='';for await(const chunk of req){data+=chunk;if(data.length>10000){res.statusCode=413;res.end('Too large');return}}
 try{const body=JSON.parse(data),result=await captureWebsite(body.url,body.project);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}catch(e){res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:e.message}))}
 })}}]});
