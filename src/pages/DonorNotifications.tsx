import { useState, useEffect } from "react";
import { AppLayout } from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { getUserNotifications, respondToNotification } from "../services/notificationService";
import { Bell, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RequestRouteMap } from "../components/RequestRouteMap";
import { parsePostGISPoint } from "../utils/geospatial";

interface Hospital {
  name?: string;
  address?: string;
  phone?: string;
  location?: any;
}

interface BloodRequest {
  blood_group?: string;
  urgency_level?: string;
  quantity?: number;
  location?: any;
  hospitals?: Hospital;
  status?: string; 
}

interface Notification {
  id: string;
  message?: string;
  status?: string;
  sent_at?: string;
  expires_at?: string;
  response?: string | null;
  blood_requests?: BloodRequest | null;
}

export function DonorNotifications() {

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    try {
      const data = await getUserNotifications(auth.user.id, "donor");
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (
    notificationId: string,
    response: "accepted" | "declined"
  ) => {

    setResponding(notificationId);

    try {

      await respondToNotification(notificationId, response);

      /* 🔔 SOUND REMINDER AFTER 2.5 MIN (HALF OF 5 MIN) */
      if (response === "accepted") {
        setTimeout(() => {
          const audio = new Audio("/alert.mp3"); // add sound file in public/
          audio.play().catch(() => {});
        }, 2.5 * 60 * 1000);
      }

      await loadNotifications();

    } catch (error) {
      console.error("Error responding:", error);
    } finally {
      setResponding(null);
    }

  };

  return (

    <AppLayout>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            Active blood requests that need your attention
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500"></div>
          </div>

        ) : notifications.length === 0 ? (

          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No active requests
            </h3>
            <p className="text-gray-600">
              You'll be notified here when hospitals need your blood type.
            </p>
          </div>

        ) : (

          <div className="space-y-4">

            {notifications.map((notification) => {

              const request = notification.blood_requests;
              if (!request) return null;

              const hospital = request.hospitals;

              const hospitalCoords = parsePostGISPoint(hospital?.location);
              const donorCoords = parsePostGISPoint(request.location);

              const isExpired =
                notification.expires_at &&
                new Date(notification.expires_at) < new Date();

              return (

                <div
                  key={notification.id}
                  className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500"
                >

                  <div className="flex justify-between mb-4">

                    <div>
                      <h3 className="text-lg font-bold">
                        {hospital?.name}
                      </h3>

                      {notification.sent_at && (
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(notification.sent_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>

                    {notification.status === "accepted" && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        <span>Accepted</span>
                      </div>
                    )}

                  </div>

                  <div className="text-sm mb-4">
                    <p><strong>Blood Type:</strong> {request.blood_group}</p>
                    <p><strong>Units:</strong> {request.quantity}</p>
                    <p><strong>Hospital:</strong> {hospital?.address}</p>
                  </div>

                  {!isExpired && notification.status === "pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          handleRespond(notification.id, "accepted")
                        }
                        disabled={responding === notification.id}
                        className="flex-1 bg-green-500 text-white py-2.5 rounded-lg hover:bg-green-600"
                      >
                        Accept - I Can Donate
                      </button>

                      <button
                        onClick={() =>
                          handleRespond(notification.id, "declined")
                        }
                        disabled={responding === notification.id}
                        className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                 {notification.status === "accepted" &&
 notification.response === "accepted" &&
 notification.blood_requests?.status !== "completed" &&
 !isExpired &&
 hospitalCoords &&
 donorCoords && (
                      <div className="mt-4">
                        <RequestRouteMap
                          hospitalLocation={hospitalCoords}
                          donorLocation={donorCoords}
                        />
                      </div>
                    )}
{notification.blood_requests?.status === "completed" && (
  <div className="bg-green-50 p-3 mt-3 rounded-lg text-green-700">
    Donation Completed ✅
  </div>
)}
                  {notification.status === "declined" && (
                    <div className="flex items-center text-gray-500 mt-3">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span>Request declined</span>
                    </div>
                  )}

                  {notification.status === "expired" && (
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-2 mt-3">
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        This request expired after 24 hours
                      </span>
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        )}

      </div>

    </AppLayout>

  );
}