// import { supabase } from "../lib/supabase";

// export async function createNotifications(notifications: any[]) {

//   if (!notifications.length) return;

//   const { error } = await supabase
//     .from("notifications")
//     .insert(notifications);

//   if (error) {
//     console.error("Notification insert error:", error);
//     throw error;
//   }
// }

// export async function updateNotificationStatus(
//   notificationId: string,
//   status: "accepted" | "declined"
// ) {

//   const { error } = await supabase
//     .from("notifications")
//     .update({
//       status,
//       responded_at: new Date().toISOString()
//     })
//     .eq("id", notificationId);

//   if (error) throw error;
// }

// export async function expirePendingNotificationsForRequest(requestId: string) {

//   const { error } = await supabase
//     .from("notifications")
//     .update({ status: "expired" })
//     .eq("request_id", requestId)
//     .eq("status", "pending");

//   if (error) throw error;
// }
// export const respondToNotification = async (
//   notificationId: string,
//   response: "accepted" | "declined"
// ) => {

//   const { data: notif } = await supabase
//     .from("notifications")
//     .select("request_id,user_id")
//     .eq("id", notificationId)
//     .single()

//   if (!notif) return

//   const requestId = notif.request_id
//   const donorId = notif.user_id

//   if (response === "accepted") {

//     await supabase
//       .from("blood_requests")
//       .update({
//         status: "matched",
//         matched_donor_id: donorId
//       })
//       .eq("id", requestId)

//     await supabase
//       .from("notifications")
//       .update({ status: "expired" })
//       .eq("request_id", requestId)
//       .neq("id", notificationId)

//   }

//   await supabase
//     .from("notifications")
//     .update({
//       status: response,
//       response: response,
//       responded_at: new Date().toISOString()
//     })
//     .eq("id", notificationId)
// }
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
//         hospitals(name,address,phone)
//       )
//     `)
//     .eq("user_id", userId)
//     .eq("role", role)
//     .neq("status", "expired")
//     .order("created_at", { ascending: false })

//   if (error) {
//     console.error("Notification fetch error:", error)
//     return []
//   }

//   return data
// }
import { supabase } from "../lib/supabase";

/* -----------------------------
CREATE NOTIFICATIONS
------------------------------ */
export async function createNotifications(notifications: any[]) {

  if (!notifications.length) return;

  const { error } = await supabase
    .from("notifications")
    .insert(notifications);

  if (error) {
    console.error("Notification insert error:", error);
    throw error;
  }
}

/* -----------------------------
UPDATE NOTIFICATION STATUS
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
EXPIRE PENDING NOTIFICATIONS
------------------------------ */
export async function expirePendingNotificationsForRequest(requestId: string) {

  const { error } = await supabase
    .from("notifications")
    .update({ status: "expired" })
    .eq("request_id", requestId)
    .eq("status", "pending");

  if (error) throw error;
}

/* -----------------------------
DONOR RESPONSE LOGIC
------------------------------ */
export const respondToNotification = async (
  notificationId: string,
  response: "accepted" | "declined"
) => {

  const { data: notif, error } = await supabase
    .from("notifications")
    .select("request_id,user_id")
    .eq("id", notificationId)
    .single();

  if (error || !notif) {
    console.error("Notification fetch error", error);
    return;
  }

  const requestId = notif.request_id;

  /* ---------- DECLINE ---------- */

  if (response === "declined") {

    await supabase
      .from("notifications")
      .update({
        status: "declined",
        response: "declined",
        responded_at: new Date().toISOString()
      })
      .eq("id", notificationId);

    return;
  }

  /* ---------- ACCEPT ---------- */

  const { data: donor } = await supabase
    .from("donors")
    .select("id")
    .eq("auth_user_id", notif.user_id)
    .single();

  if (!donor) {
    console.error("Donor not found");
    return;
  }

  /* mark notification accepted */

  await supabase
    .from("notifications")
    .update({
      status: "accepted",
      response: "accepted",
      responded_at: new Date().toISOString()
    })
    .eq("id", notificationId);


  /* get request info */

  const { data: request } = await supabase
    .from("blood_requests")
    .select("quantity")
    .eq("id", requestId)
    .single();

  if (!request) return;

  const requiredUnits = request.quantity;


  /* count accepted donors */

  const { data: accepted } = await supabase
    .from("notifications")
    .select("id")
    .eq("request_id", requestId)
    .eq("status", "accepted");

  const acceptedUnits = accepted?.length || 0;


  /* update request status */

  if (acceptedUnits >= requiredUnits) {

    await supabase
      .from("blood_requests")
      .update({
        status: "matched"
      })
      .eq("id", requestId);


    /* expire remaining notifications */

    await supabase
      .from("notifications")
      .update({
        status: "expired",
        response: "expired"
      })
      .eq("request_id", requestId)
      .eq("status", "pending");

  }

};
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
      blood_requests!inner(
        blood_group,
        urgency_level,
        quantity,
        location,
        hospitals(name,address,phone,location)
      )
    `)
    .eq("user_id", userId)
    .eq("role", role)
    .in("status", ["pending","accepted"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Notification fetch error:", error);
    return [];
  }
 console.log("Fetched notifications:", data);
  return data;
};
