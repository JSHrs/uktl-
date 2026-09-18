import type {AppEnv} from './env';

export const UPLOAD_RECONCILIATION_GRACE_MS=24*60*60*1000;
export const RECONCILIATION_LIMIT=100;
export const ORPHAN_OBJECTS_SQL=`SELECT o.id::text AS id
  FROM storage.objects o
  WHERE o.bucket_id='uktl-cvs' AND o.name LIKE 'cvs/%'
    AND o.created_at < to_timestamp(?1 / 1000.0)
    AND COALESCE(o.updated_at,o.created_at) < to_timestamp(?1 / 1000.0)
    AND NOT EXISTS (SELECT 1 FROM recruitment.candidates c WHERE c.source_r2_key=o.name)
    AND NOT EXISTS (SELECT 1 FROM recruitment.cv_versions v WHERE v.storage_key=o.name)
  ORDER BY o.id LIMIT 101`;
export const MISSING_OBJECTS_SQL=`SELECT c.id
  FROM recruitment.candidates c
  WHERE c.source_r2_key IS NOT NULL AND c.source_r2_key<>''
    AND c.created_at<?1 AND c.updated_at<?1
    AND NOT EXISTS (SELECT 1 FROM storage.objects o
      WHERE o.bucket_id='uktl-cvs' AND o.name=c.source_r2_key)
    AND NOT EXISTS (SELECT 1 FROM recruitment.processing_jobs p
      WHERE p.candidate_id=c.id AND p.status IN ('pending','running'))
  ORDER BY c.id LIMIT 101`;

export type UploadReconciliationReport={
  checkedAt:number;cutoff:number;
  orphanObjects:{id:string}[];missingFiles:{id:string}[];
  moreOrphanObjects:boolean;moreMissingFiles:boolean;
};

// Metadata-only, non-destructive snapshot samples. These are review signals,
// not authorization to delete: a follow-up must recheck references and leases.
export async function inspectUploadReconciliation(env:AppEnv):Promise<UploadReconciliationReport>{
  if(env.DATA_BACKEND!=='supabase') throw new Error('Upload reconciliation requires Supabase');
  const checkedAt=Date.now(),cutoff=checkedAt-UPLOAD_RECONCILIATION_GRACE_MS;
  try {
    const [objects,candidates]=await Promise.all([
      env.DB.prepare(ORPHAN_OBJECTS_SQL).bind(cutoff).all<{id:string}>(),
      env.DB.prepare(MISSING_OBJECTS_SQL).bind(cutoff).all<{id:string}>(),
    ]);
    if(!objects.success||!candidates.success||!objects.results||!candidates.results) throw new Error('Query failed');
    const ids=(rows:{id:string}[])=>rows.slice(0,RECONCILIATION_LIMIT).map(row=>{
      if(typeof row.id!=='string'||!row.id) throw new Error('Invalid result');
      return {id:row.id};
    });
    return {checkedAt,cutoff,orphanObjects:ids(objects.results),missingFiles:ids(candidates.results),
      moreOrphanObjects:objects.results.length>RECONCILIATION_LIMIT,moreMissingFiles:candidates.results.length>RECONCILIATION_LIMIT};
  }catch{throw new Error('Upload reconciliation unavailable. No files or candidate records were changed.');}
}
