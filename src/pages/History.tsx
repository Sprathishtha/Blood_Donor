import { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function History() {
  const { userProfile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!userProfile) return;

    supabase
      .from('blood_requests')
      .select(`
        blood_group,
        quantity,
        status,
        created_at,
        donors:matched_donor_id ( full_name )
      `)
      .eq('hospital_id', userProfile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Request History</h1>

        <table className="w-full bg-white shadow rounded text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Blood</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Status</th>
              <th className="p-3">Donor</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.blood_group}</td>
                <td className="p-3">{r.quantity}</td>
                <td className="p-3 capitalize">{r.status}</td>
                <td className="p-3">
                  {r.status === 'completed' && r.donors
                    ? r.donors.full_name
                    : '-'}
                </td>
                <td className="p-3">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
