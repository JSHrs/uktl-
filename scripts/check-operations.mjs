const url=process.env.UKTL_MONITOR_URL,token=process.env.UKTL_MONITOR_TOKEN;
if(!url||!token||token.length<32)throw new Error('Set UKTL_MONITOR_URL and UKTL_MONITOR_TOKEN securely before monitoring.');
const endpoint=new URL(url);
if(endpoint.protocol!=='https:'||endpoint.pathname!=='/api/operations/health'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('Monitoring requires the exact HTTPS operations health endpoint.');
try {
 const r=await fetch(endpoint,{headers:{authorization:`Bearer ${token}`},redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw new Error();
 const status=await r.json();if(status.status!=='healthy')throw new Error();
 console.log('UKTL operational checks healthy.');
}catch{console.error('UKTL operational check failed. Inspect the protected Operations dashboard.');process.exitCode=1;}
