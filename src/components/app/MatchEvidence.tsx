import {useState} from 'react';
import {assessMatchEvidenceFn} from '@/lib/functions';
import type {EvidenceReview} from '@/lib/server/match-evidence';
export function MatchEvidence({candidateId,jobId}:{candidateId:string;jobId:string}){
 const [review,setReview]=useState<EvidenceReview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function run(){setBusy(true);setError('');setReview(null);try{setReview(await assessMatchEvidenceFn({data:{candidateId,jobId}}));}catch(e){setError(e instanceof Error?e.message:'Review unavailable');}finally{setBusy(false);}}
 return <div className="border border-rule rounded-md p-3 mb-4 text-sm"><button disabled={busy} onClick={run} className="underline">{busy?'Reviewing evidence…':'Review evidence with Claude'}</button>
 {error&&<p role="alert">{error}</p>}{review&&<div><p className="my-2">{review.notice}</p><p>{review.version} · {new Date(review.assessedAt).toLocaleString()}</p><ul>{review.requirements.map((r,i)=><li key={i} className="my-2"><strong>{r.requirement}</strong>: {r.status==='not_established'?'Not established':`Evidence found: “${r.quote}”`}</li>)}</ul></div>}</div>;
}
