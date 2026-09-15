const $ = (selector, root=document) => root.querySelector(selector);
const config = JSON.parse($('#public-config').textContent);
const dialog = $('#contact-dialog');
const content = $('#dialog-content');
let opener;
let activeRequest;
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const areas = ['Not sure yet','Colorado Springs','Fountain','Monument','Falcon & Peyton','Security-Widefield','Manitou Springs','Elsewhere in El Paso County'];
const options = (values, selected) => values.map(value => `<option${value===selected?' selected':''}>${escapeHtml(value)}</option>`).join('');
const heading = (eyebrow,title,description) => `<span class="eyebrow green">${eyebrow}</span><h2 id="dialog-title">${title}</h2><p>${description}</p>`;
function rentalReferral(){
 const partner=config.propertyManagement;
 return `<aside class="rental-referral" aria-label="Property management and rental help"><strong>Renting or becoming a landlord?</strong><p>${escapeHtml(partner.name)}, also owned by Darryl Champion, helps landlords and renters.</p><a href="${escapeHtml(partner.ownerUrl)}">Rent out my property ↗</a><a href="${escapeHtml(partner.renterUrl)}">Find rental help ↗</a><small>Continue to summitpeakpm.com</small></aside>`;
}
function download(name,text) {
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function openDialog(kind, trigger) {
 opener=trigger||document.activeElement;
 activeRequest?.abort();
 if(kind==='plan') renderPlan(); else renderContact(kind==='sell'?'Selling a home':'Buying a home');
 if(!dialog.open) dialog.showModal();
}
function closeDialog(){activeRequest?.abort();dialog.close();opener?.focus();}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open]');if(trigger)openDialog(trigger.dataset.open,trigger);});
$('.dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)closeDialog();}});
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
const menu=$('.menu-button');
menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(expanded));menu.setAttribute('aria-label',expanded?'Close navigation':'Open navigation');$('#main-nav').classList.toggle('is-open',expanded);});
$('#main-nav').addEventListener('click',event=>{if(event.target.closest('a')){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');$('#main-nav').classList.remove('is-open');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){menu.click();menu.focus();}});

function renderPlan(){
 const communityName=document.querySelector('.community-hero h1')?.firstChild?.textContent?.trim();
 content.innerHTML=heading('YOUR NEXT CHAPTER','Let’s find your starting point.','A few priorities are all it takes to build a practical first-step plan. No contact details needed.')+`<form id="plan-form"><label>Where would you like to call home?<select name="area">${options(areas,communityName)}</select></label><div class="form-row"><label>Your next move<select name="goal">${options(['Buying my first home','Buying my next home','Relocating / PCS','Selling a home'])}</select></label><label>Your timeline<select name="timeline">${options(['Just exploring','Within 3 months','3–6 months','6–12 months'])}</select></label></div><label>Are VA benefits part of your plan?<select name="benefits">${options(['I’d like to explore eligibility','Yes, I plan to use VA benefits','No / not applicable'])}</select></label><button class="button" type="submit">Build my home plan <span aria-hidden="true">→</span></button><span class="form-help">Your answers stay in this browser unless you choose to share them.</span></form>`;
 $('#plan-form').insertAdjacentHTML('afterend',rentalReferral());
 $('#plan-form').addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.target));showPlan(data);});
}
function showPlan(data){
 const steps = data.goal==='Selling a home' ? ['Gather your property details, recent improvements, and any HOA information.','Discuss a property-specific pricing and preparation strategy with Darryl.','Work backward from your desired move date to plan marketing, showings, and closing.'] : [data.benefits!=='No / not applicable'?'Ask a lender to review your VA eligibility and Certificate of Eligibility, then discuss preapproval.':'Connect with a lender to review financing options, your budget, and preapproval.',`List your must-haves and compare ${data.area==='Not sure yet'?'El Paso County communities':data.area+' properties'} against your commute and daily routine.`,data.goal==='Relocating / PCS'?'Coordinate your orders, arrival date, temporary housing, and anticipated closing timeline.':'Plan tours, then review the offer, inspection, and closing steps with your real estate partner.'];
 const text=`CHAMP REAL ESTATE | YOUR HOME PLAN\nchamprealestate.org\n\nArea: ${data.area}\nGoal: ${data.goal}\nTimeline: ${data.timeline}\nVA benefits: ${data.benefits}\n\nYOUR NEXT STEPS\n${steps.map((s,i)=>`${i+1}. ${s}`).join('\n\n')}\n\nPrepared in your browser. This is a planning guide, not a loan approval, property search result, or submitted consultation request.\nOfficial VA guidance: https://www.va.gov/housing-assistance/home-loans/\n`;
 content.innerHTML=heading('A LITTLE CLARITY. A CLEAR NEXT STEP.','Your next chapter has a plan.',`${escapeHtml(data.goal)} · ${escapeHtml(data.area)} · ${escapeHtml(data.timeline)}`)+`<div class="plan-summary"><h3>Your first three steps</h3><ol>${steps.map(step=>`<li>${escapeHtml(step)}</li>`).join('')}</ol></div><p class="form-help">This is a starting point, not a financing decision. Your lender will confirm eligibility and approval.</p><div class="dialog-actions"><button class="button" id="download-plan">Download my plan ↓</button><button class="button button-outline" id="talk-plan">Talk with Darryl →</button><button class="text-button" id="edit-plan">Start again</button></div><div class="form-status" aria-live="polite" id="plan-status"></div>`;
 $('#download-plan').addEventListener('click',()=>{download('champ-home-plan.txt',text);$('#plan-status').textContent='Your plan download has been prepared. Nothing has been sent to Champ Real Estate.';});
 $('#talk-plan').addEventListener('click',()=>renderContact(data.goal==='Selling a home'?'Selling a home':'Buying a home',`My home plan: ${data.goal} in ${data.area}. Timeline: ${data.timeline}. VA benefits: ${data.benefits}.`));
 $('#edit-plan').addEventListener('click',renderPlan);
}
async function renderContact(goal='Buying a home',message=''){
 content.innerHTML=heading('PERSONAL GUIDANCE STARTS HERE','Let’s talk about your next move.','Tell Darryl what you have in mind, and start with a conversation.')+`<div id="delivery-note" class="form-status" role="status">Checking consultation availability…</div><form id="contact-form"><div class="form-row"><label>Your name<input name="name" autocomplete="name" required maxlength="100" placeholder="First and last name"></label><label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@example.com"></label></div><label>Phone number <span class="form-help">Optional</span><input name="phone" type="tel" autocomplete="tel" maxlength="30" placeholder="Your preferred number"></label><label>I’d like help with<select name="goal">${options(['Buying a home','Selling a home','Military / PCS relocation','Understanding VA benefits'],goal)}</select></label><label>A little about your move<textarea name="message" maxlength="3000" placeholder="Your preferred area, timing, and what you’re looking for…">${escapeHtml(message)}</textarea></label><label class="trap-field" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><button class="button" type="submit" disabled id="contact-submit">Please wait…</button><span class="form-help">Use this form for your real estate inquiry. Please don’t include financial account numbers or military documents. <a href="/privacy/">Privacy details</a></span><div class="form-status" id="contact-status" role="status"></div></form>`;
 $('#contact-form').insertAdjacentHTML('beforebegin',rentalReferral());
 const form=$('#contact-form'),note=$('#delivery-note'),submit=$('#contact-submit'),status=$('#contact-status');
 let ready=false;
 const controller=new AbortController();activeRequest=controller;
 try{const response=await fetch('/api/contact-status',{signal:controller.signal});if(response.ok){const result=await response.json();ready=result.ready===true;}}catch(error){if(error.name==='AbortError')return;}
 if(!form.isConnected)return;
 const emailMode=!ready&&Boolean(config.email);
 note.textContent=ready?'Your inquiry will be sent to Champ Real Estate.':emailMode?'This form prepares an email in your email app. Review and send it there.':'Online consultations are not connected yet. You can prepare and download a draft; it will not be sent to Darryl.';
 note.classList.toggle('draft-notice',!ready);
 submit.textContent=ready?'Send my inquiry →':emailMode?'Prepare my email →':'Download my inquiry draft ↓';submit.disabled=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();const data=Object.fromEntries(new FormData(form));
  if(!data.name.trim()){form.elements.name.setCustomValidity('Please enter your name.');form.elements.name.reportValidity();return;}
  status.classList.remove('error');
  if(!ready){const body=`CHAMP REAL ESTATE — INQUIRY DRAFT (NOT SENT)\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone||'Not provided'}\nInterested in: ${data.goal}\n\n${data.message}\n`;
   if(emailMode){window.location.href=`mailto:${encodeURIComponent(config.email)}?subject=${encodeURIComponent('Real estate inquiry: '+data.goal)}&body=${encodeURIComponent(body)}`;status.textContent='Your email app has been requested. Review and send your message there; this website has not sent it.';}else{download('champ-inquiry-draft.txt',body);status.textContent='Your draft download has been prepared. This inquiry has not been sent. Contact delivery must be connected before Darryl can receive it.';}return;}
  submit.disabled=true;submit.textContent='Sending…';
  try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Your inquiry could not be sent. Please try again.');form.reset();status.textContent='Your inquiry was delivered. Thank you for sharing your plans with Champ Real Estate.';}catch(error){status.classList.add('error');status.textContent=error.name==='TimeoutError'?'Delivery could not be confirmed. Please try again in a moment.':error.message||'Your inquiry could not be sent. Please try again.';}finally{submit.disabled=false;submit.textContent='Send my inquiry →';}
 });
 form.elements.name.addEventListener('input',()=>form.elements.name.setCustomValidity(''));
}
