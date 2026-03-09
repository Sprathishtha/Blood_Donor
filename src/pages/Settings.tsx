// src/pages/Settings.tsx
import { AppLayout } from '../components/AppLayout';

export function Settings() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h3 className="font-medium">Notifications</h3>
            <p className="text-sm text-gray-500">Manage push and SMS preferences (coming soon).</p>
          </div>

          <div>
            <h3 className="font-medium">Privacy</h3>
            <p className="text-sm text-gray-500">Control what data is shared with hospitals (coming soon).</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default Settings;

// src/pages/Settings.tsx
// export function Settings() {
//   return (
//     <div className="max-w-3xl mx-auto px-4 py-12">
//       <h1 className="text-2xl font-bold mb-4">Settings</h1>
//       <p className="text-gray-600">Notification & privacy settings (coming soon).</p>
//     </div>
//   );
// }
