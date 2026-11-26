import {captureWebsite} from './capture-core.mjs';
const url=process.argv[2];if(!url){console.error('Usage: npm run capture -- <URL> [project-name]');process.exit(1)}
captureWebsite(url,process.argv[3]).then(result=>console.log(JSON.stringify(result,null,2))).catch(e=>{console.error(e.message);process.exitCode=1});
