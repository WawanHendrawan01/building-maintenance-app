const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname,'../special-project-module.js'),'utf8');
const elements = new Map();
const get = id => { if(!elements.has(id)) elements.set(id,{value:'',checked:false,innerHTML:'',textContent:'',className:'',hidden:false});return elements.get(id); };
const docs = new Map([['purchase_requests/PR-2026-0012',{}]]);
let serial=0;
const reference=(...parts)=>parts.map(p=>p?.path||p).join('/');
const context={console,Intl,Date,Number,String,Set,Map,JSON,Promise,Object,Array,Error,setTimeout,FormData:class{constructor(data){return Object.entries(data)[Symbol.iterator]();}},document:{getElementById:get},window:{firebaseAuth:{currentUser:{uid:'tester'}}}};
const w=context.window;
w.firebaseDB='db';
w.firestoreDoc=(...args)=>({path:args.length===1?reference(args[0],`history-${++serial}`):reference(...args.filter(x=>x!=='db'))});
w.firestoreCollection=(...args)=>({path:reference(...args.filter(x=>x!=='db'))});
w.firestoreServerTimestamp=()=>({toMillis:()=>Date.now(),toDate:()=>new Date()});
w.firestoreGetDoc=async ref=>({exists:()=>docs.has(ref.path),data:()=>docs.get(ref.path)});
w.firestoreGetDocs=async ref=>({docs:[...docs].filter(([p])=>p.startsWith(ref.path+'/')).map(([,v])=>({data:()=>v}))});
w.firestoreRunTransaction=async(db,fn)=>{const pending=[];await fn({get:w.firestoreGetDoc,set:(r,d)=>pending.push([r.path,d]),update:(r,d)=>pending.push([r.path,{...docs.get(r.path),...d}])});for(const [p,d] of pending)docs.set(p,d);};
vm.createContext(context);
vm.runInContext(source.replace('    init();','    window.test = {matches,overdue,remaining,collect,save,today};'),context);
const t=w.test;
const base={project_number:'SP-2026-0001',project_name:'Chiller improvement',area:'Chiller Area',location:'Roof',project_type:'Improvement',category:'HVAC',status:'In Progress',priority:'High',pic:'Wawan',vendor:'Vendor A',created_date:'2026-01-02',start_date:'2026-01-03',target_date:'2026-01-10',progress_percentage:40};
assert(t.overdue(base));assert(!t.overdue({...base,status:'Completed'}));assert(!t.overdue({...base,status:'Cancelled'}));assert(!t.overdue({...base,target_date:t.today()}));
for(const k of ['project_number','project_name','area','location','project_type','category','status','priority','pic','vendor']){assert(t.matches(base,{[k]:base[k]}),k);assert(!t.matches(base,{[k]:'missing'}),k);}
assert(t.matches(base,{keyword:'CHILLER',progress_min:'40',progress_max:'40'}));assert(!t.matches(base,{progress_min:'41'}));assert(!t.matches(base,{progress_max:'39'}));assert(!t.matches(base,{completed:true}));assert(t.matches(base,{overdue:true}));
for(const k of ['created_date','start_date','target_date']){assert(t.matches(base,{[k+'_from']:base[k],[k+'_to']:base[k]}));assert(!t.matches(base,{[k+'_from']:'2027-01-01'}));assert(!t.matches(base,{[k+'_to']:'2025-01-01'}));}
const form={...base,budget:'1000',actual_cost:'1200',team_members:'A, B, A',linked_pr_numbers:'PR-2026-0012',current_progress_result:'Material arrived',progress_date:t.today(),issue_or_constraint:'Night work',next_action:'Install',actual_completion_date:t.today(),final_result:'Test passed',remark:'',completion_remark:''};
assert.throws(()=>t.collect({...form,progress_percentage:101},base));assert.throws(()=>t.collect({...form,progress_percentage:-1},base));assert.throws(()=>t.collect({...form,budget:-1},base));assert.throws(()=>t.collect({...form,target_date:'2025-01-01'},base));
assert.equal(t.collect({...form,status:'Completed'},base).progress_percentage,100);assert.equal(t.collect({...form,progress_percentage:100},base).status,'In Progress');
async function save(data,p){await t.save({preventDefault(){},submitter:{disabled:false},target:data},p);}
(async()=>{
 await save(form,null);
 const number=[...docs.keys()].find(x=>/^special_projects\/SP-/.test(x)&&x.split('/').length===2);
 assert(number,'created project');let p=docs.get(number);assert.equal(p.progress_percentage,0);assert.equal(p.status,'Planning');assert.equal(p.created_by,'tester');assert.equal(p.budget-p.actual_cost,-200);
 await save(form,p);p=docs.get(number);assert.equal(p.progress_percentage,40);assert.equal(p.status,'In Progress');
 await save({...form,status:'Completed'},p);p=docs.get(number);assert.equal(p.progress_percentage,100);assert.equal(p.status,'Completed');assert.equal(p.final_result,'Test passed');
 assert.equal([...docs.keys()].filter(k=>k.startsWith(number+'/progress_history/')).length,2);
 assert.equal([...docs.keys()].filter(k=>k.startsWith(number+'/status_history/')).length,3);
 assert.equal([...docs.keys()].filter(k=>k.startsWith(number+'/general_history/')).length,3);
 const before=docs.size;await save(form,{...p,revision:1});assert.equal(docs.size,before,'stale edit rejected atomically');
 await save({...form,linked_pr_numbers:'MISSING'},null);assert.equal(docs.size,before,'missing PR rejected atomically');
 await save(form,null);assert(docs.has(number.replace('0001','0002')),'unique sequential number');
 w.firebaseAuth.currentUser=null;const count=docs.size;await save(form,null);assert.equal(docs.size,count,'unauthenticated rejected');
 console.log('PASS: filters, dates, overdue, validation, create/update/completion, unique numbering, append histories, PR validation, stale edit and auth guards (mock Firestore).');
})().catch(e=>{console.error(e);process.exitCode=1;});
