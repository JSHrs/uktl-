(()=>{const S=window.UKTL_SCREENS,{ph,ch}=window.UH;
const empty=(gl,h,p,acts='')=>`<div class="empty"><span class="gl">${gl}</span><h3 class="disp">${h}</h3><p>${p}</p>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
const ghostChart=msg=>`<div class="ghost-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0,80 L20,72 L40,74 L60,58 L80,52 L100,40" class="gl-ln"></path></svg><span>${msg}</span></div>`;
const sk=(n,cols=3)=>`<div class="skl">${Array.from({length:n},(_,i)=>`<div><i class="c"></i><span><i style="width:${70-i*9}%"></i><i style="width:${42-i*5}%"></i></span>${cols>2?'<i class="r"></i>':''}</div>`).join('')}</div>`;
const kEmpty=items=>`<div class="card kstrip">${items.map(k=>`<div class="kc"><span class="mono">${k[0]}</span><span class="v mute">—</span><span class="d">${k[1]}</span><div class="viz"><div class="bm" style="width:100%;opacity:.6"></div></div></div>`).join('')}</div>`;
const steps=(arr)=>`<div class="onb">${arr.map((s,i)=>`<div class="${s[3]||''}"><span class="n">${s[3]==='done'?'✓':i+1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div>${s[2]||''}</div>`).join('')}</div>`;
S.dashboard0={nav:'dashboard',crumb:'Overview',html:()=>`
${ph('Welcome to UK Talent Link','Let\u2019s get you <em>started,</em> Amara.','Your account is ready. Add your CV and Talent Compass can start matching you to roles.')}
<div class="bento" style="margin-bottom:20px">
<div class="card c-8">${ch('Set up your profile','<span class="mono">1 of 4 done</span>')}<div class="bm" style="margin:-4px 0 20px"><i style="width:25%"></i></div>
${steps([['Create your account','Signed up with amara.okafor@email.com','','done'],['Upload your CV','PDF or Word. We\u2019ll score it in about a minute.','<a href="?s=upload" class="btn btn-ink btn-sm">Upload CV</a>','cur'],['Choose where you\u2019d work','UK, UAE, Saudi Arabia, Qatar or anywhere.','<a href="?s=profile" class="btn btn-sm">Set markets</a>'],['Add right-to-work details','Helps us show you roles you can start quickly.','<a href="?s=profile" class="btn btn-sm">Add details</a>']])}</div>
<div class="col c-4"><div class="drop" style="padding:36px 20px;height:100%"><span class="gl">↑</span><b style="font-weight:500">Drop your CV here</b><span class="mute" style="font-size:13px">PDF or DOCX, up to 5 MB</span><a href="?s=upload" class="btn btn-sm">Choose file</a><span class="hint">Private until you apply</span></div></div>
</div>
${kEmpty([['CV score','After your first upload'],['New matches','Once your CV is scored'],['Applications','None yet'],['Profile views','Visible to consultants']])}
<div class="bento">
<div class="card c-8">${ch('Score over time')}${ghostChart('Your score history will appear here after your first upload')}</div>
<div class="card c-4">${ch('Applications')}${empty('◷','Nothing yet','When you show interest in a role, you\u2019ll track its progress here.')}</div>
<div class="card c-12">${ch('Top matches')}${empty('◇','No matches yet','Talent Compass needs your CV to find roles that fit. Most people see their first matches within minutes.','<a href="?s=upload" class="btn btn-ink">Upload CV</a><a href="?s=jobs" class="btn">Browse all jobs</a>')}</div>
</div>`};
S.discover0={nav:'discover',crumb:'Discover',html:()=>`
${ph('Discover','Roles picked <em>for you.</em>','')}
<div class="card" style="max-width:560px;margin:0 auto">${empty('◇','No matches to show yet','Upload your CV and set your preferred markets. We\u2019ll line up roles here and tell you why each one fits.','<a href="?s=upload" class="btn btn-ink">Upload CV</a><a href="?s=profile" class="btn">Set preferences</a>')}</div>`};
S.messages0={nav:'messages',crumb:'Messages',flush:true,html:()=>`
<div class="msg"><div class="threads"><div style="padding:18px">${sk(4,2)}</div></div>
<div class="convo" style="display:grid;place-items:center">${empty('✉','No messages yet','When a consultant contacts you about a role or your CV, the conversation will appear here.','<a href="?s=consultations" class="btn btn-ink">Book a consultation</a>')}</div></div>`};
S.company0={nav:'company',emp:true,crumb:'Employer / Overview',html:()=>`
${ph('Welcome to UK Talent Link','Let\u2019s make your <em>first hire.</em>','Meridian Capital is set up. Post a role and Talent Compass will start ranking applicants as soon as they arrive.',`<a href="?s=postjob" class="btn btn-ink">+ Post a job</a>`)}
<div class="bento" style="margin-bottom:20px">
<div class="card c-8">${ch('Get set up','<span class="mono">1 of 4 done</span>')}<div class="bm" style="margin:-4px 0 20px"><i style="width:25%"></i></div>
${steps([['Create your company account','Meridian Capital · DIFC, Dubai','','done'],['Post your first job','Takes about 5 minutes. You can save a draft.','<a href="?s=postjob" class="btn btn-ink btn-sm">Post a job</a>','cur'],['Invite your hiring team','Share shortlists and interview notes.','<button class="btn btn-sm">Invite</button>'],['Meet your consultant','A 30-minute call to set up search and HR support.','<a href="UKTL Landing.html?for=employer#contact" class="btn btn-sm">Book a call</a>']])}</div>
<div class="card deep c-4">${ch('How ranking works')}<div class="check"><div><i>1</i><span>You set must-have skills and how much each factor counts.</span></div><div><i>2</i><span>Every applicant gets a Compass score with the reasons behind it.</span></div><div><i>3</i><span>You shortlist, message and book interviews here.</span></div></div></div>
</div>
${kEmpty([['Live roles','Post a job to begin'],['Applicants','Appear as they apply'],['Shortlisted','Compass 80+'],['Interviews','None booked']])}
<div class="bento">
<div class="card c-12">${ch('Job postings')}${empty('▤','No jobs posted yet','Your live roles, applicant counts and pipelines will appear here.','<a href="?s=postjob" class="btn btn-ink">Post your first job</a>')}</div>
<div class="card c-8">${ch('Applicants per day')}${ghostChart('Daily applicants will chart here once a role is live')}</div>
<div class="card c-4">${ch('Top new candidates')}${sk(4)}</div>
</div>`};
S.allcands0={nav:'allcands',emp:true,crumb:'Employer / Candidates',html:()=>`
${ph('All roles · 0 candidates','Every candidate, <em>ranked.</em>','Talent Compass scores each person against the role they applied for.')}
<div class="card" style="position:relative;overflow:hidden"><div style="opacity:.55;pointer-events:none">${sk(6)}</div><div class="empty-over">${empty('≡','No candidates yet','Post a job and applicants will appear here, ranked, with the reasoning for every score.','<a href="?s=postjob" class="btn btn-ink">Post a job</a>')}</div></div>`};
S.empmsg0={nav:'empmsg',emp:true,crumb:'Employer / Messages',flush:true,html:()=>`
<div class="msg"><div class="threads"><div style="padding:18px">${sk(4,2)}</div></div>
<div class="convo" style="display:grid;place-items:center">${empty('✉','No conversations yet','Message shortlisted candidates and your UKTL consultant from here.','<a href="?s=allcands" class="btn">View candidates</a>')}</div></div>`};
})();
