const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createClient}=require('../supabase-client.js');
function storage(){const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
function response(value,status=200){return{ok:status>=200&&status<300,status,headers:{get:()=> 'application/json'},json:async()=>value,text:async()=>JSON.stringify(value)};}
function clientFor(role,fetch){const s=storage();s.setItem('busho-auth-session-v1',JSON.stringify({access_token:'token',refresh_token:'refresh',expires_at:1800003000,user:{id:'user-1'}}));return createClient({url:'https://demo.supabase.co',publishableKey:'sb_publishable_demo_key',fetch,storage:s,now:()=>1800000000000});}

test('PHC supervisor can list stockout cases through the scoped authenticated endpoint',async()=>{
 const calls=[];const c=clientFor('supervisor',async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'user-1',role:'supervisor',status:'active'}]);if(url.includes('/rest/v1/stockout_cases?'))return response([{id:'case-1',status:'submitted_to_phc'}]);throw Error('Unexpected '+url);});
 const rows=await c.listPHCStockoutCases();assert.equal(rows[0].id,'case-1');assert.equal(calls[1].options.headers.Authorization,'Bearer token');assert.match(calls[1].url,/stockout_case_events/);
});

test('PHC supervisor cannot invoke review operations with a worker account',async()=>{
 const calls=[];const c=clientFor('worker',async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'user-1',role:'worker',status:'active'}]);throw Error('Unexpected '+url);});
 await assert.rejects(c.reviewPHCStockoutCase({id:'case-1',status:'accepted_for_phc_action'}),/not available to the worker role/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
});

test('PHC review requires reasons for clarification/non-fulfilment and cannot enter physical availability',async()=>{
 const calls=[];const c=clientFor('supervisor',async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'user-1',role:'supervisor',status:'active'}]);if(url.includes('/rest/v1/stockout_cases?id=eq.case-1'))return response([{id:'case-1',status:'under_phc_review'}]);throw Error('Unexpected '+url);});
 await assert.rejects(c.reviewPHCStockoutCase({id:'case-1',status:'clarification_requested'}),/reason is required/i);
 await assert.rejects(c.reviewPHCStockoutCase({id:'case-1',status:'phc_cannot_fulfil'}),/reason is required/i);
 await assert.rejects(c.reviewPHCStockoutCase({id:'case-1',status:'accepted_for_phc_action',availableQuantity:12}),/PHC storekeeper records PHC physical availability/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
});

test('PHC supervisor review sends only the operational decision and review note',async()=>{
 const calls=[];const c=clientFor('supervisor',async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'user-1',role:'supervisor',status:'active'}]);if(url.includes('/rest/v1/stockout_cases?id=eq.case-1'))return response([{id:'case-1',status:JSON.parse(options.body||'{}').status}]);throw Error('Unexpected '+url);});
 const result=await c.reviewPHCStockoutCase({id:'case-1',status:'accepted_for_phc_action',note:'Synthetic PHC review decision'});
 assert.equal(result.status,'accepted_for_phc_action');
 const patch=calls.find(x=>x.options.method==='PATCH');assert.deepEqual(JSON.parse(patch.options.body),{status:'accepted_for_phc_action',phc_review_note:'Synthetic PHC review decision'});
});

test('supervisor portal exposes the SHC stockout queue only after authenticated supervisor sign-in',()=>{
 const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'supervisor.html'),'utf8');const js=fs.readFileSync(path.join(root,'supervisor-stockouts.js'),'utf8');const css=fs.readFileSync(path.join(root,'styles-v2.css'),'utf8');
 assert.match(html,/data-portal-view="stockout-review"/);assert.match(html,/data-module="stockout-review"/);assert.match(html,/supervisor-stockouts\.js/);
 assert.match(js,/busho:authenticated/);assert.match(js,/busho:unauthenticated/);assert.match(js,/listPHCStockoutCases/);assert.match(js,/reviewPHCStockoutCase/);assert.match(js,/textContent/);assert.doesNotMatch(js,/availableQuantity/);assert.match(js,/PHC storekeeper/i);
 assert.match(css,/\.stockout-supervisor-case/);
});
