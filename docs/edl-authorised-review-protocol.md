# Chhattisgarh EDL 2025 — authorised review protocol

**Status:** Draft review worksheet. Not an approval, clinical reference, procurement instruction or import authorization.

## Source and scope

- Issuing authority shown in the document: Department of Health and Family Welfare, Government of Chhattisgarh.
- Document: Essential Drug List – 2025.
- Notification date: 12-Nov-2025.
- Source URL: https://dpdmis.in/faconline/Common/Document/EDL_2025.pdf
- Uploaded source PDF SHA-256: `6e9b8e83d93fcd613328214dde4f979d592d8af0e01c3d4e41a26b0d0ee1c72e`.
- Annexure 4: PHC / PHC-AAM / UPHC, 172 numbered source rows, printed footer pages 47–52.
- Annexure 5: SHC-AAM, 106 numbered source rows, printed footer pages 53–56.
- Physical PDF pages are printed footer page + 2.

The source rows are preserved verbatim in the two transcription JSON files. The CSV worksheet contains all 278 rows and blank decision/normalization/reviewer fields.

## Required reviewer authority

The review must be performed by a named pharmacist or other reviewer whose authority to review the Chhattisgarh EDL and medicine reference mapping is confirmed by their organization. Record:

- Full name and designation.
- Organization / department.
- Who or what confirms their review authority.
- Review date/time.
- Evidence or official reference for any interpretation that is not explicit in the source.

A BUSHO developer or automated test is not a substitute for an authorised pharmacist/CGMSC reviewer.

## Row review procedure

For each row:

1. Match the annexure, item number and printed footer page against the rendered source PDF.
2. Preserve the source description exactly. If the PDF itself is truncated, misspelled or inconsistent, record that fact; do not silently repair it.
3. Decide whether the row is:
   - one medicine item;
   - multiple distinct medicine/formulation items;
   - a programme/guideline reference rather than an inventory SKU;
   - a non-medicine commodity / device / consumable;
   - unclear and requiring escalation.
4. Only if authorized, enter each candidate medicine mapping separately, with normalized name, dosage form, strength, stock unit, facility applicability and local DPDMIS/CGMSC code where supported by authoritative evidence.
5. Cite the source page and any official clarification / catalogue / code evidence used.
6. Leave fields blank and keep the row pending if the source does not support a reliable decision.

Do not infer stock balances, pack sizes, procurement quantities, buffer norms, clinical protocols, dosage instructions or availability from this EDL.

## Known source issues requiring explicit attention

- Annexure 4 item 36: rendered source ends `Albendazole Oral liquid 200 mg/5 m`.
- Annexure 4 item 37: rendered source ends `Diethylcarbama`.
- Annexure 5 item 22: rendered source ends `Gentamicin Injection 80 mg/m`.
- Annexure 4 item 17: rendered source says `Levocetirizine` twice; PDF text extraction had an OCR spelling discrepancy.
- Annexure 4 item 172 says `Medroxprogesterone Acetate Injection 150 mg`; Annexure 5 item 81 says `Medroxyprogesterone Acetate Injection 150 mg`. Both spellings appear in the rendered source.
- Programme references include Annexure 4 items 52, 53, 58, 135 and Annexure 5 items 27, 28, 32, 87. Do not map these rows to medicine SKUs without formal interpretation.
- Annexure 5 item 82 is printed as `FP Commodities: PTK`; determine its meaning only from an authorized source.
- Asterisk markers are present on selected rows. The reviewed annexures do not provide a complete general legend for all asterisks. Preserve them and do not infer a legal category from the marker alone.

## Highlighted source text

The visual annotation register records seven highlighted spans:
- Annexure 4 items 13, 58, 66 and 119.
- Annexure 5 items 4, 32 and 35.

Highlighting is recorded as source formatting only. It is not assumed to mean approval, addition, amendment or special priority.

## Review outcomes and gates

Use one of these decisions per row:
- `pending_authorised_review`
- `source_confirmed_no_normalization`
- `reference_mapping_approved`
- `programme_reference_not_sku`
- `non_medicine_item_escalated`
- `source_discrepancy_escalated`

The review-decision validator requires exact source-row/page/text matching, rendered-PDF confirmation, reviewer identity/designation/organization, organization-confirmed authority, timestamp and evidence. A mapping approval also requires candidate mapping fields and facility applicability consistent with the annexure.

Even a valid review batch does **not** authorize live import, stock use, prescribing or procurement. Those require a separate approved release decision and data-governance review.

## Files

- Full PHC transcription: `data/medicine-catalogue/chhattisgarh-edl-2025-phc-aam-source-transcription.json`
- Full SHC transcription: `data/medicine-catalogue/chhattisgarh-edl-2025-shc-aam-source-transcription.json`
- Row evidence queue: `data/medicine-catalogue/chhattisgarh-edl-2025-review-queue.json`
- Highlight / note register: `data/medicine-catalogue/chhattisgarh-edl-2025-source-annotations.json`
- Fillable review worksheet: `data/medicine-catalogue/chhattisgarh-edl-2025-pharmacist-review-template.csv`
- Review validator: `scripts/validate-medicine-review-decisions.mjs`
