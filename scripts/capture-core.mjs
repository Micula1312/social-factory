import {chromium} from 'playwright';
import {mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

const folder=resolve('exports');
export const slugify=value=>String(value||'project').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'project';
function isPrivate(ip){if(ip==='::1'||ip==='::'||ip.startsWith('fe80:')||ip.startsWith('fc')||ip.startsWith('fd'))return true;if(ip.startsWith('::ffff:'))return isPrivate(ip.slice(7));if(isIP(ip)===4){const a=ip.split('.').map(Number);return a[0]===0||a[0]===10||a[0]===127||a[0]===169&&a[1]===254||a[0]===172&&a[1]>=16&&a[1]<=31||a[0]===192&&a[1]===168||a[0]>=224}return false}
async function validateAddress(raw){const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw Error('Use an HTTP(S) URL');if(url.username||url.password)throw Error('Embedded credentials are not allowed');const host=url.hostname.toLowerCase();if(host==='localhost'||host==='127.0.0.1'||host==='[::1]')return url;if(host==='0.0.0.0'||host.endsWith('.localhost'))throw Error('Use localhost or 127.0.0.1 explicitly');const records=await lookup(host,{all:true});if(records.some(r=>isPrivate(r.address)))throw Error('Private-network hosts are not supported (localhost is allowed)');return url}
export async function listCaptures(project){const slug=slugify(project);let manifest;try{manifest=JSON.parse(await readFile(join(folder,slug,'manifest.json'),'utf8'))}catch{manifest=null}return manifest||{project:slug,images:[]}}
export async function captureWebsite(url,project){const target=await validateAddress(url);const slug=slugify(project||target.hostname.replace(/^www\./,''));const dir=join(folder,slug);await mkdir(join(dir,'captures'),{recursive:true});const browser=await chromium.launch({headless:true});const pages=[];try{const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});await page.route('**/*',async route=>{try{await validateAddress(route.request().url());await route.continue()}catch{await route.abort()}});await page.goto(target.toString(),{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1400);const views=[{name:'desktop',width:1440,height:1000},{name:'portrait',width:768,height:960},{name:'mobile',width:390,height:844}];for(const v of views){await page.setViewportSize({width:v.width,height:v.height});await page.waitForTimeout(500);const name=v.name+'.png';await page.screenshot({path:join(dir,'captures',name),fullPage:false,animations:'disabled'});pages.push({name:v.name,file:name,url:'/captures/'+slug+'/'+name})}await page.setViewportSize({width:1440,height:1000});const logo=page.locator('header img[alt*="logo" i], header img[class*="logo" i], header svg[class*="logo" i], img[alt*="logo" i], [class*="logo" i] > img, [class*="logo" i] > svg').first();let logoUrl='';try{if(await logo.isVisible()){await logo.screenshot({path:join(dir,'captures','logo.png'),timeout:3000,omitBackground:true});logoUrl='/captures/'+slug+'/logo.png'}}catch{}const heading=await page.title();const manifest={project:slug,url:target.href,title:heading,logo:logoUrl,images:pages,capturedAt:new Date().toISOString()};await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest,null,2));return manifest}finally{await browser.close()}}

export async function recordMobile(url,project){
 const target=await validateAddress(url),slug=slugify(project||target.hostname),dir=join(folder,slug);
 await mkdir(join(dir,'captures'),{recursive:true});
 const browser=await chromium.launch({headless:true});let video;
 try{const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,recordVideo:{dir:join(dir,'captures'),size:{width:390,height:844}}});
 const page=await context.newPage();video=page.video();await page.route('**/*',async route=>{try{await validateAddress(route.request().url());await route.continue()}catch{await route.abort()}});
 await page.goto(target.href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1200);
 await page.evaluate(async()=>{const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);const start=performance.now();await new Promise(resolve=>{function tick(t){const p=Math.min(1,(t-start)/8000);scrollTo(0,max*p);if(p<1)requestAnimationFrame(tick);else resolve()}requestAnimationFrame(tick)})});
 await page.waitForTimeout(800);await context.close();
 }finally{await browser.close()}
 const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const input=await video.path();try{await promisify(execFile)('ffmpeg',['-y','-i',input,'-vf','scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',join(dir,'captures','mobile.mp4')])}catch(e){throw Error('FFmpeg conversion failed: '+(e.code==='ENOENT'?'Install FFmpeg and add it to PATH':e.message))}
 return {url:'/captures/'+slug+'/mobile.mp4'};
}
