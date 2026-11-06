/* BUSHO v2 shared demo workflow.
 * Same-origin browser storage only. All users, ids and transactions are synthetic.
 * This does not read from or write to CGMSC DPDMIS, HMIS, PMBI or any government system.
 */
(() => {
  'use strict';
  const STORAGE_KEY = 'busho-operational-demo-v2';
  const FACILITY_ID = 'demo-hwc-dhamtari';
  const medicines = [
    {id:'ors',name:'ORS packets',unit:'packets',capacity:50,reorderAt:25},
    {id:'ifa',name:'Iron and folic acid',unit:'strips',capacity:60,reorderAt:20},
    {id:'zinc',name:'Zinc tablets',unit:'tablets',capacity:100,reorderAt:30},
    {id:'paracetamol',name:'Paracetamol 500 mg',unit:'tablets',capacity:500,reorderAt:100},
    {id:'amoxicillin',name:'Amoxicillin 500 mg',unit:'capsules',capacity:250,reorderAt:60},
    {id:'cetirizine',name:'Cetirizine 10 mg',unit:'tablets',capacity:200,reorderAt:50}
  ];
  let sequence = 0;

  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();
  const today = () => now().slice(0,10);
  const id = prefix => `BUSHO-DEMO-${prefix}-${Date.now()}-${++sequence}`;
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0;
  const required = (value, label) => {
    const text = String(value ?? '').trim();
    if (!text) throw new Error(`${label} is required.`);
    return text;
  };
  const byId = (items, value, label) => {
    const found = items.find(item => item.id === value);
    if (!found) throw new Error(`${label} was not found.`);
    return found;
  };

  function freshState() {
    const initialDate = today();
    return {
      version: 2,
      lastUpdatedAt: now(),
      reports: [],
      indents: [],
      receipts: [],
      consumption: [],
      auditLog: [],
      inventoryLots: [
        {id:'DEMO-LOT-ORS-OPEN',facilityId:FACILITY_ID,medicineId:'ors',batchNumber:'DEMO-ORS-2026-OPEN',quantity:20,expiryDate:'2027-01-01',rack:'Demo rack A',receivedAt:initialDate,source:'Synthetic opening balance'},
        {id:'DEMO-LOT-IFA-OPEN',facilityId:FACILITY_ID,medicineId:'ifa',batchNumber:'DEMO-IFA-2026-OPEN',quantity:14,expiryDate:'2027-03-31',rack:'Demo rack B',receivedAt:initialDate,source:'Synthetic opening balance'},
        {id:'DEMO-LOT-ZINC-OPEN',facilityId:FACILITY_ID,medicineId:'zinc',batchNumber:'DEMO-ZINC-2026-OPEN',quantity:72,expiryDate:'2027-06-30',rack:'Demo rack C',receivedAt:initialDate,source:'Synthetic opening balance'},
        {id:'DEMO-LOT-PARA-OPEN',facilityId:FACILITY_ID,medicineId:'paracetamol',quantity:240,batchNumber:'DEMO-PARA-2026-OPEN',expiryDate:'2027-09-30',rack:'Demo rack D',receivedAt:initialDate,source:'Synthetic opening balance'},
        {id:'DEMO-LOT-AMOX-OPEN',facilityId:FACILITY_ID,medicineId:'amoxicillin',quantity:120,batchNumber:'DEMO-AMOX-2026-OPEN',expiryDate:'2027-08-31',rack:'Demo rack E',receivedAt:initialDate,source:'Synthetic opening balance'},
        {id:'DEMO-LOT-CET-OPEN',facilityId:FACILITY_ID,medicineId:'cetirizine',quantity:80,batchNumber:'DEMO-CET-2026-OPEN',expiryDate:'2027-10-31',rack:'Demo rack F',receivedAt:initialDate,source:'Synthetic opening balance'}
      ]
    };
  }

  function readState() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && stored.version === 2 && Array.isArray(stored.reports) && Array.isArray(stored.indents) && Array.isArray(stored.inventoryLots)) return stored;
    } catch {}
    return freshState();
  }

  function writeState(state, action) {
    state.lastUpdatedAt = now();
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { throw new Error('BUSHO could not save the demo record. Check browser storage availability.'); }
    try {
      window.dispatchEvent(new window.CustomEvent('busho:workflow-updated', {detail:{action:action || 'state_updated'}}));
    } catch {}
    return state;
  }

  function recordEvent(state, {entityType, entityId, reportId, indentId, action, actor, note, fromStatus, toStatus, metadata}) {
    const event = {
      id:id('EVT'), at:now(), actor:String(actor || 'Demo user'),
      entityType, entityId, reportId:reportId || null, indentId:indentId || null,
      action, fromStatus:fromStatus || null, toStatus:toStatus || null,
      note:String(note || ''), metadata:metadata || {}, synthetic:true
    };
    state.auditLog.push(event);
    return event;
  }

  function getState() { return clone(readState()); }
  function getReports() { return clone(readState().reports).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
  function getIndents() { return clone(readState().indents).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
  function getAuditLog() { return clone(readState().auditLog).sort((a,b)=>b.at.localeCompare(a.at)); }
  function getMedicineCatalog() { return clone(medicines); }

  function submitReport({rawText, workerName='Anita Verma', facilityId=FACILITY_ID, conditions=[], medicines:reportedMedicines=[]}) {
    const note = required(rawText, 'Original field note');
    if (note.length > 4000) throw new Error('Field note must be 4,000 characters or fewer.');
    if (facilityId !== FACILITY_ID) throw new Error('This demo is enabled only for its single synthetic facility.');
    const state = readState();
    const report = {
      id:id('RPT'), createdAt:now(), updatedAt:now(), workerName:String(workerName),
      facilityId, facilityName:'Rampur HWC · Synthetic demo facility',
      districtName:'Dhamtari', blockName:'Dhamtari',
      rawText:note, conditions:clone(Array.isArray(conditions)?conditions:[]),
      medicines:clone(Array.isArray(reportedMedicines)?reportedMedicines:[]),
      status:'submitted', reviewNote:'', reviewedBy:null, reviewedAt:null,
      indentIds:[], synthetic:true, source:'Worker-confirmed field report'
    };
    state.reports.push(report);
    recordEvent(state,{entityType:'report',entityId:report.id,reportId:report.id,action:'report_submitted',actor:workerName,note:'Worker confirmed the structured draft. Awaiting supervisor review.',toStatus:'submitted'});
    writeState(state,'report_submitted');
    return clone(report);
  }

  function reviewReport(reportId, {decision,actor='Supervisor demo',note=''}) {
    const state = readState();
    const report = byId(state.reports,reportId,'Report');
    if (!['submitted','needs_correction'].includes(report.status)) throw new Error('Only submitted or returned reports can be reviewed.');
    if (!['verify','request_correction','reject'].includes(decision)) throw new Error('Choose verify, request_correction or reject.');
    if (decision !== 'verify') required(note,'Review reason');
    const previous = report.status;
    const next = decision === 'verify' ? 'verified' : decision === 'request_correction' ? 'needs_correction' : 'rejected';
    report.status = next;
    report.reviewNote = String(note || (decision==='verify' ? 'Source note and structured fields reviewed.' : ''));
    report.reviewedBy = String(actor);
    report.reviewedAt = now();
    report.updatedAt = now();
    recordEvent(state,{entityType:'report',entityId:report.id,reportId:report.id,action:decision==='verify'?'report_verified':decision==='request_correction'?'correction_requested':'report_rejected',actor,note:report.reviewNote,fromStatus:previous,toStatus:next});
    writeState(state,'report_reviewed');
    return clone(report);
  }

  function resubmitReport(reportId, {rawText,conditions=[],medicines:reportedMedicines=[],actor='Anita Verma'}) {
    const state = readState();
    const report = byId(state.reports,reportId,'Report');
    if (report.status !== 'needs_correction') throw new Error('Only a report returned for correction can be resubmitted.');
    const previous = report.status;
    report.rawText = required(rawText,'Corrected source note').slice(0,4000);
    report.conditions = clone(conditions);
    report.medicines = clone(reportedMedicines);
    report.status = 'submitted';
    report.reviewNote = '';
    report.reviewedBy = null;
    report.reviewedAt = null;
    report.updatedAt = now();
    recordEvent(state,{entityType:'report',entityId:report.id,reportId:report.id,action:'report_resubmitted',actor,note:'Worker resubmitted the corrected report.',fromStatus:previous,toStatus:'submitted'});
    writeState(state,'report_resubmitted');
    return clone(report);
  }

  function createIndentDraft(reportId, {actor='Facility store demo',items=[]}) {
    const state = readState();
    const report = byId(state.reports,reportId,'Report');
    if (report.status !== 'verified') throw new Error('A supervisor-verified report is required before an indent can be drafted.');
    if (!Array.isArray(items) || items.length !== 1) throw new Error('Create one medicine line per demo indent.');
    const lines = items.map(item => {
      const medicine = byId(medicines,item.medicineId,'Medicine');
      if (!positive(item.requestedQuantity)) throw new Error('Requested quantity must be greater than zero.');
      return {medicineId:medicine.id,medicineName:medicine.name,requestedQuantity:Number(item.requestedQuantity),unit:item.unit || medicine.unit,issuedQuantity:0,receivedQuantity:0};
    });
    const indent = {
      id:id('INDENT'), createdAt:now(), updatedAt:now(), reportId,
      facilityId:report.facilityId, facilityName:report.facilityName,
      districtName:report.districtName, blockName:report.blockName,
      createdBy:String(actor), status:'draft', lines,
      programme:'Regular supply · synthetic demo', indentDate:today(),
      warehouseIssue:null, dispatch:null, receipts:[], synthetic:true,
      externalSystem:'Not submitted to CGMSC DPDMIS'
    };
    state.indents.push(indent);
    report.indentIds.push(indent.id);
    report.updatedAt = now();
    recordEvent(state,{entityType:'indent',entityId:indent.id,reportId,indentId:indent.id,action:'indent_draft_created',actor,note:'Synthetic facility-store indent draft created from a verified report.',toStatus:'draft',metadata:{lineCount:lines.length}});
    writeState(state,'indent_draft_created');
    return clone(indent);
  }

  function submitIndent(indentId, {actor='Facility store demo',note='Facility-store demo user completed the indent for the warehouse queue.'}={}) {
    const state=readState(), indent=byId(state.indents,indentId,'Indent');
    if(indent.status!=='draft') throw new Error('Only a draft indent can be submitted.');
    required(actor,'Actor');
    const previous=indent.status; indent.status='submitted_to_warehouse'; indent.updatedAt=now(); indent.submittedAt=now();
    recordEvent(state,{entityType:'indent',entityId:indent.id,reportId:indent.reportId,indentId:indent.id,action:'indent_submitted_to_warehouse',actor,note,fromStatus:previous,toStatus:indent.status});
    writeState(state,'indent_submitted');
    return clone(indent);
  }

  function recordWarehouseIssue(indentId, {actor='Warehouse demo',issuedQuantity,issueRef,issueDate=today()}={}) {
    const state=readState(), indent=byId(state.indents,indentId,'Indent');
    if(indent.status!=='submitted_to_warehouse') throw new Error('The indent must be submitted before warehouse issue can be recorded.');
    const requested=indent.lines.reduce((sum,line)=>sum+line.requestedQuantity,0);
    if(!positive(issuedQuantity) || Number(issuedQuantity)>requested) throw new Error('Issued quantity must be positive and cannot exceed the indent quantity.');
    indent.warehouseIssue={reference:required(issueRef,'Warehouse issue reference'),date:required(issueDate,'Issue date'),quantity:Number(issuedQuantity),actor:String(actor),recordedAt:now()};
    indent.lines[0].issuedQuantity=Number(issuedQuantity);
    indent.status='warehouse_issued'; indent.updatedAt=now();
    recordEvent(state,{entityType:'indent',entityId:indent.id,reportId:indent.reportId,indentId:indent.id,action:'warehouse_issue_recorded',actor,note:'Warehouse issue entered as a synthetic event; not a CGMSC issue transaction.',fromStatus:'submitted_to_warehouse',toStatus:'warehouse_issued',metadata:{issueRef:indent.warehouseIssue.reference,quantity:Number(issuedQuantity)}});
    writeState(state,'warehouse_issue_recorded');
    return clone(indent);
  }

  function recordDispatch(indentId, {actor='Facility store demo',dispatchRef,dispatchDate=today(),carrier='Demo dispatch'}={}) {
    const state=readState(), indent=byId(state.indents,indentId,'Indent');
    if(indent.status!=='warehouse_issued') throw new Error('Warehouse issue must be recorded before dispatch.');
    indent.dispatch={reference:required(dispatchRef,'Dispatch reference'),date:required(dispatchDate,'Dispatch date'),carrier:String(carrier),actor:String(actor),recordedAt:now()};
    indent.status='in_transit'; indent.updatedAt=now();
    recordEvent(state,{entityType:'indent',entityId:indent.id,reportId:indent.reportId,indentId:indent.id,action:'dispatch_recorded',actor,note:'Synthetic dispatch event. No courier or GPS tracking is connected.',fromStatus:'warehouse_issued',toStatus:'in_transit',metadata:{dispatchRef:indent.dispatch.reference,carrier:indent.dispatch.carrier}});
    writeState(state,'dispatch_recorded');
    return clone(indent);
  }

  function recordReceipt(indentId, {actor='Facility store demo',receivedQuantity,receiptNumber,receiptDate=today(),batchNumber,expiryDate,rack}={}) {
    const state=readState(), indent=byId(state.indents,indentId,'Indent');
    if(!['in_transit','partially_received'].includes(indent.status)) throw new Error('Dispatch must be recorded before facility receipt.');
    if(!positive(receivedQuantity)) throw new Error('Received quantity must be greater than zero.');
    const issued=indent.warehouseIssue?.quantity || 0;
    const priorReceived=indent.receipts.reduce((sum,receipt)=>sum+receipt.quantity,0);
    if(priorReceived+Number(receivedQuantity)>issued) throw new Error('Received quantity cannot exceed the warehouse-issued quantity.');
    const receipt={
      id:id('RECEIPT'),number:required(receiptNumber,'Receipt number'),
      date:required(receiptDate,'Receipt date'),quantity:Number(receivedQuantity),
      batchNumber:required(batchNumber,'Batch number'),
      expiryDate:required(expiryDate,'Expiry date'),rack:required(rack,'Rack'),
      actor:String(actor),recordedAt:now(),synthetic:true
    };
    if(!/^\d{4}-\d{2}-\d{2}$/.test(receipt.expiryDate)) throw new Error('Expiry date must use YYYY-MM-DD.');
    if(receipt.expiryDate<today()) throw new Error('An expired demo batch cannot be added to usable stock.');
    indent.receipts.push(receipt);
    indent.lines[0].receivedQuantity=priorReceived+receipt.quantity;
    indent.status=priorReceived+receipt.quantity===issued?'received':'partially_received';
    indent.updatedAt=now();
    const medicine=byId(medicines,indent.lines[0].medicineId,'Medicine');
    state.inventoryLots.push({
      id:id('LOT'),facilityId:indent.facilityId,medicineId:medicine.id,
      batchNumber:receipt.batchNumber,quantity:receipt.quantity,
      expiryDate:receipt.expiryDate,rack:receipt.rack,receivedAt:receipt.date,
      receiptId:receipt.id,source:'Synthetic receipt against demo indent'
    });
    recordEvent(state,{entityType:'indent',entityId:indent.id,reportId:indent.reportId,indentId:indent.id,action:'facility_receipt_recorded',actor,note:'Synthetic facility receipt with batch, expiry and rack captured.',fromStatus:priorReceived?'partially_received':'in_transit',toStatus:indent.status,metadata:{receiptNumber:receipt.number,quantity:receipt.quantity,batchNumber:receipt.batchNumber,expiryDate:receipt.expiryDate,rack:receipt.rack}});
    writeState(state,'facility_receipt_recorded');
    return clone(receipt);
  }

  function addDemoLot({facilityId=FACILITY_ID,medicineId,batchNumber,quantity,expiryDate,rack='Demo rack'}={}) {
    if(facilityId!==FACILITY_ID) throw new Error('Only the synthetic demo facility is enabled.');
    byId(medicines,medicineId,'Medicine');
    if(!positive(quantity)) throw new Error('Lot quantity must be greater than zero.');
    const state=readState();
    const lot={id:id('LOT'),facilityId,medicineId,batchNumber:required(batchNumber,'Batch number'),quantity:Number(quantity),expiryDate:required(expiryDate,'Expiry date'),rack,receivedAt:today(),source:'Synthetic test lot'};
    state.inventoryLots.push(lot);
    recordEvent(state,{entityType:'inventory_lot',entityId:lot.id,action:'demo_lot_added',actor:'Test/demo fixture',note:'Synthetic inventory lot added.'});
    writeState(state,'demo_lot_added');
    return clone(lot);
  }

  function recordConsumption({facilityId=FACILITY_ID,medicineId,quantity,actor='Facility store demo',issueTo='Demo service point'}={}) {
    if(facilityId!==FACILITY_ID) throw new Error('Only the synthetic demo facility is enabled.');
    byId(medicines,medicineId,'Medicine');
    if(!positive(quantity)) throw new Error('Consumption quantity must be greater than zero.');
    const state=readState();
    const lots=state.inventoryLots
      .filter(lot=>lot.facilityId===facilityId && lot.medicineId===medicineId && lot.quantity>0 && lot.expiryDate>=today())
      .sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));
    const available=lots.reduce((sum,lot)=>sum+lot.quantity,0);
    if(Number(quantity)>available) throw new Error(`Consumption exceeds available stock (${available}).`);
    let remaining=Number(quantity);
    const allocations=[];
    for(const lot of lots){
      if(!remaining) break;
      const used=Math.min(lot.quantity,remaining);
      lot.quantity-=used; remaining-=used;
      allocations.push({batchNumber:lot.batchNumber,quantity:used,expiryDate:lot.expiryDate});
    }
    const transaction={id:id('ISSUE'),facilityId,medicineId,quantity:Number(quantity),issueTo:String(issueTo),actor:String(actor),allocations,createdAt:now(),synthetic:true};
    state.consumption.push(transaction);
    recordEvent(state,{entityType:'consumption',entityId:transaction.id,action:'consumption_recorded',actor,note:'Synthetic stock consumption recorded in FEFO expiry order.',metadata:{medicineId,quantity:Number(quantity),allocations}});
    writeState(state,'consumption_recorded');
    return clone(transaction);
  }

  function getInventory(facilityId=FACILITY_ID,medicineId) {
    const state=readState();
    const result = medicines.filter(m=>!medicineId||m.id===medicineId).map(m=>{
      const lots=state.inventoryLots.filter(lot=>lot.facilityId===facilityId && lot.medicineId===m.id);
      const quantityOnHand=lots.reduce((sum,lot)=>sum+Math.max(0,lot.quantity),0);
      const availableLots=lots.filter(lot=>lot.quantity>0).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate));
      return {...m,quantityOnHand,low:quantityOnHand<=m.reorderAt,lots:clone(availableLots),nextExpiry:availableLots[0]?.expiryDate||null,source:'Synthetic demo balance'};
    });
    return medicineId ? (result[0] || null) : result;
  }

  function getIndent(indentId) { return clone(byId(readState().indents,indentId,'Indent')); }
  function getReport(reportId) { return clone(byId(readState().reports,reportId,'Report')); }
  function getTimeline(reportId) {
    const state=readState();
    const indentIds=state.indents.filter(indent=>indent.reportId===reportId).map(indent=>indent.id);
    return clone(state.auditLog.filter(event=>event.reportId===reportId || (event.indentId && indentIds.includes(event.indentId))).sort((a,b)=>a.at.localeCompare(b.at)));
  }
  function reset() {
    const state=freshState();
    writeState(state,'demo_reset');
    return clone(state);
  }

  window.BUSHO_WORKFLOW = Object.freeze({
    storageKey:STORAGE_KEY, facilityId:FACILITY_ID,
    getState,getReports,getIndents,getAuditLog,getMedicineCatalog,
    submitReport,reviewReport,resubmitReport,createIndentDraft,
    submitIndent,recordWarehouseIssue,recordDispatch,recordReceipt,
    addDemoLot,recordConsumption,getInventory,getIndent,getReport,
    getTimeline,reset
  });
})();
