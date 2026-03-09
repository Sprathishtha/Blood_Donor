// src/pages/HowItWorks.tsx
import { AppLayout } from '../components/AppLayout';
import { Droplet, Search, Bell, CheckCircle } from 'lucide-react';

export function HowItWorks() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          How GeoBlood Works
        </h1>

        <p className="text-gray-600 mb-10">
          GeoBlood connects hospitals and donors in real time using location-based
          matching to ensure faster and reliable blood availability.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Droplet className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Create Request</h3>
            <p className="text-sm text-gray-600">
              Hospital raises a blood request with group, quantity, urgency, and radius.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Search className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">
              Nearby eligible donors are automatically matched using geospatial logic.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Bell className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Instant Notification</h3>
            <p className="text-sm text-gray-600">
              Donors receive alerts and can respond immediately.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Fulfillment</h3>
            <p className="text-sm text-gray-600">
              Hospital marks the request fulfilled once blood is received.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
