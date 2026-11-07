# BUSHO medicine reference catalogue — Part 2D

**Status:** versioned source catalogue foundation; complete 278-row source-text transcription present; human reconciliation pending  
**Prepared:** 2026-11-07  
**Scope:** Chhattisgarh public-facility EDL 2025, Annexure 4 and Annexure 5

## 1. Authoritative source located

The Chhattisgarh Department of Health and Family Welfare issued the **Essential Drug List – 2025** through notification dated **12 November 2025** (File No. GENS-2101/4186/2025-HEALTH SECTION-2). The published PDF was generated from eOffice on 13 November 2025.

Official source:
- [Chhattisgarh EDL 2025 PDF on DPDMIS](https://dpdmis.in/faconline/Common/Document/EDL_2025.pdf)
- [DPDMIS facility store portal and manuals](https://dpdmis.in/faconline/)
- [DPDMIS public reporting system](https://dpdmis.in/DPDMISStock/Public_HomeDrug.aspx)

The notification says the EDL is for District Hospitals, Civil Hospitals, CHCs, PHCs, Health and Wellness Centres and Sub Health Centres. The PDF has separate annexures. The contents index cites the section starts as pages 47 and 53, but the printed footer on the first actual annexure sheets reads 48 and 54 respectively. BUSHO stores the **printed footer page** as source provenance, not the contents-index reference.
- Annexure 4: PHC, PHC-AAM and UPHC, printed pages 48–53, 172 numbered source entries.
- Annexure 5: SHC-AAM, printed pages 54–57, 106 numbered source entries.

**Important:** the published EDL is a facility-level reference list. It is not an inventory balance, proof of current stock, procurement authorization, prescription or clinical protocol. Some entries refer to current national programme guidelines instead of specifying individual products. Several rows contain multiple formulations and caveats. Those details must be preserved rather than silently simplified.

## 2. What has been added in the repository

- `supabase/migrations/20261107200000_medicine_reference_catalogue.sql`
  - Versioned catalogue release table with source authority, publication/source dates, URL and lifecycle status.
  - Catalogue entry table preserving annexure, facility level, original row number, printed source page, source category and verbatim source description.
  - Normalized medicine name, dosage form, strength and stock unit remain nullable; parsing state defaults to `source_text_only`.
  - Existing facility-specific `inventory_items` can optionally link to a reviewed catalogue entry. The reference catalogue is not itself a stock ledger.
  - Authenticated users receive read-only access; writes are reserved for trusted service-side import/review.
- `data/medicine-catalogue/chhattisgarh-edl-2025-sample.json`
- `data/medicine-catalogue/chhattisgarh-edl-2025-shc-aam-source-transcription.json`: all 106 numbered Annexure 5 rows transcribed from PDF text, with source descriptions, category, item number and printed footer page. This remains explicitly unreviewed and is not approved for live ingestion.
- `data/medicine-catalogue/chhattisgarh-edl-2025-phc-aam-source-transcription.json`: all 172 numbered Annexure 4 rows transcribed from PDF text. Together with Annexure 5, the files contain all 278 numbered rows. Both remain unreviewed source-text transcriptions and are not approved for live ingestion or normalized inventory mapping.
- `scripts/validate-medicine-catalogue.mjs` checks source metadata, annexure/facility-level consistency, row uniqueness, printed source-page bounds and verbatim-only staging. It intentionally refuses guessed normalized stock units or dosage fields and always marks live import unsafe.
- `scripts/audit-medicine-source-transcriptions.mjs` audits the two source files together for row-count/sequence/page mapping, duplicate rows, premature normalization and likely OCR/spelling anomalies. It creates a review queue with blank reviewer, source-PDF-check, row-interpretation, candidate-item, facility-applicability, local DPDMIS code and evidence fields. Every row starts `pending_source_reconciliation`; it never fills normalized medicine data or authorizes import.
- `scripts/validate-medicine-review-decisions.mjs` validates a completed reviewer batch against the exact transcribed source rows. It requires the rendered-PDF check, reviewer identity/designation/organization, organization-confirmed authority, timestamp, evidence note and source-row match. Mapping approval also requires complete candidate fields and matching facility applicability. A passing batch still cannot be imported to live or used for prescribing/stock decisions.

Run the structural audit with:

`node scripts/audit-medicine-source-transcriptions.mjs data/medicine-catalogue/chhattisgarh-edl-2025-phc-aam-source-transcription.json data/medicine-catalogue/chhattisgarh-edl-2025-shc-aam-source-transcription.json /tmp/edl-source-audit.json`

  - A deliberately small sample transcription (10 PHC-AAM/UPHC rows and 14 SHC-AAM rows) from the published annexures.
  - Every row carries source annexure, source item number, page, category and original description.
  - `sampleOnly: true`; this is not the complete 172-row or 106-row annexure and must never be presented as a complete medicine list.

## 3. Catalogue model and invariants

1. A **catalogue release** represents a source document/version, not a facility's actual stock.
2. An **entry** retains the source's own row number and wording. It is not assumed to represent one normalized SKU; a source row may list several formulations or a programme-level reference.
3. Facility applicability is explicit. PHC-AAM and SHC-AAM lists are separate; do not infer applicability from generic PHC/SHC labels without checking the source.
4. The source's therapeutic category is retained as text. It is not rewritten into a clinical taxonomy without review.
5. Ingredient, strength, dosage form, pack size, unit and item code must not be guessed from a free-text row.
6. Stock units are operational units (e.g. tablets, strips, vials, bottles, packets, devices) and must match the actual pack/stock-register convention. They are not interchangeable with dosage strength.
7. A catalogue entry must not be linked to a facility inventory item until a pharmacist/store-in-charge or other authorised reviewer has confirmed the mapping and local item code.
8. No stock quantity, batch, expiry, minimum/maximum stock, buffer norm, rate contract, warehouse code or current availability is inferred from the EDL.
9. EDL publication does not establish that a facility currently stocks, dispenses or is authorised to use every listed entry. Programme notes, controlled medicines and facility conditions remain visible and must be checked against current SOPs.
10. Jan Aushadhi remains a separate network and must not inherit CGMSC/AAM catalogue applicability by default.

## 4. Next catalogue ingestion steps

- Obtain/retain the original PDF as a versioned source artifact and record its cryptographic hash at ingestion time.
- Transcribe all 172 Annexure 4 and 106 Annexure 5 numbered rows, retaining exact source text, row number and printed page. Check that the row counts match the source.
- Parse each source row into candidate formulations only where the source explicitly distinguishes them. Keep the original row as the parent record and store parsing provenance.
- Run a two-person reconciliation against the PDF, including all footnotes, stars, restricted-storage notes, programme-guideline references and conditional facility notes.
- Obtain pharmacist/CGMSC confirmation before treating normalized entries, stock units, local item codes, buffer norms or facility mappings as operationally approved.
- Only after review should an inventory item link to a catalogue entry. Existing stock transactions remain in the existing facility inventory workflow.
- Do not add a clinical decision-support layer or suggest doses, substitutions, prescribing, or treatment from this catalogue.

## 5. Validation required

- Source notification date, annexure names, page ranges and source entry counts match the PDF.
- Every imported row has a unique source item number within its annexure/release.
- Source text is preserved exactly enough for side-by-side reconciliation.
- Duplicate names are allowed when they are different formulations or different source rows; do not auto-merge them.
- No record is marked clinically reviewed without named reviewer and timestamp.
- A facility-level inventory item cannot be assumed to exist just because an EDL row exists.
- Read access is authenticated; browser users cannot directly insert, update or delete catalogue rows.
- CI verifies the new migration in the PostgreSQL contract database.

## 8. Reconciliation checkpoint — 2026-11-07

- The official 59-page PDF was opened from the DPDMIS source URL. The notification page identifies the Department of Health and Family Welfare, Government of Chhattisgarh, and date 12-Nov-2025. Annexure 4 starts on printed page 48 and Annexure 5 on printed page 54.
- Structural audit of the repository transcriptions: 172 Annexure 4 rows + 106 Annexure 5 rows = 278; contiguous row numbers; expected printed-page mapping; no structural errors.
- Targeted machine flags: 15 rows (1 possible truncated unit/OCR, 6 spelling/OCR, 8 programme-guideline references). The exact row list is in the review queue.
- **Not completed:** visual/page-by-page reconciliation of every row against the rendered PDF, PDF checksum capture, two-person review, pharmacist/CGMSC review, normalized mapping and live import. Do not represent the structural audit as clinical or source accuracy approval.
- Note: the source JSON currently uses `sampleOnly: true` as a non-importability safety marker despite containing the full numbered annexure transcriptions. This field name is semantically misleading and should be replaced in a separately tested schema migration with explicit `completeTranscription` and `importApproved` fields; do not remove the existing guard until consumers and tests are updated.

## 6. What is not done yet

- The 172-row PHC-AAM/UPHC and 106-row SHC-AAM annexures have been transcribed from PDF text, but none of the 278 rows has completed rendered-PDF human reconciliation.
- No District Hospital, Civil Hospital, CHC or UPHC-only catalogue has been loaded.
- The structural audit has confirmed row counts, contiguous numbering, annexure taxonomy and expected printed-page mapping for all 278 rows. It flagged 15 rows for targeted review: 1 possible truncated unit/OCR issue, 6 spelling/OCR checks and 8 programme-guideline references. This is a machine-assisted triage result, not proof that the remaining rows are correct.
- A row-by-row review queue is maintained at `data/medicine-catalogue/chhattisgarh-edl-2025-review-queue.json`; all rows remain `pending_source_reconciliation`, `sourcePdfChecked: false`, and non-importable.
- No normalized ingredient/formulation/unit mapping has been approved.
- No facility has been mapped to the EDL or to inventory items.
- No actual stock, expiry, procurement, DPDMIS API or government transaction has been imported or simulated in the live project.
- The new migration has not been applied to connected Supabase. This remains CI-only until a separate release approval.

## 7. Source notes

The EDL itself describes alignment with IPHS/NHSRC EML, NLEM, WHO EML, STGs and state facility consultations. It also explains tier-wise U/P/S/T stratification and buffer-stock planning. BUSHO does not recreate those policy decisions; it preserves the published reference and leaves local applicability and stock workflow with the authorised system and personnel.

This document is an engineering data-governance note, not a clinical or procurement SOP.


## 9. PDF text-layer comparison checkpoint

The 15 machine-flagged rows have been compared against the official DPDMIS PDF's extracted text layer and row-level findings recorded in the review queue. This comparison confirms what the PDF text extraction contains; it is **not** a visual inspection of the rendered page. All 278 rows remain `sourcePdfChecked: false`. The text layer itself contains the apparent truncation in Annexure 4 item 36 and a spelling difference between Annexure 4 item 172 (`Medroxprogesterone`) and Annexure 5 item 81 (`Medroxyprogesterone`). Preserve source strings pending visual and authorised pharmacist/CGMSC review. Programme-guideline rows are not SKU records and must not be normalized as inventory products.


## 10. Evidence boundary for the current review pass

The current 278-row audit validates the repository transcription structure and compares entries across the two stored JSON transcriptions. It does not verify the transcription against the official PDF. In particular, the PHC Annexure 4 item 36 source string is truncated in the repository file, and the PHC Annexure 4 item 172 / SHC Annexure 5 item 81 descriptions differ by spelling. These are unresolved review items, not corrected facts. All queue entries remain `sourcePdfChecked: false`. The official PDF must be supplied or retrieved in a form that permits rendered-page inspection before any visual verification is recorded.
