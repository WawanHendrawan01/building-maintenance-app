(function () {
    'use strict';
    const STATUSES = ['Planning','Waiting Approval','Waiting Budget','Waiting Material','Waiting Vendor','Ready to Start','In Progress','On Hold','Testing / Commissioning','Completed','Cancelled'];
    const TYPES = ['Repair','Renovation','Replacement','Improvement','Preventive Improvement','Energy Saving','CAPEX','Compliance','Safety','Operational Improvement','Vendor Work','Other'];
    const PRIORITIES = ['Low','Normal','High','Urgent','Critical'];
    const AREAS = ['Guest Room','Corridor','Lobby','Public Area','Restaurant','Kitchen','Dishwasher Area','Back Office','Engineering Office','Pump Room','Chiller Area','Rooftop','LVMDP','Genset Room','Transformer Room','STP','Swimming Pool','Water Heater Area','Lift','Lift Machine Room','Basement','Parking Area','Exterior','Landscape','Server / IT Room','Utility Area','Other'];
    const state = { records:[], active:null, unsubscribe:null, generation:0, ready:false };
    const el = id => document.getElementById(id);
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    const day = s => Date.parse(`${s}T00:00:00Z`);
    const remaining = p => p.target_date ? Math.round((day(p.target_date)-day(today()))/86400000) : null;
    const closed = p => ['Completed','Cancelled'].includes(p.status);
    const overdue = p => !closed(p) && remaining(p) !== null && remaining(p) < 0;
    const money = v => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(v)||0);
    const date = v => v?.toDate ? v.toDate().toLocaleString('id-ID') : v || '—';
    const actor = () => { const u = window.firebaseAuth?.currentUser; if (!u) throw new Error('Silakan login dengan Firebase terlebih dahulu.'); return u.uid; };
    const api = () => ({db:window.firebaseDB, doc:window.firestoreDoc, collection:window.firestoreCollection, getDoc:window.firestoreGetDoc, getDocs:window.firestoreGetDocs, transaction:window.firestoreRunTransaction, stamp:window.firestoreServerTimestamp});
    const options = (arr,v='') => arr.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
    const lists = {status:STATUSES,project_type:TYPES,priority:PRIORITIES,area:AREAS};
    const label = key => key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
    const textareas = new Set(['project_description','expected_benefit','remark','current_progress_result','issue_or_constraint','next_action','actual_benefit','final_result','completion_remark']);
    const numeric = new Set(['budget','actual_cost','progress_percentage']);
    function field(key,value='',filter=false) {
        const id = `${filter?'spf':'spe'}-${key}`;
        const type = key.includes('date') ? 'date' : numeric.has(key)||key.startsWith('progress_')&&filter ? 'number' : 'text';
        const attrs = `id="${id}" name="${key}" ${!filter&&['project_name','created_date','pic','area','target_date'].includes(key)?'required':''}`;
        let input = lists[key] ? `<select ${attrs}>${filter?'<option value="">All</option>':''}${options(lists[key],value)}</select>` : textareas.has(key)&&!filter ? `<textarea ${attrs} rows="3">${esc(value)}</textarea>` : `<input ${attrs} type="${type}" value="${esc(Array.isArray(value)?value.join(', '):value)}" ${type==='number'?`min="0" step="${key.includes('progress')?'1':'0.01'}" ${key.includes('progress')?'max="100"':''}`:''}>`;
        return `<div class="sp-field"><label for="${id}">${esc(label(key))}${!filter&&['project_name','created_date','pic','area','target_date'].includes(key)?' *':''}</label>${input}</div>`;
    }
    function message(s,error=false) { el('sp-message').className=error?'sp-error':'sp-message'; el('sp-message').textContent=s; }
    function view(name) { ['list','form','detail'].forEach(x=>el(`sp-${x}`).hidden=x!==name); message(''); if(name!=='detail') {state.active=null; state.generation++;} }
    const filterKeys = ['keyword','project_number','project_name','area','location','project_type','category','status','priority','pic','vendor','created_date_from','created_date_to','start_date_from','start_date_to','target_date_from','target_date_to','progress_min','progress_max'];
    function matches(p,f) {
        if(f.keyword&&!['project_number','project_name','location','vendor','pic','project_description'].some(k=>String(p[k]||'').toLowerCase().includes(f.keyword.toLowerCase()))) return false;
        for(const k of ['project_number','project_name','area','location','project_type','category','status','priority','pic','vendor']) if(f[k] && (lists[k]?p[k]!==f[k]:!String(p[k]||'').toLowerCase().includes(f[k].toLowerCase()))) return false;
        for(const k of ['created_date','start_date','target_date']) if((f[k+'_from']&&(!p[k]||p[k]<f[k+'_from']))||(f[k+'_to']&&(!p[k]||p[k]>f[k+'_to']))) return false;
        return !(f.progress_min!==''&&f.progress_min!=null&&p.progress_percentage<Number(f.progress_min)) && !(f.progress_max!==''&&f.progress_max!=null&&p.progress_percentage>Number(f.progress_max)) && (!f.overdue||overdue(p)) && (!f.completed||p.status==='Completed');
    }
    const progress = p => `<progress max="100" value="${Number(p.progress_percentage)||0}" aria-label="Project progress"></progress> ${Number(p.progress_percentage)||0}%`;
    const badge = p => `<span class="sp-badge">${esc(p.status)}</span>${overdue(p)?` <span class="sp-badge sp-late">OVERDUE — ${-remaining(p)} Days</span>`:''}`;
    function renderList() {
        const f=Object.fromEntries(filterKeys.map(k=>[k,el('spf-'+k).value.trim()])); f.overdue=el('spf-overdue').checked; f.completed=el('spf-completed').checked;
        const r=state.records;
        const cards=[['Total Projects',r.length],['Active Projects',r.filter(p=>!closed(p)).length],...['Planning','Waiting Material','In Progress','On Hold'].map(s=>[s,r.filter(p=>p.status===s).length]),['Overdue',r.filter(overdue).length],['Completed',r.filter(p=>p.status==='Completed').length],['Total Budget',money(r.reduce((s,p)=>s+Number(p.budget||0),0))],['Actual Cost',money(r.reduce((s,p)=>s+Number(p.actual_cost||0),0))]];
        el('sp-summary').innerHTML=cards.map(([k,v])=>`<div class="sp-summary-card">${k}<strong>${v}</strong></div>`).join('');
        el('sp-rows').innerHTML=r.filter(p=>matches(p,f)).map(p=>`<tr><td><strong>${esc(p.project_number)}</strong></td>${['created_date','project_name','area','location','pic','vendor','start_date','target_date'].map(k=>`<td>${esc(p[k]||'—')}</td>`).join('')}<td>${badge(p)}</td><td>${progress(p)}</td><td>${overdue(p)?-remaining(p)+' days':'—'}</td><td>${money(p.budget)}</td><td>${esc(date(p.updated_at))}</td><td><button type="button" data-view="${esc(p.project_number)}">View</button></td></tr>`).join('')||'<tr><td colspan="15">No projects found.</td></tr>';
    }
    const sections = {
        'Project information':['created_date','project_name','project_title','project_description','project_type','category','priority'],
        'Location':['area','location','floor','asset_or_system'],
        'Responsibility':['requested_by','pic','team_members','vendor'],
        'Schedule':['start_date','target_date'],
        'Financial':['budget','actual_cost'],
        'Purpose':['expected_benefit','remark'],
        'Linked documents':['linked_pr_numbers']
    };
    const tracking = ['status','progress_percentage','progress_date','current_progress_result','issue_or_constraint','next_action'];
    const completion = ['actual_completion_date','actual_benefit','final_result','completion_remark'];
    function showForm(p=null) {
        view('form');
        const defaults=p||{created_date:today(),priority:'Normal',project_type:'Repair',area:'Guest Room',requested_by:window.firebaseAuth?.currentUser?.email||'',budget:0,actual_cost:0};
        el('sp-form').innerHTML=`<div class="sp-header"><div><h1>${p?'Update':'Create'} Special Project</h1><p>${p?esc(p.project_number):'Project Number: SP-YYYY-XXXX • assigned when saved • Planning / 0%'}</p></div><button type="button" data-back>Back</button></div><form id="sp-editor" class="sp-panel">${Object.entries(sections).map(([title,keys])=>`<h2>${title}</h2><div class="sp-grid">${keys.map(k=>field(k,defaults[k]??'')).join('')}</div>`).join('')}${p?`<h2>Progress & status update</h2><p>Setiap penyimpanan menambahkan histori. 100% tidak otomatis Completed.</p><div class="sp-grid">${tracking.map(k=>field(k,k==='progress_date'?today():p[k]??'')).join('')}</div><h2>Completion</h2><p>Completed menyimpan progress 100%. Isi tanggal penyelesaian dan hasil akhir.</p><div class="sp-grid">${completion.map(k=>field(k,p[k]??'')).join('')}</div>`:''}<p>Team members dan linked PR numbers: pisahkan dengan koma. Nomor PR diverifikasi saat disimpan.</p><p>Attachments: upload belum tersedia pada V1. Project dapat digunakan sepenuhnya tanpa file.</p><button class="btn btn-primary" type="submit">${p?'Save update':'Save project'}</button></form>`;
        el('sp-editor').addEventListener('submit',e=>save(e,p));
    }
    function collect(form,p) {
        const data=Object.fromEntries(new FormData(form));
        for(const k of ['budget','actual_cost',...(p?['progress_percentage']:[])]) { data[k]=Number(data[k]); if(!Number.isFinite(data[k])||data[k]<0||(k==='progress_percentage'&&data[k]>100)) throw new Error('Budget/cost harus positif dan progress antara 0–100.'); }
        for(const k of ['team_members','linked_pr_numbers']) data[k]=[...new Set(data[k].split(',').map(s=>s.trim()).filter(Boolean))];
        for(const k of ['project_name','pic','area','created_date','target_date']) if(!data[k]?.trim()) throw new Error(`${label(k)} wajib diisi.`);
        if(data.start_date&&data.target_date<data.start_date) throw new Error('Target date tidak boleh sebelum start date.');
        if(p && (!STATUSES.includes(data.status)||!data.progress_date||!data.current_progress_result.trim())) throw new Error('Isi status, progress date dan progress result.');
        if(data.status==='Completed') { data.progress_percentage=100; if(!data.actual_completion_date||!data.final_result.trim()) throw new Error('Completed memerlukan actual completion date dan final result.'); if(data.start_date&&data.actual_completion_date<data.start_date) throw new Error('Completion date tidak boleh sebelum start date.'); }
        if(data.status!=='Completed') data.actual_completion_date='';
        return data;
    }
    async function save(e,p) {
        e.preventDefault(); const button=e.submitter; button.disabled=true;
        try {
            const uid=actor(), a=api(), data=collect(e.target,p), year=new Date().getFullYear();
            const progressDate=data.progress_date; delete data.progress_date;
            const counter=a.doc(a.db,'special_project_counters',String(year));
            let saved;
            await a.transaction(a.db,async tx=>{
                let ref, old=null, seq;
                if(p) { ref=a.doc(a.db,'special_projects',p.project_number); const snap=await tx.get(ref); if(!snap.exists()) throw new Error('Project tidak ditemukan.'); old=snap.data(); if((old.revision||0)!==(p.revision||0)) throw new Error('Project diperbarui pengguna lain. Buka ulang detail sebelum menyimpan.'); }
                else { const c=await tx.get(counter); seq=(c.exists()?c.data().last_number:0)+1; if(!Number.isSafeInteger(seq)||seq<1) throw new Error('Counter tidak valid.'); saved=`SP-${year}-${String(seq).padStart(4,'0')}`; ref=a.doc(a.db,'special_projects',saved); if((await tx.get(ref)).exists()) throw new Error('Nomor sudah ada. Administrator perlu memeriksa counter.'); }
                for(const number of data.linked_pr_numbers) { if(number.includes('/')) throw new Error('Nomor PR tidak valid.'); if(!(await tx.get(a.doc(a.db,'purchase_requests',number))).exists()) throw new Error(`PR ${number} tidak ditemukan.`); }
                const stamp=a.stamp();
                const patch={...data,updated_at:stamp,updated_by:uid,revision:(old?.revision||0)+1};
                if(!p) { Object.assign(patch,{project_id:saved,project_number:saved,status:'Planning',progress_percentage:0,current_progress_result:'',issue_or_constraint:'',next_action:'',actual_benefit:'',final_result:'',completion_remark:'',created_by:uid,created_at:stamp,attachments:[]}); tx.set(counter,{last_number:seq}); tx.set(ref,patch); }
                else { saved=p.project_number; tx.update(ref,patch); tx.set(a.doc(a.collection(ref,'progress_history')),{progress_percentage:patch.progress_percentage,progress_date:progressDate,progress_result:patch.current_progress_result,issue_or_constraint:patch.issue_or_constraint,next_action:patch.next_action,updated_by:uid,timestamp:stamp}); }
                if(!old||old.status!==patch.status) tx.set(a.doc(a.collection(ref,'status_history')),{old_status:old?.status||null,new_status:patch.status,updated_by:uid,timestamp:stamp,remark:patch.completion_remark||patch.remark||''});
                tx.set(a.doc(a.collection(ref,'general_history')),{action:p?'Project updated':'Project created',changes:Object.fromEntries(Object.keys(data).filter(k=>JSON.stringify(old?.[k])!==JSON.stringify(patch[k])).map(k=>[k,{before:old?.[k]??null,after:patch[k]}])),updated_by:uid,timestamp:stamp});
            });
            await showDetail(saved); message('Project berhasil disimpan.');
        } catch(error) { message(error.message,true); } finally { button.disabled=false; }
    }
    function kv(keys,p) { return `<dl class="sp-grid">${keys.map(k=>`<div><dt>${label(k)}</dt><dd>${esc(Array.isArray(p[k])?p[k].join(', '):numeric.has(k)?(k==='progress_percentage'?p[k]+'%':money(p[k])):date(p[k]))}</dd></div>`).join('')}</dl>`; }
    async function showDetail(number) {
        view('detail'); state.active=number; const token=++state.generation; el('sp-detail').innerHTML='<p>Loading project…</p>';
        try {
            actor(); const a=api(), ref=a.doc(a.db,'special_projects',number); const snap=await a.getDoc(ref);
            if(token!==state.generation)return; if(!snap.exists()) throw new Error('Project tidak ditemukan.'); const p=snap.data();
            el('sp-detail').innerHTML=`<div class="sp-header"><div><h1>${esc(p.project_name)}</h1><p>${esc(number)}</p>${badge(p)}<p>${progress(p)}</p></div><div><button data-back>Back</button> <button id="sp-edit">Update project / progress</button></div></div>${Object.entries(sections).map(([title,keys])=>`<section class="sp-panel"><h2>${title}</h2>${kv(keys,p)}</section>`).join('')}<section class="sp-panel"><h2>Current condition & outcome</h2>${kv([...tracking.filter(k=>k!=='progress_date'),...completion,'created_by','created_at','updated_at'],p)}<p>${remaining(p)===null?'No target date':closed(p)?'Project '+esc(p.status):remaining(p)<0?-remaining(p)+' days overdue':remaining(p)+' days remaining'}</p><p>Variance: <strong>${money(p.budget-p.actual_cost)}</strong> ${p.actual_cost>p.budget?'<span class="sp-badge sp-late">Over Budget</span>':''}</p></section><section class="sp-panel"><h2>Attachments</h2><p>Upload ditunda; metadata attachments disiapkan. Tidak membutuhkan Firebase Storage.</p></section><section class="sp-panel"><h2>History</h2><div id="sp-history">Loading history…</div></section>`;
            el('sp-edit').onclick=()=>showForm(p);
            const histories=await Promise.allSettled(['progress_history','status_history','general_history'].map(async name=>({name,snapshot:await a.getDocs(a.collection(ref,name))})));
            if(token!==state.generation)return;
            el('sp-history').innerHTML=histories.map((result,i)=>{
                const name=['Progress history','Status history','Update history'][i]; if(result.status==='rejected') return `<h3>${name}</h3><p class="sp-error">${esc(result.reason.message)}</p>`;
                const entries=result.value.snapshot.docs.map(d=>d.data()).sort((x,y)=>(y.timestamp?.toMillis?.()||0)-(x.timestamp?.toMillis?.()||0));
                return `<h3>${name}</h3><ol class="sp-timeline">${entries.map(h=>`<li><strong>${esc(date(h.timestamp))} · ${esc(h.updated_by)}</strong>${i===0?`<p>${esc(h.progress_date)} — ${h.progress_percentage}%</p><p>${esc(h.progress_result)}</p><p>Issue: ${esc(h.issue_or_constraint)}</p><p>Next: ${esc(h.next_action)}</p>`:i===1?`<p>${esc(h.old_status||'Created')} → ${esc(h.new_status)}</p><p>${esc(h.remark)}</p>`:`<p>${esc(h.action)}</p><details><summary>Changes</summary>${Object.entries(h.changes||{}).map(([k,v])=>`<p>${esc(label(k))}: ${esc(Array.isArray(v.before)?v.before.join(', '):v.before)} → ${esc(Array.isArray(v.after)?v.after.join(', '):v.after)}</p>`).join('')}</details>`}</li>`).join('')||'<li>No history yet.</li>'}</ol>`;
            }).join('');
        } catch(error) { if(token===state.generation) {el('sp-detail').innerHTML='<button data-back>Back</button>';message(error.message,true);} }
    }
    function connect() {
        state.unsubscribe?.(); state.unsubscribe=null; state.ready=false; state.records=[]; state.generation++; view('list'); renderList(); el('sp-create').disabled=true;
        if(!window.firebaseAuth?.currentUser) return message('Silakan login untuk mengakses Special Project.',true);
        message('Loading projects…');
        state.unsubscribe=window.firestoreOnSnapshot(window.firestoreCollection(window.firebaseDB,'special_projects'),s=>{state.records=s.docs.map(d=>d.data()).sort((a,b)=>b.project_number.localeCompare(a.project_number));state.ready=true;el('sp-create').disabled=false;renderList();message('');},error=>message(`Firestore: ${error.message}. Periksa rules Special Project.`,true));
    }
    function init() {
        if(!el('sp-app'))return;
        el('sp-app').innerHTML=`<div id="sp-message" role="status" aria-live="polite"></div><div id="sp-list"><div class="sp-header"><div><h1>Special Project</h1><p>Engineering project tracking & documentation</p></div><button id="sp-create" class="btn btn-primary" disabled>+ Create Project</button></div><div id="sp-summary"></div><div class="sp-panel"><details><summary>Search & filters</summary><form id="sp-filters"><div class="sp-grid">${filterKeys.map(k=>field(k,'',true)).join('')}</div><div class="sp-actions"><label><input type="checkbox" id="spf-overdue"> Overdue only</label><label><input type="checkbox" id="spf-completed"> Completed only</label><button type="reset">Reset filters</button></div></form></details><div class="sp-table-wrap"><table><thead><tr>${['Project Number','Created Date','Project Name','Area','Location','PIC','Vendor','Start Date','Target Date','Status','Progress','Overdue','Budget','Last Update','Action'].map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody id="sp-rows"></tbody></table></div></div></div><div id="sp-form" hidden></div><div id="sp-detail" hidden></div>`;
        el('sp-create').onclick=()=>showForm(); el('sp-filters').oninput=renderList; el('sp-filters').onsubmit=e=>e.preventDefault(); el('sp-filters').onreset=()=>setTimeout(renderList,0);
        el('sp-app').addEventListener('click',e=>{const b=e.target.closest('button'); if(b?.hasAttribute('data-back'))view('list');if(b?.dataset.view)showDetail(b.dataset.view);});
        window.addEventListener('firebaseReady',connect); if(window.firebaseAuth?.currentUser)connect();else {renderList();message('Menunggu autentikasi Firebase…');}
        setInterval(()=>{if(!el('sp-list').hidden)renderList();},60000);
    }
    init();
})();
