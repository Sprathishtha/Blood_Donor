import { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, Phone, Mail, Calendar, Droplet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export function DonorDashboard() {

  const { userProfile, refreshProfile } = useAuth();

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const daysUntilEligible = userProfile?.last_donation_date
    ? 90 - differenceInDays(new Date(), new Date(userProfile.last_donation_date))
    : 0;


  /* ===========================
     AUTO ENABLE AFTER 60 DAYS
  =========================== */

  useEffect(() => {

    const checkEligibility = async () => {

      if (!userProfile?.next_eligible_date) return;

      const today = new Date();
      const nextDate = new Date(userProfile.next_eligible_date);

      if (today >= nextDate) {

        await supabase
          .from('donors')
          .update({
            is_available: true,
            is_eligible: true
          })
          .eq('id', userProfile.id);

        await refreshProfile();

      }

    };

    checkEligibility();

  }, [userProfile]);


  /* ===========================
     TOGGLE AVAILABILITY
  =========================== */

  const toggleAvailability = async () => {

    setUpdating(true);
    setError('');
    setSuccess('');

    try {

      const { error: updateError } = await supabase
        .from('donors')
        .update({ is_available: !userProfile?.is_available })
        .eq('id', userProfile?.id);

      if (updateError) throw updateError;

      await refreshProfile();

      setSuccess('Availability status updated successfully');

    } catch (err: any) {

      setError(err.message || 'Failed to update availability');

    } finally {

      setUpdating(false);

    }

  };


  return (

    <AppLayout>

      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your profile and availability</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blood Group</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {userProfile?.blood_group}
                </p>
              </div>
              <Droplet className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            userProfile?.is_eligible ? 'border-green-500' : 'border-orange-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eligibility</p>
                <p className={`text-xl font-bold mt-1 ${
                  userProfile?.is_eligible ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {userProfile?.is_eligible
                    ? 'Eligible'
                    : `${daysUntilEligible} days left`}
                </p>
              </div>

              {userProfile?.is_eligible
                ? <CheckCircle className="w-12 h-12 text-green-500" />
                : <Calendar className="w-12 h-12 text-orange-500" />}
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
            userProfile?.is_available ? 'border-blue-500' : 'border-gray-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-xl font-bold mt-1 ${
                  userProfile?.is_available ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {userProfile?.is_available ? 'Available' : 'Unavailable'}
                </p>
              </div>

              {userProfile?.is_available
                ? <CheckCircle className="w-12 h-12 text-blue-500" />
                : <XCircle className="w-12 h-12 text-gray-400" />}
            </div>
          </div>

        </div>


        {/* Profile Information */}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Profile Information
          </h2>

          <div className="space-y-4">

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-gray-900 font-medium">{userProfile?.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-gray-900 font-medium">{userProfile?.phone}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gray-600"/>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-gray-900 font-medium">{userProfile?.address}</p>
              </div>
            </div>

            {userProfile?.last_donation_date && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600"/>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Last Donation</p>
                  <p className="text-gray-900 font-medium">
                    {format(new Date(userProfile.last_donation_date), 'MMMM d, yyyy')}
                    {' '}
                    ({differenceInDays(new Date(), new Date(userProfile.last_donation_date))} days ago)
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>


        {/* Availability Settings */}

        <div className="bg-white rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Availability Settings
          </h2>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">

            <div>

              <p className="font-medium text-gray-900">
                Currently {userProfile?.is_available ? 'Available' : 'Unavailable'}
              </p>

              <p className="text-sm text-gray-600 mt-1">
                {userProfile?.is_available
                  ? 'You will receive notifications when hospitals need your blood type'
                  : 'You will not receive any notifications'}
              </p>

            </div>

            <button
              onClick={toggleAvailability}
              disabled={updating}
              className={`px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50 ${
                userProfile?.is_available
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {updating
                ? 'Updating...'
                : userProfile?.is_available
                ? 'Mark Unavailable'
                : 'Mark Available'}
            </button>

          </div>

          {!userProfile?.is_eligible && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700">
                You must wait 90 days between donations. You will be eligible to donate again in {daysUntilEligible} days.
              </p>
            </div>
          )}

        </div>

      </div>

    </AppLayout>

  );

}