(()=>{
const q=new URLSearchParams(location.search),root=document.documentElement,body=document.body;
const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const setTheme=t=>{root.classList.remove('t-light','t-dark');root.classList.add('t-'+t);if(!q.get('theme'))put('uktl-theme',t)};
setTheme(q.get('theme')||get('uktl-theme')||'light');
const page=body.dataset.page||'';
const L={candidate:[['Services.html','What we offer','services'],['How it works.html','How it works','how'],['Sectors.html','Sectors','sectors'],['Reach.html','Reach','reach'],['Contact.html','Contact','contact']],
employer:[['Employers.html','Services','employers'],['How it works.html','How we search','how'],['Sectors.html','Sectors','sectors'],['Reach.html','Reach','reach'],['Contact.html','Contact','contact']]};
const links=(aud,cls='')=>L[aud].map(l=>`<li data-only="${aud}"><a href="${l[0]}" class="${cls} ${page===l[2]?'on':''}">${l[1]}</a></li>`).join('');
const head=document.createElement('div');head.className='site-h';
head.innerHTML=`<div class="ubar"><div class="who"><span>I'm viewing as</span><button data-set="candidate">Candidate</button><button data-set="employer">Employer</button></div><div class="r"><a href="tel:+442071892857">+44 (0)20 7189 2857</a><span>London · Dubai</span></div></div>
<nav id="nav" class="snav"><a href="UKTL Landing.html" class="logo">UK <em>Talent</em> Link</a><ul class="snav-links">${links('candidate')}${links('employer')}</ul>
<div class="snav-right"><button class="theme-btn" data-theme aria-label="Toggle dark mode"><i></i></button><span class="sep hide-m"></span><a href="UKTL Platform.html?s=login" class="hide-m" data-only="candidate">Sign in</a><a href="UKTL Employer.html" class="hide-m" data-only="employer">Client sign in</a><a href="Onboarding.html?for=candidate" class="btn btn-ink btn-sm" data-only="candidate">Register free</a><a href="Onboarding.html?for=employer" class="btn btn-ink btn-sm" data-only="employer">Start hiring</a></div>
<button class="burger" aria-label="Menu"><span></span><span></span></button></nav>`;
body.prepend(head);
const m=document.createElement('div');m.className='mnav';
m.innerHTML=`${L.candidate.map(l=>`<a class="big" data-only="candidate" href="${l[0]}">${l[1]}</a>`).join('')}${L.employer.map(l=>`<a class="big" data-only="employer" href="${l[0]}">${l[1]}</a>`).join('')}<div class="acts"><div class="aud"><span class="aud-thumb"></span><button data-set="candidate">Candidate</button><button data-set="employer">Employer</button></div><a href="Onboarding.html?for=candidate" class="btn btn-ink btn-lg" data-only="candidate">Register free</a><a href="Onboarding.html?for=employer" class="btn btn-ink btn-lg" data-only="employer">Start hiring</a><a href="UKTL Platform.html?s=login" class="btn btn-lg">Sign in</a></div>`;
body.appendChild(m);
head.querySelector('.burger').onclick=()=>m.classList.toggle('open');
if(!body.dataset.nofoot){const f=document.createElement('footer');f.className='foot';
f.innerHTML=`<div class="wrap"><div class="foot-g"><div><a href="UKTL Landing.html" class="logo">UK <em>Talent</em> Link</a><p>Recruitment and HR consultancy across the United Kingdom and the Gulf.</p></div>
<div><h5>Candidates</h5><ul><li><a href="Services.html">What we offer</a></li><li><a href="Onboarding.html?for=candidate">Score my CV</a></li><li><a href="UKTL Platform.html?s=hrlibrary">HR guidance</a></li><li><a href="How it works.html">How it works</a></li></ul></div>
<div><h5>Employers</h5><ul><li><a href="Employers.html#search">Executive search</a></li><li><a href="Employers.html#hr">HR consultancy</a></li><li><a href="Onboarding.html?for=employer">Start hiring</a></li><li><a href="Contact.html">Book a consultation</a></li></ul></div>
<div><h5>Company</h5><ul><li><a href="Sectors.html">Sectors</a></li><li><a href="Reach.html">Reach</a></li><li><a href="Contact.html">Contact</a></li></ul></div></div>
<div class="foot-b"><span>© 2026 UK Talent Link Ltd · Chancery House, London WC2A 1QS</span><nav><a href="Privacy.html">Privacy</a><a href="Terms.html">Terms</a><a href="Unsubscribe.html">Email preferences</a></nav></div></div>`;
body.appendChild(f);}
window.setFor=f=>{body.dataset.for=f;put('uktl-for',f);document.querySelectorAll('[data-set]').forEach(b=>b.classList.toggle('on',b.dataset.set===f));document.querySelectorAll('[data-only="'+f+'"]').forEach(el=>{if(el.closest('.site-h,.mnav'))return;el.classList.remove('swap');void el.offsetWidth;el.classList.add('swap')});document.querySelectorAll('[data-only="'+f+'"] .rv,[data-only="'+f+'"].rv').forEach(el=>el.classList.add('in'));document.dispatchEvent(new CustomEvent('aud',{detail:f}))};
document.addEventListener('click',e=>{const b=e.target.closest('[data-set]');if(b)setFor(b.dataset.set);if(e.target.closest('[data-theme]'))setTheme(root.classList.contains('t-dark')?'light':'dark')});
setFor(q.get('for')||get('uktl-for')||body.dataset.for||'candidate');
document.querySelectorAll('[data-only]').forEach(el=>el.classList.remove('swap'));
addEventListener('scroll',()=>head.classList.toggle('solid',scrollY>30),{passive:true});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
if(q.get('static'))document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
})();
