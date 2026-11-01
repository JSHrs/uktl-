(()=>{const S=window.UKTL_SCREENS,C=window.UC;
const ph=(eb,h,p,acts='')=>`<div class="ph"><div><div class="eyebrow">${eb}</div><h1 class="disp" style="margin-top:12px">${h}</h1>${p?`<p>${p}</p>`:''}</div>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
const ch=(t,r='',s='')=>`<div class="card-h"><h3>${t}</h3>${r}</div>${s?`<p class="card-s">${s}</p>`:''}`;
const bm=(l,v,c='')=>`<div><span>${l}</span><span class="bm"><i class="${c}" style="width:${v}%"></i></span><span class="n">${v}</span></div>`;
const roles=[
['Senior Financial Analyst','Dubai · DIFC','AED 32–38k',38,6,[38,18,9,3],'Interviewing','good',12],
['Head of Treasury','Dubai · DIFC','AED 55–65k',21,4,[21,11,4,0],'Shortlisting','warn',9],
['Risk Analyst','Abu Dhabi','AED 24–29k',47,11,[47,20,0,0],'Screening','',5],
['Investment Associate','London','£70–80k',15,2,[15,4,0,0],'Live','line',3],
['Compliance Officer','Dubai · DIFC','AED 30–36k',0,0,[0,0,0,0],'Draft','line',0]];
const pipe=p=>{const t=p[0]||1;return `<div class="pp"><i class="d1" style="width:${p[3]/t*100}%"></i><i class="d2" style="width:${(p[2]-p[3])/t*100}%"></i><i class="d3" style="width:${(p[1]-p[2])/t*100}%"></i><i class="d0" style="width:${(p[0]-p[1])/t*100}%"></i></div>`};
S.company={nav:'company',emp:true,crumb:'Employer / Overview',html:()=>`
${ph('Meridian Capital · Employer','Your hiring, <em>at a glance.</em>','23 new applicants since Friday across four live roles.',`<a href="?s=allcands" class="btn">All candidates</a><a href="?s=postjob" class="btn btn-ink">+ Post a job</a>`)}
<div class="card kstrip">
<div class="kc"><span class="mono">Live roles</span><span class="v">4</span><span class="d">1 draft</span><div class="viz">${C.minibars([2,2,3,3,4,4])}</div></div>
<div class="kc"><span class="mono">Applicants</span><span class="v">121</span><span class="d"><b>+23</b> since Friday</span><div class="viz">${C.spark([14,22,31,48,77,98,121])}</div></div>
<div class="kc"><span class="mono">Shortlisted</span><span class="v">13</span><span class="d">Compass 80+</span><div class="viz"><div class="bm" style="width:100%"><i style="width:11%"></i></div></div></div>
<div class="kc"><span class="mono">Interviews</span><span class="v">3</span><span class="d">Next: Thu 6 Nov, 11:00</span><div class="viz"><div class="kseg"><i class="a"></i><i class="a"></i><i class="a"></i><i></i><i></i></div></div></div>
</div>
<div class="bento">
<div class="card flush c-12">${ch('Job postings',`<div class="lg"><span><i class="blk sw d1"></i>Interview</span><span><i class="blk sw d2"></i>Shortlist</span><span><i class="blk sw d3"></i>Screened</span><span><i class="blk" style="background:var(--rule)"></i>New</span></div>`)}
<div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Role</th><th class="hide-m hide-t">Salary</th><th>Applicants</th><th class="hide-m" style="width:30%;min-width:110px">Pipeline</th><th class="hide-m hide-t">Days open</th><th>Status</th><th></th></tr></thead><tbody>
${roles.map(r=>`<tr onclick="location.search='?s=jobcands'" style="cursor:pointer"><td><b style="font-weight:500">${r[0]}</b><div class="mute" style="font-size:12px">${r[1]}</div></td><td class="hide-m hide-t mono" style="font-size:11px;letter-spacing:.04em;text-transform:none;color:var(--ink-soft)">${r[2]}</td><td><span style="font-family:var(--display);font-size:22px;font-weight:300">${r[3]}</span>${r[4]?`<div class="mono" style="letter-spacing:.04em;text-transform:none;color:var(--good)">+${r[4]} new</div>`:''}</td><td class="hide-m">${r[3]?pipe(r[5]):'<span class="mute">—</span>'}</td><td class="hide-m hide-t mono" style="font-size:11px">${r[8]||'—'}</td><td><span class="pill ${r[7]}">${r[6]}</span></td><td style="text-align:right">${r[6]==='Draft'?'<a href="?s=postjob" class="btn btn-sm">Edit</a>':'<a href="?s=jobcands" class="btn btn-sm">View</a>'}</td></tr>`).join('')}
</tbody></table></div></div>
<div class="card c-8">${ch('Applicants per day','<span class="mono">Last 14 days</span>')}${C.vbars({vals:[4,6,5,9,7,3,2,8,11,9,12,10,6,13],labels:['19','','21','','23','','25','','27','','29','','31','1 Nov'],hi:[13],show:false,h:170})}</div>
<div class="card c-4">${ch('Top new candidates',`<a href="?s=allcands" class="lnk">All →</a>`)}<div class="vh">
<div>${C.ring(94,38)}<div><b style="font-weight:500;display:block">Amara Okafor</b><span class="mute" style="font-size:12px">Senior Financial Analyst</span></div></div>
<div>${C.ring(91,38)}<div><b style="font-weight:500;display:block">Rahul Kapoor</b><span class="mute" style="font-size:12px">Senior Financial Analyst</span></div></div>
<div>${C.ring(89,38)}<div><b style="font-weight:500;display:block">Hana Yousef</b><span class="mute" style="font-size:12px">Head of Treasury</span></div></div>
<div>${C.ring(86,38)}<div><b style="font-weight:500;display:block">Daniel Price</b><span class="mute" style="font-size:12px">Risk Analyst</span></div></div></div></div>
</div>`};
const people=[
['AO','Amara Okafor','Senior Financial Analyst','Manchester, UK',94,'Interview','good','UAE visa','2 Nov'],
['RK','Rahul Kapoor','Senior Financial Analyst','Dubai, UAE',91,'Shortlisted','good','UAE resident','30 Oct'],
['HY','Hana Yousef','Head of Treasury','Abu Dhabi, UAE',89,'Shortlisted','good','UAE resident','31 Oct'],
['LM','Lena Moreau','Senior Financial Analyst','London, UK',88,'Shortlisted','good','Needs visa','29 Oct'],
['DP','Daniel Price','Risk Analyst','Leeds, UK',86,'Screening','','Needs visa','1 Nov'],
['FA','Faisal Al-Amri','Head of Treasury','Riyadh, KSA',84,'Screening','','GCC national','28 Oct'],
['SK','Sofia Kaur','Investment Associate','London, UK',82,'New','line','UK citizen','1 Nov'],
['TB','Tom Brennan','Senior Financial Analyst','Leeds, UK',79,'Screening','','Needs visa','27 Oct'],
['MA','Mariam Aziz','Risk Analyst','Dubai, UAE',76,'New','line','UAE resident','1 Nov'],
['NH','Noor Haddad','Senior Financial Analyst','Abu Dhabi, UAE',73,'New','line','UAE resident','26 Oct']];
S.allcands={nav:'allcands',emp:true,crumb:'Employer / Candidates',html:()=>`
${ph('All roles · 121 candidates','Every candidate, <em>ranked.</em>','Talent Compass scores each person against the role they applied for.',`<button class="btn">Export CSV</button><button class="btn btn-ink">Send shortlist</button>`)}
<div class="filters"><span class="pill on">All roles</span><span class="pill">Senior Financial Analyst</span><span class="pill">Head of Treasury</span><span class="pill">Risk Analyst</span><span class="pill">Investment Associate</span><span class="pill">Compass 80+</span><span class="pill">No visa needed</span></div>
<div class="bento">
<div class="card flush c-8"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Candidate</th><th class="hide-m hide-t">Applied for</th><th>Compass</th><th class="hide-m">Right to work</th><th>Stage</th><th class="hide-m hide-t">Applied</th></tr></thead><tbody>
${people.map((p,i)=>`<tr class="${i===0?'sel':''}"><td><div class="who"><span class="av sm">${p[0]}</span><div><b>${p[1]}</b><small>${p[3]}</small></div></div></td><td class="hide-m hide-t" style="color:var(--ink-soft)">${p[2]}</td><td>${C.ring(p[4],38)}</td><td class="hide-m"><span class="pill ${p[7]==='Needs visa'?'warn':'line'}">${p[7]}</span></td><td><span class="pill ${p[6]}">${p[5]}</span></td><td class="hide-m hide-t mono" style="font-size:11px">${p[8]}</td></tr>`).join('')}
</tbody></table></div><div class="tfoot"><span class="mono">Showing 10 of 121</span><div style="display:flex;gap:8px"><button class="btn btn-sm">← Prev</button><button class="btn btn-sm">Next →</button></div></div></div>
<div class="col c-4">
<div class="card"><div style="display:flex;gap:14px;align-items:center"><span class="av lg" style="width:52px;height:52px;font-size:19px">AO</span><div style="flex:1"><b style="font-weight:500;font-size:16px;display:block">Amara Okafor</b><span class="mute" style="font-size:12px">Manchester, UK · 6 yrs</span></div>${C.ring(94,56)}</div>
<div class="chips" style="margin-top:16px"><span class="pill good">Interview</span><span class="pill line">UAE visa</span><span class="pill line">1 month notice</span></div>
<div class="bms" style="margin-top:20px;gap:10px">${bm('Skills',96)}${bm('Seniority',92)}${bm('Location',100)}${bm('Quals',70,'warn')}</div>
<div class="why-list" style="margin-top:20px"><div>Rebuilt Halden's budgeting model in Power BI</div><div>IFRS and three-statement modelling</div><div class="no">CIMA part-qualified</div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px"><button class="btn">View CV</button><a href="?s=empmsg" class="btn">Message</a><button class="btn btn-ink" style="grid-column:1/-1">Schedule interview</button></div></div>
<div class="card">${ch('Candidates by stage')}<div class="fn">${[['New',58],['Screening',35],['Shortlisted',13],['Interview',3],['Offer',0]].map((r,i)=>`<div><span>${r[0]}</span><span class="fb"><i style="width:${(r[1]/58*100).toFixed(1)}%;animation-delay:${i*.08}s"></i></span><span class="n">${r[1]}</span><span></span></div>`).join('')}</div></div>
</div></div>`};
S.empmsg=Object.assign({},S.messages,{nav:'empmsg',emp:true,crumb:'Employer / Messages'});
S.jobcands=Object.assign({},S.ranking,{nav:'allcands',emp:true,admin:false,crumb:'Employer / Senior Financial Analyst'});
S.postjob={nav:'postjob',emp:true,crumb:'Employer / Post a job',html:()=>`
${ph('New posting','Post a <em>job.</em>','Talent Compass starts matching as soon as you publish.',`<button class="btn">Save draft</button><button class="btn btn-ink">Publish</button>`)}
<div class="bento">
<form class="col c-7" onsubmit="event.preventDefault()">
<div class="card">${ch('The role','<span class="mono">1 / 4</span>')}<div class="fg">
<label class="field full"><span>Job title</span><input class="inp" value="Compliance Officer"></label>
<label class="field"><span>Department</span><input class="inp" value="Risk &amp; Compliance"></label>
<label class="field"><span>Location</span><select class="inp"><option>Dubai · DIFC</option><option>Abu Dhabi</option><option>London</option><option>Riyadh</option></select></label>
<div class="field full"><span>Work pattern</span><div class="segc"><label><input type="radio" name="wp" checked><b>On-site</b></label><label><input type="radio" name="wp"><b>Hybrid</b></label><label><input type="radio" name="wp"><b>Remote</b></label></div></div></div></div>
<div class="card">${ch('Pay &amp; visa','<span class="mono">2 / 4</span>')}<div class="fg">
<label class="field"><span>Salary from</span><input class="inp" value="30,000"></label>
<label class="field"><span>Salary to</span><input class="inp" value="36,000"></label>
<label class="field"><span>Currency</span><select class="inp"><option>AED / month</option><option>GBP / year</option><option>SAR / month</option></select></label>
<label class="field"><span>Benefits</span><input class="inp" value="Housing, flights, medical"></label>
<label class="tgl full"><input type="checkbox" checked><i></i><span><b>Visa sponsored</b><small>Opens the role to candidates outside the UAE</small></span></label></div>
<div style="margin-top:20px"><span class="mono">Market range for this role</span>${C.range({min:22,max:44,lo:30,hi:36,you:31,fmt:v=>'AED '+v+'k',youLabel:'Median · 31k'})}</div></div>
<div class="card">${ch('Description &amp; skills','<span class="mono">3 / 4</span>')}<div class="fg">
<label class="field full"><span>About the role</span><textarea class="inp" rows="5">Own the compliance monitoring programme for our DIFC entity, advise the business on DFSA rules and lead regulatory reporting.</textarea></label>
<div class="field full"><span>Essential skills</span><div class="chips"><span class="pill good">DFSA rulebook ✕</span><span class="pill good">AML / KYC ✕</span><span class="pill good">Regulatory reporting ✕</span><span class="pill line">+ Add</span></div></div>
<div class="field full"><span>Nice to have</span><div class="chips"><span class="pill">ICA diploma ✕</span><span class="pill">Arabic ✕</span><span class="pill line">+ Add</span></div></div></div></div>
<div class="card">${ch('Compass weightings','<span class="mono">4 / 4</span>','How much each factor counts when we rank applicants.')}<div class="sl">
${[['Skills',40],['Seniority',25],['Qualifications',20],['Location &amp; visa',15]].map(w=>`<label><span>${w[0]}</span><input type="range" min="0" max="60" value="${w[1]}" oninput="this.nextElementSibling.textContent=this.value+'%'"><b>${w[1]}%</b></label>`).join('')}</div></div>
</form>
<div class="col c-5 stick">
<div class="card"><span class="mono">Preview</span><div class="jd" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="co">MC</span><span class="pill">Visa sponsored</span></div><h2 class="disp" style="font-size:28px">Compliance Officer</h2><p>Meridian Capital · Dubai · On-site</p><div class="meta-g" style="margin-top:20px"><div><span class="mono">Salary</span>AED 30–36k / month</div><div><span class="mono">Benefits</span>Housing, flights, medical</div></div></div></div>
<div class="card deep">${ch('Expected reach')}<div style="display:flex;align-items:baseline;gap:10px"><span class="big-n" style="font-size:52px">~140</span><span class="mute" style="font-size:13px">matching candidates</span></div><p class="mute" style="font-size:12px;margin:6px 0 20px">Profiles in Talent Compass scoring 70+ on this brief.</p>${C.vbars({vals:[62,41,24,13],labels:['UAE','UK','KSA','Other'],hi:[0],show:true,h:130})}</div>
</div></div>`};
})();
