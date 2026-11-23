# Chhattisgarh facility registry — source review and import gate

**Review date:** 2026-11-07  
**Decision:** Do not seed assignable facility rows from the public snapshots currently discoverable. Obtain a current state facility master and stage it for human verification first.

## Sources reviewed

1. **MoHFW Ayushman Arogya Mandir portal** — [State and district reports](https://aam.mohfw.gov.in/Home/Implementation_hwc_state). The page lists an operational facility dataset dated **12 August 2024** and state/district totals dated **31 July 2024**. The portal itself shows a page update in August 2026, but that does not make the linked roster current. Treat the downloadable roster as historical reference only.
2. **CGMSC / DPDMIS** — [Public facility details](https://dpdmis.in/DPDMISStock/GernalReport/FacilityDetails.aspx). This is a state-government facility source and exposes a large facility list with names, facility types and warehouse/location labels. The public page is very large and its search preview shows mixed facility categories and some inconsistent/ambiguous location labels. The page does not provide a clear source snapshot date or a validated LGD crosswalk in the visible public output. It is a strong reconciliation source, but not sufficient on its own to mark facilities verified.
3. **NHSRC NQAS facility map report** — [NQAS Certified Facility Map Report](https://qps.nhsrcindia.org/nqas-map-report), updated through **31 March 2026**. It reports Chhattisgarh counts for DH, SDH, CHC, AAM-PHC, AAM-UPHC and AAM-SHC. These are certification counts, not a complete operational facility roster, so they cannot be used to create all facility rows.
4. **ABDM / HFR public registry context** — [PIB update on ABDM](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2288848&lang=1&reg=1), dated 24 July 2026, reports 5.36 lakh health facilities registered nationally as of 20 July 2026. HFR is a useful unique-identity reconciliation layer, but the public aggregate does not supply the required Chhattisgarh facility-to-LGD roster.
5. **Open Government Data hospital directory** — [National Health Portal Hospital Directory](https://www.data.gov.in/catalog/hospital-directory-national-health-portal) and [geo-coded resource](https://www.data.gov.in/resource/national-hospital-directory-geo-code-and-additional-parameters-updated-till-last-month). The catalog metadata shows an old 2018 update lineage, so it is not an acceptable current master for operational assignments.

## Required authoritative export

Request a dated Chhattisgarh facility master from the Directorate of Health Services / NHM Chhattisgarh or CGMSC, with at least:

- Stable source facility ID (DPDMIS facility code and/or HFR ID)
- Official facility name and facility type
- State, district and block LGD codes (not only free-text district/block names)
- Current operational/closed status and effective date
- AAM status and facility category, where applicable
- Source authority, extraction date and source URL or signed export reference

Reconcile DPDMIS and HFR identities where both are available. Keep PMBJK / Jan Aushadhi locations in their separate registry; do not merge them into the AAM/health-facility table.

## Staging and verification policy

The new `scripts/validate-facility-import.mjs` tool validates a supplied CSV against the Chhattisgarh LGD directory. It checks stable IDs, facility type vocabulary, district and block LGD codes, block-parent consistency, duplicate IDs, possible duplicate names, source URL and source date. Stale snapshots and ambiguous block mappings are flagged.

The tool emits a provenance manifest and staging records only. Every record is explicitly `verification_status = needs_review`, `is_synthetic = false`, and `safe_to_assign = false`. It does **not** write to Supabase. No facility may be assigned to a worker or supervisor until an authorised reviewer confirms its identity and status and the database row is explicitly promoted to `verified`.

Example (after obtaining an authorised source export):

```bash
node scripts/validate-facility-import.mjs \
  --input ./incoming/chhattisgarh-facilities.csv \
  --source "Directorate of Health Services, Chhattisgarh" \
  --source-date 2026-11-01 \
  --source-url https://official-source.example.gov.in/facility-export \
  --output ./staging/chhattisgarh-facilities-review.json
```

The example URL and date above are placeholders, not an assertion that such an export has been received.

## Current state

- Supabase `public.facilities` has **0 rows**.
- There are no workers, user-facility assignments or Auth users.
- The admin portal correctly disables worker/supervisor invitations when no verified facilities are visible.
- No facility dataset has been imported or marked verified.
