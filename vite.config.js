import {defineConfig} from 'vite';
import {readFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {captureWebsite, listCaptures} from './scripts/capture-core.mjs';

export default defineConfig({server:{host:'127.0.0.1'},plugins:[{name:'social-factory-local-harvest',configureServer(server){server.middlewares.use(async(req,res,next)=>{const requestUrl=new URL(req.url,'http://localhost');if(req.method==='GET'&&requestUrl.pathname.startsWith('/captures/')){try{const parts=requestUrl.pathname.split('/').filter(Boolean);if(parts.length!==3||!['desktop.png','portrait.png','mobile.png'].includes(parts[2])||!/^[a-z0-9-]+$/.test(parts[1]))throw Error('Invalid capture path');const data=await readFile(resolve('exports',parts[1],'captures',parts[2]));res.setHeader('Content-Type','image/png');res.end(data)}catch{res.statusCode=404;res.end('Capture not found')}return}if(!requestUrl.pathname.startsWith('/api/'))return next();req.url=requestUrl.pathname+requestUrl.search;
 if(req.method==='GET'&&req.url?.startsWith('/captures?')){try{const u=new URL(req.url,'http://localhost');const name=u.searchParams.get('project')||'';const result=await listCaptures(name);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}return}
 if(req.method!=='POST'||req.url!=='/harvest')return next();
 let data='';for await(const chunk of req){data+=chunk;if(data.length>10000){res.statusCode=413;res.end('Too large');return}}
 try{const body=JSON.parse(data),result=await captureWebsite(body.url,body.project);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result))}catch(e){res.statusCode=400;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:e.message}))}
 })}}]});
