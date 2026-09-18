import { createFileRoute } from '@tanstack/react-router';
import { getEnv } from '@/lib/server/env';
import { processNextCv, validMaintenanceSecret } from '@/lib/server/processing';
import { enforceRateLimit, pruneRateLimits } from '@/lib/server/ratelimit';
export const Route=createFileRoute('/api/maintenance')({server:{handlers:{POST:async({request})=>{
  try {
    const env=await getEnv();
    if(!await validMaintenanceSecret(request.headers.get('authorization'),env.CRON_SECRET)) return new Response('Unauthorized',{status:401});
    await enforceRateLimit(env,'cvWorker','maintenance');
    const result=await processNextCv(env);
    await pruneRateLimits(env);
    return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  } catch {return Response.json({error:'Maintenance unavailable'},{status:503});}
}}}});
