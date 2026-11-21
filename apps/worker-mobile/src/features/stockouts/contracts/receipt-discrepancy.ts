/**
 * M1 contract boundary for SHC physical receipt discrepancies.
 *
 * Current backend fields are shc_received_quantity and discrepancy_note.
 * Do not add guessed database columns here. Any future structured schema must
 * be introduced as a separate adapter after backend/API approval.
 */

export type ReceiptDiscrepancyKind = 'short_quantity' | 'wrong_strength' | 'damaged';

export type ReceiptDiscrepancyInput = {
  kind: ReceiptDiscrepancyKind;
  receivedQuantity: number;
  note: string;
};

export type CurrentReceiptDiscrepancyPayload = {
  shc_received_quantity: number;
  discrepancy_note: string;
};

const DISCREPANCY_LABEL: Record<ReceiptDiscrepancyKind, string> = {
  short_quantity: 'Short quantity',
  wrong_strength: 'Wrong strength',
  damaged: 'Damaged',
};

/**
 * Serializes the UI-level discrepancy classification into the existing
 * supported receipt payload. The server remains authoritative for whether a
 * given transition and quantity are permitted.
 */
export function toCurrentReceiptDiscrepancyPayload(
  input: ReceiptDiscrepancyInput,
): CurrentReceiptDiscrepancyPayload {
  if (!Number.isFinite(input.receivedQuantity) || input.receivedQuantity < 0) {
    throw new Error('Received quantity must be a non-negative number.');
  }
  const note = input.note.trim();
  if (!note) throw new Error('A short explanation is required for a receipt discrepancy.');

  return {
    shc_received_quantity: input.receivedQuantity,
    discrepancy_note: `[${DISCREPANCY_LABEL[input.kind]}] ${note}`,
  };
}

/**
 * FUTURE CONTRACT ADAPTER:
 * A dedicated structured discrepancy schema is intentionally not assumed.
 * Add a new serializer here only after the backend migration/API contract is
 * approved and tested; never send speculative column names to PostgREST.
 */
