import {useEffect,useState} from 'react';
import type {ParsedProfile} from '@/lib/schemas/profile';
import {EditableProfileSchema} from '@/lib/schemas/editable-profile';
import {getEditableProfileFn,saveEditableProfileFn} from '@/lib/functions';

const inputClass='block w-full mt-1 p-2 border border-rule rounded bg-paper text-ink';
export function ProfileEditor({id,onSaved,onClose}:{id:string;onSaved:()=>void;onClose:()=>void}) {
  const [value,setValue]=useState<ParsedProfile|null>(null);
  const [revision,setRevision]=useState(0);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  useEffect(()=>{
    let current=true;
    getEditableProfileFn({data:{id}}).then(result=>{if(!current)return;if(result){setValue(result.profile);setRevision(result.revision);}else setError('An extracted profile is not available yet.');})
      .catch(()=>{if(current)setError('Could not load your profile. Close and try again.');});
    return ()=>{current=false;};
  },[id]);
  async function save(event:React.FormEvent) {
    event.preventDefault(); if(!value)return;
    const parsed=EditableProfileSchema.safeParse(value);
    if(!parsed.success){setError(parsed.error.issues.map(i=>`${i.path.join(' ')}: ${i.message}`).join('; '));return;}
    setSaving(true);setError('');
    try {await saveEditableProfileFn({data:{id,revision,profile:parsed.data}});onSaved();}
    catch(err){setError(err instanceof Error?err.message:'Could not save your profile');}
    finally{setSaving(false);}
  }
  return <section className="border border-rule p-6 rounded my-6" aria-label="Correct extracted profile">
    <h2 className="font-display text-2xl">Correct your profile</h2>
    <p className="text-sm text-ink-soft my-3">Check the information extracted from your CV. Saving queues a new assessment and match refresh. Your original CV file stays as uploaded; upload a new file to replace its contents.</p>
    {error&&<p role="alert" className="text-red-700 my-3">{error}</p>}
    {!value&&!error&&<p role="status">Loading your profile…</p>}
    {value&&<form onSubmit={save}>
      <fieldset disabled={saving}>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['name','email','phone','location','headline','work_authorization'] as const).map(key=><label key={key} className="text-sm capitalize">{key.replaceAll('_',' ')}<input className={inputClass} value={value[key]??''} maxLength={300} onChange={e=>setValue({...value,[key]:e.target.value})}/></label>)}
          <label className="text-sm">Sector<select className={inputClass} value={value.sector??''} onChange={e=>setValue({...value,sector:(e.target.value||null) as ParsedProfile['sector']})}><option value="">Not specified</option><option value="construction">Construction</option><option value="technology">Technology</option><option value="other">Other</option></select></label>
          <label className="text-sm">Seniority<select className={inputClass} value={value.seniority??''} onChange={e=>setValue({...value,seniority:(e.target.value||null) as ParsedProfile['seniority']})}><option value="">Not specified</option>{['junior','mid','senior','lead','director','executive'].map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="text-sm">Total years of experience<input className={inputClass} type="number" min="0" max="80" step="0.5" value={value.total_years_experience??''} onChange={e=>setValue({...value,total_years_experience:e.target.value===''?null:Number(e.target.value)})}/></label>
        </div>
        <label className="block text-sm mt-4">Summary<textarea className={inputClass} rows={4} maxLength={6000} value={value.summary??''} onChange={e=>setValue({...value,summary:e.target.value})}/></label>
        <h3 className="font-display text-xl mt-6">Skills</h3>
        {value.skills.map((skill,i)=><div key={i} className="flex flex-wrap items-end gap-3 my-2">
          <label className="text-sm flex-1">Skill {i+1}<input className={inputClass} maxLength={100} value={skill.skill} onChange={e=>setValue({...value,skills:value.skills.map((s,n)=>n===i?{...s,skill:e.target.value}:s)})}/></label>
          <label className="text-sm">Years<input className={inputClass} type="number" min="0" max="80" step="0.5" value={skill.years_experience??''} onChange={e=>setValue({...value,skills:value.skills.map((s,n)=>n===i?{...s,years_experience:e.target.value===''?null:Number(e.target.value)}:s)})}/></label>
          <button type="button" className="underline p-2" aria-label={`Remove skill ${i+1}`} onClick={()=>setValue({...value,skills:value.skills.filter((_,n)=>n!==i)})}>Remove</button>
        </div>)}
        <button type="button" className="underline my-2" disabled={value.skills.length>=100} onClick={()=>setValue({...value,skills:[...value.skills,{skill:''}]})}>Add skill</button>
        {(['experience','education'] as const).map(section=><div key={section}>
          <h3 className="font-display text-xl mt-6 capitalize">{section}</h3>
          {value[section].map((entry,i)=><fieldset key={i} className="border border-rule rounded p-4 my-3">
            <legend className="capitalize px-2">{section} {i+1}</legend>
            <div className="grid sm:grid-cols-2 gap-3">{(section==='experience'?['company','title','start_date','end_date','location','description']:['institution','degree','field','start_year','end_year']).map(key=><label key={key} className="text-sm capitalize">{key.replaceAll('_',' ')}<textarea className={inputClass} rows={key==='description'?3:1} maxLength={key==='description'?6000:300} value={(entry as Record<string,unknown>)[key] as string??''} onChange={e=>setValue({...value,[section]:value[section].map((s,n)=>n===i?{...s,[key]:e.target.value}:s)})}/></label>)}</div>
            {section==='experience'&&<label className="block text-sm my-3"><input type="checkbox" checked={!!(entry as {is_current?:boolean}).is_current} onChange={e=>setValue({...value,experience:value.experience.map((s,n)=>n===i?{...s,is_current:e.target.checked}:s)})}/> Current role</label>}
            <button type="button" className="underline mt-3" onClick={()=>setValue({...value,[section]:value[section].filter((_,n)=>n!==i)})}>Remove {section} {i+1}</button>
          </fieldset>)}
          <button type="button" className="underline my-2" disabled={value[section].length>=(section==='experience'?50:30)} onClick={()=>setValue({...value,[section]:[...value[section],{}]})}>Add {section}</button>
        </div>)}
        {(['languages','certifications'] as const).map(key=><label key={key} className="block text-sm mt-4 capitalize">{key} (one per line)<textarea className={inputClass} value={value[key].join('\n')} onChange={e=>setValue({...value,[key]:e.target.value.split('\n')})}/></label>)}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">{(['linkedin','github','portfolio'] as const).map(key=><label key={key} className="text-sm capitalize">{key}<input className={inputClass} value={value.links?.[key]??''} onChange={e=>setValue({...value,links:{...value.links,[key]:e.target.value}})}/></label>)}</div>
        <button className="bg-ink text-paper rounded-full px-5 py-2 mt-6" type="submit">{saving?'Saving…':'Save and refresh assessment'}</button>
      </fieldset>
    </form>}
    <button type="button" disabled={saving} className="underline mt-4" onClick={onClose}>Close editor</button>
  </section>;
}
