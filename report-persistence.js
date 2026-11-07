(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BUSHO_REPORT_PERSISTENCE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EXTRACTION_VERSION = 1;

  function parseOptionalQuantity(value, label) {
    if (value === '' || value === null || value === undefined) return null;
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new Error(label + ' must be a non-negative number.');
    }
    return quantity;
  }

  function encodeDetails(details) {
    return JSON.stringify(details);
  }

  function toDatabaseItems(draft) {
    if (!Array.isArray(draft)) throw new Error('A structured report draft is required.');
    const items = [];
    const conditions = draft.find(item => item && item.id === 'disease-table');
    const medicines = draft.find(item => item && item.id === 'medicine-table');

    for (const row of (conditions && Array.isArray(conditions.rows) ? conditions.rows : [])) {
      const label = String(row.name || '').trim();
      if (!label) throw new Error('Every reported condition needs a name before saving.');
      const quantity = parseOptionalQuantity(row.patients, 'Patient count');
      items.push({
        item_type: 'symptom_trend',
        display_label: label,
        quantity,
        unit: quantity === null ? null : 'patients',
        value_text: encodeDetails({
          source_phrase: String(row.sourcePhrase || ''),
          count_status: String(row.countStatus || 'Needs review')
        }),
        confidence: null,
        requires_review: true
      });
    }

    for (const row of (medicines && Array.isArray(medicines.rows) ? medicines.rows : [])) {
      const label = String(row.name || '').trim();
      if (!label) throw new Error('Every stock observation needs a medicine name before saving.');
      const quantity = parseOptionalQuantity(row.quantity, 'Medicine quantity');
      items.push({
        item_type: 'stock_observation',
        display_label: label,
        quantity,
        unit: String(row.unit || '').trim() || null,
        value_text: encodeDetails({
          mentioned_as: String(row.mentionedAs || label),
          source_phrase: String(row.sourcePhrase || ''),
          stock_status: String(row.stockStatus || 'Needs review'),
          possible_spelling_correction: Boolean(row.fuzzy)
        }),
        confidence: null,
        requires_review: true
      });
    }

    return items;
  }

  function toReportSummary(draft) {
    const items = toDatabaseItems(draft);
    return {
      extraction_version: EXTRACTION_VERSION,
      structured_item_count: items.length,
      condition_count: items.filter(item => item.item_type === 'symptom_trend').length,
      stock_observation_count: items.filter(item => item.item_type === 'stock_observation').length,
      review_required: true
    };
  }

  async function persistConfirmedReport(options) {
    options = options || {};
    const client = options.client;
    if (!client) throw new Error('An authenticated BUSHO data client is required.');
    const originalText = String(options.originalText || '').trim();
    if (!originalText) throw new Error('The original field report cannot be empty.');

    const items = toDatabaseItems(options.draft);
    const summary = {
      extraction_version: EXTRACTION_VERSION,
      structured_item_count: items.length,
      condition_count: items.filter(item => item.item_type === 'symptom_trend').length,
      stock_observation_count: items.filter(item => item.item_type === 'stock_observation').length,
      review_required: true
    };

    let report;
    if (options.reportId) {
      report = await client.getReport(options.reportId);
      if (!report) throw new Error('The saved report draft could not be found. No new report was created.');
      if (!['draft', 'correction_requested'].includes(report.status)) {
        throw new Error('This report is no longer editable. Refresh its current status before continuing.');
      }
      if (typeof client.updateReportDraft !== 'function') {
        throw new Error('The BUSHO client cannot update a returned draft. Refresh the application.');
      }
      report = await client.updateReportDraft(report.id, {
        originalText,
        languageCode: options.languageCode || 'en',
        reportingDate: options.reportingDate,
        summary
      });
    } else {
      if (typeof options.onDraftCreated !== 'function') {
        throw new Error('A local draft-ID persistence callback is required before creating a report.');
      }
      report = await client.createReportDraft({
        originalText,
        languageCode: options.languageCode || 'en',
        reportingDate: options.reportingDate,
        summary
      });
      if (!report || !report.id) throw new Error('BUSHO did not return a report ID. The report was not submitted.');
      // Persist the ID locally before any subsequent network operation so retries
      // replace the same draft instead of creating duplicate reports.
      await options.onDraftCreated(report.id);
    }

    if (typeof client.replaceReportItems !== 'function') {\n      throw new Error('The BUSHO client does not support safe report-item replacement. Refresh the application.');\n    }\n    await client.replaceReportItems(report.id, items);
    const submitted = await client.submitReport(report.id);
    if (!submitted || !submitted.id) {
      throw new Error('The report draft was saved, but submission was not confirmed. Keep its ID and retry safely.');
    }
    return { report: submitted, itemCount: items.length, summary };
  }

  return Object.freeze({
    extractionVersion: EXTRACTION_VERSION,
    toDatabaseItems,
    toReportSummary,
    persistConfirmedReport
  });
});
