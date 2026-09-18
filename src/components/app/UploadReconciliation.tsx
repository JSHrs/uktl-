import {useState} from 'react';
import {inspectUploadsFn} from '@/lib/functions';
import type {UploadReconciliationReport} from '@/lib/server/upload-reconciliation';

export function UploadReconciliation(){
  const [report,setReport]=useState<UploadReconciliationReport|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function inspect(){
    setBusy(true);setError('');setReport(null);
    try{setReport(await inspectUploadsFn({data:{}}));}
    catch{setError('Inspection unavailable. No files or candidate records were changed.');}
    finally{setBusy(false);}
  }
  return <section className="my-8 border-t border-rule pt-6">
    <h2 className="font-display text-2xl">Upload reconciliation</h2>
    <p className="my-3 text-ink-soft">Inspect metadata older than 24 hours. Active processing tasks are excluded from missing-file findings. This does not download or delete CVs, verify file contents, or repair records.</p>
    <button className="px-5 py-2 rounded-full bg-ink text-paper" disabled={busy} onClick={inspect}>{busy?'Inspecting…':'Inspect upload metadata'}</button>
    {error&&<p role="alert" className="my-3">{error}</p>}
    {report&&<div role="status" className="my-4">
      <p>Checked {new Date(report.checkedAt).toLocaleString()}. First 100 findings per category; not a complete storage audit. Recheck before any cleanup.</p>
      <h3 className="font-semibold mt-4">Unreferenced objects: {report.orphanObjects.length}{report.moreOrphanObjects?'+':''}</h3>
      <ul className="list-disc pl-6">{report.orphanObjects.map(o=><li key={o.id}>Object {o.id}</li>)}</ul>
      <h3 className="font-semibold mt-4">Candidate records missing object metadata: {report.missingFiles.length}{report.moreMissingFiles?'+':''}</h3>
      <ul className="list-disc pl-6">{report.missingFiles.map(c=><li key={c.id}>Candidate {c.id}</li>)}</ul>
      {report.moreOrphanObjects||report.moreMissingFiles?<p>Additional findings exist beyond this sample.</p>:null}
      {!report.orphanObjects.length&&!report.missingFiles.length&&<p>No findings within these metadata checks. This does not prove every stored file is intact.</p>}
    </div>}
  </section>;
}
