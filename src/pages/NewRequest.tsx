import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { createRequest } from '../services/requestService';
import {
  parsePostGISPoint,
  getCurrentLocation,
} from '../utils/geospatial';
import { AlertCircle, CheckCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function NewRequest() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: '',
    urgencyLevel: 'normal',
    quantity: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!userProfile) throw new Error('Hospital profile not found');

      let hospitalLocation =
        userProfile.location
          ? parsePostGISPoint(userProfile.location)
          : await getCurrentLocation();

      if (!hospitalLocation)
        throw new Error('Unable to determine hospital location');

      // Create request and send notifications via RequestService
      await createRequest(
        userProfile.id,
        formData.bloodGroup,
        formData.quantity,
        hospitalLocation,
        formData.urgencyLevel
      );

      setSuccess('Request created and notifications sent.');
      setTimeout(() => navigate('/hospital/dashboard'), 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">New Blood Request</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded flex gap-2">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>

          <select
            name="urgencyLevel"
            value={formData.urgencyLevel}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>

          <input
            type="number"
            name="quantity"
            min={1}
            value={formData.quantity}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />

          <button
            disabled={loading}
            className="w-full bg-red-500 text-white py-2 rounded"
          >
            {loading ? 'Creating...' : 'Create Request'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}