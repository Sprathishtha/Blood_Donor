// import { supabase } from "../lib/supabase";

// /* -----------------------------
// CREATE NOTIFICATIONS (24H EXPIRY)
// ------------------------------ */
// export async function createNotifications(notifications: any[]) {

//   if (!notifications.length) return;

//   const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

//   const dataToInsert = notifications.map(n => ({
//     ...n,
//     expires_at: expiry.toISOString()
//   }));

//   const { error } = await supabase
//     .from("notifications")
//     .insert(dataToInsert);

//   if (error) {
//     console.error("Notification insert error:", error);
//     throw error;
//   }
// }

// /* -----------------------------
// UPDATE NOTIFICATION STATUS
// ------------------------------ */
// export async function updateNotificationStatus(
//   notificationId: string,
//   status: "accepted" | "declined"
// ) {

//   const { error } = await supabase
//     .from("notifications")
//     .update({
//       status,
//       response: status,
//       responded_at: new Date().toISOString()
//     })
//     .eq("id", notificationId);

//   if (error) throw error;
// }

// /* -----------------------------
// EXPIRE AFTER 24H
// ------------------------------ */
// export async function expireOldNotifications() {

//   const { error } = await supabase
//     .from("notifications")
//     .update({ status: "expired" })
//     .lt("expires_at", new Date().toISOString())
//     .eq("status", "pending");

//   if (error) throw error;
// }

// /* -----------------------------
// DONOR RESPONSE (🔥 FIXED CORRECTLY)
// ------------------------------ */
// export const respondToNotification = async (
//   notificationId: string,
//   response: "accepted" | "declined"
// ) => {

//   /* ---------- GET NOTIFICATION ---------- */
//   const { data: notif, error } = await supabase
//     .from("notifications")
//     .select("request_id,user_id,role")
//     .eq("id", notificationId)
//     .single();

//   if (error || !notif) {
//     console.error("Notification fetch error:", error);
//     return;
//   }

//   const requestId = notif.request_id;

//   /* ---------- DECLINE ---------- */
//   if (response === "declined") {
//     await updateNotificationStatus(notificationId, "declined");
//     return;
//   }

//   /* ---------- ACCEPT ---------- */

//   // 1️⃣ update notification
//   await updateNotificationStatus(notificationId, "accepted");

//   /* ---------- 🔥 GET DONOR ID (CRITICAL FIX) ---------- */
//   const { data: donor, error: donorError } = await supabase
//     .from("donors")
//     .select("id")
//     .eq("auth_user_id", notif.user_id)
//     .single();

//   if (donorError || !donor) {
//     console.error("Donor not found:", donorError);
//     return;
//   }

//   /* ---------- 🔥 UPDATE BLOOD REQUEST ---------- */
//   const { error: updateError } = await supabase
//     .from("blood_requests")
//     .update({
//       status: "matched",
//       matched_donor_id: donor.id   // ✅ CORRECT (NOT auth_user_id)
//     })
//     .eq("id", requestId);

//   if (updateError) {
//     console.error("Request update error:", updateError);
//   }

//   /* ---------- DONOR COOLDOWN ---------- */
//   await supabase
//     .from("donors")
//     .update({
//       available: false,
//       next_available_at: new Date(
//         Date.now() + 60 * 24 * 60 * 60 * 1000
//       )
//     })
//     .eq("auth_user_id", notif.user_id);
// };



// /* -----------------------------
// GET USER NOTIFICATIONS
// ------------------------------ */
// export const getUserNotifications = async (
//   userId: string,
//   role: string
// ) => {

//   const { data, error } = await supabase
//     .from("notifications")
//     .select(`
//       id,
//       message,
//       status,
//       sent_at,
//       expires_at,
//       response,
//       blood_requests(
//         blood_group,
//         urgency_level,
//         quantity,
//         location,
//         hospitals(name,address,phone,location)
//       )
//     `)
//     .eq("user_id", userId)
//     .eq("role", role)
//     .in("status", ["pending", "accepted"])
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Notification fetch error:", error);
//     return [];
//   }

//   return data;
// };

import { supabase } from "../lib/supabase";

/* -----------------------------
CREATE NOTIFICATIONS (24H)
------------------------------ */
export async function createNotifications(notifications: any[]) {

  if (!notifications.length) return;

  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const dataToInsert = notifications.map(n => ({
    ...n,
    expires_at: expiry.toISOString()
  }));

  const { error } = await supabase
    .from("notifications")
    .insert(dataToInsert);

  if (error) {
    console.error("Notification insert error:", error);
    throw error;
  }
}

/* -----------------------------
UPDATE STATUS
------------------------------ */
export async function updateNotificationStatus(
  notificationId: string,
  status: "accepted" | "declined"
) {

  const { error } = await supabase
    .from("notifications")
    .update({
      status,
      response: status,
      responded_at: new Date().toISOString()
    })
    .eq("id", notificationId);

  if (error) throw error;
}

/* -----------------------------
EXPIRE OLD
------------------------------ */
export async function expireOldNotifications() {

  await supabase
    .from("notifications")
    .update({ status: "expired" })
    .lt("expires_at", new Date().toISOString())
    .eq("status", "pending");
}

/* -----------------------------
DONOR RESPONSE
------------------------------ */
export const respondToNotification = async (
  notificationId: string,
  response: "accepted" | "declined"
) => {

  const { data: notif, error } = await supabase
    .from("notifications")
    .select("request_id,user_id,role")
    .eq("id", notificationId)
    .single();

  if (error || !notif) {
    console.error(error);
    return;
  }

  const requestId = notif.request_id;

  /* ---------- DECLINE ---------- */
  if (response === "declined") {
    await updateNotificationStatus(notificationId, "declined");
    return;
  }

  /* ---------- ACCEPT ---------- */

  await updateNotificationStatus(notificationId, "accepted");

  /* 🔥 GET DONOR ID */
  const { data: donor } = await supabase
    .from("donors")
    .select("id")
    .eq("auth_user_id", notif.user_id)
    .single();

  if (!donor) return;

  /* 🔥 UPDATE REQUEST */
  await supabase
    .from("blood_requests")
    .update({
      status: "matched",
      matched_donor_id: donor.id
    })
    .eq("id", requestId);

  /* 🔥 BLOCK DONOR 60 DAYS */
  await supabase
    .from("donors")
    .update({
      available: false,
      next_available_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      )
    })
    .eq("auth_user_id", notif.user_id);
};

/* -----------------------------
GET NOTIFICATIONS
------------------------------ */
export const getUserNotifications = async (
  userId: string,
  role: string
) => {

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      message,
      status,
      sent_at,
      expires_at,
      response,
      blood_requests(
        blood_group,
        urgency_level,
        quantity,
        location,
        status,
        hospitals(name,address,phone,location)
      )
    `)
    .eq("user_id", userId)
    .eq("role", role)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
};