window.UKTL_SCREENS=(()=>{
const C=window.UC;
const sbar=(l,v,c='')=>`<div class="sbar"><span>${l}</span><div class="sbar-t"><div class="sbar-f ${c}" style="width:${v}%"></div></div><span class="sbar-n">${v}</span></div>`;
const ph=(eb,h,p,acts='')=>`<div class="ph"><div><div class="eyebrow">${eb}</div><h1 class="disp" style="margin-top:12px">${h}</h1>${p?`<p>${p}</p>`:''}</div>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
const ch=(t,r='',s='')=>`<div class="card-h"><h3>${t}</h3>${r}</div>${s?`<p class="card-s">${s}</p>`:''}`;
const bm=(l,v,ref,c='')=>`<div><span>${l}</span><span class="bm"><i class="${c}" style="width:${v}%"></i>${ref!=null?`<u style="left:${ref}%"></u>`:''}</span><span class="n">${v}${ref!=null?` <small>/ ${ref}</small>`:''}</span></div>`;
const jobs=[
['Senior Financial Analyst','Meridian Capital','Dubai, UAE','AED 32–38k / mo','Visa sponsored',94,'MC'],
['FP&amp;A Manager','Halden Group','London, UK','£78–88k','Hybrid',89,'HG'],
['Finance Business Partner','Qamar Health','Riyadh, KSA','SAR 40–46k / mo','Relocation',86,'QH'],
['Head of Reporting','Northvale Energy','Aberdeen, UK','£92–105k','On-site',81,'NE'],
['Treasury Analyst','Gulfstone Bank','Doha, Qatar','QAR 28–32k / mo','Visa sponsored',77,'GB']];
const jobRow=(j,i,sel)=>`<a href="?s=job" class="${sel&&i===0?'on':''}"><span class="co">${j[6]}</span><span class="t"><b>${j[0]}</b><small>${j[1]} · ${j[2]}</small><span class="chips" style="margin-top:8px"><span class="pill line">${j[3]}</span><span class="pill">${j[4]}</span></span></span>${C.ring(j[5],46)}</a>`;
const S={};
S.dashboard={nav:'dashboard',crumb:'Overview',html:()=>`
${ph('Sunday 1 November','Good morning, <em>Amara.</em>','Three new matches since Friday, and James has replied about Meridian.',`<a href="?s=upload" class="btn">Update CV</a><a href="?s=discover" class="btn btn-ink">Review matches</a>`)}
<a href="?s=upload" class="nudge"><span class="pill warn">+6 pts</span><span><b>Quantify your impact at Halden.</b> It's the single biggest gain toward 85, the shortlist threshold for most of your matches.</span><span class="lnk">Fix now →</span></a>
<div class="card kstrip">
<div class="kc"><span class="mono">CV score</span><span class="v">78</span><span class="d"><b>+26</b> since May</span><div class="viz">${C.spark([52,58,61,69,74,78])}</div></div>
<div class="kc"><span class="mono">New matches</span><span class="v">24</span><span class="d"><b>+3</b> today</span><div class="viz">${C.minibars([4,6,3,8,5,7,9])}</div></div>
<div class="kc"><span class="mono">Applications</span><span class="v">3</span><span class="d">1 interview booked</span><div class="viz"><div class="kseg"><i class="a"></i><i class="b"></i><i class="c"></i><i></i></div></div></div>
<div class="kc"><span class="mono">Profile views</span><span class="v">41</span><span class="d"><b>+12</b> this week</span><div class="viz">${C.spark([12,18,15,22,29,41])}</div></div>
</div>
<div class="bento">
<div class="card c-8">${ch('Score over time',`<div class="lg"><span><i></i>Your score</span><span><i class="dash"></i>Shortlist threshold</span></div>`,'Six uploads since May. Each version was rescored against the same benchmark.')}
${C.area({vals:[52,58,61,69,74,78],labels:['May','Jun','Jul','Aug','Sep','Oct'],min:40,max:100,ticks:[40,60,80,100],target:85,targetLabel:'85 · shortlist',h:230})}</div>
<div class="card c-4">${ch('You vs. your matches','','How your CV compares with what your 24 matched roles ask for.')}
${C.radar({dims:['Skills','Seniority','Impact','Keywords','Quals','Location'],a:[92,88,64,81,62,96],b:[85,80,78,75,80,70]})}
<div class="lg" style="justify-content:center;margin-top:16px"><span><i></i>You</span><span><i class="ref"></i>Roles ask for</span></div></div>
<div class="card flush c-7">${ch('Top matches',`<a href="?s=jobs" class="lnk">All 24 →</a>`)}<div class="rows" style="margin-top:12px">${jobs.slice(0,4).map(j=>jobRow(j)).join('')}</div></div>
<div class="card c-5">${ch('Applications',`<a href="?s=messages" class="lnk">Messages →</a>`)}
<div class="apps">
<div><div class="hd"><span class="co">MC</span><div><b>Meridian Capital</b><small>Interview Thu 6 Nov · 11:00 GST</small></div><span class="pill good">Interview</span></div>${C.stepper(2)}</div>
<div><div class="hd"><span class="co">HG</span><div><b>Halden Group</b><small>With hiring manager since 22 Oct</small></div><span class="pill">Screen</span></div>${C.stepper(1)}</div>
<div><div class="hd"><span class="co">QH</span><div><b>Qamar Health</b><small>Submitted 28 Oct</small></div><span class="pill line">Applied</span></div>${C.stepper(0)}</div>
</div></div>
<div class="card c-7">${ch('What your matches ask for','','Share of your 24 matched roles that list each skill.')}
<div class="dm">
<div><span>Financial modelling</span><span class="bm"><i style="width:92%"></i></span><span class="n">92%</span><span class="pill good">You have</span></div>
<div><span>IFRS</span><span class="bm"><i style="width:83%"></i></span><span class="n">83%</span><span class="pill good">You have</span></div>
<div><span>Power BI / Tableau</span><span class="bm"><i style="width:71%"></i></span><span class="n">71%</span><span class="pill good">You have</span></div>
<div><span>CIMA / ACCA</span><span class="bm"><i class="warn" style="width:68%"></i></span><span class="n">68%</span><span class="pill warn">Partial</span></div>
<div><span>SAP</span><span class="bm"><i style="width:46%"></i></span><span class="n">46%</span><span class="pill good">You have</span></div>
<div><span>Arabic</span><span class="bm"><i class="soft" style="width:21%"></i></span><span class="n">21%</span><span class="pill miss">Missing</span></div>
</div></div>
<div class="card c-5">${ch('Where your matches are')}
<div class="dn">${C.donut({segs:[['UAE',10],['UK',8],['KSA',4],['Qatar',2]],center:'24',sub:'roles'})}
<div class="leg"><div><span class="sw d1"></span><span>UAE</span><span class="n">10</span><span class="s">£84k med.</span></div><div><span class="sw d2"></span><span>United Kingdom</span><span class="n">8</span><span class="s">£81k med.</span></div><div><span class="sw d3"></span><span>Saudi Arabia</span><span class="n">4</span><span class="s">£92k med.</span></div><div><span class="sw d4"></span><span>Qatar</span><span class="n">2</span><span class="s">£79k med.</span></div></div></div>
<p class="mute" style="font-size:12px;margin-top:16px">GCC salaries converted to GBP, tax-free, excluding housing.</p></div>
</div>`};
S.upload={nav:'upload',crumb:'CV score',html:()=>`
${ph('CV score','Your CV, <em>scored honestly.</em>','We read it the way a screener and an ATS would, then show you what to change.',`<button class="btn">Download report</button><a href="?s=discover" class="btn btn-ink">See matches</a>`)}
<div class="bento">
<div class="card c-8 score-hero">
<div>${C.gauge(78,{marks:[[64,'avg 64'],[85,'85','w']]})}<p class="cap">Better than <b>71%</b> of Senior Analyst CVs</p></div>
<div><span class="mono">Where you sit</span><p class="mute" style="font-size:12px;margin:4px 0 16px">2,140 Senior Analyst CVs scored in 2026</p>${C.vbars({vals:[6,9,17,24,22,15,7],labels:['&lt;40','40s','50s','60s','70s','80s','90s'],hi:[4],fmt:()=>'You',h:170})}</div>
</div>
<div class="col c-4">
<div class="drop" style="padding:32px 20px"><span class="gl">↑</span><b style="font-weight:500">Drop a new version</b><span class="mute" style="font-size:13px">PDF or DOCX, up to 5 MB</span><button class="btn btn-sm">Choose file</button></div>
<div class="card">${ch('Versions')}<div class="vh">
<div><span class="file" style="padding:0;border:0"><span class="ext">PDF</span></span><span>Oct · current</span><span class="n">78</span></div>
<div><span class="pill line">PDF</span><span class="mute">Sep</span><span class="n mute">74</span></div>
<div><span class="pill line">DOC</span><span class="mute">Aug</span><span class="n mute">69</span></div></div></div>
</div>
<div class="card c-5">${ch('Breakdown',`<div class="lg"><span><i class="tk"></i>Hired avg.</span></div>`,'Each area against the average of candidates we placed this year.')}
<div class="bms">${bm('Structure',88,80)}${bm('Impact',64,76,'warn')}${bm('Keywords',81,72)}${bm('ATS readability',79,74)}${bm('Length',92,85)}</div></div>
<div class="card c-7">${ch('What to fix','<span class="mono">5 suggestions</span>')}
<div class="proj"><span class="cur" style="width:78%">78 now</span><span class="gn" style="width:6%">+6</span><span class="gn" style="width:4%">+4</span><span class="gn" style="width:3%">+3</span><span class="gn" style="width:2%"></span><span class="gn" style="width:1%"></span></div>
<div class="proj-s"><span>0</span><span>Possible after fixes · <b>94</b></span><span>100</span></div>
<div style="margin-top:24px">
<div class="fix"><b><span class="pill warn">+6</span>Quantify your impact at Halden</b><p>Three bullets describe duties without results. Try "Cut month-end close from 9 to 6 days" instead of "Responsible for month-end close".</p></div>
<div class="fix"><b><span class="pill warn">+4</span>Lead with a 2-line profile</b><p>Open with your title, years of experience and the two markets you know.</p></div>
<div class="fix"><b><span class="pill good">+3</span>Add CIMA status</b><p>68% of your matches list CIMA or ACCA. If you're part-qualified, say so and add the expected date.</p></div>
<div class="fix"><b><span class="pill good">+2</span>Move the skills table to plain text</b><p>Some ATS parsers drop tables. A comma-separated line reads reliably.</p></div>
<div class="fix"><b><span class="pill">+1</span>State right-to-work</b><p>Add "British citizen · UAE residence visa" under your name.</p></div>
</div></div>
</div>`};
S.discover={nav:'discover',crumb:'Discover',html:()=>`
${ph('Discover · 12 left today','Roles picked <em>for you.</em>','',`<div class="chips"><span class="pill">UK</span><span class="pill">UAE</span><span class="pill">KSA</span><span class="pill line">Senior+</span></div>`)}
<div class="stack"><div class="ghost b"></div><div class="ghost a"></div>
<div class="swipe">
<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start"><div><div class="chips"><span class="pill good">New</span><span class="pill">Visa sponsored</span></div><h2 class="disp" style="margin-top:14px">Senior Financial Analyst</h2><p class="soft" style="margin-top:6px">Meridian Capital · Dubai, UAE</p></div>${C.ring(94,76)}</div>
<div class="meta-g"><div><span class="mono">Salary</span>AED 32–38k / mo</div><div><span class="mono">Type</span>Permanent, on-site</div><div><span class="mono">Reports to</span>Head of FP&amp;A</div><div><span class="mono">Start</span>Jan 2027</div></div>
<div class="bms" style="gap:10px">${bm('Skills',96)}${bm('Seniority',92)}${bm('Location',100)}${bm('Quals',70,null,'warn')}</div>
<div><span class="mono">Why you match</span><div class="why-list" style="margin-top:10px"><div>6 years in FP&amp;A at Senior level, matching their brief</div><div>IFRS and Power BI both listed as essential</div><div class="no">They prefer CIMA. You're part-qualified</div></div></div>
</div>
<div class="sw-acts"><button aria-label="Skip">✕</button><button class="yes" aria-label="Apply">✓</button><button aria-label="Save">☆</button></div>
<p class="mono" style="text-align:center;margin-top:14px">← skip · apply · save →</p>
</div>`};
function jd(){return `<div class="jd"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><span class="co">MC</span><span class="pill good">94% match</span></div><h2 class="disp">Senior Financial Analyst</h2><p>Meridian Capital · Dubai International Financial Centre</p>
<div class="meta-g" style="margin-top:24px"><div><span class="mono">Salary</span>AED 32–38k / month</div><div><span class="mono">Benefits</span>Housing, flights, medical</div><div><span class="mono">Visa</span>Sponsored</div><div><span class="mono">Closes</span>14 Nov 2026</div></div>
<div class="sticky-apply"><a href="?s=messages" class="btn btn-ink">Apply with profile</a><button class="btn">Save</button></div>
<div class="sec-t">Salary benchmark</div>${C.range({min:24,max:46,lo:32,hi:38,you:34,fmt:v=>'AED '+v+'k',youLabel:'Your ask · 34k'})}
<div class="sec-t">The role</div><p>Own the monthly forecast for a $2bn asset management arm, partner with portfolio leads and build the models behind capital allocation across the region.</p>
<div class="sec-t">You'll bring</div><ul><li>5+ years in FP&amp;A or corporate finance</li><li>Strong IFRS and three-statement modelling</li><li>Power BI or Tableau</li><li>CIMA, ACCA or CFA, part-qualified considered</li></ul>
<div class="sec-t">Your consultant</div><div style="display:flex;gap:12px;align-items:center"><span class="av">JH</span><div><b style="font-weight:500">James Harlow</b><div class="mute" style="font-size:12px">Finance practice · Dubai</div></div></div></div>`}
S.jobs={nav:'jobs',crumb:'Jobs',html:()=>`
${ph('Jobs','24 roles <em>match you.</em>','Sorted by Talent Compass fit.',`<button class="btn">Save search</button>`)}
<div class="filters"><span class="pill on">All markets</span><span class="pill">United Kingdom</span><span class="pill">UAE</span><span class="pill">Saudi Arabia</span><span class="pill">Qatar</span><span class="pill">Visa sponsored</span><span class="pill">£75k+</span></div>
<div class="bento"><div class="card flush jl c-5"><div class="rows">${jobs.map((j,i)=>jobRow(j,i,true)).join('')}</div></div>
<div class="card d-only c-7">${jd()}</div></div>`};
S.job={nav:'jobs',crumb:'Jobs / Meridian Capital',html:()=>`<a href="?s=jobs" class="lnk">← All jobs</a><div class="bento" style="margin-top:20px"><div class="card c-8">${jd()}</div>
<div class="col c-4"><div class="card deep">${ch('Why you match')}<div style="display:flex;justify-content:center;margin-bottom:24px">${C.ring(94,112)}</div><div class="bms">${bm('Skills',96)}${bm('Seniority',92)}${bm('Location',100)}${bm('Quals',70,null,'warn')}</div></div>
<div class="card">${ch('Applicants so far')}${C.vbars({vals:[3,6,9,8,7,5],labels:['&lt;50','50s','60s','70s','80s','90s'],hi:[5],fmt:()=>'You',h:120})}<p class="mute" style="font-size:12px;margin-top:12px">38 applicants. You're in the top 5 by Compass score.</p></div></div></div>`};
S.profile={nav:'profile',crumb:'Profile',html:()=>`
<div class="card" style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:20px"><span class="av lg">AO</span><div style="flex:1;min-width:200px"><h1 class="disp" style="font-size:34px">Amara Okafor</h1><p class="soft">Senior Financial Analyst · Manchester, UK</p></div><div style="display:flex;align-items:center;gap:14px">${C.ring(82,64)}<div><span class="mono">Profile strength</span><div class="mute" style="font-size:12px;margin-top:2px">Add CIMA status for +4</div></div></div><button class="btn">Edit</button></div>
<div class="tabs"><a class="on">Overview</a><a>Experience</a><a>Preferences</a><a>Documents</a><a>Privacy</a></div>
<div class="bento"><div class="col c-8">
<div class="card">${ch('Profile views','<span class="mono">Last 6 weeks</span>','Consultants and employers who opened your profile.')}${C.vbars({vals:[12,18,15,22,29,41],labels:['21 Sep','28 Sep','5 Oct','12 Oct','19 Oct','26 Oct'],hi:[5],show:true,h:170})}</div>
<div class="card">${ch('Experience','<button class="lnk">+ Add</button>')}
<div class="feed"><div><span class="co">HG</span><div style="flex:1"><b style="font-weight:500">Finance Analyst → Senior Financial Analyst</b><div class="mute">Halden Group · 2021–present</div><p class="soft" style="margin-top:6px">Lead the monthly forecast for UK retail. Rebuilt the budgeting model in Power BI.</p></div></div>
<div><span class="co">PW</span><div style="flex:1"><b style="font-weight:500">Graduate Analyst</b><div class="mute">Pellow &amp; Webb · 2019–2021</div></div></div></div></div>
<div class="card">${ch('Skills')}<div class="chips"><span class="pill good">Financial modelling</span><span class="pill good">IFRS</span><span class="pill good">Power BI</span><span class="pill">Forecasting</span><span class="pill">SAP</span><span class="pill">Stakeholder management</span><span class="pill">Excel / VBA</span></div></div>
</div><div class="col c-4">
<div class="card">${ch('Who looked')}<div class="feed"><div><span class="dot"></span><div>Hiring manager, Meridian Capital<small>2 DAYS AGO</small></div></div><div><span class="dot"></span><div>Talent team, Halden Group<small>5 DAYS AGO</small></div></div><div><span class="dot m"></span><div>3 UKTL consultants<small>THIS MONTH</small></div></div></div></div>
<div class="card">${ch('Preferences')}<div class="meta-g"><div><span class="mono">Markets</span>UK, UAE, KSA</div><div><span class="mono">Salary floor</span>£70k / equiv.</div><div><span class="mono">Notice</span>1 month</div><div><span class="mono">Relocate</span>Yes</div></div></div>
<div class="card">${ch('Right to work')}<div class="meta-g"><div><span class="mono">UK</span>Citizen</div><div><span class="mono">UAE</span>Residence visa</div></div></div>
<div class="card deep">${ch('Visibility','<span class="pill good">Consultants only</span>')}<p class="soft" style="font-size:13px">Employers only see your profile after you apply or approve an introduction.</p></div>
</div></div>`};
S.hr={nav:'hr',crumb:'HR guidance',html:()=>`
${ph('HR guidance','Answers <em>before you sign.</em>','Plain-English guides on UK and GCC employment, reviewed by our consultants.',`<button class="btn btn-ink">Ask a consultant</button>`)}
<div class="g g3" style="margin-bottom:40px">
<a class="topic"><span class="mono">UK · 6 guides</span><h4>Contracts &amp; notice</h4><p>What to check in an offer, and how notice and garden leave work.</p></a>
<a class="topic"><span class="mono">GCC · 8 guides</span><h4>Moving to the Gulf</h4><p>Visas, housing allowances, end-of-service gratuity and schooling.</p></a>
<a class="topic"><span class="mono">UK · 4 guides</span><h4>Sponsorship</h4><p>Skilled Worker routes, timelines and what employers need from you.</p></a>
<a class="topic"><span class="mono">All · 5 guides</span><h4>Negotiating an offer</h4><p>Benchmarks, total reward and how to counter well.</p></a>
<a class="topic"><span class="mono">GCC · 3 guides</span><h4>Saudisation &amp; Emiratisation</h4><p>How nationalisation quotas affect hiring for your role.</p></a>
<a class="topic"><span class="mono">All · 4 guides</span><h4>Your first 90 days</h4><p>Probation, objectives and settling in.</p></a></div>
<div class="g g-37"><div><div class="eyebrow">FAQ</div><h2 class="disp" style="font-size:32px;margin-top:12px">Asked this week</h2></div>
<div class="faq"><details open><summary>Is end-of-service gratuity paid if I resign?</summary><p>In the UAE, yes, once you've completed a year of continuous service. It's based on basic salary: 21 days' pay per year for the first five years, then 30 days per year after that.</p></details>
<details><summary>Can my UK employer stop me joining a competitor?</summary><p>Restrictive covenants are only enforceable if they're reasonable in scope and duration. Have a consultant check yours before you resign.</p></details>
<details><summary>Do I pay UK tax while working in Dubai?</summary><p>Usually not, if you become non-resident under the Statutory Residence Test. Timing matters, so take advice before you move.</p></details>
<details><summary>How long does a Saudi work visa take?</summary><p>Typically 4–8 weeks from offer, including attestation of your degree certificate.</p></details></div></div>`};
S.messages={nav:'messages',crumb:'Messages',flush:true,html:()=>`
<div class="msg"><div class="threads">
<a class="on"><span class="av">JH</span><span class="t"><b>James Harlow <small>10:24</small></b><p>Great news on Meridian. They'd like to meet you on Thursday</p></span></a>
<a><span class="av">SR</span><span class="t"><b>Sara Rahman <small>Mon</small></b><p>I've sent your profile to Halden's hiring manager</p></span></a>
<a><span class="av">UK</span><span class="t"><b>UKTL Support <small>18 Oct</small></b><p>Your CV score report is ready</p></span></a></div>
<div class="convo"><div class="convo-h"><span class="av">JH</span><div style="flex:1"><b style="font-weight:500">James Harlow</b><div class="mute" style="font-size:12px">Finance practice · Dubai · re: Senior Financial Analyst</div></div><button class="btn btn-sm d-only">Book a call</button></div>
<div class="convo-b"><span class="day">YESTERDAY</span>
<div class="bub them">Hi Amara, I've shared your profile with Meridian. The hiring manager liked your forecasting work at Halden.<small>16:02</small></div>
<div class="bub me">Thanks James. Anything I should prepare?<small>16:40</small></div>
<span class="day">TODAY</span>
<div class="bub them">Great news. They'd like to meet you on Thursday at 11:00 Dubai time. I've attached a short brief on the panel.<div class="att"><span class="ext pill">PDF</span><span style="font-size:13px">Meridian_interview_brief.pdf</span></div><small>10:24</small></div></div>
<div class="compose"><input class="inp" placeholder="Write a message…"><button class="btn btn-ink">Send</button></div></div></div>`};
S.auth={bare:true,html:()=>`
<div class="auth"><div class="auth-l"><a href="UKTL Landing.html" class="logo">UK <em>Talent</em> Link</a><div><h2 class="disp">Recruitment that <em>shows its working.</em></h2><p class="hide-m">Join more than 18,000 professionals matched across the UK and the Gulf.</p></div><span class="mono hide-m">London · Dubai · Riyadh</span></div>
<div class="auth-r"><form class="auth-f" onsubmit="event.preventDefault();location.search='?s=dashboard'"><div><div class="eyebrow">Create account</div><h1 class="disp" style="margin-top:12px">Get started</h1></div>
<div class="role"><label><input type="radio" name="r" checked><b>I'm a candidate</b><small>Score my CV, find roles</small></label><label><input type="radio" name="r"><b>I'm hiring</b><small>Search &amp; HR services</small></label></div>
<label class="field"><span>Full name</span><input class="inp" placeholder="Amara Okafor"></label>
<label class="field"><span>Email</span><input class="inp" type="email" placeholder="you@email.com"></label>
<label class="field"><span>Password</span><input class="inp" type="password" placeholder="At least 8 characters"></label>
<button class="btn btn-ink btn-lg">Create account</button><div class="or">OR</div><button type="button" class="btn btn-lg">Continue with LinkedIn</button>
<p class="mute" style="font-size:13px;text-align:center">Already registered? <a href="?s=dashboard" style="color:var(--ink);border-bottom:1px solid var(--ink)">Sign in</a></p></form></div></div>`};
const cands=[['AO','Amara Okafor','Manchester · 6 yrs',94,96,92,70,'Interview'],['RK','Rahul Kapoor','Dubai · 8 yrs',91,90,95,88,'Shortlisted'],['LM','Lena Moreau','London · 7 yrs',88,92,85,80,'Shortlisted'],['FA','Faisal Al-Amri','Riyadh · 5 yrs',84,86,78,90,'Screening'],['TB','Tom Brennan','Leeds · 6 yrs',79,82,80,64,'Screening'],['NH','Noor Haddad','Abu Dhabi · 4 yrs',73,78,66,72,'New']];
const stP=s=>({Interview:'good',Shortlisted:'good',Screening:'',New:'line'}[s]);
const tb=(v,c='')=>`<span class="bm"><i class="${c}" style="width:${v}%"></i></span>`;
const fnRows=[['Applied',612],['Screened',294],['Shortlisted',108],['Interview',49],['Offer',21]];
S.admin={nav:'admin',admin:true,crumb:'Admin / Overview',html:()=>`
${ph('Admin · October 2026','Placements <em>overview.</em>','',`<button class="btn">Export</button><button class="btn btn-ink">+ New role</button>`)}
<div class="card kstrip">
<div class="kc"><span class="mono">Open roles</span><span class="v">42</span><span class="d"><b>+6</b> this month</span><div class="viz">${C.spark([31,33,36,35,36,42])}</div></div>
<div class="kc"><span class="mono">Active candidates</span><span class="v">1,318</span><span class="d"><b>+214</b> this month</span><div class="viz">${C.minibars([820,880,940,1010,1104,1318])}</div></div>
<div class="kc"><span class="mono">Placements</span><span class="v">17<small style="font-size:16px;color:var(--ink-mute)"> / 20</small></span><span class="d">85% of October target</span><div class="viz"><div class="bm" style="width:100%"><i style="width:85%"></i></div></div></div>
<div class="kc"><span class="mono">Avg time to hire</span><span class="v">31<small style="font-size:16px;color:var(--ink-mute)"> days</small></span><span class="d"><b>−4</b> vs September</span><div class="viz">${C.spark([41,38,36,37,35,31])}</div></div>
</div>
<div class="bento">
<div class="card flush c-8">${ch('Roles needing attention',`<a href="?s=ranking" class="lnk">All roles →</a>`)}<div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Role</th><th class="hide-m">Client</th><th class="hide-m" style="min-width:120px">Pipeline</th><th class="hide-m">Owner</th><th>Status</th></tr></thead><tbody>
<tr onclick="location.search='?s=ranking'" style="cursor:pointer"><td><b style="font-weight:500">Senior Financial Analyst</b><div class="mute" style="font-size:12px">Dubai · 38 in pipeline</div></td><td class="hide-m">Meridian Capital</td><td class="hide-m">${tb(76)}</td><td class="hide-m"><span class="av sm">JH</span></td><td><span class="pill good">Interviewing</span></td></tr>
<tr><td><b style="font-weight:500">Chief People Officer</b><div class="mute" style="font-size:12px">Riyadh · 12 in pipeline</div></td><td class="hide-m">Qamar Health</td><td class="hide-m">${tb(24)}</td><td class="hide-m"><span class="av sm">SR</span></td><td><span class="pill warn">Shortlist due</span></td></tr>
<tr><td><b style="font-weight:500">FP&amp;A Manager</b><div class="mute" style="font-size:12px">London · 54 in pipeline</div></td><td class="hide-m">Halden Group</td><td class="hide-m">${tb(100)}</td><td class="hide-m"><span class="av sm">SR</span></td><td><span class="pill">Screening</span></td></tr>
<tr><td><b style="font-weight:500">Head of Reporting</b><div class="mute" style="font-size:12px">Aberdeen · 6 in pipeline</div></td><td class="hide-m">Northvale Energy</td><td class="hide-m">${tb(11,'warn')}</td><td class="hide-m"><span class="av sm">JH</span></td><td><span class="pill bad">Low pipeline</span></td></tr></tbody></table></div></div>
<div class="card c-4">${ch('Activity')}<div class="feed"><div><span class="dot"></span><div>Offer accepted, Treasury Analyst at Gulfstone<small>2H AGO · JH</small></div></div><div><span class="dot w"></span><div>Shortlist for Qamar Health due Friday<small>TODAY · SR</small></div></div><div><span class="dot m"></span><div>14 new CVs scored above 80<small>TODAY · AUTO</small></div></div><div><span class="dot m"></span><div>Northvale role re-advertised<small>YESTERDAY · JH</small></div></div></div></div>
<div class="card c-4">${ch('Pipeline','<span class="mono">All roles</span>')}<div class="fn"><div class="hdr"><span>Stage</span><span></span><span style="text-align:right">n</span><span style="text-align:right">conv.</span></div>${fnRows.map((r,i,a)=>`<div><span>${r[0]}</span><span class="fb"><i style="width:${(r[1]/612*100).toFixed(1)}%;animation-delay:${i*.08}s"></i></span><span class="n">${r[1]}</span><span class="cv">${i?Math.round(r[1]/a[i-1][1]*100)+'%':''}</span></div>`).join('')}</div></div>
<div class="card c-4">${ch('Time to hire','<span class="mono">Days</span>')}${C.vbars({vals:[41,38,36,37,35,31],labels:['May','Jun','Jul','Aug','Sep','Oct'],hi:[5],show:true,fmt:v=>v,line:35,h:180})}<div class="lg" style="margin-top:12px"><span><i class="dash"></i>Target 35 days</span></div></div>
<div class="card c-4">${ch('Placements by market','<span class="mono">YTD</span>')}<div class="dn" style="grid-template-columns:120px minmax(0,1fr);gap:20px">${C.donut({segs:[['UAE',7],['UK',5],['KSA',3],['Qatar',2]],center:'17',sub:'Oct'})}<div class="leg"><div><span class="sw d1"></span><span>UAE</span><span class="n">7</span><span></span></div><div><span class="sw d2"></span><span>UK</span><span class="n">5</span><span></span></div><div><span class="sw d3"></span><span>KSA</span><span class="n">3</span><span></span></div><div><span class="sw d4"></span><span>Qatar</span><span class="n">2</span><span></span></div></div></div></div>
</div>`};
S.ranking={nav:'ranking',admin:true,crumb:'Admin / Candidates',html:()=>`
${ph('Meridian Capital · Dubai','Senior Financial Analyst','Ranked by Talent Compass across 38 applicants.',`<button class="btn">Weightings</button><button class="btn btn-ink">Send shortlist</button>`)}
<div class="bento" style="margin-bottom:20px">
<div class="card c-8">${ch('Score distribution',`<div class="lg"><span><i class="blk"></i>Above shortlist line</span><span><i class="blk soft"></i>Below</span></div>`)}${C.vbars({vals:[5,7,9,8,6,3],labels:['&lt;50','50s','60s','70s','80s','90s'],hi:[4,5],show:true,h:150})}<p class="mute" style="font-size:12px;margin-top:12px">9 candidates score 80 or above.</p></div>
<div class="card c-4">${ch('Weightings','<button class="lnk">Edit</button>')}<div class="wt"><i class="d1" style="width:40%"></i><i class="d2" style="width:25%"></i><i class="d3" style="width:20%"></i><i class="d4" style="width:15%"></i></div><div class="leg"><div><span class="sw d1"></span><span>Skills</span><span class="n">40%</span><span></span></div><div><span class="sw d2"></span><span>Seniority</span><span class="n">25%</span><span></span></div><div><span class="sw d3"></span><span>Qualifications</span><span class="n">20%</span><span></span></div><div><span class="sw d4"></span><span>Location &amp; visa</span><span class="n">15%</span><span></span></div></div></div>
</div>
<div class="tabs"><a class="on">Ranked (38)</a><a>Shortlisted (3)</a><a>Interview (1)</a><a>Rejected (9)</a></div>
<div class="card flush"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Candidate</th><th>Compass</th><th class="hide-m" style="min-width:130px">Skills</th><th class="hide-m" style="min-width:130px">Seniority</th><th class="hide-m" style="min-width:130px">Quals</th><th class="hide-m">Stage</th><th></th></tr></thead><tbody>
${cands.map((c,i)=>`<tr class="${i<3?'top3':''}"><td class="rk">${i+1}</td><td><div class="who"><span class="av sm">${c[0]}</span><div><b>${c[1]}</b><small>${c[2]}</small></div></div></td><td>${C.ring(c[3],40)}</td><td class="hide-m"><div class="sbar">${tb(c[4])}<span class="sbar-n">${c[4]}</span></div></td><td class="hide-m"><div class="sbar">${tb(c[5])}<span class="sbar-n">${c[5]}</span></div></td><td class="hide-m"><div class="sbar">${tb(c[6],c[6]<75?'warn':'')}<span class="sbar-n">${c[6]}</span></div></td><td class="hide-m"><span class="pill ${stP(c[7])}">${c[7]}</span></td><td style="text-align:right"><button class="btn btn-sm">View</button></td></tr>`).join('')}
</tbody></table></div></div>
<div class="card deep" style="margin-top:20px">${ch('Why #1 ranks first','<span class="mono">Amara Okafor</span>')}<div class="why-list"><div>Closest match on IFRS modelling and Power BI, both weighted as essential</div><div>Holds a UAE residence visa, so there's no sponsorship delay</div><div class="no">Part-qualified CIMA, against a stated preference for fully qualified</div></div></div>`};
return S;})();
