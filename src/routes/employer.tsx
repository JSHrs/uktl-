import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppLayout";
import { EmployerHome } from "@/components/app/EmployerHome";
export const Route=createFileRoute("/employer")({
  beforeLoad:({context})=>{if(!context.session.userId)throw redirect({to:"/auth/login",search:{redirect:"/employer"}});if(context.session.accountRole!=="employer")throw redirect({to:"/employers"});},
  head:()=>({meta:[{title:"Employer account — UK Talent Link"},{name:"robots",content:"noindex, nofollow"}]}),
  component: () => (
    <AppShell>
      <EmployerHome />
    </AppShell>
  ),
});
