import {useState} from 'react';
import {refreshMatchBatchFn} from '@/lib/functions';
import type {MatchCursor} from '@/lib/server/match-evidence';
export function MatchRefresh(){
 const [cursor,setCursor]=useState<MatchCursor|undefined>(),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[count,setCount]=useState(0);
 async function run(){setBusy(true);try{const r=await refreshMatchBatchFn({data:{cursor}});const total=count+r.saved;setCount(r.nextCursor?total:0);setCursor(r.nextCursor??undefined);setMessage(r.nextCursor?`${total} matches refreshed. Continue the next batch.`:`Pass complete: ${total} matches refreshed. Jobs/profiles added or changed during a pass may require another pass.`);}catch(e){setMessage(e instanceof Error?e.message:'Refresh failed');}finally{setBusy(false);}}
 return <section className="my-6 border-t border-rule pt-4"><h2 className="font-display text-2xl">Vacancy match refresh</h2><p className="my-3">25 candidate/vacancy pairs per batch. No AI calls; existing consultant stages are preserved. Continue until the pass completes. Reloading restarts the pass safely.</p><button disabled={busy} onClick={run} className="underline">{busy?'Refreshing…':cursor?'Continue match refresh':'Start match refresh'}</button><p role="status">{message}</p></section>;
}
