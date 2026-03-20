import { supabase } from '../lib/supabase'

/* ===============================
   BLOOD RECEIVE COMPATIBILITY
================================ */

const RECEIVE_COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

/* ===============================
   FIND DONORS (SIMPLE)
================================ */

export async function findDonorsWithExpansion(
  bloodGroup: string,
  location: { longitude: number; latitude: number }
) {

  const compatibleDonors = RECEIVE_COMPATIBILITY[bloodGroup] || [bloodGroup]

  console.log("Searching donors for:", compatibleDonors)

  const { data: donors, error } = await supabase
    .from("donors")
    .select("id, auth_user_id, full_name, phone, blood_group, available, next_available_at")
    .in("blood_group", compatibleDonors)

  if (error) {
    console.error("Donor fetch error:", error)
    return { donors: [] }
  }

  /* ✅ FILTER AVAILABLE + COOLDOWN */
  const filtered = (donors || []).filter((d: any) => {

    if (!d.available) return false

    if (!d.next_available_at) return true

    return new Date(d.next_available_at) <= new Date()
  })

  console.log("Final donors:", filtered)

  return { donors: filtered }
}