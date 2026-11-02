import {LAYOUTS, analyze, applyDeskVariant} from './layouts.js';
for (const variant of ['full','store']) { console.log('=== desk', variant);
for (const L0 of LAYOUTS){ const L=applyDeskVariant(L0,variant); const r=analyze(L); console.log(`#${L.id} [${L.bedType}] ${L.name.slice(0,48)} | err:${r.errors.length} ${r.errors.join(' ; ')} | warn:${r.warnings.filter(w=>!w.startsWith('Biurko nad')).join(' ; ')} | free ${(r.freeDay*100).toFixed(0)}/${(r.freeNight*100).toFixed(0)} | pass d/n ${r.passDay}/${r.passNight} | docs ${r.docs} | ${r.outlets.filter(o=>o.status!=='dostępne').map(o=>o.id).join(',')}`); }
}
