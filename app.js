import { createAccountStore } from './account-store.js?v=22';
import { createTeams } from './teams.js?v=24';
import { createViewLayout } from './view-layout.js?v=22';
import { enableTableSorting } from './table-sort.js?v=16';
import { trophyIcon } from './icons.js';
import { renderFlag } from './flags.js?v=12';
import { renderAnnualCalendar } from './calendar.js';
import { createCircuits } from './circuits.js?v=20';
import { createCockpits } from './cockpit.js?v=23';
import { createProfile } from './profile.js?v=24';
import { createStatistics } from './statistics.js?v=24';
import { teamColor, teamLogo } from './branding.js?v=23';
const API = 'https://api.jolpi.ca/ergast/f1/';
const CURRENT_YEAR = new Date().getFullYear();
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escapeHTML(url.href.replace(/^http:/, 'https:')) : '#'; } catch { return '#'; } };
const dateLabel = (race) => new Date(`${race.date}T${race.time || '12:00:00Z'}`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fullName = (driver) => `${driver?.givenName || ''} ${driver?.familyName || ''}`.trim();
const flag = renderFlag;
function teamIdentity(team, season) {
  return `<span class="identity">${teamLogo(team,season)}<button class="team-link" data-team-id="${escapeHTML(team?.constructorId || team?.id || '')}" data-team-name="${escapeHTML(team?.name || '')}" data-team-year="${season}">${escapeHTML(team?.name || '—')}</button></span>`;
}
function driverIdentity(driver, team, season, showTeam = true, winner = false) {
  return `<span class="identity">${showTeam ? teamLogo(team,season) : ''}<button class="driver-link" data-driver-name="${escapeHTML(fullName(driver))}">${escapeHTML(fullName(driver))}</button>${winner ? trophyIcon : ''}</span>`;
}
const calendarIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v17H5ZM8 2v4m8-4v4M5 9h14m-11 4h2m4 0h2m-8 4h2"/></svg>';
const checkedFlag = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V3m0 1c5-4 11 4 16 0v11c-5 4-11-4-16 0"/><path d="M4 4h4v4H4m4 0h4v4H8m4-8h4v4h-4m4 0h4v4h-4M4 12h4v4H4m8-4h4v4h-4" fill="currentColor"/></svg>';
function countryOnly(country,label=country) { return flag(country,label) || escapeHTML(label); }
const account=createAccountStore();
let collection={};
const pendingCollection=new Set();
const layouts=createViewLayout(account);
let renderedView = null;
const state = { loading: true, year: CURRENT_YEAR, view: 'races', races: [], drivers: [], constructors: [], winners: [], generation: 0, detailGeneration: 0 };
const requestCache = new Map();
const preferences={
  get(key){return collection[key] || {};},
  async toggle(key,field,race){
    const user=account.getState().user;if(!user){location.hash='connexion';return;}
    const pendingKey=`${user.uid}:${key}`;if(pendingCollection.has(pendingKey))return;
    pendingCollection.add(pendingKey);document.querySelectorAll(`[data-key="${key}"]`).forEach(button=>button.disabled=true);
    try{await account.toggle(key,field,race);}catch{paintAccountStatus();}
    finally{pendingCollection.delete(pendingKey);if(account.getState().user?.uid===user.uid && ['races','collection'].includes(state.view))render();}
  }
};
async function request(path) {
  const key=path;
  if (requestCache.has(key)) return requestCache.get(key);
  const pending = (async () => {
    const response = await fetch(`${API}${path}${path.includes('?') ? '&' : '?'}limit=100`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(response.status === 429 ? 'La source reçoit trop de demandes. Réessaie dans une minute.' : `La source ne répond pas (${response.status}).`);
    const body = await response.json();
    if (!body.MRData) throw new Error('La source a renvoyé des données inattendues.');
    return body.MRData;
  })();
  requestCache.set(key, pending);
  try { return await pending; } catch (error) { requestCache.delete(key); throw error; }
}
function raceKey(race) { return `${race.season}-${race.round}`; }
function isUpcoming(race) { return new Date(`${race.date}T${race.time || '23:59:59Z'}`) > new Date(); }
function matches(race) {
  const search = $('#search').value.toLowerCase();
  const winner = state.winners.find((item) => item.round === race.round)?.Results?.[0];
  const text = `${race.raceName} ${race.Circuit.circuitName} ${race.Circuit.Location.locality} ${race.Circuit.Location.country} ${fullName(winner?.Driver)} ${race.season}`.toLowerCase();
  const filter = $('#filter').value;
  return text.includes(search) && (filter === 'all' || (filter === 'upcoming' ? isUpcoming(race) : filter === 'finished' ? !isUpcoming(race) : preferences.get(raceKey(race))[filter]));
}
const collectionIcons = {
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="m3 3 18 18M9.8 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 4M6.5 6.5A20 20 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.5-1.5M10 10a3 3 0 0 0 4 4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="m5 12 4 4L19 6"/>'
};
function actions(race, compact = false) {
  const saved = preferences.get(raceKey(race));
  return `<div class="card-actions ${compact ? 'icon-actions' : ''}">${compact ? '' : `<button class="detail" data-detail="${raceKey(race)}">Explorer <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg></button>`}${[['favorite','Favori',collectionIcons.star],['watched','Vu',saved.watched?collectionIcons.eye:collectionIcons.eyeOff],['watchlist','À voir',saved.watchlist?collectionIcons.check:collectionIcons.plus]].map(([field,label,icon])=>`<button data-key="${raceKey(race)}" data-field="${field}" class="collection-action ${saved[field]?'active':''}" aria-pressed="${Boolean(saved[field])}" ${pendingCollection.has(`${account.getState().user?.uid}:${raceKey(race)}`)?'disabled':''} aria-label="${label} : ${escapeHTML(race.raceName)}" title="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>${compact?'':`<span>${label}</span>`}</button>`).join('')}</div>`;
}
function renderRaces() {
  const races = state.view === 'collection' ? Object.values(collection).filter((item) => item.race && (item.favorite || item.watched || item.watchlist)).map((item) => item.race).sort((a,b) => b.date.localeCompare(a.date)).filter(matches) : state.races.filter(matches);
  if (layouts.get(state.view) === 'list') { $('#results').innerHTML = raceList(races); return; }
  $('#results').innerHTML = races.length ? `<div class="grid">${races.map((race) => {
    const winner = state.view === 'collection' ? null : state.winners.find((item) => item.round === race.round)?.Results?.[0];
    return `<article class="race ${isUpcoming(race) ? 'upcoming' : ''}"><div class="card-top"><span class="round">ROUND ${String(race.round).padStart(2, '0')} · ${race.season}</span><span>${escapeHTML(dateLabel(race))}</span></div><h3>${flag(race.Circuit.Location.country)}${escapeHTML(race.raceName)}</h3>${circuits.raceCard(race)}<div class="winner"><small>${isUpcoming(race) ? 'PROCHAIN RENDEZ-VOUS' : winner ? 'VAINQUEUR' : 'RÉSULTATS'}</small>${winner ? driverIdentity(winner.Driver, winner.Constructor, race.season, true, true) : isUpcoming(race) ? 'À venir' : 'Consulter le détail de la course'}</div>${actions(race)}</article>`;
  }).join('')}</div>` : '<p class="empty">Aucune course ici. Change les filtres ou ajoute des courses à ta collection.</p>';
}
function raceList(races) {
  if (!races.length) return '<p class="empty">Aucune course ici. Change les filtres ou ajoute des courses à ta collection.</p>';
  return `<div class="table-wrap race-list"><table><thead><tr><th>Saison / round</th><th>Date</th><th>Grand Prix</th><th>Circuit</th><th>Pays</th><th>Vainqueur</th><th>Actions</th></tr></thead><tbody>${races.map(race=>{
    const winner = state.view === 'collection' ? null : state.winners.find(item=>item.round===race.round)?.Results?.[0];
    return `<tr class="race-click-row" data-race-key="${raceKey(race)}" tabindex="0" aria-label="${escapeHTML(race.raceName)} · ${escapeHTML(dateLabel(race))}"><td data-sort-value="${race.season}-${String(race.round).padStart(2,'0')}">${race.season} · ${race.round}</td><td data-sort-value="${race.date}">${escapeHTML(dateLabel(race))}</td><td><strong>${escapeHTML(race.raceName)}</strong></td><td>${circuits.nameLink(race)}</td><td>${countryOnly(race.Circuit.Location.country)}</td><td>${winner ? driverIdentity(winner.Driver,winner.Constructor,race.season,true,true) : isUpcoming(race)?'À venir':'Consulter les résultats'}</td><td>${actions(race,true)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderLoading() {
  const root = $('#results');
  if (renderedView !== state.view || !root.children.length) {
    if (['drivers','constructors'].includes(state.view) || layouts.get(state.view) === 'list' && state.view === 'races') {
      const headers = state.view === 'races' ? ['Saison / round','Date','Grand Prix','Circuit','Pays','Vainqueur','Actions'] : state.view === 'constructors' ? ['Pos.','Constructeur','Nationalité','Victoires','Points'] : ['Pos.','Pilote','Nationalité','Constructeur','Victoires','Points'];
      const count = state.view === 'drivers' ? state.drivers.length || 20 : state.view === 'constructors' ? state.constructors.length || 10 : state.races.length || 6;
      root.innerHTML = `<div class="table-wrap"><table><thead><tr>${headers.map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${Array.from({length:count},()=>`<tr>${headers.map(()=>'<td><span class="skeleton-line">Chargement</span></td>').join('')}</tr>`).join('')}</tbody></table></div>`;
    } else if (state.view === 'calendar') root.innerHTML = renderAnnualCalendar({year:state.year,races:[],escapeHTML,renderFlag});
    else root.innerHTML = `<div class="grid">${Array.from({length:state.races.length||6},()=>'<article class="race skeleton-card"><div>Chargement du Grand Prix</div></article>').join('')}</div>`;
    renderedView = state.view;
  }
  root.classList.add('loading-placeholders');root.setAttribute('aria-busy','true');root.setAttribute('aria-hidden','true');root.inert = true;
}
function standingsTable(items, constructors = false) {
  const query = $('#search').value.toLowerCase();
  const max = Math.max(1, ...items.map((item) => Number(item.points)));
  const filtered = items.filter((item) => `${constructors ? item.Constructor.name : fullName(item.Driver)} ${item.Constructors?.map((team) => team.name).join(' ') || ''}`.toLowerCase().includes(query));
  if (!filtered.length) return '<p class="empty">Aucun classement disponible pour cette sélection.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>Pos.</th><th>${constructors ? 'Constructeur' : 'Pilote'}</th>${constructors ? '<th>Nationalité</th>' : '<th>Nationalité</th><th>Constructeur</th>'}<th>Victoires</th><th>Points</th></tr></thead><tbody>${filtered.map((item) => `<tr style="--team-color:${teamColor(constructors ? item.Constructor : item.Constructors?.[0], state.year)}"><td>${Number(item.position) === 1 && state.year < CURRENT_YEAR ? trophyIcon : ''}${escapeHTML(item.position)}</td><td><strong>${constructors ? teamIdentity(item.Constructor, state.year) : driverIdentity(item.Driver, item.Constructors?.[0], state.year, false)}</strong></td>${constructors ? '' : `<td>${countryOnly(item.Driver.nationality)}</td>`}<td>${constructors ? `${countryOnly(item.Constructor.nationality)}` : `<span class="team-list">${(item.Constructors || []).map((team) => teamIdentity(team, state.year)).join('')}</span>`}</td><td>${escapeHTML(item.wins)}</td><td class="points"><strong>${escapeHTML(item.points)}</strong><span class="bar" style="width:${Number(item.points) / max * 100}%"></span></td></tr>`).join('')}</tbody></table></div>`;
}
function render() {
  const titles = { races: ['LE CALENDRIER', 'Les Grands Prix'], drivers: ['LE CHAMPIONNAT', 'Classement des pilotes'], constructors: ['LE CHAMPIONNAT', 'Classement des constructeurs'], calendar: ['LA SAISON EN UN COUP D’ŒIL', `Calendrier ${state.year}`], circuits: ['LES TRACÉS DE LA FORMULE 1', 'Circuits & records'], login: ['BIENVENUE DANS LE PADDOCK', 'Connexion'], profile: ['TON ESPACE PERSONNEL', 'Mon profil'], statistics: ['LES RECORDS DE LA FORMULE 1', 'Statistiques & carrières'], collection: ['TON HISTOIRE AVEC LA F1', 'Ma collection · toutes les saisons'] };
  $('#section-label').textContent = titles[state.view][0]; $('#section-title').textContent = titles[state.view][1];
  document.body.classList.toggle('profile-view', ['profile','login'].includes(state.view));
  $('.profile-nav').setAttribute('aria-current', ['profile','login'].includes(state.view) ? 'page' : 'false');
  $('.filters').hidden = ['profile','login'].includes(state.view);
  $('#layout-controls').innerHTML = layouts.controls(state.view);
  $('#filter').hidden = !['races', 'collection', 'calendar'].includes(state.view);
  $('#tabs').querySelectorAll('button').forEach((button) => { if (button.dataset.view === state.view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
  if (state.loading && ['races','drivers','constructors','calendar'].includes(state.view)) { renderLoading(); return; }
  $('#results').classList.remove('loading-placeholders'); $('#results').removeAttribute('aria-hidden'); $('#results').inert = false;
  if (state.view === 'calendar') $('#results').innerHTML = renderAnnualCalendar({year:state.year,races:state.races.filter(matches),escapeHTML,renderFlag}); else if (state.view === 'circuits') circuits.render($('#search').value); else if (state.view === 'login') profile.renderLogin(); else if (state.view === 'profile') profile.render(); else if (state.view === 'statistics') statistics.render($('#search').value); else if (state.view==='collection' && !account.getState().user) $('#results').innerHTML='<div class="empty"><p>Connecte-toi pour retrouver ta collection sur tous tes appareils.</p><a class="primary-action guest-sign-in" href="#connexion">Se connecter avec Google</a></div>'; else if(state.view==='collection' && !account.getState().ready) $('#results').innerHTML='<p class="empty">Chargement de ta collection…</p>'; else if (['races', 'collection'].includes(state.view)) renderRaces(); else $('#results').innerHTML = standingsTable(state[state.view], state.view === 'constructors');
  renderedView = state.view;
  $('#results').setAttribute('aria-busy', 'false');
}
async function loadSeason() {
  const generation = ++state.generation;
  cockpits.update(state.year);
  $('#notice').textContent = 'Chargement de la saison…'; $('#results').setAttribute('aria-busy', 'true');
  state.loading = true;
  if (!$('#stats').children.length) $('#stats').innerHTML = ['GRANDS PRIX','RÉSULTATS PUBLIÉS','PILOTES','ÉCURIES'].map(label=>`<div class="stat"><small>${label}</small><strong>Chargement</strong></div>`).join('');
  $('#stats').classList.add('loading-stats'); $('#season-summary').classList.add('loading-stats'); $('#season-summary').inert=true;render();
  const outcomes = await Promise.allSettled([request(`${state.year}/`), request(`${state.year}/driverstandings/`), request(`${state.year}/constructorstandings/`), request(`${state.year}/results/1/`), circuits.load()]);
  if (generation !== state.generation) return;
  state.loading = false; $('#stats').classList.remove('loading-stats'); $('#season-summary').classList.remove('loading-stats'); $('#season-summary').inert=false;
  const data = outcomes.map((result) => result.status === 'fulfilled' ? result.value : null);
  state.races = data[0]?.RaceTable?.Races || []; state.drivers = data[1]?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || []; state.constructors = data[2]?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || []; state.winners = data[3]?.RaceTable?.Races || [];
  const completed = state.winners.length;
  const nextRace = state.races.find(isUpcoming);
  const start = nextRace ? new Date(`${nextRace.date}T${nextRace.time || '12:00:00Z'}`) : null;
  const days = start ? Math.max(0,Math.ceil((start-Date.now())/86400000)) : 0;
  const hour = start && nextRace.time ? start.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZoneName:'short'}) : 'Horaire à confirmer';
  const progress = state.races.length ? completed/state.races.length : 0;
  $('#season-summary').innerHTML = `<button class="summary-next" ${nextRace ? `data-detail="${raceKey(nextRace)}"` : 'disabled'}><small>${nextRace ? 'PROCHAIN GRAND PRIX' : 'SAISON ARCHIVÉE'}</small><strong>${nextRace ? flag(nextRace.Circuit.Location.country) + escapeHTML(nextRace.raceName) : 'Saison ' + state.year}</strong>${nextRace ? `<div class="next-race-body"><div class="next-race-schedule"><span class="race-date">${calendarIcon}${dateLabel(nextRace)}</span><strong class="race-time">${escapeHTML(hour)}</strong><span class="countdown">${days ? `J − ${days}` : 'AUJOURD’HUI'}</span></div>${circuits.summaryDrawing(nextRace)}</div>` : '<span>Explore les résultats et les classements</span>'}</button><div class="summary-progress"><small>SAISON ${state.year}</small><div class="season-progress-ring" role="img" aria-label="${completed} Grands Prix sur ${state.races.length} avec résultats publiés"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="52"/><circle class="ring-value" cx="60" cy="60" r="52" pathLength="100" stroke-dasharray="${progress*100} 100"/></svg><div>${checkedFlag}<strong>${completed}<em> / ${state.races.length || '—'}</em></strong><small>GRANDS PRIX</small></div></div></div><div class="summary-leader"><small>TOP 3 · CHAMPIONNAT PILOTES</small><ol class="season-top-three">${state.drivers.slice(0,3).map((driver,index)=>`<li><span class="top-position">${index+1}</span>${driverIdentity(driver.Driver,driver.Constructors?.[0],state.year,true,state.year<CURRENT_YEAR && index===0)}<strong>${escapeHTML(driver.points)}<small> pts</small></strong></li>`).join('') || '<li>Classement indisponible</li>'}</ol></div>`;
  $('#stats').innerHTML = '';
  const failure = outcomes.find((result) => result.status === 'rejected');
  $('#notice').innerHTML = failure ? `${escapeHTML(failure.reason.message)} <button id="retry">Réessayer</button>` : `Saison ${state.year} · dates affichées dans ton fuseau horaire · données Jolpica F1`;
  $('#retry')?.addEventListener('click', loadSeason); render();
}
const dialog = $('#race-dialog');
const statistics = createStatistics({ $, escapeHTML, dialog, driverIdentity, state });
const teams = createTeams({ $, escapeHTML, dialog, state, load: statistics.load, onSeason(year) { state.year=year; state.view='constructors'; loadSeason(); } });
const profile = createProfile({ $, escapeHTML, account });
const circuits = createCircuits({ $, escapeHTML, state, layouts });
const cockpits = createCockpits({ initialYear: CURRENT_YEAR, onYearChange(year) { state.year = year; loadSeason(); } });
async function showSession(race, session, token) {
  $('#session-results').innerHTML = '<p class="empty">Chargement…</p>';
  try {
    const data = await request(`${race.season}/${race.round}/${session}/`);
    if (token !== state.detailGeneration) return;
    const record = data.RaceTable?.Races?.[0];
    const rows = record?.[session === 'qualifying' ? 'QualifyingResults' : session === 'sprint' ? 'SprintResults' : 'Results'] || [];
    $('#session-results').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>Pos.</th><th>Pilote</th><th>Constructeur</th>${session === 'qualifying' ? '<th>Q1</th><th>Q2</th><th>Q3</th>' : '<th>Grille</th><th>Tours</th><th>Temps / statut</th><th>Points</th>'}</tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHTML(row.position)}</td><td>${driverIdentity(row.Driver, row.Constructor, race.season, true, Number(row.position) === 1 && session !== 'qualifying')}</td><td>${teamIdentity(row.Constructor, race.season)}</td>${session === 'qualifying' ? ['Q1','Q2','Q3'].map((key) => `<td>${escapeHTML(row[key] || '—')}</td>`).join('') : `<td>${escapeHTML(row.grid)}</td><td>${escapeHTML(row.laps)}</td><td>${escapeHTML(row.Time?.time || row.status)}</td><td>${escapeHTML(row.points)}</td>`}</tr>`).join('')}</tbody></table></div>` : '<p class="empty">Aucune donnée publiée pour cette session. Les archives anciennes ne couvrent pas toutes les qualifications.</p>';
  } catch (error) { if (token === state.detailGeneration) $('#session-results').innerHTML = `<p class="empty">${escapeHTML(error.message)} <button data-session="${session}">Réessayer</button></p>`; }
}
let selectedRace;
function openRace(race) {
  selectedRace = race; const token = ++state.detailGeneration;
  $('#race-detail').innerHTML = `<p class="eyebrow">SAISON ${race.season} · ROUND ${race.round}</p><h2 id="race-title">${flag(race.Circuit.Location.country)}${escapeHTML(race.raceName)}</h2><p class="detail-meta">${escapeHTML(race.Circuit.circuitName)} · ${escapeHTML(race.Circuit.Location.locality)}, ${escapeHTML(race.Circuit.Location.country)}<br>${escapeHTML(dateLabel(race))}${race.time ? ` · ${escapeHTML(new Date(`${race.date}T${race.time}`).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}))}` : ''}<br><a href="${safeURL(race.Circuit.url)}" target="_blank" rel="noopener noreferrer">Découvrir le circuit ↗</a> · <a href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(race.Circuit.Location.lat)}&mlon=${encodeURIComponent(race.Circuit.Location.long)}#map=14/${encodeURIComponent(race.Circuit.Location.lat)}/${encodeURIComponent(race.Circuit.Location.long)}" target="_blank" rel="noopener noreferrer">Localiser ↗</a></p>${circuits.detailLink(race)}<div class="session-tabs"><button class="active" data-session="results">Course</button><button data-session="qualifying">Qualifications</button><button data-session="sprint" disabled title="Vérification des données Sprint…">Sprint</button></div><div id="session-results"></div>`;
  if (!dialog.open) dialog.showModal(); showSession(race, 'results', token);
  const sprintButton = $('#race-detail [data-session="sprint"]');
  if (Number(race.season) < 2021) { sprintButton.title = 'Pas de Sprint pour ce Grand Prix'; return; }
  request(`${race.season}/${race.round}/sprint/`).then(data => {
    if (selectedRace !== race || !sprintButton.isConnected) return;
    const available = Boolean(data.RaceTable?.Races?.[0]?.SprintResults?.length);
    sprintButton.disabled = !available;
    sprintButton.title = available ? 'Résultats du Sprint' : 'Aucune donnée Sprint publiée pour ce Grand Prix';
  }).catch(() => { if (sprintButton.isConnected) sprintButton.title = 'Données Sprint indisponibles'; });
}
$('#tabs').addEventListener('click', (event) => { const view = event.target.closest('[data-view]')?.dataset.view; if (view) { state.view = view; render(); } });
$('#layout-controls').addEventListener('click',async event=>{const layout=event.target.closest('[data-layout]')?.dataset.layout;if(!layout)return;try{await layouts.set(state.view,layout);renderedView=null;render();}catch{paintAccountStatus();}});
$('#search').addEventListener('input', render); $('#filter').addEventListener('change', render);
$('#season-summary').addEventListener('click',event=>{const key=event.target.closest('[data-detail]')?.dataset.detail;const race=state.races.find(item=>raceKey(item)===key);if(race && !state.loading)openRace(race);});
$('#results').addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(button?.dataset.calendarDate){const race=state.races.find(item=>item.date===button.dataset.calendarDate);if(race)openRace(race);return;}
  if(button){
    if(!button.dataset.field && !button.dataset.detail)return;
    const key=button.dataset.detail || button.dataset.key;const race=state.races.find(item=>raceKey(item)===key)||preferences.get(key).race;if(!race)return;
    if(button.dataset.detail)openRace(race);else{preferences.toggle(key,button.dataset.field,race);render();}return;
  }
  if(event.target.closest('a,[data-circuit],[data-driver-id],[data-driver-name],[data-team-id]'))return;
  const row=event.target.closest('[data-race-key]');if(row){const race=state.races.find(item=>raceKey(item)===row.dataset.raceKey)||preferences.get(row.dataset.raceKey).race;if(race)openRace(race);}
});
$('#results').addEventListener('keydown',event=>{
  if(!['Enter',' '].includes(event.key)||!event.target.matches('[data-race-key]'))return;
  event.preventDefault();event.target.click();
});
$('#race-detail').addEventListener('click', (event) => {
  const target = event.target.closest('[data-session]'); const session = target?.dataset.session; if (!session || target.disabled) return;
  $('#race-detail').querySelectorAll('.session-tabs button').forEach((button) => button.classList.toggle('active', button.dataset.session === session));
  showSession(selectedRace, session, ++state.detailGeneration);
});
$('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { state.detailGeneration++; });
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
enableTableSorting();
loadSeason();

function navigateProfile() {
  if (['#profil','#connexion'].includes(location.hash)) { state.view = location.hash === '#profil' ? 'profile' : 'login'; render(); window.scrollTo({top:0,behavior:'instant'}); }
  else if (['profile','login'].includes(state.view)) { state.view = 'races'; render(); }
}
window.addEventListener('hashchange', navigateProfile);
navigateProfile();

function paintAccountStatus(){
  const data=account.getState(),root=$('#cloud-status');
  root.hidden=!(data.error || data.saving || data.user && !data.ready);
  root.innerHTML=data.error?`${escapeHTML(data.error)} <button id="retry-account">Réessayer la synchronisation</button>`:data.saving?'Enregistrement dans ton compte…':data.user && !data.ready?'Chargement de ton compte…':'';
  $('#retry-account')?.addEventListener('click',()=>account.retry());
}
let lastLayouts='';
account.subscribe((data,reason)=>{
  collection=data.collection;
  if(reason==='auth'){pendingCollection.clear();}
  paintAccountStatus();
  const layoutSignature=JSON.stringify(data.profile.layouts || {}),layoutChanged=layoutSignature!==lastLayouts;lastLayouts=layoutSignature;
  if(reason==='status')return;
  if(state.view==='login' && data.user){location.hash='profil';navigateProfile();return;}
  if(['profile','login'].includes(state.view) && profile.isEditing())return;
  if(reason==='auth' || reason==='collection' || layoutChanged || ['profile','login'].includes(state.view))render();
});
account.start();

const navToggle=document.querySelector('#nav-toggle'),navigation=document.querySelector('#tabs');
function closeNavigation(){document.body.classList.remove('navigation-open');navToggle.setAttribute('aria-expanded','false');}
navToggle.addEventListener('click',()=>{const open=!document.body.classList.contains('navigation-open');document.body.classList.toggle('navigation-open',open);navToggle.setAttribute('aria-expanded',String(open));});
navigation.addEventListener('click',event=>{if(event.target.closest('button'))closeNavigation();});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && document.body.classList.contains('navigation-open')){closeNavigation();navToggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('#tabs,#nav-toggle'))closeNavigation();});
window.matchMedia('(min-width:1101px)').addEventListener('change',closeNavigation);
