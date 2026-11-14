const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('../supabase-client.js');

function makeStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}
function jsonResponse(value, status = 200) {
  return { ok: status >= 200 && status < 300, status,
    headers: { get: () => 'application/json' },
    json: async () => value, text: async () => JSON.stringify(value) };
}
function signedInClient(fetch) {
  const storage = makeStorage();
  storage.setItem('busho-auth-session-v1', JSON.stringify({
    access_token:'worker-token',refresh_token:'worker-refresh',
    expires_at:1800003000,user:{id:'auth-worker'}
  }));
  return createClient({url:'https://demo.supabase.co',publishableKey:'sb_publishable_demo_key',
    fetch,storage,now:()=>1800000000000});
}

test('worker stockout submission uses only the current verified parent-PHC link and keeps source quantities distinct', async () => {
  const calls=[];
  const fetch=async (url,options={})=>{
    calls.push({url,options});
    if(url.includes('/rest/v1/profiles?')) return jsonResponse([{id:'auth-worker',role:'worker',status:'active'}]);
    if(url.includes('/rest/v1/workers?')) return jsonResponse([{id:'worker-row',auth_user_id:'auth-worker',facility_id:'shc-1',is_active:true,facilities:{name:'Synthetic SHC',district:'Dhamtari'}}]);
    if(url.includes('/rest/v1/facility_service_links?')) return jsonResponse([{id:'link-1',shc_facility_id:'shc-1',phc_facility_id:'phc-1',verification_status:'verified',data_mode:'synthetic_demo',effective_from:'2026-01-01',effective_until:null}]);
    if(url.includes('/rest/v1/facilities?id=eq.phc-1')) return jsonResponse([{id:'phc-1',name:'Synthetic PHC',facility_type:'phc',is_synthetic:true}]);
    if(url.endsWith('/rest/v1/stockout_cases')&&options.method==='POST') return jsonResponse([{id:'case-1',status:'submitted_to_phc',reported_quantity:0,requested_quantity:50}],201);
    throw new Error('Unexpected request: '+url+' '+options.method);
  };
  const client=signedInClient(fetch);
  const result=await client.createStockoutCase({medicineName:'Synthetic medicine',medicineSourceReference:'DEMO-001',
    reportedQuantity:0,requestedQuantity:50,quantityUnit:'tablets',observationSource:'physical_count',note:'Synthetic fixture'});
  assert.equal(result.id,'case-1');
  const post=calls.find(call=>call.options.method==='POST');
  const payload=JSON.parse(post.options.body);
  assert.equal(payload.shc_facility_id,'shc-1');
  assert.equal(payload.phc_facility_id,'phc-1');
  assert.equal(payload.submitted_by_worker_id,'worker-row');
  assert.equal(payload.reported_quantity,0);
  assert.equal(payload.requested_quantity,50);
  assert.equal(payload.data_mode,'synthetic_demo');
  assert.equal(payload.status,'submitted_to_phc');
});

test('worker stockout submission refuses to guess a parent PHC when no verified relationship exists', async () => {
  const calls=[];
  const client=signedInClient(async (url,options={})=>{
    calls.push({url,options});
    if(url.includes('/rest/v1/profiles?')) return jsonResponse([{id:'auth-worker',role:'worker',status:'active'}]);
    if(url.includes('/rest/v1/workers?')) return jsonResponse([{id:'worker-row',facility_id:'shc-1',is_active:true,facilities:{name:'SHC'}}]);
    if(url.includes('/rest/v1/facility_service_links?')) return jsonResponse([]);
    throw new Error('Unexpected request: '+url);
  });
  await assert.rejects(client.createStockoutCase({medicineName:'Medicine',reportedQuantity:0,requestedQuantity:4,quantityUnit:'packs'}),/No current verified parent PHC/i);
  assert.equal(calls.some(call=>call.options.method==='POST'),false);
});

test('worker stockout transitions are restricted to clarification, collection and receipt actions', async () => {
  const calls=[];
  const client=signedInClient(async (url,options={})=>{
    calls.push({url,options});
    if(url.includes('/rest/v1/profiles?')) return jsonResponse([{id:'auth-worker',role:'worker',status:'active'}]);
    if(url.includes('/rest/v1/stockout_cases?id=eq.case-1')) return jsonResponse([{id:'case-1',status:'collected_by_shc'}]);
    throw new Error('Unexpected request: '+url);
  });
  await assert.rejects(client.transitionMyStockoutCase({id:'case-1',status:'official_indent_submitted'}),/not available to the SHC worker/i);
  assert.equal(calls.some(call=>call.options.method==='PATCH'),false);
  const result=await client.transitionMyStockoutCase({id:'case-1',status:'collected_by_shc',shc_collection_reference:'DEMO-ISSUE-1',shc_collected_at:'2026-11-14T08:00:00Z'});
  assert.equal(result.status,'collected_by_shc');
  const patch=calls.find(call=>call.options.method==='PATCH');
  assert.deepEqual(JSON.parse(patch.options.body),{status:'collected_by_shc',shc_collection_reference:'DEMO-ISSUE-1',shc_collected_at:'2026-11-14T08:00:00Z'});
});

test('worker stockout workspace is authenticated, accessible from navigation and avoids unverified catalogue claims', () => {
  const root=path.join(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'worker.html'),'utf8');
  const js=fs.readFileSync(path.join(root,'worker-stockouts.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'styles-v2.css'),'utf8');
  const client=fs.readFileSync(path.join(root,'supabase-client.js'),'utf8');
  assert.match(html,/data-portal-view="stockouts"/);
  assert.match(html,/data-module="stockouts"/);
  assert.match(html,/worker-stockouts\.js/);
  assert.match(html,/medicine name as written on the pack\/register/i);
  assert.match(js,/busho:authenticated/);
  assert.match(js,/busho:unauthenticated/);
  assert.match(js,/createStockoutCase/);
  assert.match(js,/transitionMyStockoutCase/);
  assert.match(js,/textContent = message/);
  assert.match(css,/\.stockout-layout/);
  assert.match(client,/No current verified parent PHC/);
});
