import {createFileRoute,Link,useRouter} from '@tanstack/react-router';
import {useState} from 'react';
import {getCvQueueFn,runCvWorkerFn} from '@/lib/functions';
import {UploadReconciliation} from '@/components/app/UploadReconciliation';
export const Route=createFileRoute('/admin/processing')({loader:()=>getCvQueueFn(),component:Queue});
function Queue(){
  const jobs=Route.useLoaderData();const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function run(){setBusy(true);setMessage('');try{const r=await runCvWorkerFn({data:{}});setMessage(r.status==='idle'?'No work is currently due.':r.status==='succeeded'?'One assessment completed.':'Attempt did not complete; check its retry status.');await router.invalidate();}catch{setMessage('Worker unavailable. Check runtime configuration.');}finally{setBusy(false);}}
  return <section><h1 className="font-display text-3xl">CV processing</h1><p className="my-3 text-ink-soft">Latest 100 tasks. Each run handles one due task. Tasks retry up to three times; expired worker leases recover after 15 minutes. Scheduling must be configured for automatic processing.</p>
    <UploadReconciliation />
    <button className="px-5 py-2 rounded-full bg-ink text-paper" disabled={busy} onClick={run}>{busy?'Processing one task…':'Process next due task'}</button>
    <p role="status" className="my-3">{message}</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Candidate','Kind','Status','Attempts','Available','Last issue'].map(x=><th className="text-left p-2" key={x}>{x}</th>)}</tr></thead><tbody>{jobs.map(j=><tr className="border-t border-rule" key={j.id}><td className="p-2"><Link to="/app/candidates/$id" params={{id:j.candidate_id}} className="underline">{j.candidate_id}</Link></td><td>{j.kind}</td><td>{j.status}</td><td>{j.attempts}/3</td><td>{new Date(j.available_at).toLocaleString()}</td><td>{j.last_error??'—'}</td></tr>)}</tbody></table></div>{!jobs.length&&<p className="my-4">No processing tasks yet.</p>}</section>;
}
