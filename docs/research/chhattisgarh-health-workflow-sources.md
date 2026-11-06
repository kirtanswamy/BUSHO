# BUSHO source and workflow audit — Chhattisgarh

**Research date:** 6 November 2026  
**Use:** Product decisions and data provenance. This is not a clinical or legal opinion.

## Government and operational sources reviewed

| Topic | Source | What it supports | Boundary |
|---|---|---|---|
| Chhattisgarh administrative directory | [IGOD: Chhattisgarh districts](https://igod.gov.in/sg/CG/E042/organizations) | 33 district entries; page last updated 7 August 2026 | Does not supply a health-facility register |
| Development blocks | [Chhattisgarh Industrial Development Policy 2024–30, reference guide](https://invest.cg.gov.in/policy-documents/402/view), Annexure “Categorization of Development Blocks”, pp. 15–16 | State table lists 33 districts and 146 development blocks (groups 10 + 61 + 75) | Industrial-policy grouping is not a health service hierarchy; retain its source/version and verify against LGD before production |
| HWC-SHC roles | [NHM / MoHFW IPHS 2022, HWC-SHC](https://nhm.gov.in/images/pdf/guidelines/iphs/iphs-revised-guidlines-2022/04-SHC_HWC_UHWC_IPHS_Guidelines-2022.pdf), Annexure 5, pp. 60 onward | CHO public-health leadership, team mentoring/supervision, reporting, inventory oversight and action planning | States may adapt detailed staffing/roles |
| Facility store workflow | [CGMSC DPDMIS Health Facility Store user manual](https://dpdmis.in/faconline/UserManuals/App_User_Manual_Health_Fac_Store.pdf) | Facility-store indent, warehouse issue, receipt, stock register, near-expiry/hold-stock, ward issue and FEFO | Manual describes the DPDMIS app. BUSHO does not have access to write to it |
| AAM/SHC stock process | [CGMSC DPDMIS AAM portal](https://dpdmis.in/shcangm/) | Opening stock, indent to warehouse / parent facility, receipt, consumption, stock register, near-expiry and hold-batch guidance | Login protected; no API credentials or write access supplied |
| Public stock source | [CGMSC Drug Public Reporting System](https://dpdmis.in/DPDMISStock/Public_HomeDrug.aspx) | Public pages for EDL, warehouses, health facilities, stock summaries and facility issue | Some report pages time out or are dynamic; do not assume a complete downloadable facility/stock export |
| State data exchange | [Digital Dwaar FAQ](https://digitaldwaar.cgstate.gov.in/faq) and [catalogue](https://digitaldwaar.cgstate.gov.in/) | Government-to-government sharing is via approved APIs with purpose/granularity/access control | Not an open public API for an unauthorised prototype |
| Historical audit | [CAG Chhattisgarh Performance Audit, Report No. 02 of 2024](https://cag.gov.in/uploads/download_audit_report/2024/Report-No.-2-of-2024%2C-Government-of-Chhattisgarh-068b1752fcef9c4.19472333.pdf), audit period ended March 2022 | Historical evidence of supply delays, HWC drug availability gaps and DPDMIS control issues | Findings relate to the audited period; do not present as current status |
| PMBJP / Janaushadhi | [PMBI: About PMBJP](https://janaushadhi.gov.in/about-pmbjb), [PMBI Kendra locator](https://janaushadhi.gov.in/locate-kendra), [PMBI agreement](https://janaushadhi.gov.in/pdf/Updated%20Tripartite%20Agreement_12122023.pdf) | Separate PMBI procurement/supply model and official Kendra locator | Do not merge PMBJK stock with CGMSC public-facility inventory |
| National AAM scale | [MoHFW Ayushman Arogya Mandir dashboard](https://aam.mohfw.gov.in/) | National/state dashboard for functional AAM counts | Dashboard is an aggregate; it is not a facility-by-facility downloadable master |

## Findings that change the product

### 1. “Supervisor approves medicine order” is not a safe assumption

IPHS assigns the CHO a broad HWC-SHC role: public-health leadership, support/supervision for MPWs and ASHAs, reporting, inventory oversight and local action planning. The state DPDMIS manual, however, describes a separate facility-store user operating the indent and receipt transactions. CGMSC / Directorate / CMHO processes sit above the facility level for annual indent, procurement and distribution.

BUSHO therefore needs distinct events and actor labels:
- supervisor verifies a field report;
- facility-store user prepares/submits an indent in the authorised stock system;
- warehouse issue is recorded separately;
- dispatch and facility receipt are separate events.

The prototype's “store officer” role is a simulation of the authorisation boundary, not a claim that BUSHO grants the real user that permission.

### 2. The state has an existing digital stock workflow

The DPDMIS manual describes an indent screen where the user selects a supply programme, views facility stock, warehouse stock and remaining annual-indent balance, enters a request quantity, adds line items and completes the indent for the warehouse module. The receipt screen records receipt number/date, indent ID, received item/quantity, batch, expiry and rack. A separate consumption transaction records issue from the main store and follows FEFO.

These are the fields BUSHO should mirror in its *demo* status trail. It should not collapse “requested”, “issued”, “in transit”, “received” and “consumed” into one “approved” flag.

### 3. Jan Aushadhi is not the HWC medicine store

PMBI's PMBJP operates Kendras with its own procurement, warehouse / authorised-distributor supply and Kendra inventory. A public HWC's CGMSC / DPDMIS stock must remain a different entity and workflow. BUSHO can link to the PMBI locator, but cannot treat every Kendra as a government HWC or let an HWC supervisor place PMBI orders.

### 4. Directory is not service coverage

The policy reference table provides 33 districts and 146 development blocks. That is enough for a state-wide location selector. It does not prove that every block has a specific number of operational AAMs, SHC-HWCs, CHCs, PHCs, staff or Jan Aushadhi Kendras. Until the appropriate health-facility master is approved and loaded, BUSHO must show zero BUSHO records / “not onboarded” instead of invented values.

### 5. AAM/CGMSC and PMBI sources have access boundaries

The public CGMSC stock portal exposes some reports; the AAM/SHC portal is login protected. Digital Dwaar describes an authorised G2G API exchange, not an unrestricted public API. PMBI provides a public locator, but a complete current location export was not available through the static public page. Integration requires credentials, API/data-sharing approval and a defined update cadence.

## Useful source links for the UI

- [MoHFW Ayushman Arogya Mandir dashboard](https://aam.mohfw.gov.in/)
- [CGMSC Drug Public Reporting System](https://dpdmis.in/DPDMISStock/Public_HomeDrug.aspx)
- [CGMSC DPDMIS AAM/SHC login and manuals](https://dpdmis.in/shcangm/)
- [PMBI Kendra locator](https://janaushadhi.gov.in/locate-kendra)
- [IGOD Chhattisgarh district directory](https://igod.gov.in/sg/CG/E042/organizations)
- [Digital Dwaar API catalogue](https://digitaldwaar.cgstate.gov.in/)
