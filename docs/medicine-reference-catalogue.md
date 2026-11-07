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

The notification says the EDL is for District Hospitals, Civil Hospitals, CHCs, PHCs, Health and Wellness Centres and Sub Health Centres. The PDF has separate annexures. The contents index and printed footers agree: Annexure 4 begins on printed page 47 and Annexure 5 on printed page 53. BUSHO stores the **printed footer page** as source provenance, not the PDF's 1-based physical page index.
- Annexure 4: PHC, PHC-AAM and UPHC, printed pages 47–52, 172 numbered source entries.
- Annexure 5: SHC-AAM, printed pages 53–56, 106 numbered source entries.

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

- The official 59-page PDF was opened from the DPDMIS source URL. The notification page identifies the Department of Health and Family Welfare, Government of Chhattisgarh, and date 12-Nov-2025. Annexure 4 starts on printed page 47 and Annexure 5 on printed page 53.
- Structural audit of the repository transcriptions: 172 Annexure 4 rows + 106 Annexure 5 rows = 278; contiguous row numbers; expected printed-page mapping; no structural errors.
- Targeted machine flags: 15 rows (1 possible truncated unit/OCR, 6 spelling/OCR, 8 programme-guideline references). The exact row list is in the review queue.
- **Not completed:** visual/page-by-page reconciliation of every row against the rendered PDF, PDF checksum capture, two-person review, pharmacist/CGMSC review, normalized mapping and live import. Do not represent the structural audit as clinical or source accuracy approval.
- Note: the source JSON currently uses `sampleOnly: true` as a non-importability safety marker despite containing the full numbered annexure transcriptions. This field name is semantically misleading and should be replaced in a separately tested schema migration with explicit `completeTranscription` and `importApproved` fields; do not remove the existing guard until consumers and tests are updated.

## 6. What is not done yet

- The 172-row PHC-AAM/UPHC and 106-row SHC-AAM annexures have been transcribed from PDF text, but none of the 278 rows has completed rendered-PDF human reconciliation.
- No District Hospital, Civil Hospital, CHC or UPHC-only catalogue has been loaded.
- The structural audit has confirmed row counts, contiguous numbering, annexure taxonomy and expected printed-page mapping for all 278 rows. It flagged 15 rows for targeted review: 1 possible truncated unit/OCR issue, 6 spelling/OCR checks and 8 programme-guideline references. This is a machine-assisted triage result, not proof that the remaining rows are correct.
- A row-by-row review queue is maintained at `data/medicine-catalogue/chhattisgarh-edl-2025-review-queue.json`; 16 targeted rows have rendered-page evidence and remain pending authorised review; the other 262 rows still require targeted row-level comparison. All rows remain non-importable.
- No normalized ingredient/formulation/unit mapping has been approved.
- No facility has been mapped to the EDL or to inventory items.
- No actual stock, expiry, procurement, DPDMIS API or government transaction has been imported or simulated in the live project.
- The new migration has not been applied to connected Supabase. This remains CI-only until a separate release approval.

## 7. Source notes

The EDL itself describes alignment with IPHS/NHSRC EML, NLEM, WHO EML, STGs and state facility consultations. It also explains tier-wise U/P/S/T stratification and buffer-stock planning. BUSHO does not recreate those policy decisions; it preserves the published reference and leaves local applicability and stock workflow with the authorised system and personnel.

This document is an engineering data-governance note, not a clinical or procurement SOP.


## 9. PDF text-layer comparison checkpoint

The uploaded 59-page PDF was rendered and visually inspected for all 15 machine-flagged rows plus Annexure 5 item 81 to verify the cross-annexure spelling difference. The PDF SHA-256 is recorded in the review queue. Annexure 4 item 36 visibly ends `200 mg/5 m`; preserve the source exactly and seek an official erratum/authorised interpretation. Annexure 4 item 172 visibly says `Medroxprogesterone`, while Annexure 5 item 81 says `Medroxyprogesterone`; this is a source-document inconsistency, not merely a transcription discrepancy. All 16 targeted rows remain pending authorised review; programme-guideline rows are not inventory SKUs.


## 10. Evidence boundary for the current review pass

The initial audit contained a systematic +1 error in its printed-page map. The uploaded PDF confirmed Annexure 4 pages 47–52 and Annexure 5 pages 53–56. Both full source transcriptions, the 24-row sample, review queue and audit script have been corrected to use the printed footer pages. The PDF SHA-256 and 16 targeted visual checks are recorded in the queue. This is not two-person or pharmacist/CGMSC approval; 262 rows still require targeted row-level comparison.


## 11. Uploaded PDF visual-review checkpoint

- Inspected the uploaded 59-page `EDL_2025.pdf`; SHA-256: `6e9b8e83d93fcd613328214dde4f979d592d8af0e01c3d4e41a26b0d0ee1c72e`.
- Corrected a systematic +1 error in prior page provenance: Annexure 4 uses printed footer pages 47–52 (physical PDF pages 49–54); Annexure 5 uses printed footer pages 53–56 (physical PDF pages 55–58).
- Updated both full source transcriptions, the 24-row sample, review queue and audit script to match printed footer pages.
- Visually checked 15 machine-flagged rows plus SHC Annexure 5 item 81 (16 rows total). No source spelling was silently corrected. Item 36's truncated `200 mg/5 m` is visibly present in the PDF. Annexure 4 item 172 and Annexure 5 item 81 visibly differ (`Medroxprogesterone` / `Medroxyprogesterone`).
- All 16 checked rows remain pending authorised reviewer decision. The remaining 262 rows are not yet individually reconciled. No normalized medicine mapping, live import, stock use or prescribing use is approved.
