import { supabase } from '../lib/supabase'
import { findDonorsWithExpansion } from './matchingService'
import { createNotifications } from './notificationService'

export async function createRequest(
  hospitalId: string,
  bloodGroup: string,
  quantity: number,
  location: { longitude: number; latitude: number },
  urgencyLevel: string = 'normal'
) {

  /* CREATE REQUEST */
  const { data: request, error } = await supabase
    .from('blood_requests')
    .insert({
      hospital_id: hospitalId,
      blood_group: bloodGroup,
      quantity,
      urgency_level: urgencyLevel,
      status: 'pending',
      units_fulfilled: 0,
      location: `POINT(${location.longitude} ${location.latitude})`
    })
    .select()
    .single()

  if (error || !request) {
    throw error || new Error("Failed to create request")
  }

  /* FIND DONORS */
  const { donors } = await findDonorsWithExpansion(bloodGroup, location)

  /* GET BLOOD BANKS + HOSPITALS */
  const [banksRes, hospitalsRes] = await Promise.all([
    supabase.from('blood_banks').select('auth_user_id'),
    supabase.from('hospitals').select('auth_user_id').neq('id', hospitalId)
  ])

  const bloodBanks = banksRes.data || []
  const otherHospitals = hospitalsRes.data || []

  const notifications: any[] = [];
  const message = `New ${urgencyLevel === 'critical' ? 'CRITICAL ' : ''}blood request for ${quantity} unit(s) of ${bloodGroup}`;

  /* DONORS */
  (donors ?? []).forEach((d: any) => {

    if (!d?.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'donor',
      user_id: d.auth_user_id,
      status: 'pending',
      message
    })
  })

  /* BLOOD BANKS */
  bloodBanks.forEach((b: any) => {

    if (!b?.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'blood_bank',
      user_id: b.auth_user_id,
      status: 'pending',
      message
    })
  })

  /* OTHER HOSPITALS */
  otherHospitals.forEach((h: any) => {

    if (!h?.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'hospital',
      user_id: h.auth_user_id,
      status: 'pending',
      message
    })
  })

  if (notifications.length > 0) {
    await createNotifications(notifications)
  }

  return request
}