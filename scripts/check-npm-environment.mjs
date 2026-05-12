import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
function run(args){try{return{ok:true,stdout:execFileSync(process.platform==='win32'?'npm.cmd':'npm',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()}}catch(e){return{ok:false,status:e.status??1,stdout:String(e.stdout??'').trim(),stderr:String(e.stderr??e.message??'').trim()}}}
const lock=fs.existsSync('package-lock.json')?fs.readFileSync('package-lock.json','utf8'):'';
const internal=(lock.match(/packages\.applied-caas-gateway1\.internal\.api\.openai\.org/g)||[]).length;
const credentialed=(lock.match(/https:\/\/[^/\s"]+:[^@\s"]+@/g)||[]).length;
const regEnv=process.env.NPM_CONFIG_REGISTRY||'';
const npmRegistry=run(['config','get','registry','--no-workspaces']);
const findings=[];
if(regEnv) findings.push({code:'registry_env_present',severity:regEnv.includes('@')?'blocker':'warning',message:'Host sets NPM_CONFIG_REGISTRY; protected/credentialed values can break Next SWC build.'});
if(internal) findings.push({code:'lockfile_internal_registry_urls',severity:'blocker',count:internal});
if(credentialed) findings.push({code:'lockfile_credentialed_urls',severity:'blocker',count:credentialed});
if(!npmRegistry.ok) findings.push({code:'npm_registry_read_failed',severity:'blocker',message:'npm config get registry failed; use clean scripts.'});
const ok=findings.every(f=>f.severity!=='blocker');
console.log(JSON.stringify({ok,nodeVersion:process.version,npmVersion:run(['--version']),npmRegistry,npmUserconfig:run(['config','get','userconfig','--no-workspaces']),hasNpmConfigRegistryEnv:Boolean(regEnv),npmConfigRegistryEnvKind:regEnv?(regEnv.includes('@')?'credentialed_or_protected':'plain'):'absent',lockInternalRegistryMatches:internal,lockCredentialMatches:credentialed,findings,remediation:['npm run lockfile:public-registry','npm run install:clean','npm run build:clean && npm run live:smoke:clean']},null,2));
process.exit(ok?0:1);
