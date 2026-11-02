import { teamLogo } from './branding.js?v=23';
import { renderFlag } from './flags.js?v=12';
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const number=value=>Number(value||0).toLocaleString('fr-FR',{maximumFractionDigits:1});
export function createTeams({ $, escapeHTML, dialog, state, load, onSeason }) {
  let generation=0;
  async function open(id,name,year) {
    const token=++generation;state.detailGeneration++;
    $('#race-detail').innerHTML='<p class="empty">Chargement de la fiche constructeur…</p>';
    if(!dialog.open)dialog.showModal();
    try {
      const snapshot=await load();if(token!==generation||!dialog.open)return;
      const aliases={alfa:'alfa-romeo',lotus_f1:'lotus-f1',racing_point:'racing-point',force_india:'force-india',toro_rosso:'toro-rosso',bmw_sauber:'bmw-sauber',red_bull:'red-bull',aston_martin:'aston-martin'};
      let key=aliases[id]||String(id||'').replaceAll('_','-');
      if(id==='rb' && Number(year)>=2025)key='racing-bulls';
      if(id==='sauber' && Number(year)>=2024 && Number(year)<=2025)key='kick-sauber';
      const records=snapshot.teams||[];
      const team=records.find(row=>row.id===key)||records.find(row=>normalize(row.name)===normalize(name));
      if(!team){$('#race-detail').innerHTML='<h2 id="race-title">Constructeur non identifiée</h2><p>La fiche de cette constructeur n’est pas disponible dans les archives.</p>';return;}
      const seasons=[...team.seasons].sort((a,b)=>b.year-a.year);
      const drivers=[...team.drivers].sort((a,b)=>b.wins-a.wins||b.races-a.races||a.name.localeCompare(b.name));
      $('#race-detail').innerHTML=`<section class="team-profile"><p class="eyebrow">FICHE ÉCURIE · ARCHIVES DU CHAMPIONNAT</p><div class="team-profile-heading">${teamLogo(team)}<div><h2 id="race-title">${escapeHTML(team.name)}</h2><p>${renderFlag(team.countryCode,team.country)} ${escapeHTML(team.country)} · ${team.firstYear}–${team.lastYear}</p></div></div><label class="team-directory-label">Explorer une autre constructeur<select id="team-profile-select">${[...records].sort((a,b)=>a.name.localeCompare(b.name)).map(row=>`<option value="${escapeHTML(row.id)}" ${row.id===team.id?'selected':''}>${escapeHTML(row.name)} · ${row.firstYear}–${row.lastYear}</option>`).join('')}</select></label><div class="profile-metrics">${[['totalChampionshipWins','Titres constructeurs'],['totalRaceStarts','Grands Prix démarrés'],['totalRaceWins','Victoires'],['totalPodiums','Podiums'],['totalPolePositions','Pole positions'],['totalFastestLaps','Meilleurs tours']].map(([key,label])=>`<div class="profile-stat"><small>${label}</small><strong>${number(team[key])}</strong></div>`).join('')}</div><p class="statistics-source">Statistiques sous le nom « ${escapeHTML(team.name)} ». Les résultats des anciennes ou nouvelles identités de l’constructeur sont consultables dans leurs fiches respectives. Le championnat constructeurs existe depuis 1958. Première saison F1 : ${team.firstYear} ; cette date ne désigne pas la fondation de l’équipe.</p><h3>Saison après saison</h3><div class="table-wrap"><table><thead><tr><th>Saison</th><th>Classement</th><th>Grands Prix</th><th>Victoires</th><th>Podiums</th><th>Poles</th><th>Points</th></tr></thead><tbody>${seasons.map(row=>`<tr><td><button class="season-record-link" data-team-season="${row.year}">${row.year}</button></td><td>${row.position||'—'}${row.year===new Date().getFullYear()?' · en cours':''}</td><td>${number(row.totalRaceStarts)}</td><td>${number(row.totalRaceWins)}</td><td>${number(row.totalPodiums)}</td><td>${number(row.totalPolePositions)}</td><td>${number(row.totalPoints)}</td></tr>`).join('')}</tbody></table></div><h3>Les pilotes de l’constructeur</h3><div class="table-wrap"><table><thead><tr><th>Pilote</th><th>Grands Prix avec cette constructeur</th><th>Victoires</th></tr></thead><tbody>${drivers.map(driver=>`<tr><td><button class="driver-link" data-driver-id="${escapeHTML(driver.id)}">${teamLogo(team)}${escapeHTML(driver.name)}</button></td><td>${number(driver.races)}</td><td>${number(driver.wins)}</td></tr>`).join('')}</tbody></table></div><p class="statistics-source">Données F1DB ${escapeHTML(snapshot.version)} au ${new Date(snapshot.through+'T12:00:00Z').toLocaleDateString('fr-FR')} · CC BY 4.0. Les barèmes de points ont changé selon les époques.</p></section>`;
      $('#team-profile-select').addEventListener('change',event=>open(event.target.value));
    } catch(error) {if(token===generation)$('#race-detail').innerHTML=`<h2 id="race-title">Fiche constructeur indisponible</h2><p>${escapeHTML(error.message)}</p><button id="retry-team">Réessayer</button>`;$('#retry-team')?.addEventListener('click',()=>open(id,name));}
  }
  document.addEventListener('click',event=>{const target=event.target.closest('[data-team-id]');if(target && target.dataset.teamId)open(target.dataset.teamId,target.dataset.teamName,target.dataset.teamYear);});
  $('#race-detail').addEventListener('click',event=>{const button=event.target.closest('[data-team-season]');if(button && onSeason){dialog.close();onSeason(Number(button.dataset.teamSeason));}});
  dialog.addEventListener('close',()=>generation++);
  return {open};
}
