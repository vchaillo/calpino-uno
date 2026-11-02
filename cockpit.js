import { createSeasonDisplay } from './season-display.js?v=7';

const ICON_LEFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7"/></svg>';
const ICON_RIGHT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7"/></svg>';
const MODELS = [{ id: 'industrial', name: 'Aux commandes de la saison', label: 'CALPINO UNO / ARCHIVE CONTROL', eyebrow: 'DRIVER’S VIEW · DESIGN STUDY' }];
function wheelDrawing() {
  const fasteners = [[286,181],[714,181],[282,280],[718,280],[379,199],[621,199],[382,286],[618,286]].map(([x,y])=>`<g class="fastener"><circle cx="${x}" cy="${y}" r="3"/><path d="M${x-1.5} ${y}h3M${x} ${y-1.5}v3"/></g>`).join('');
  const controls = [[345,214,'N','#ffd45b'],[345,247,'RADIO','#66cbd9'],[655,214,'PIT','#ff3b35'],[655,247,'MARK','#9fc671']].map(([x,y,label,color])=>`<circle cx="${x}" cy="${y}" r="11" fill="#19191f" stroke="${color}"/><circle cx="${x}" cy="${y}" r="6" fill="${color}" fill-opacity=".18"/><text x="${x}" y="${y+22}" text-anchor="middle" class="control-label">${label}</text>`).join('');
  const dials = [[345,295,'MODE'],[655,295,'BIAS'],[415,320,'ENTRY'],[500,325,'ARCHIVE'],[585,320,'EXIT']].map(([x,y,label],index)=>`<g class="rotary-dial" style="--dial-delay:${index*35}ms;transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="16"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<path d="M${x+Math.sin(a)*20} ${y-Math.cos(a)*20}l${Math.sin(a)*3} ${-Math.cos(a)*3}"/>`;}).join('')}<path class="dial-indicator" d="M${x} ${y-12}v8"/><circle cx="${x}" cy="${y}" r="3"/></g><text x="${x}" y="${y+32}" text-anchor="middle" class="control-label">${label}</text>`).join('');
  const lights = Array.from({length:15},(_,i)=>`<rect class="shift-light" style="--light-delay:${i*25}ms;fill:${i<5?'#9fc671':i<10?'#ffd45b':'#ff3b35'}" x="${414+i*12}" y="170" width="7" height="5" fill="${i<5?'#9fc671':i<10?'#ffd45b':'#ff3b35'}"/>`).join('');
  const gripLines = Array.from({length:9},(_,i)=>`<path d="M${284-i*.4} ${198+i*9}l16 4M${716+i*.4} ${198+i*9}l-16 4"/>`).join('');
  return `<svg class="cockpit-drawing industrial-drawing" viewBox="0 0 1000 420" fill="none" aria-hidden="true">
  <defs><pattern id="carbon-study" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0l8 8M-4 4l8 8M4-4l8 8" stroke="#ffffff" stroke-opacity=".025"/></pattern></defs>
  <g class="construction-lines"><path d="M500 6v150M500 355v59M90 238h154m512 0h154M160 118h680M190 389h620" stroke-dasharray="3 8"/><ellipse cx="500" cy="236" rx="270" ry="148" stroke-dasharray="2 12"/><path d="M120 398h120M880 398H760M158 398v-25M842 398v-25"/></g>
  <path class="cockpit-shell" d="M22 410 111 179Q136 94 233 53Q500-35 767 53Q864 94 889 179L978 410M44 410 133 184Q157 115 241 78M956 410 867 184Q843 115 759 78"/>
  <path class="halo-outline" d="M141 160Q148 80 239 48Q500-17 761 48Q852 80 859 160L842 155Q820 89 749 73Q500 10 251 73Q180 89 158 155Z"/>
  <path class="halo-spine" d="M490 24 481 137Q500 155 519 137L510 24Z"/><path class="halo-highlight" d="M494 30 490 126M145 140Q159 72 242 48"/>
  <path class="cockpit-edge" d="M64 389 160 177 253 192M936 389 840 177 747 192"/>
  <g class="shell-details"><path d="M80 389 171 197 245 209M920 389 829 197 755 209M108 358l24 8M892 358l-24 8M159 254l35 12M841 254l-35 12M204 312l54 12M796 312l-54 12"/><path d="M188 285 224 227 245 234 213 301ZM812 285 776 227 755 234 787 301Z" fill="url(#carbon-study)"/><path d="M260 356 334 370h100M740 356 666 370H566"/></g>
  <path class="paddle-outline" d="M252 182 236 203v69l18 21h25V182ZM748 182l16 21v69l-18 21h-25V182Z"/><path class="paddle-mechanism" d="M250 190v92M750 190v92M258 192h12v89h-12ZM742 192h-12v89h12Z"/>
  <path class="wheel-body" d="M323 162Q303 142 286 157L260 196Q250 231 264 278L288 318Q307 335 329 315L374 291h252l45 24Q693 335 712 318L736 278Q750 231 740 196L714 157Q697 142 677 162L627 184H373Z"/>
  <path class="carbon-face" d="M323 163 374 185H626l51-22 19 17-22 98-50 27H376l-50-27-22-98Z" fill="url(#carbon-study)"/>
  <path class="grip-detail" d="M298 169 280 207Q274 244 289 280l18 26M702 169l18 38Q726 244 711 280l-18 26"/><g class="grip-hatching">${gripLines}</g>
  <path class="wheel-top" d="M329 165 375 190H625l46-25"/><path class="face-seams" d="M368 207v72l-31 34M632 207v72l31 34M374 291 396 307h208l22-16"/>
  <rect x="388" y="181" width="224" height="114" class="screen-outline"/><rect x="399" y="192" width="202" height="91" class="screen-inner"/>
  ${lights}${controls}${dials}${fasteners}
  <path class="wheel-column" d="M461 354 450 371Q500 402 550 371l-11-17M481 371h38M500 367v25"/>
  <g class="technical-annotation"><path d="M178 146h72l26 21M822 146h-72l-26 21M120 337h89l24-42M880 337h-89l-24-42M377 111h84l22 28M623 111h-84l-22 28"/><text x="178" y="138">CARBON / MONOCOQUE</text><text x="822" y="138" text-anchor="end">HALO / DRIVER VIEW</text><text x="120" y="330">−1 / PADDLE</text><text x="880" y="330" text-anchor="end">PADDLE / +1</text><text x="386" y="104">ARCHIVE SYSTEM</text><text x="614" y="104" text-anchor="end">1950 — TODAY</text></g>
  <text class="blueprint-label" x="190" y="408">CU / INDUSTRIAL STUDY 04</text><text class="blueprint-label" x="810" y="408" text-anchor="end">SEASON NAVIGATION · NOT LIVE TELEMETRY</text>
  </svg>`;
}
export function createCockpits({ initialYear, onYearChange }) {
  const maximumYear = new Date().getFullYear();
  const root = document.querySelector('#cockpit-experiments');
  root.innerHTML = `<article class="cockpit-proposal cockpit-industrial" data-cockpit="industrial"><div id="season-summary" class="season-summary" aria-live="polite"></div><div class="cockpit-stage new-cockpit"><img class="cockpit-background" src="assets/cockpit-v2.webp" alt="Dessin industriel d’un cockpit de Formule 1, vu du pilote"><div class="native-shift-lights">${Array.from({length:15},(_,i)=>`<i style="--light-delay:${i*25}ms;--led:${i<5?'#33dcc8':i<10?'#ffd45b':'#ff3b35'}"></i>`).join('')}</div><button class="paddle paddle-left" data-step="-1" aria-label="Saison précédente">${ICON_LEFT}<span>−</span></button><button class="wheel-screen" data-year-picker aria-label="Choisir la saison ${initialYear}" aria-haspopup="dialog"><small>SAISON</small><span class="cockpit-year" aria-hidden="true">${initialYear}</span><span class="screen-hint">SÉLECTIONNER LA SAISON</span></button><button class="paddle paddle-right" data-step="1" aria-label="Saison suivante">${ICON_RIGHT}<span>+</span></button></div></article>`;
  const displays = [...root.querySelectorAll('.cockpit-year')].map((element) => createSeasonDisplay(element, initialYear));
  const picker = document.querySelector('#season-dialog');
  const choices = document.querySelector('#season-choices');
  const search = document.querySelector('#season-search');
  let year = initialYear;
  let wheelDelta = 0;
  let lastWheelChange = 0;
  const screen = root.querySelector('.wheel-screen');
  screen.addEventListener('wheel', event => {
    // Capture scrolling only over the display; elsewhere the page scrolls normally.
    if (event.ctrlKey || picker.open) return;
    event.preventDefault();
    wheelDelta += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
    if (Math.abs(wheelDelta) < 40 || performance.now() - lastWheelChange < 160) return;
    const nextYear = Math.max(1950, Math.min(maximumYear, year + (wheelDelta < 0 ? 1 : -1)));
    wheelDelta = 0; lastWheelChange = performance.now();
    if (nextYear !== year) onYearChange(nextYear);
  }, {passive:false});
  window.addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || !root.getClientRects().length || event.target.closest('input,select,textarea,button,[contenteditable],.world-map')) return;
    const nextYear=Math.max(1950,Math.min(maximumYear,year+(event.key==='ArrowRight'?1:-1)));
    if(nextYear!==year){event.preventDefault();onYearChange(nextYear);}
  });
  screen.addEventListener('mouseleave', () => { wheelDelta = 0; });
  function renderChoices() {
    const query = search.value.trim();
    choices.innerHTML = Array.from({length:maximumYear-1949},(_,index)=>maximumYear-index).filter(value=>String(value).includes(query)).map(value=>`<button type="button" data-pick-season="${value}" aria-pressed="${value === year}" class="${value === year ? 'selected-season' : ''}">${value}</button>`).join('') || '<p>Aucune saison trouvée.</p>';
  }
  function openPicker() { search.value = ''; renderChoices(); picker.showModal(); search.focus(); }
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-year-picker')) { openPicker(); return; }
    const step = Number(button.dataset.step);
    if (!step || year + step < 1950 || year + step > maximumYear) return;
    button.classList.remove('paddle-pressed');
    // A press can restart immediately after the preceding animation.
    void button.offsetWidth;
    button.classList.add('paddle-pressed');
    onYearChange(year + step);
  });
  search.addEventListener('input', renderChoices);
  choices.addEventListener('click', (event) => {
    const selected = event.target.closest('[data-pick-season]'); if (!selected) return;
    onYearChange(Number(selected.dataset.pickSeason)); picker.close();
  });
  document.querySelector('#close-season-picker').addEventListener('click', () => picker.close());
  picker.addEventListener('click', (event) => { if (event.target === picker) { const box = picker.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) picker.close(); } });
  function update(nextYear) {
    const changed = year !== nextYear;
    year = nextYear;
    if (changed) {
      root.classList.remove('season-shifting'); void root.offsetWidth; root.classList.add('season-shifting');
      root.dataset.shiftDirection = nextYear > Number(root.dataset.year || initialYear) ? 'up' : 'down';
    }
    root.dataset.year = year;
    displays.forEach(display=>display(year));
    root.querySelectorAll('[data-step]').forEach(button=>{ button.disabled = Number(button.dataset.step) < 0 ? year <= 1950 : year >= maximumYear; });
    root.querySelectorAll('[data-year-picker]').forEach(button=>button.setAttribute('aria-label', `${MODELS.find(model=>model.id === button.closest('[data-cockpit]').dataset.cockpit).name} : choisir la saison ${year}`));
  }
  update(initialYear);
  return { update };
}
