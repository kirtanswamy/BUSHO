const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createClient}=require('../supabase-client.js');
function storage(){const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}
function response(value,status=200){return{ok:status>=200&&status<300,status,headers:{get:()=> 'application/json'},json:async()=>value,text:async()=>JSON.stringify(value)};}
function clientFor(fetch){const s=storage();s.setItem('busho-auth-session-v1',JSON.stringify({access_token:'token',refresh_token:'refresh',expires_at:1800003000,user:{id:'storekeeper-1'}}));return createClient({url:'https://demo.supabase.co',publishableKey:'sb_publishable_demo_key',fetch,storage:s,now:()=>1800000000000});}
function fakeFetch(calls,role='storekeeper'){return async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'storekeeper-1',role,status:'active'}]);if(url.includes('/rest/v1/stockout_cases?id=eq.case-1'))return response([{id:'case-1',status:JSON.parse(options.body||'{}').status}]);if(url.includes('/rest/v1/stockout_cases?'))return response([{id:'case-1',status:'phc_cannot_fulfil'}]);throw Error('Unexpected '+url);};}

test('PHC storekeeper can list assigned stockout cases through authenticated RLS endpoint',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));const rows=await c.listPHCStorekeeperStockoutCases();assert.equal(rows[0].id,'case-1');assert.match(calls[1].url,/stockout_case_events/);assert.equal(calls[1].options.headers.Authorization,'Bearer token');
});

test('non-storekeeper cannot access storekeeper stockout listing or action',async()=>{
 const calls=[],c=clientFor(async(url,options={})=>{calls.push({url,options});if(url.includes('/rest/v1/profiles?'))return response([{id:'storekeeper-1',role:'worker',status:'active'}]);throw Error('Unexpected '+url);});
 await assert.rejects(c.listPHCStorekeeperStockoutCases(),/not available to the worker role/i);
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'official_indent_submitted',officialSystemName:'DPDMIS',officialIndentReference:'DEMO-1'}),/not available to the worker role/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
});

test('PHC storekeeper records a non-negative physical availability observation after PHC accepts the case',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'accepted_for_phc_action',phcAvailableQuantity:-1,phcAvailableObservedAt:'2026-11-14T08:00:00Z'}),/non-negative PHC availability observation/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
 const result=await c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'accepted_for_phc_action',phcAvailableQuantity:0,phcAvailableObservedAt:'2026-11-14T08:00:00Z'});
 assert.equal(result.status,'accepted_for_phc_action');
 const payload=JSON.parse(calls.find(x=>x.options.method==='PATCH').options.body);
 assert.deepEqual(payload,{status:'accepted_for_phc_action',phc_available_quantity:0,phc_available_observed_at:'2026-11-14T08:00:00Z'});
});

test('PHC storekeeper records a non-negative physical availability observation after PHC accepts the case',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'accepted_for_phc_action',phcAvailableQuantity:-1,phcAvailableObservedAt:'2026-11-14T08:00:00Z'}),/non-negative PHC availability observation/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
 const result=await c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'accepted_for_phc_action',phcAvailableQuantity:0,phcAvailableObservedAt:'2026-11-14T08:00:00Z'});
 assert.equal(result.status,'accepted_for_phc_action');
 const payload=JSON.parse(calls.find(x=>x.options.method==='PATCH').options.body);
 assert.deepEqual(payload,{status:'accepted_for_phc_action',phc_available_quantity:0,phc_available_observed_at:'2026-11-14T08:00:00Z'});
});

test('official indent record requires real system, external reference and valid timestamp before write',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'official_indent_submitted',officialSystemName:'DPDMIS',officialIndentReference:''}),/external indent reference is required/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
 const result=await c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'official_indent_submitted',officialSystemName:'DPDMIS',officialIndentReference:'DEMO-DPDMIS-001',submittedAt:'2026-11-14T08:00:00Z'});
 assert.equal(result.status,'official_indent_submitted');
 const payload=JSON.parse(calls.find(x=>x.options.method==='PATCH').options.body);
 assert.deepEqual(payload,{status:'official_indent_submitted',official_system_name:'DPDMIS',official_indent_reference:'DEMO-DPDMIS-001',official_indent_submitted_at:'2026-11-14T08:00:00Z'});
});

