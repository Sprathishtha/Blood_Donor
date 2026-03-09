// src/pages/Profile.tsx
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const { userProfile, userType } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-4">Account type: <strong>{userType}</strong></p>
          {userProfile ? (
            <div className="space-y-2">
              {userType === 'donor' ? (
                <>
                  <p><strong>Name:</strong> {userProfile.full_name}</p>
                  <p><strong>Blood group:</strong> {userProfile.blood_group}</p>
                  <p><strong>Phone:</strong> {userProfile.phone}</p>
                </>
              ) : (
                <>
                  <p><strong>Hospital:</strong> {userProfile.name}</p>
                  <p><strong>Phone:</strong> {userProfile.phone}</p>
                  <p><strong>Address:</strong> {userProfile.address}</p>
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No profile data available.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default Profile;
