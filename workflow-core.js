(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_WORKFLOW = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const REPORT_TRANSITIONS = {
    draft: {
      submitted: { roles: ['worker'], action: 'worker_submitted' }
    },
    submitted: {
      supervisor_verified: { roles: ['supervisor'], action: 'supervisor_verified' },
      correction_requested: { roles: ['supervisor'], action: 'correction_requested', needsNote: true },
      escalated: { roles: ['supervisor'], action: 'escalated_for_medical_officer_review', needsNote: true }
    },
    correction_requested: {
      resubmitted: { roles: ['worker'], action: 'worker_resubmitted', needsNote: true }
    },
    resubmitted: {
      supervisor_verified: { roles: ['supervisor'], action: 'supervisor_verified' },
      correction_requested: { roles: ['supervisor'], action: 'correction_requested', needsNote: true },
      escalated: { roles: ['supervisor'], action: 'escalated_for_medical_officer_review', needsNote: true }
    },
    supervisor_verified: {
      closed: { roles: ['supervisor'], action: 'report_closed' }
    },
    escalated: {
      supervisor_verified: { roles: ['supervisor'], action: 'supervisor_verified_after_escalation' },
      correction_requested: { roles: ['supervisor'], action: 'correction_requested', needsNote: true }
    }
  };

  const INDENT_TRANSITIONS = {
    recommended_to_facility_store: {
      supervisor_approved: { roles: ['supervisor'], action: 'supervisor_approved_indent' },
      returned_for_clarification: { roles: ['supervisor', 'storekeeper'], action: 'indent_returned', needsNote: true }
    },
    supervisor_approved: {
      submitted_to_dpdmis: { roles: ['supervisor', 'storekeeper'], action: 'dpdmis_submission_recorded', needsReference: true },
      returned_for_clarification: { roles: ['supervisor', 'storekeeper'], action: 'indent_returned', needsNote: true }
    },
    returned_for_clarification: {
      recommended_to_facility_store: { roles: ['supervisor'], action: 'indent_revised', needsNote: true }
    },
    submitted_to_dpdmis: {
      allocated: { roles: ['supervisor', 'storekeeper'], action: 'allocation_reference_recorded', needsReference: true },
      dispatched: { roles: ['supervisor', 'storekeeper'], action: 'dispatch_reference_recorded', needsReference: true },
      returned_for_clarification: { roles: ['supervisor', 'storekeeper'], action: 'indent_returned', needsNote: true }
    },
    allocated: {
      dispatched: { roles: ['supervisor', 'storekeeper'], action: 'dispatch_reference_recorded', needsReference: true }
    },
    dispatched: {
      partially_received: { roles: ['supervisor', 'storekeeper'], action: 'partial_receipt_recorded', needsReference: true, receives: true },
      received: { roles: ['supervisor', 'storekeeper'], action: 'receipt_completed', needsReference: true, receives: true }
    },
    partially_received: {
      partially_received: { roles: ['supervisor', 'storekeeper'], action: 'partial_receipt_recorded', needsReference: true, receives: true },
      received: { roles: ['supervisor', 'storekeeper'], action: 'receipt_completed', needsReference: true, receives: true }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertRecord(record, label) {
    if (!record || typeof record !== 'object' || !record.id) {
      throw new Error(label + ' must have an id.');
    }
    if (!Array.isArray(record.events)) record.events = [];
  }

  function requireText(value, label) {
    if (typeof value !== 'string' || !value.trim()) throw new Error(label + ' is required.');
    return value.trim();
  }

  function requireRole(role, allowed) {
    if (!allowed.includes(role)) throw new Error('This action is not allowed for the ' + String(role || 'unknown') + ' role.');
  }

  function makeEvent(record, input, transition, from, to, extra) {
    return {
      id: String(record.id) + '-EVT-' + String((record.events || []).length + 1).padStart(3, '0'),
      at: input.at || new Date().toISOString(),
      actorRole: input.actorRole,
      actorLabel: requireText(input.actorLabel, 'Actor label'),
      action: transition.action,
      from,
      to,
      ...(input.note && input.note.trim() ? { note: input.note.trim() } : {}),
      ...(input.reference && input.reference.trim() ? { reference: input.reference.trim() } : {}),
      ...(extra || {})
    };
  }

  function transitionReport(report, input) {
    input = input || {};
    const next = clone(report);
    assertRecord(next, 'Report');
    const from = next.status || 'draft';
    const to = input.to;
    const rule = REPORT_TRANSITIONS[from] && REPORT_TRANSITIONS[from][to];
    if (!rule) throw new Error('Report transition ' + from + ' → ' + String(to) + ' is not available.');
    requireRole(input.actorRole, rule.roles);
    if (rule.needsNote) requireText(input.note, 'A reason or correction note');
    if (to === 'submitted' && next.submittedAt) throw new Error('This report has already been submitted.');
    next.status = to;
    next.updatedAt = input.at || new Date().toISOString();
    next.events.push(makeEvent(next, input, rule, from, to));
    if (to === 'submitted') next.submittedAt = next.updatedAt;
    if (to === 'supervisor_verified') {
      next.verifiedAt = next.updatedAt;
      next.verifiedBy = input.actorLabel;
    }
    if (to === 'correction_requested') next.correctionRequestedAt = next.updatedAt;
    if (to === 'escalated') next.escalatedAt = next.updatedAt;
    return next;
  }

  function createIndent(report, item, input) {
    input = input || {};
    assertRecord(report, 'Report');
    if (report.status !== 'supervisor_verified') {
      throw new Error('A supervisor-verified report is required before creating a facility indent recommendation.');
    }
    requireRole(input.actorRole, ['supervisor', 'storekeeper']);
    if (!item || typeof item !== 'object') throw new Error('A stock item is required.');
    const requestedQty = Number(item.requestedQty);
    const onHand = Number(item.onHand);
    if (!Number.isSafeInteger(requestedQty) || requestedQty <= 0) throw new Error('Requested quantity must be a positive whole number.');
    if (!Number.isSafeInteger(onHand) || onHand < 0) throw new Error('Reported on-hand stock must be a whole number of zero or more.');
    const id = input.id || ('IND-' + String(report.id).replace(/[^A-Za-z0-9]/g, '').slice(-16) + '-' + String((input.sequence || 1)).padStart(2, '0'));
    const createdAt = input.at || new Date().toISOString();
    const indent = {
      id,
      reportId: report.id,
      facilityId: report.facilityId || null,
      blockCode: report.blockCode || null,
      facilityName: report.facilityName || null,
      itemId: requireText(String(item.id || ''), 'Item id'),
      itemName: requireText(String(item.name || ''), 'Item name'),
      unit: requireText(String(item.unit || ''), 'Quantity unit'),
      onHand,
      requestedQty,
      receivedQty: 0,
      status: 'recommended_to_facility_store',
      createdAt,
      updatedAt: createdAt,
      createdBy: input.actorLabel,
      externalReference: null,
      dispatchReference: null,
      receiptReferences: [],
      purchaseOrderCreated: false,
      dataMode: 'synthetic_demo',
      events: []
    };
    const rule = { action: 'facility_indent_recommended' };
    indent.events.push(makeEvent(indent, input, rule, null, indent.status, {
      reportId: report.id,
      itemId: indent.itemId,
      requestedQty,
      onHand
    }));
    return indent;
  }

  function transitionIndent(indent, input) {
    input = input || {};
    const next = clone(indent);
    assertRecord(next, 'Indent');
    const from = next.status;
    const to = input.to;
    const rule = INDENT_TRANSITIONS[from] && INDENT_TRANSITIONS[from][to];
    if (!rule) throw new Error('Indent transition ' + String(from) + ' → ' + String(to) + ' is not available.');
    requireRole(input.actorRole, rule.roles);
    const reference = input.reference && input.reference.trim();
    if (rule.needsReference && !reference) throw new Error('An external DPDMIS, allocation, challan or receipt reference is required.');
    if (rule.needsNote) requireText(input.note, 'A reason or clarification note');

    let extra = {};
    if (rule.receives) {
      const delta = Number(input.receivedQty);
      if (!Number.isSafeInteger(delta) || delta <= 0) throw new Error('Receipt quantity must be a positive whole number.');
      const total = Number(next.receivedQty || 0) + delta;
      const requested = Number(next.requestedQty);
      if (total > requested) throw new Error('Receipt quantity cannot exceed the requested quantity.');
      if (to === 'received' && total !== requested) throw new Error('To mark the indent fully received, the remaining quantity must also be recorded.');
      if (to === 'partially_received' && total >= requested) throw new Error('Use the received state when the full requested quantity has arrived.');
      next.receivedQty = total;
      next.receiptReferences = (next.receiptReferences || []).concat([{
        reference,
        quantity: delta,
        at: input.at || new Date().toISOString(),
        actor: input.actorLabel
      }]);
      extra = { quantityReceivedNow: delta, totalReceived: total, outstandingQty: requested - total };
    }

    if (to === 'submitted_to_dpdmis') next.externalReference = reference;
    if (to === 'allocated') next.allocationReference = reference;
    if (to === 'dispatched') next.dispatchReference = reference;
    if (to === 'received') next.receivedAt = input.at || new Date().toISOString();
    next.status = to;
    next.updatedAt = input.at || new Date().toISOString();
    next.purchaseOrderCreated = false;
    next.events.push(makeEvent(next, input, rule, from, to, extra));
    return next;
  }

  function summarizeReports(records, blockCode) {
    const scoped = (Array.isArray(records) ? records : []).filter(record =>
      String(record.blockCode || '') === String(blockCode) && record.status !== 'draft'
    );
    return {
      submitted: scoped.filter(r => r.status === 'submitted' || r.status === 'resubmitted').length,
      awaitingReview: scoped.filter(r => r.status === 'submitted' || r.status === 'resubmitted').length,
      verified: scoped.filter(r => r.status === 'supervisor_verified' || r.status === 'closed').length,
      correctionRequested: scoped.filter(r => r.status === 'correction_requested').length,
      total: scoped.length
    };
  }

  return {
    transitionReport,
    createIndent,
    transitionIndent,
    summarizeReports,
    reportTransitions: REPORT_TRANSITIONS,
    indentTransitions: INDENT_TRANSITIONS
  };
});