test('PHC upstream receipt requires a receipt reference and valid date',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'upstream_supply_received_at_phc',upstreamReceiptReference:'DEMO-GRN',upstreamReceivedQuantity:0,receivedAt:'2026-11-14T08:00:00Z'}),/positive physical upstream receipt quantity/i);
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'upstream_supply_received_at_phc',upstreamReceiptReference:'',upstreamReceivedQuantity:12,receivedAt:'2026-11-14T08:00:00Z'}),/receipt reference is required/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
 const result=await c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'upstream_supply_received_at_phc',upstreamReceiptReference:'DEMO-PHC-GRN-001',upstreamReceivedQuantity:40,receivedAt:'2026-11-14T08:00:00Z'});
 assert.equal(result.status,'upstream_supply_received_at_phc');
 const payload=JSON.parse(calls.find(x=>x.options.method==='PATCH').options.body);assert.deepEqual(payload,{status:'upstream_supply_received_at_phc',upstream_received_quantity:40,upstream_receipt_reference:'DEMO-PHC-GRN-001',upstream_received_at:'2026-11-14T08:00:00Z'});
});

test('PHC-to-SHC handover requires positive quantity, register reference and timestamp',async()=>{
 const calls=[],c=clientFor(fakeFetch(calls));
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'phc_handover_recorded',handoverQuantity:0,handoverReference:'DEMO-ISSUE',handoverAt:'2026-11-14T08:00:00Z'}),/positive physical handover quantity/i);
 await assert.rejects(c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'phc_handover_recorded',handoverQuantity:5,handoverReference:'',handoverAt:'2026-11-14T08:00:00Z'}),/handover register reference is required/i);
 assert.equal(calls.some(x=>x.options.method==='PATCH'),false);
 const result=await c.transitionPHCStorekeeperStockoutCase({id:'case-1',status:'phc_handover_recorded',handoverQuantity:25,handoverReference:'DEMO-PHC-ISSUE-001',handoverAt:'2026-11-14T08:00:00Z'});
 assert.equal(result.status,'phc_handover_recorded');
 const payload=JSON.parse(calls.find(x=>x.options.method==='PATCH').options.body);
 assert.deepEqual(payload,{status:'phc_handover_recorded',phc_handover_quantity:25,phc_handover_reference:'DEMO-PHC-ISSUE-001',phc_handover_at:'2026-11-14T08:00:00Z'});
});

test('storekeeper portal exposes separate stockout workspace and keeps official portal handoff explicit',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'storekeeper.html'),'utf8'),js=fs.readFileSync(path.join(root,'storekeeper-stockouts.js'),'utf8'),css=fs.readFileSync(path.join(root,'styles-v2.css'),'utf8'),client=fs.readFileSync(path.join(root,'supabase-client.js'),'utf8');
 assert.match(html,/phc-stockout-storekeeper-list/);assert.match(html,/storekeeper-stockouts\.js/);
 assert.match(js,/busho:authenticated/);assert.match(js,/busho:unauthenticated/);assert.match(js,/transitionPHCStorekeeperStockoutCase/);assert.match(js,/BUSHO does not submit it/);assert.match(js,/discrepancy_recorded:'SHC discrepancy recorded/);assert.match(js,/upstreamReceivedQuantity/);assert.match(js,/phcAvailableObservedAt/);assert.match(js,/data-action="availability"/);assert.match(js,/phcAvailableObservedAt/);assert.match(js,/data-action=\\?"availability/);
 assert.match(css,/\.phc-storekeeper-action/);assert.match(css,/\.storekeeper-facts/);
 assert.match(client,/listPHCStorekeeperStockoutCases/);assert.match(client,/transitionPHCStorekeeperStockoutCase/);
});
