import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { chooseAccountRoleFn } from "@/lib/account-functions";
export function AccountType({role}: {role:"candidate"|"employer"}) {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function change(){setBusy(true);setError("");try{const next=role==="candidate"?"employer":"candidate";await chooseAccountRoleFn({data:{role:next}});await router.invalidate();await router.navigate({href:next==="employer"?"/employer":"/app"});}catch(e){setError(e instanceof Error?e.message:"Unable to change account type");}finally{setBusy(false);}}
  return <section className="border border-rule rounded-lg p-5 my-6"><h2 className="font-display text-xl">{role==="employer"?"Looking for work yourself?":"Hiring?"}</h2><p className="text-sm my-3 text-ink-soft">{role==="employer"?"This is an employer account. To upload a CV and be matched to roles, switch to a candidate account.":"Candidate accounts manage their own CV and job interests."}</p><button disabled={busy} onClick={change} className="min-h-11 underline">{busy?"Saving…":`Switch to a ${role==="candidate"?"employer":"candidate"} account`}</button>{error&&<p role="alert">{error}</p>}</section>;
}
