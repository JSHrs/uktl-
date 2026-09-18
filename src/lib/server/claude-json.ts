import {z} from 'zod';
export async function claudeJson<T>(args:{apiKey?:string;model?:string;system:string;input:unknown;schema:z.ZodType<T>;maxTokens?:number}):Promise<T>{
 if(!args.apiKey)throw new Error('AI service is not configured');
 const input=JSON.stringify(args.input);
 if(input.length>100000)throw new Error('Assessment input is too large');
 try{
  const response=await fetch('https://api.anthropic.com/v1/messages',{
   method:'POST',signal:AbortSignal.timeout(60000),redirect:'error',
   headers:{'x-api-key':args.apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
   body:JSON.stringify({model:args.model??'claude-sonnet-4-6',max_tokens:args.maxTokens??3000,system:args.system,messages:[{role:'user',content:input}]})});
  if(!response.ok)throw new Error('Provider unavailable');
  const raw=await response.text();if(raw.length>100000)throw new Error('Response too large');
  const body=JSON.parse(raw);
  if(body.stop_reason!=='end_turn'||!Array.isArray(body.content))throw new Error('Incomplete response');
  const text=body.content.filter((c:{type:string})=>c.type==='text').map((c:{text:string})=>c.text).join('');
  return args.schema.parse(JSON.parse(text));
 }catch{throw new Error('AI assessment unavailable or invalid. No result was saved.');}
}
