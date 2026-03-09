import { supabase } from '../lib/supabase'
import { findDonorsWithExpansion } from './matchingService'
import { createNotifications, updateNotificationStatus, expirePendingNotificationsForRequest } from './notificationService'

export async function createRequest(
  hospitalId: string,
  bloodGroup: string,
  quantity: number,
  location: { longitude: number; latitude: number },
  urgencyLevel: string = 'normal'
) {

  const { data: request, error: requestError } = await supabase
    .from('blood_requests')
    .insert({
      hospital_id: hospitalId,
      blood_group: bloodGroup,
      quantity,
      urgency_level: urgencyLevel,
      units_fulfilled: 0,
      status: 'pending',
      location: `POINT(${location.longitude} ${location.latitude})`
    })
    .select()
    .single()

  if (requestError || !request) {
    throw requestError || new Error("Failed to create request")
  }

  const { donors } = await findDonorsWithExpansion(bloodGroup, location)

  const [banksRes, hospitalsRes] = await Promise.all([
    supabase.from('blood_banks').select('id,auth_user_id'),
    supabase.from('hospitals').select('id,auth_user_id').neq('id', hospitalId)
  ])

  const bloodBanks = banksRes.data || []
  const otherHospitals = hospitalsRes.data || []

  const notifications: {
    request_id: string
    role: 'donor' | 'blood_bank' | 'hospital'
    user_id: string
    status: string
    message: string
  }[] = []

  const message = `New ${urgencyLevel === 'critical' ? 'CRITICAL ' : ''}blood request for ${quantity} unit(s) of ${bloodGroup}`

  donors.forEach((donor: any) => {

    if (!donor.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'donor',
      user_id: donor.auth_user_id,
      status: 'pending',
      message
    })

  })

  bloodBanks.forEach((bank: any) => {

    if (!bank.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'blood_bank',
      user_id: bank.auth_user_id,
      status: 'pending',
      message
    })

  })

  otherHospitals.forEach((hospital: any) => {

    if (!hospital.auth_user_id) return

    notifications.push({
      request_id: request.id,
      role: 'hospital',
      user_id: hospital.auth_user_id,
      status: 'pending',
      message
    })

  })

  if (notifications.length > 0) {
    await createNotifications(notifications)
  }

  return request
}



export async function processNotificationResponse(
  notificationId: string,
  response: 'accepted' | 'declined',
  unitsProvided: number = 1
) {

  const { data: notif } = await supabase
    .from('notifications')
    .select('*, blood_requests(*)')
    .eq('id', notificationId)
    .single()

  if (!notif) return

  const request = notif.blood_requests

  if (response === 'declined') {

    await updateNotificationStatus(notificationId, 'declined')
    return
  }

  let updateData: any = {
    units_fulfilled: request.units_fulfilled + unitsProvided
  }

  // donor
  if (notif.role === "donor") {
    updateData.matched_donor_id = notif.user_id
  }

  // blood bank
  if (notif.role === "blood_bank") {
    updateData.matched_bloodbank_id = notif.user_id
    updateData.bloodbank_units = unitsProvided
  }

  const newFulfilled = request.units_fulfilled + unitsProvided

  if (newFulfilled >= request.quantity) {
    updateData.status = "matched"
  }

  await supabase
    .from("blood_requests")
    .update(updateData)
    .eq("id", request.id)

  await updateNotificationStatus(notificationId, "accepted")

  if (newFulfilled >= request.quantity) {
    await expirePendingNotificationsForRequest(request.id)
  }

}