import fs from 'node:fs'; import os from 'node:os';
function ex(p){return fs.existsSync(p)}
const platform=os.platform(), arch=os.arch();
let swc=null;
if(platform==='linux'&&arch==='x64') swc='node_modules/@next/swc-linux-x64-gnu';
if(platform==='linux'&&arch==='arm64') swc='node_modules/@next/swc-linux-arm64-gnu';
if(platform==='darwin'&&arch==='x64') swc='node_modules/@next/swc-darwin-x64';
if(platform==='darwin'&&arch==='arm64') swc='node_modules/@next/swc-darwin-arm64';
if(process.platform==='win32'&&arch==='x64') swc='node_modules/@next/swc-win32-x64-msvc';
if(process.platform==='win32'&&arch==='arm64') swc='node_modules/@next/swc-win32-arm64-msvc';
const nextBin=process.platform==='win32'?'node_modules/.bin/next.cmd':'node_modules/.bin/next';
const checks=[{name:'next_binary',path:nextBin,ok:ex(nextBin)},{name:'platform_swc_optional_package',platform,arch,path:swc,ok:swc?ex(swc):false}];
const ok=checks.every(c=>c.ok);
console.log(JSON.stringify({ok,checks,message:ok?'Next binary and expected SWC optional package are present.':'Dependencies are incomplete. Run npm run install:clean without --omit=optional.'},null,2));
process.exit(ok?0:1);
