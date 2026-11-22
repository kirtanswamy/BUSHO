import type { SupabaseClient, User } from '@supabase/supabase-js';

export type WorkerIdentity = {
  userId: string;
  profile: { displayName: string | null; preferredLanguage: string };
  worker: { id: string; displayName: string; preferredLanguage: string };
  facility: {
    id: string;
    name: string;
    district: string | null;
    facilityType: string;
    isSynthetic: boolean;
  };
};

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

function deny(message: string): never {
  throw new AccessDeniedError(message);
}

export async function loadWorkerIdentity(
  supabase: SupabaseClient,
  user: User,
): Promise<WorkerIdentity> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, preferred_language, role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) deny('No BUSHO worker profile is linked to this account. Ask your authorised administrator to provision your access.');
  if (profile.status !== 'active') deny('Your BUSHO account is not active. Contact your authorised administrator.');
  if (profile.role !== 'worker') deny('This account is not authorised for the SHC Health Worker app.');

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, auth_user_id, facility_id, display_name, preferred_language, role, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (workerError) throw workerError;
  if (!worker) deny('No worker record is linked to this account. Ask your authorised administrator to complete worker provisioning.');
  if (!worker.is_active) deny('Your worker assignment is inactive. Contact your authorised administrator.');
  if (worker.role !== 'worker') deny('Your worker record does not have the worker role. Access has been withheld.');

  const now = new Date().toISOString();
  const { data: assignments, error: assignmentError } = await supabase
    .from('user_facility_assignments')
    .select('id, facility_id, assignment_role, is_active, valid_from, valid_until')
    .eq('user_id', user.id)
    .eq('facility_id', worker.facility_id)
    .eq('assignment_role', 'worker')
    .eq('is_active', true)
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gt.${now}`);

  if (assignmentError) throw assignmentError;
  if (!assignments || assignments.length !== 1) {
    deny('Your active SHC facility assignment could not be verified. Contact your authorised administrator.');
  }

  const { data: facility, error: facilityError } = await supabase
    .from('facilities')
    .select('id, name, district, facility_type, verification_status, is_synthetic, is_active')
    .eq('id', worker.facility_id)
    .maybeSingle();

  if (facilityError) throw facilityError;
  if (!facility) deny('Your assigned facility is unavailable or outside your approved access scope.');
  if (!facility.is_active || facility.verification_status !== 'verified') {
    deny('Your assigned facility is not active and verified. Contact your authorised administrator.');
  }

  return {
    userId: user.id,
    profile: {
      displayName: profile.display_name ?? null,
      preferredLanguage: profile.preferred_language ?? 'en',
    },
    worker: {
      id: worker.id,
      displayName: worker.display_name,
      preferredLanguage: worker.preferred_language ?? profile.preferred_language ?? 'en',
    },
    facility: {
      id: facility.id,
      name: facility.name,
      district: facility.district ?? null,
      facilityType: facility.facility_type,
      isSynthetic: Boolean(facility.is_synthetic),
    },
  };
}
