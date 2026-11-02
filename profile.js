import { readLegacyData, removeLegacyData } from './account-data.js?v=22';
const googleIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.6c-.3 1.3-1 2.4-2.1 3.1v2.6h3.4C20.8 17.9 22 15.3 22 12.2Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.7v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.4V7.6H2.7a10 10 0 0 0 0 8.8Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 2.7 7.6l3.5 2.7C7 7.9 9.3 6.1 12 6.1Z"/></svg>';
export function createProfile({ $, escapeHTML, account }) {
  let loginPending=false,legacy;
  const toggle=$('#account-menu-toggle'),dropdown=$('#account-dropdown');
  function closeMenu(){dropdown.hidden=true;toggle.setAttribute('aria-expanded','false');}
  toggle.addEventListener('click',()=>{dropdown.hidden=!dropdown.hidden;toggle.setAttribute('aria-expanded',String(!dropdown.hidden));});
  document.addEventListener('click',event=>{if(!event.target.closest('.account-menu'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !dropdown.hidden){closeMenu();toggle.focus();}});
  dropdown.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  function updateHeader(){
    const state=account.getState(),name=state.profile.name || state.user?.displayName || 'Visiteur';
    $('#menu-account-name').textContent=state.authReady?name:'Connexion…';
    $('#profile-avatar').textContent=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
    const theme=state.profile.theme==='light'?'light':'dark';document.documentElement.dataset.theme=theme;$('#theme-toggle').setAttribute('aria-checked',String(theme==='dark'));
    $('#sign-out').hidden=!state.user;
    $('#menu-profile-link').href=state.user?'#profil':'#connexion';
    $('#menu-profile-label').textContent=state.user?'Mon profil':'Se connecter';
    $('#menu-account-caption').textContent=state.user?'TON COMPTE GOOGLE':'EXPLORER LE PADDOCK';
  }
  account.subscribe(updateHeader);
  $('#theme-toggle').addEventListener('click',async()=>{try{await account.setPreference('theme',document.documentElement.dataset.theme==='dark'?'light':'dark');}catch{}});
  $('#sign-out').addEventListener('click',async()=>{closeMenu();try{await account.signOut();location.hash='connexion';}catch{}});
  function isEditing(){return !!document.activeElement?.closest('#account-form');}
  function render(){
    const state=account.getState(),user=state.user;
    if(!state.authReady){$('#results').innerHTML='<p class="empty">Vérification de la connexion…</p>';return;}
    if(!user){renderLogin();return;}
    const profile=state.profile,name=profile.name||user.displayName||'Ton profil',initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
    let photo='';try{if(new URL(user.photoURL).protocol==='https:')photo=user.photoURL;}catch{}
    try{legacy=readLegacyData(localStorage);}catch{legacy={available:false,count:0,collection:{},profile:{}};}
    $('#results').innerHTML=`<div class="account-layout"><section class="account-card"><div class="account-intro"><span class="account-avatar">${photo?`<img src="${escapeHTML(photo)}" alt="Photo de ton compte Google" referrerpolicy="no-referrer">`:escapeHTML(initials)}</span><div><h3>${escapeHTML(name)}</h3><span class="connected-badge">Compte Google connecté</span></div></div><p class="account-description">Ta collection et tes préférences sont synchronisées avec ton compte, sur tous tes appareils.</p><form id="account-form"><label for="account-name">Nom ou pseudonyme</label><input id="account-name" name="name" maxlength="80" required autocomplete="nickname" value="${escapeHTML(name)}"><label for="account-email">Adresse e-mail Google</label><input id="account-email" type="email" value="${escapeHTML(user.email||'')}" readonly><small class="account-help">L’adresse e-mail est gérée par ton compte Google.</small><label for="account-team">Constructeur favori</label><select id="account-team"><option value="">Aucune préférence</option>${['Alpine','Aston Martin','Audi','Cadillac','Ferrari','Haas','McLaren','Mercedes','Racing Bulls','Red Bull','Williams'].map(team=>`<option ${profile.favoriteTeam===team?'selected':''}>${team}</option>`).join('')}</select><button class="primary-action" type="submit" ${!state.ready?'disabled':''}>Enregistrer dans mon compte</button><p id="account-status" role="status" aria-live="polite">${state.ready?'':escapeHTML(state.error||'Chargement des données du compte…')}</p></form></section><div class="account-side"><section class="account-card"><p class="eyebrow">CONNEXION & SÉCURITÉ</p><h3>Authentification Google</h3><p class="account-description">Aucun mot de passe n’est conservé par Calpino Uno. La connexion et les réglages de sécurité sont gérés par Google.</p><a class="google-account-link" href="https://myaccount.google.com/security" target="_blank" rel="noopener">Gérer la sécurité de mon compte Google ↗</a><p class="account-help">Dernière connexion : ${user.metadata?.lastSignInTime?escapeHTML(new Date(user.metadata.lastSignInTime).toLocaleString('fr-FR')):'—'}</p></section><section class="account-card"><p class="eyebrow">ACTIVITÉ DU COMPTE</p><h3>Dernières connexions</h3><ul class="visit-list">${state.signins.map(visit=>`<li><span class="visit-dot" aria-hidden="true"></span><div><strong>${escapeHTML(visit.browser)} · ${escapeHTML(visit.device)}</strong><small>${visit.date?escapeHTML(new Date(visit.date).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'})):'—'}</small></div></li>`).join('')||'<li>Chargement de l’activité…</li>'}</ul></section>${legacy.available && !profile.migrationComplete?`<section class="account-card legacy-import"><p class="eyebrow">TES ANCIENNES DONNÉES</p><h3>Importer depuis ce navigateur</h3><p class="account-description">${legacy.count} course${legacy.count>1?'s':''} enregistrée${legacy.count>1?'s':''} localement, ainsi que ton ancien profil et tes préférences. Cet import les ajoutera au compte <strong>${escapeHTML(user.email||name)}</strong>. Les courses déjà présentes seront conservées.</p><button id="import-legacy" ${!state.ready?'disabled':''}>Importer dans ce compte</button><p id="legacy-status" role="status"></p></section>`:''}</div></div>`;
    $('#account-form').addEventListener('submit',async event=>{
      event.preventDefault();const button=event.target.querySelector('button[type=submit]'),status=$('#account-status');
      const nextName=$('#account-name').value.trim();if(!nextName){status.textContent='Renseigne un nom ou pseudonyme.';return;}
      const uid=account.getState().user?.uid;button.disabled=true;status.textContent='Enregistrement…';
      try{await account.saveProfile({name:nextName,favoriteTeam:$('#account-team').value});if(account.getState().user?.uid===uid && status.isConnected){status.textContent='Informations enregistrées dans ton compte.';$('.account-intro h3').textContent=nextName;if(!$('.account-avatar img'))$('.account-avatar').textContent=nextName.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();}}
      catch(error){if(status.isConnected)status.textContent=error.message;}
      finally{if(button.isConnected)button.disabled=!account.getState().ready;}
    });
    $('#import-legacy')?.addEventListener('click',async event=>{
      const button=event.currentTarget,status=$('#legacy-status');button.disabled=true;status.textContent='Importation en cours…';
      const uid=account.getState().user?.uid;
      try{await account.importLegacy(legacy);if(account.getState().user?.uid!==uid)return;removeLegacyData(localStorage);render();}
      catch(error){if(status.isConnected)status.textContent='Import incomplet : '+error.message+' Tu peux relancer l’import sans créer de doublons.';if(button.isConnected)button.disabled=false;}
    });
  }
  function renderLogin(){
    const state=account.getState();
    $('#results').innerHTML=`<section class="login-layout"><div class="login-art"><img src="assets/cockpit-v2.webp" alt="Cockpit de Formule 1 dessiné en noir et rouge"><div><p class="eyebrow">CALPINO UNO</p><h3>Chaque saison.<br>Chaque émotion.</h3><p>Les circuits, les champions et les courses qui ont écrit l’histoire.</p></div></div><div class="login-panel"><p class="eyebrow">TON ACCÈS AU PADDOCK</p><h3>Prends place.</h3><p>Connecte-toi pour retrouver tes favoris, ta collection et tes préférences sur tous tes appareils.</p><button id="google-sign-in" class="google-login" ${!state.authReady||loginPending?'disabled':''}>${googleIcon}${loginPending?'Connexion en cours…':'Continuer avec Google'}</button><p class="login-account-note">Connexion sécurisée avec Google. Ton mot de passe reste chez Google.</p><a href="#">Explorer sans connexion →</a><p id="login-status" role="status" aria-live="polite">${escapeHTML(state.error)}</p></div></section>`;
    $('#google-sign-in').addEventListener('click',async event=>{
      const button=event.currentTarget;loginPending=true;button.disabled=true;$('#login-status').textContent='Ouverture de Google…';
      try{await account.signIn();if(account.getState().user)location.hash='profil';}
      catch(error){if($('#login-status'))$('#login-status').textContent=error.message;}
      finally{loginPending=false;if(button.isConnected)button.disabled=false;}
    });
  }
  return {render,renderLogin,isEditing};
}
