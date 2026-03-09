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
   FIND DONORS WITH RADIUS EXPANSION
================================ */

export async function findDonorsWithExpansion(
  bloodGroup: string,
  location: { longitude: number; latitude: number }
) {

  const compatibleDonors = RECEIVE_COMPATIBILITY[bloodGroup] || [bloodGroup]

  for (const radius of [5, 10, 20]) {

    /* ---------- CALL RPC FOR EACH COMPATIBLE BLOOD GROUP ---------- */

    const results = await Promise.all(
      compatibleDonors.map(bg =>
        supabase.rpc("find_donors_within_radius", {
          blood_type: bg,
          lng: location.longitude,
          lat: location.latitude,
          radius_meters: radius * 1000,
        })
      )
    )

    const donorsRaw = results
      .filter(r => !r.error && r.data)
      .flatMap(r => r.data)

    if (!donorsRaw.length) continue


    /* ---------- GET DONOR PROFILE ---------- */

    const donorIds = donorsRaw.map((d: any) => d.id)

    const { data: donorProfiles } = await supabase
      .from("donors")
      .select("id, auth_user_id, full_name, phone, blood_group")
      .in("id", donorIds)


    if (!donorProfiles) {
      return { donors: [], radiusUsed: radius }
    }


    /* ---------- MERGE RPC DATA + PROFILE ---------- */

    const donors = donorsRaw.map((d: any) => {

      const profile = donorProfiles.find(p => p.id === d.id)

      return {
        id: d.id,
        auth_user_id: profile?.auth_user_id,
        full_name: profile?.full_name,
        phone: profile?.phone,
        blood_group: profile?.blood_group,
        distance_km: d.distance_km,
        location: d.location,
        is_available: true,
        is_eligible: true
      }

    })


    /* ---------- SORT BY DISTANCE ---------- */

    donors.sort(
      (a: any, b: any) =>
        parseFloat(a.distance_km) - parseFloat(b.distance_km)
    )


    return { donors, radiusUsed: radius }

  }

  return { donors: [], radiusUsed: 20 }

}