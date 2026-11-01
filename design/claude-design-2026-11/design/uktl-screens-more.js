(()=>{const S=window.UKTL_SCREENS,C=window.UC;
const ph=(eb,h,p,acts='')=>`<div class="ph"><div><div class="eyebrow">${eb}</div><h1 class="disp" style="margin-top:12px">${h}</h1>${p?`<p>${p}</p>`:''}</div>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
const ch=(t,r='',s='')=>`<div class="card-h"><h3>${t}</h3>${r}</div>${s?`<p class="card-s">${s}</p>`:''}`;
const bm=(l,v,ref,c='')=>`<div><span>${l}</span><span class="bm"><i class="${c}" style="width:${v}%"></i>${ref!=null?`<u style="left:${ref}%"></u>`:''}</span><span class="n">${v}</span></div>`;
const fld=(l,inner,cls='')=>`<label class="field ${cls}"><span>${l}</span>${inner}</label>`;
const inp=(l,v='',cls='',p='',t='text')=>fld(l,`<input class="inp" type="${t}" value="${v}" placeholder="${p}">`,cls);
const sel=(l,opts,cls='')=>fld(l,`<select class="inp">${opts.map(o=>`<option>${o}</option>`).join('')}</select>`,cls);
const ta=(l,v='',rows=4,cls='',p='')=>fld(l,`<textarea class="inp" rows="${rows}" placeholder="${p}">${v}</textarea>`,cls);
window.UH={ph,ch,bm,fld,inp,sel,ta};
const hrTabs=a=>`<div class="tabs">${[['hr','Ask a question'],['hrlibrary','Library'],['hrhistory','My questions']].map(t=>`<a href="?s=${t[0]}" class="${a===t[0]?'on':''}">${t[1]}</a>`).join('')}</div>`;
/* ---------- candidate ---------- */
const acts=[
['Interested','good','2 Nov','Senior Financial Analyst','Meridian Capital','Dubai, UAE',94,0],
['Interested','good','31 Oct','FP&amp;A Manager','Halden Group','London, UK',89,0],
['Interested','good','30 Oct','Finance Business Partner','Qamar Health','Riyadh, KSA',86,1],
['Dismissed','line','29 Oct','Accounts Payable Lead','Corvane Logistics','Birmingham, UK',58,0],
['Interested','good','24 Oct','Group Reporting Analyst','Sable Resources','Abu Dhabi, UAE',81,2],
['Dismissed','line','22 Oct','Junior Credit Analyst','Gulfstone Bank','Doha, Qatar',49,0]];
S.activity={nav:'activity',crumb:'Saved & history',html:()=>`
${ph('Saved &amp; history','Your interests <em>and history.</em>','Roles you\u2019ve marked as interested or dismissed, newest first. Showing interest lets UKTL review your profile for the role. It doesn\u2019t apply to the employer directly.',`<a href="?s=discover" class="btn btn-ink">Discover more roles</a>`)}
<div class="bento">
<div class="col c-8">
<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between"><div class="choice"><button class="on">All · 36</button><button>Interested · 14</button><button>Dismissed · 22</button></div><label class="tgl" style="padding:8px 14px"><input type="checkbox"><i></i><span><b style="font-size:13px">Saved jobs only</b></span></label></div>
${acts.map(a=>`<div class="card" style="display:flex;gap:18px;align-items:flex-start">${C.ring(a[6],52)}<div style="flex:1;min-width:0"><div class="chips"><span class="pill ${a[1]}">${a[0]}</span><span class="pill line">${a[2]}</span>${a[7]===1?'<span class="pill warn">Role closed</span>':''}${a[7]===2?'<span class="pill line">Via Reed</span>':''}</div><a href="?s=job" class="disp" style="display:block;font-size:24px;margin-top:10px">${a[3]}</a><p class="soft" style="font-size:13px;margin-top:4px">${a[4]} · ${a[5]}</p><div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">${a[7]===2?'<button class="btn btn-sm">Apply on Reed ↗</button>':''}${a[0]==='Interested'?'<button class="btn btn-sm">Withdraw interest</button>':'<button class="btn btn-sm">Undo dismissal</button>'}</div></div></div>`).join('')}
<button class="btn" style="justify-self:center">Load more</button>
</div>
<div class="col c-4">
<div class="card">${ch('Your decisions')}<div class="dn" style="grid-template-columns:110px minmax(0,1fr);gap:18px">${C.donut({segs:[['Interested',14],['Dismissed',22]],center:'36',sub:'roles'})}<div class="leg"><div><span class="sw d1"></span><span>Interested</span><span class="n">14</span><span></span></div><div><span class="sw d3"></span><span>Dismissed</span><span class="n">22</span><span></span></div></div></div></div>
<div class="card">${ch('Interest by week')}${C.vbars({vals:[2,4,1,3,4],labels:['6 Oct','13','20','27','3 Nov'],hi:[4],show:true,h:130})}</div>
<div class="card deep"><p class="soft" style="font-size:13px">Dismissed roles train Talent Compass. Undo a dismissal if you change your mind and the role will return to Discover.</p></div>
</div></div>`};
const days=[['Mon','3',4],['Tue','4',6],['Wed','5',2],['Thu','6',5],['Fri','7',0]];
S.consultations={nav:'consultations',crumb:'Consultations',html:()=>`
${ph('My account','Book a <em>consultation.</em>','Talk to a consultant about your CV, your matches or a workplace question. You can reschedule or cancel here.')}
<div class="bento">
<div class="card c-8">${ch('Choose a time','<span class="mono">UK time · 30 min</span>')}
<div class="field" style="margin-bottom:24px"><span>Topic</span><div class="segc"><label><input type="radio" name="tp" checked><b>CV review</b></label><label><input type="radio" name="tp"><b>Job matches</b></label><label><input type="radio" name="tp"><b>Workplace question</b></label></div></div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><span class="mono">November 2026</span><div style="display:flex;gap:6px"><button class="btn btn-sm">←</button><button class="btn btn-sm">→</button></div></div>
<div class="dpick">${days.map((d,i)=>`<button class="${i===1?'on':''}" ${d[2]?'':'disabled style="opacity:.4"'}><small>${d[0]}</small><b>${d[1]}</b><small>${d[2]?d[2]+' free':'Full'}</small></button>`).join('')}</div>
<div class="sec-l" style="margin-top:28px">Tuesday 4 November</div>
<div class="slots">${['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30'].map((t,i)=>`<button ${[1,2,5,7,9,11].includes(i)?'disabled':''} class="${i===8?'on':''}">${t}</button>`).join('')}</div>
<div class="fg" style="margin-top:28px">${ta('Anything we should know? (optional)','',3,'full','e.g. I\u2019m weighing two offers and want a second opinion')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap"><span class="hint">Tue 4 Nov · 14:00–14:30 · Video call</span><button class="btn btn-ink">Confirm booking</button></div>
</div>
<div class="col c-4">
<div class="card">${ch('Upcoming','<span class="pill good">Confirmed</span>')}<div class="dpick" style="grid-template-columns:72px 1fr;gap:16px;align-items:center"><button class="on" style="pointer-events:none"><small>Thu</small><b>6</b><small>Nov</small></button><div><b style="font-weight:500;display:block">CV review with James Harlow</b><span class="mute" style="font-size:12px">11:00–11:30 · Video call</span></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px"><button class="btn btn-sm">Add to calendar</button><button class="btn btn-sm">Reschedule</button><button class="btn btn-sm btn-danger" style="grid-column:1/-1">Cancel</button></div></div>
<div class="card">${ch('Past')}<div class="feed"><div><span class="dot m"></span><div>Job matches, Sara Rahman<small>14 OCT · 30 MIN</small></div></div><div><span class="dot m"></span><div>Workplace question, James Harlow<small>2 SEP · 30 MIN</small></div></div></div></div>
<div class="card deep"><p class="soft" style="font-size:13px">You'll get an email confirmation with a calendar file. Cancel or reschedule up to 4 hours before.</p></div>
</div></div>`};
const topics=[['Contracts &amp; notice','UK · 6 guides','What to check in an offer, and how notice and garden leave work.'],['Moving to the Gulf','GCC · 8 guides','Visas, housing allowances, end-of-service gratuity and schooling.'],['Sponsorship','UK · 4 guides','Skilled Worker routes, timelines and what employers need from you.'],['Negotiating an offer','All · 5 guides','Benchmarks, total reward and how to counter well.'],['Saudisation &amp; Emiratisation','GCC · 3 guides','How nationalisation quotas affect hiring for your role.'],['Your first 90 days','All · 4 guides','Probation, objectives and settling in.']];
S.hr={nav:'hr',crumb:'HR guidance',html:()=>`
${ph('HR guidance','Answers <em>before you sign.</em>','Plain-English guidance on UK and GCC employment, reviewed by our consultants. General information, not legal advice.')}
${hrTabs('hr')}
<div class="bento" style="margin-bottom:40px">
<div class="card c-8">${ch('Ask a workplace question')}<div class="fg">${ta('Your question','Can my employer change my shift pattern without asking me?',4,'full')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap"><span class="hint">We match your question to reviewed guidance. Your question is saved privately.</span><a href="?s=hranswer" class="btn btn-ink">Find guidance</a></div></div>
<div class="card c-4">${ch('Asked this week')}<div class="feed">${['Is end-of-service gratuity paid if I resign?','Can my UK employer stop me joining a competitor?','Do I pay UK tax while working in Dubai?','How long does a Saudi work visa take?'].map(q=>`<div><span class="dot m"></span><a href="?s=hranswer">${q}</a></div>`).join('')}</div></div>
</div>
<div class="sec-head" style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px"><h2 class="disp" style="font-size:30px">Browse by topic</h2><a href="?s=hrlibrary" class="lnk">Full library →</a></div>
<div class="g g3">${topics.map(t=>`<a href="?s=hrlibrary" class="topic"><span class="mono">${t[1]}</span><h4>${t[0]}</h4><p>${t[2]}</p></a>`).join('')}</div>`};
const vids=[['What counts as unfair dismissal?','Dismissal','4:12',1,'2,104'],['Changing your contract: what needs consent','Contracts','3:38',1,'1,486'],['Holiday pay for irregular hours','Holiday','',0,''],['Redundancy: selection and consultation','Redundancy','5:05',1,'988'],['Your rights on parental leave','Parental leave','4:47',1,'1,231'],['Raising a grievance at work','Dismissal','',0,''],['National Minimum Wage explained','Pay','2:56',1,'744'],['Working time and rest breaks','Working hours','3:21',1,'612'],['Settlement agreements: before you sign','Settlement','',0,'']];
S.hrlibrary={nav:'hr',crumb:'HR guidance / Library',html:()=>`
${ph('HR &amp; employment law','Guidance <em>library</em>','Reviewed HR and employment-law guides and videos. General information, not advice on your individual case.',`<a href="?s=hr" class="btn btn-ink">Ask a question</a>`)}
${hrTabs('hrlibrary')}
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px"><input class="inp sm" type="search" placeholder="Search guidance…" style="min-width:240px"></div>
<div class="filters">${['All topics','Dismissal','Contracts','Discrimination','Pay','Redundancy','Holiday','Working hours','Parental leave','Whistleblowing','Settlement'].map((c,i)=>`<span class="pill ${i?'':'on'}">${c}</span>`).join('')}</div>
<div class="filters" style="margin-top:-8px">${['All sectors','Construction','Technology'].map((c,i)=>`<span class="pill ${i?'':'on'}">${c}</span>`).join('')}</div>
<p class="mono" style="margin:8px 0 20px">— ${vids.length} guides</p>
<div class="g g3">${vids.map(v=>`<a href="?s=hranswer" class="vcard"><div class="vthumb"><span>${v[3]?'▶':'¶'}</span>${v[2]?`<em>${v[2]}</em>`:''}</div><div class="vmeta"><b>${v[0]}</b><div class="row"><span class="mono">${v[1]}</span><span class="mono">${v[3]?'Video':'Written guide'}</span></div>${v[4]?`<span class="hint">${v[4]} signed-in plays</span>`:''}</div></a>`).join('')}</div>`};
S.hranswer={nav:'hr',crumb:'HR guidance / Answer',html:()=>`
<a href="?s=hr" class="lnk">← Workplace questions</a>
<div class="bento" style="margin-top:20px">
<div class="col c-8">
<h1 class="disp" style="font-size:clamp(28px,3.4cqi,40px)">Can my employer change my shift pattern without asking me?</h1>
<div class="note">General information, not legal advice. Source excerpts may not cover your circumstances or later changes in the law. For decisions or deadlines, speak to a qualified employment adviser.</div>
<div><p class="mono" style="margin-bottom:10px">Suggested topic: check it addresses your question</p>
<div class="player"><span>▶</span><div class="cap">Your contract sets out the hours you agreed to work</div><div class="ctl"><span>1:34</span><i></i><span>3:38</span><span>CC</span></div></div>
<p style="margin-top:12px;font-weight:500">Changing your contract: what needs consent</p><p class="hint">Contracts · 1,486 signed-in plays</p></div>
<div><span class="mono">Other possible topics</span><div class="feed" style="margin-top:6px"><div><span class="dot m"></span><a href="?s=hranswer" class="lnk" style="color:var(--ink)">Working time and rest breaks</a></div><div><span class="dot m"></span><a href="?s=hranswer" class="lnk" style="color:var(--ink)">Flexible working requests</a></div></div></div>
<div class="card">${ch('Did this answer your question?')}<div class="choice"><button>Resolved</button><button class="on">Partly</button><button>Not resolved</button></div>
<div class="fg" style="margin-top:20px">${ta('Additional context (optional, saved privately)','My contract says \u201chours as required by the business\u201d. I\u2019ve worked days for four years and they want to move me to nights from December.',4,'full')}</div>
<button class="btn" style="margin-top:14px">Find reviewed source excerpts</button></div>
<div class="card">${ch('Source-backed response','<span class="pill good">2 excerpts</span>')}
<div class="g">
<div class="excerpt"><blockquote>\u201cYour employer should not change your contract without your agreement, unless the contract allows for the change.\u201d</blockquote><a href="#" class="lnk" style="color:var(--ink)">ACAS · Changing an employment contract ↗</a><span class="hint">Retrieved 12 Oct 2026 · reviewed 14 Oct 2026</span></div>
<div class="excerpt"><blockquote>\u201cEven if a contract has a flexibility clause, the employer must still act reasonably when using it.\u201d</blockquote><a href="#" class="lnk" style="color:var(--ink)">ACAS · Flexibility clauses ↗</a><span class="hint">Retrieved 12 Oct 2026 · reviewed 14 Oct 2026</span></div>
</div><p class="hint" style="margin-top:16px">These excerpts are quoted from reviewed sources. They don't assess your situation.</p></div>
</div>
<div class="col c-4">
<div class="card deep">${ch('Speak to an adviser')}<p class="soft" style="font-size:13px;margin-bottom:16px">Book 30 minutes with a consultant. Your question and context are shared with them.</p><div class="slots" style="grid-template-columns:1fr 1fr"><button>Tue 10:00</button><button class="on">Tue 14:00</button><button>Wed 09:30</button><button>Thu 15:00</button></div><a href="?s=consultations" class="btn btn-ink" style="width:100%;margin-top:14px">Book a consultation</a></div>
<div class="card">${ch('Related guides')}<div class="feed">${vids.slice(0,4).map(v=>`<div><span class="dot m"></span><div><a href="?s=hranswer">${v[0]}</a><small>${v[1].toUpperCase()}${v[2]?' · '+v[2]:''}</small></div></div>`).join('')}</div></div>
</div></div>`};
const qs=[['Can my employer change my shift pattern without asking me?','1 Nov 2026','Partly','warn',1],['Is end-of-service gratuity paid if I resign in Dubai?','18 Oct 2026','Resolved','good',0],['Do I have to work my full notice period?','2 Sep 2026','Resolved','good',1],['Can I be made redundant while on parental leave?','21 Aug 2026','Not resolved','bad',0],['What happens to my visa if I leave my job?','3 Aug 2026','Not recorded','line',0]];
S.hrhistory={nav:'hr',crumb:'HR guidance / My questions',html:()=>`
${ph('HR guidance','Your <em>questions.</em>','Saved privately to your account. Only you and, if you book, your consultant can see them.',`<a href="?s=hr" class="btn btn-ink">Ask a question</a>`)}
${hrTabs('hrhistory')}
<div class="bento">
<div class="card flush c-8"><div class="rows">${qs.map(q=>`<a href="?s=hranswer"><span class="t"><b style="white-space:normal">${q[0]}</b><small>${q[1]}${q[4]?' · Linked consultation':''}</small></span><span class="pill ${q[3]}">${q[2]}</span></a>`).join('')}</div><div class="tfoot"><span class="mono">5 of 5</span></div></div>
<div class="col c-4"><div class="card">${ch('Outcomes')}<div class="dn" style="grid-template-columns:110px minmax(0,1fr);gap:18px">${C.donut({segs:[['Resolved',2],['Partly',1],['Not resolved',1],['Not recorded',1]],center:'5',sub:'asked'})}<div class="leg"><div><span class="sw d1"></span><span>Resolved</span><span class="n">2</span><span></span></div><div><span class="sw d2"></span><span>Partly</span><span class="n">1</span><span></span></div><div><span class="sw d3"></span><span>Not resolved</span><span class="n">1</span><span></span></div><div><span class="sw d4"></span><span>Not recorded</span><span class="n">1</span><span></span></div></div></div></div>
<div class="card deep"><p class="soft" style="font-size:13px">Something still unresolved? A consultant can talk it through with you.</p><a href="?s=consultations" class="btn btn-sm" style="margin-top:12px">Book a consultation</a></div></div>
</div>`};
/* ---------- auth ---------- */
const shell=(h,p,form,mono='London · Dubai · Riyadh')=>`<div class="auth"><div class="auth-l"><a href="UKTL Landing.html" class="logo">UK <em>Talent</em> Link</a><div><h2 class="disp">${h}</h2><p class="hide-m">${p}</p></div><span class="mono hide-m">${mono}</span></div><div class="auth-r"><form class="auth-f" onsubmit="event.preventDefault()">${form}</form></div></div>`;
const head=(eb,t)=>`<div><div class="eyebrow">${eb}</div><h1 class="disp" style="margin-top:12px">${t}</h1></div>`;
S.login={bare:true,html:()=>shell('Welcome <em>back.</em>','Your matches, applications and messages are waiting.',`${head('Sign in','Good to see you')}${inp('Email','amara.okafor@email.com','','','email')}${fld('Password',`<input class="inp" type="password" value="password12">`)}<div style="display:flex;justify-content:space-between;align-items:center"><label style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--ink-soft)"><input type="checkbox" checked> Keep me signed in</label><a href="?s=forgot" class="lnk">Forgot password?</a></div><a href="?s=dashboard" class="btn btn-ink btn-lg">Sign in</a><div class="or">OR</div><button type="button" class="btn btn-lg">Continue with LinkedIn</button><p class="mute" style="font-size:13px;text-align:center">New here? <a href="Onboarding.html?for=candidate" style="color:var(--ink);border-bottom:1px solid var(--ink)">Create an account</a></p>`)};
S.forgot={bare:true,html:()=>shell('Locked <em>out?</em>','It happens. We\u2019ll email you a secure link to set a new password.',`${head('Reset password','Forgot your password?')}<p class="soft" style="font-size:14px">Enter the email you registered with. If it matches an account, we\u2019ll send a reset link valid for 60 minutes.</p>${inp('Email','amara.okafor@email.com','','','email')}<a href="?s=reset" class="btn btn-ink btn-lg">Send reset link</a><div class="note">Check your spam folder if nothing arrives within a few minutes.</div><a href="?s=login" class="lnk" style="justify-self:center">← Back to sign in</a>`)};
S.reset={bare:true,html:()=>shell('A fresh <em>start.</em>','Choose a password you don\u2019t use anywhere else.',`${head('New password','Set a new password')}${fld('New password',`<input class="inp" type="password" value="correcthorse42">`)}<div><div class="pw"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div><p class="hint" style="margin-top:6px">Strong. Add a symbol to make it very strong.</p></div>${fld('Confirm password',`<input class="inp" type="password" value="correcthorse42">`)}<a href="?s=login" class="btn btn-ink btn-lg">Update password</a><p class="hint" style="text-align:center">You\u2019ll be signed out of other devices.</p>`)};
S.callback={bare:true,html:()=>`<div style="min-height:100vh;display:grid;place-items:center;padding:24px"><div style="display:grid;justify-items:center;gap:20px;text-align:center;max-width:360px"><a href="UKTL Landing.html" class="logo">UK <em>Talent</em> Link</a><div class="spin"></div><h1 class="disp" style="font-size:30px">Signing you in…</h1><div class="check" style="text-align:left"><div class="done"><i>✓</i><span>Verified with LinkedIn</span></div><div class="done"><i>✓</i><span>Account found</span></div><div><i></i><span>Loading your dashboard</span></div></div><p class="hint">If nothing happens in a few seconds, <a href="?s=login" style="color:var(--ink);border-bottom:1px solid var(--ink)">return to sign in</a>.</p></div></div>`};
S.security={bare:true,html:()=>shell('Staff <em>access.</em>','Staff access needs a code from your authenticator app, every time.',`${head('Two-step verification','Verify your authenticator')}<p class="soft" style="font-size:14px">Enter the 6-digit code from your authenticator app.</p>${sel('Authenticator',['iPhone · 1Password','Backup · Authy'])}<div class="field"><span>Authentication code</span><div class="otp">${['4','8','1','','',''].map(v=>`<input class="inp" maxlength="1" inputmode="numeric" value="${v}">`).join('')}</div></div><a href="?s=admin" class="btn btn-ink btn-lg">Verify code</a><details class="note"><summary style="cursor:pointer">Set up a new authenticator</summary><div style="display:flex;gap:16px;align-items:center;margin-top:14px"><div class="qr"></div><p class="hint">Scan this code in your authenticator app. Keep the setup key private.</p></div></details><p class="hint">Lost your authenticator? Ask the account owner to verify your identity and reset your enrolment.</p><a href="?s=adminlogin" class="lnk" style="justify-self:start">Sign out</a>`,'Restricted · Staff only')};
S.adminlogin={bare:true,html:()=>shell('Consultant <em>workspace.</em>','Mandates, candidates, consultations and content, in one place.',`${head('Staff sign in','UKTL Admin')}${inp('Work email','james.harlow@uktalentlink.com','','','email')}${fld('Password',`<input class="inp" type="password" value="password12">`)}<a href="?s=security" class="btn btn-ink btn-lg">Continue</a><div class="note">Two-step verification is required for every staff session. Sign-ins are recorded in the audit log.</div><a href="?s=login" class="lnk" style="justify-self:center">Candidate sign in →</a>`,'Restricted · Staff only')};
})();
