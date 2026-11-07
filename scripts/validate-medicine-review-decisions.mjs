#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ALLOWED_STATUS = new Set([
  'source_text_confirmed',
  'needs_clinical_review',
  'deferred_external_guideline',
  'reference_mapping_approved',
  'rejected_source_row'
]);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateMedicineReviewBatch(batch, sourceDocuments) {
  const errors = [];
  const sourceRows = new Map();
  for (const doc of sourceDocuments) {
    for (const entry of doc.entries || []) {
      sourceRows.set(entry.sourceAnnexure + ':' + entry.sourceItemNumber, entry);
    }
  }

  if (!batch || batch.schemaVersion !== 1) errors.push({ code: 'unsupported_review_batch_schema' });
  const reviewer = batch?.reviewer || {};
  if (!nonEmpty(reviewer.name)) errors.push({ code: 'reviewer_name_required' });
  if (!nonEmpty(reviewer.designation)) errors.push({ code: 'reviewer_designation_required' });
  if (!nonEmpty(reviewer.organization)) errors.push({ code: 'reviewer_organization_required' });
  if (reviewer.authorityConfirmedByOrganization !== true) {
    errors.push({ code: 'reviewer_authority_not_confirmed', message: 'The submitting organization must confirm reviewer authorization; this tool cannot verify credentials.' });
  }

  const entries = Array.isArray(batch?.entries) ? batch.entries : [];
  const seen = new Set();
  for (const [index, decision] of entries.entries()) {
    const row = index + 1;
    const key = decision.annexure + ':' + decision.item;
    const source = sourceRows.get(key);
    if (!source) {
      errors.push({ row, code: 'unknown_source_row', key });
      continue;
    }
    if (seen.has(key)) errors.push({ row, code: 'duplicate_review_decision', key });
    seen.add(key);

    if (decision.printedPage !== source.sourcePage) errors.push({ row, code: 'source_page_mismatch', key });
    if (decision.sourceDescription !== source.sourceDescription) errors.push({ row, code: 'source_description_mismatch', key });
    if (decision.sourcePdfChecked !== true) errors.push({ row, code: 'rendered_pdf_check_required', key });
    if (!ALLOWED_STATUS.has(decision.reviewStatus)) errors.push({ row, code: 'invalid_review_status', key });
    if (!nonEmpty(decision.evidenceNote) || decision.evidenceNote.trim().length < 20) {
      errors.push({ row, code: 'review_evidence_required', key });
    }
    if (!nonEmpty(decision.rowInterpretation)) errors.push({ row, code: 'row_interpretation_required', key });

    const candidates = Array.isArray(decision.candidateItems) ? decision.candidateItems : [];
    if (decision.reviewStatus === 'reference_mapping_approved') {
      if (candidates.length === 0) errors.push({ row, code: 'approved_mapping_requires_candidate_items', key });
      for (const [candidateIndex, candidate] of candidates.entries()) {
        for (const field of ['normalizedName', 'dosageForm', 'strength', 'stockUnit']) {
          if (!nonEmpty(candidate[field])) errors.push({ row, code: 'candidate_field_required', field, candidate: candidateIndex + 1, key });
        }
        if (candidate.facilityApplicability !== source.facilityLevel) {
          errors.push({ row, code: 'candidate_facility_applicability_mismatch', candidate: candidateIndex + 1, key });
        }
      }
    } else if (candidates.length > 0) {
      errors.push({ row, code: 'candidate_items_not_allowed_for_unapproved_status', key });
    }
  }

  return {
    ok: errors.length === 0,
    status: 'review_batch_validation_only',
    summary: {
      decisions_submitted: entries.length,
      valid_decisions: Math.max(0, entries.length - errors.filter(error => error.row).length),
      error_count: errors.length
    },
    authority_notice: 'Reviewer identity and authorization are self-reported and must be confirmed by the responsible organization outside this tool.',
    import_policy: {
      live_import_allowed: false,
      stock_or_prescribing_use_allowed: false,
      note: 'A valid review batch only confirms that required evidence fields are present and source references match. It does not establish clinical correctness, legal authorization, procurement eligibility, current stock or facility operating status.'
    },
    errors
  };
}

async function main() {
  const phcPath = process.argv[2];
  const shcPath = process.argv[3];
  const batchPath = process.argv[4];
  const outputPath = process.argv[5];
  if (!phcPath || !shcPath || !batchPath || !outputPath) {
    throw new Error('Usage: node scripts/validate-medicine-review-decisions.mjs phc.json shc.json review-batch.json validation.json');
  }
  const [phc, shc, batch] = await Promise.all([
    readFile(resolve(phcPath), 'utf8').then(JSON.parse),
    readFile(resolve(shcPath), 'utf8').then(JSON.parse),
    readFile(resolve(batchPath), 'utf8').then(JSON.parse)
  ]);
  const result = validateMedicineReviewBatch(batch, [phc, shc]);
  await writeFile(resolve(outputPath), JSON.stringify(result, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify(result.summary, null, 2) + '\n');
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  main().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
