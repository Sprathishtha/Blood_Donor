
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow, isSameDay, format } from 'date-fns';
import { parsePostGISPoint, calculateHaversineDistance, Coordinates } from '../utils/geospatial';
import { RequestRouteMap } from '../components/RequestRouteMap';

interface BloodRequest {
  id: string;
  blood_group: string;
  urgency_level: string;
  quantity: number;
  status: string; // pending | matched | completed | cancelled
  radius_km: number;
  created_at: string;
  matched_donor_id: string | null;
  location: any; // PostGIS geography
  donors?: {
    full_name: string;
    phone: string;
    location?: any;
  };
}

interface Stats {
  pending: number;
  matched: number;
  fulfilled: number;
}

interface RecordStats {
  fulfilled: number;
  cancelled: number;
  matched: number;
}

export function HospitalDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [todayActive, setTodayActive] = useState<BloodRequest[]>([]);
  const [recordRequests, setRecordRequests] = useState<BloodRequest[]>([]);
  const [todayStats, setTodayStats] = useState<Stats>({ pending: 0, matched: 0, fulfilled: 0 });
  const [recordStats, setRecordStats] = useState<RecordStats>({ fulfilled: 0, cancelled: 0, matched: 0 });

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const loadRequests = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .select(
          `
          *,
          donors:matched_donor_id (
            full_name,
            phone,
            location
          )
        `
        )
        .eq('hospital_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const all = (data || []) as BloodRequest[];
      const today = new Date();

      const isToday = (r: BloodRequest) => isSameDay(new Date(r.created_at), today);

      const todayPending = all.filter((r) => isToday(r) && r.status === 'pending').length;
      const todayMatched = all.filter((r) => isToday(r) && r.status === 'matched').length;
      const todayFulfilled = all.filter((r) => isToday(r) && (r.status === 'completed' || r.status === 'fulfilled')).length;

      setTodayStats({ pending: todayPending, matched: todayMatched, fulfilled: todayFulfilled });

      const previous = all.filter((r) => !isToday(r));
      const prevFulfilled = previous.filter((r) => r.status === 'completed' || r.status === 'fulfilled').length;
      const prevCancelled = previous.filter((r) => r.status === 'cancelled').length;
      const prevMatched = previous.filter((r) => r.status === 'matched').length;

      setRecordStats({ fulfilled: prevFulfilled, cancelled: prevCancelled, matched: prevMatched });

      const activeToday = all.filter((r) => isToday(r) && (r.status === 'pending' || r.status === 'matched'));
      const records = all.filter((r) => !(isToday(r) && (r.status === 'pending' || r.status === 'matched')));

      setTodayActive(activeToday);
      setRecordRequests(records);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFulfilled = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('blood_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (error) throw error;
      await loadRequests();
    } catch (err) {
      console.error('Error marking request fulfilled:', err);
      alert('Failed to mark request as fulfilled');
    }
  };
  const handleCancelRequest = async (requestId: string) => {
  try {
    // 1️⃣ Update request status
    await supabase
      .from('blood_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);

    // 2️⃣ Expire pending notifications
    await supabase
      .from('notifications')
      .update({ status: 'expired' })
      .eq('request_id', requestId)
      .eq('status', 'pending');

    await loadRequests();
  } catch (err) {
    console.error('Error cancelling request:', err);
    alert('Failed to cancel request');
  }
};

const handleDeleteRequest = async (requestId: string) => {
  try {
    // 1️⃣ Delete notifications first (FK safety)
    await supabase
      .from('notifications')
      .delete()
      .eq('request_id', requestId);

    // 2️⃣ Delete request
    await supabase
      .from('blood_requests')
      .delete()
      .eq('id', requestId);

    await loadRequests();
  } catch (err) {
    console.error('Error deleting request:', err);
    alert('Failed to delete request');
  }
};
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
      case 'matched':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Matched</span>
          </span>
        );
      case 'completed':
      case 'fulfilled':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Fulfilled</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-500';
      case 'urgent':
        return 'border-orange-500';
      default:
        return 'border-blue-500';
    }
  };

  const getDistanceAndEta = (hospitalLoc: Coordinates | null, donorLoc: Coordinates | null) => {
    if (!hospitalLoc || !donorLoc) return null;
    const km = calculateHaversineDistance(hospitalLoc, donorLoc);
    const minutes = Math.round((km / 30) * 60); // assume 30 km/h
    return { km, minutes };
  };

  const renderRequestCard = (request: BloodRequest, showFulfillButton: boolean) => {
    const hospitalCoords = parsePostGISPoint(request.location);
    const donorCoords = parsePostGISPoint(request.donors?.location ?? null);
    const distanceInfo = getDistanceAndEta(hospitalCoords, donorCoords);

    return (
      <div
        key={request.id}
        className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${getUrgencyColor(
          request.urgency_level
        )}`}
      >
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl font-bold text-red-600">
                {request.blood_group}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.urgency_level === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : request.urgency_level === 'urgent'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {request.urgency_level.toUpperCase()}
              </span>
              {getStatusBadge(request.status)}
            </div>
            <p className="text-sm text-gray-500">
              Created{' '}
              {formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>

          {showFulfillButton && request.status === 'matched' && (
            <button
              onClick={() => handleMarkFulfilled(request.id)}
              className="ml-4 inline-flex items-center rounded-md bg-green-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-600"
            >
              Mark as Fulfilled
            </button>
          )}
          {request.status === 'pending' && (
  <div className="flex gap-2 mt-3">
    <button
      onClick={() => handleCancelRequest(request.id)}
      className="px-3 py-1.5 text-sm rounded-md bg-gray-200 hover:bg-gray-300"
    >
      Cancel
    </button>

    <button
      onClick={() => handleDeleteRequest(request.id)}
      className="px-3 py-1.5 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
    >
      Delete
    </button>
  </div>
)}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Quantity</p>
            <p className="font-semibold text-gray-900">{request.quantity} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Search Radius</p>
            <p className="font-semibold text-gray-900">{request.radius_km} km</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold text-gray-900 capitalize">
              {request.status === 'completed' ? 'fulfilled' : request.status}
            </p>
          </div>
        </div>

        {request.matched_donor_id && request.donors && (
          <>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
              <p className="text-sm font-medium text-green-800 mb-1">
                Matched Donor
              </p>
              <div className="flex items-center justify-between">
                <p className="text-green-900 font-semibold">
                  {request.donors.full_name}
                </p>
                <p className="text-green-700">{request.donors.phone}</p>
              </div>

              {distanceInfo && (
                <div className="mt-2 text-xs text-green-800 flex gap-4">
                  <span>
                    Approx distance:{' '}
                    <strong>{distanceInfo.km.toFixed(1)} km</strong>
                  </span>
                  <span>
                    Est. travel time:{' '}
                    <strong>{distanceInfo.minutes} mins</strong>
                  </span>
                </div>
              )}
            </div>

            {hospitalCoords && donorCoords && (
              <div className="mt-2 overflow-hidden rounded-lg border">
                <RequestRouteMap
                  hospitalLocation={hospitalCoords}
                  donorLocation={donorCoords}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const todayLabel = format(new Date(), 'dd MMM yyyy');

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blood Requests</h1>
            <p className="text-gray-600 mt-2">Manage and track your blood requests</p>
            <p className="text-xs text-gray-500 mt-1">Today: <span className="font-medium">{todayLabel}</span></p>
          </div>

          <div className="flex items-center gap-3">
            {/* New Request (page button - visible on this page) */}
            <Link
              to="/hospital/new-request"
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </Link>

            {/* History page (separate page) */}
            <button
              onClick={() => navigate('/hospital/history')}
              className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 transition text-sm font-medium"
            >
              History
            </button>
          </div>
        </div>

        {/* Today stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending (today)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{todayStats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Matched (today)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{todayStats.matched}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fulfilled (today)</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{todayStats.fulfilled}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>

        <div className="mb-6 text-sm text-gray-600">
          Previous records: {recordStats.fulfilled} fulfilled, {recordStats.matched} matched, {recordStats.cancelled} cancelled (before today).
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="text-gray-600 mt-4">Loading requests...</p>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Today's Active Requests</h2>

              {todayActive.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-6 text-center text-sm text-gray-600">No pending or matched requests created today.</div>
              ) : (
                <div className="space-y-4">
                  {todayActive.map((r) => renderRequestCard(r, true))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}



