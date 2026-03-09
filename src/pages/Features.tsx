// src/pages/Features.tsx
import { AppLayout } from '../components/AppLayout';

export function Features() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Features</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">Geospatial matching with automatic radius expansion (5 → 10 → 20 km).</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Fast Notifications</h3>
            <p className="text-sm text-gray-600">Push + SMS fallback, 5-minute accept window and retry logic.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Verified Hospitals</h3>
            <p className="text-sm text-gray-600">Hospitals register with license details for trust & safety.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
// src/pages/Features.tsx
// export function Features() {
//   return (
//     <div className="max-w-6xl mx-auto px-4 py-12">
//       <h1 className="text-3xl font-bold mb-6">Features</h1>
//       <p className="text-gray-600">
//         Real-time donor matching, smart radius expansion, SMS & push alerts.
//       </p>
//     </div>
//   );
// }
