// Shared, crawlable links for Darryl's two distinct businesses.
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function propertyManagementSection(config, icon) {
 const partner=config.propertyManagement;
 return `<section id="rent-or-manage" class="section rental-section" aria-labelledby="rental-heading">
  <div class="rental-intro"><span class="eyebrow green">RENTALS & PROPERTY MANAGEMENT</span><h2 id="rental-heading">Renting may be<br>your <em>next move.</em></h2><p>Meet ${esc(partner.name)}, also owned by ${esc(config.owner)}. Local support for landlords and renters.</p></div>
  <div class="rental-grid">
   <article class="rental-card"><span class="eyebrow green">FOR PROPERTY OWNERS</span><h3>Rent out your property.</h3><p>Keeping your home through a PCS or renting instead of selling? Get help with property management.</p><a class="button" href="${esc(partner.ownerUrl)}">Explore property management ${icon('diagonal')}</a></article>
   <article class="rental-card"><span class="eyebrow green">FOR RENTERS</span><h3>Find your next rental.</h3><p>Find a place for your next chapter with rental guidance from Summit Peak.</p><a class="button" href="${esc(partner.renterUrl)}">Get rental help ${icon('diagonal')}</a></article>
  </div>
  <div class="rental-followup"><p>Both options take you to summitpeakpm.com.</p><button class="text-button" data-open="sell">Not sure? Talk with Darryl ${icon('arrow')}</button></div>
 </section>`;
}

export function propertyManagementFooter(config, icon) {
 const partner=config.propertyManagement;
 return `<div class="partner-footer"><div><span class="eyebrow green">ALSO OWNED BY ${esc(config.owner.toUpperCase())}</span><h3>${esc(partner.name)}</h3><p>Property management for landlords. Rental guidance for renters.</p></div><div class="partner-footer-links"><a href="${esc(partner.ownerUrl)}">Rent out my property ${icon('diagonal')}</a><a href="${esc(partner.renterUrl)}">Find a rental ${icon('diagonal')}</a><span>Visit summitpeakpm.com</span></div></div>`;
}
