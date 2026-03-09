import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrentLocation, createPostGISPoint } from '../utils/geospatial';
import { PublicLayout } from '../components/PublicLayout';

export function BloodBankRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseId: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch {
      setError('Enable location services and try again.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!location) {
      setError('Please capture location');
      return;
    }

    setLoading(true);

    try {
      const authUser = await signUp(
        formData.email,
        formData.password,
        'bloodbank'
      );

      if (!authUser) throw new Error('Account creation failed');

      const { error: profileError } = await supabase
        .from('blood_banks')
        .insert({
          auth_user_id: authUser.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          license_id: formData.licenseId,
          address: formData.address,
          location: createPostGISPoint(location),
        });

      if (profileError) throw profileError;

      navigate('/bloodbank/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <Warehouse className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Register as Blood Bank</h1>
            <p className="text-gray-600 mt-2">
              Manage blood stock and support hospitals
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8">

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Blood Bank Name *
                </label>
                <input
                  type="text"
                  name="name"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <input
                type="text"
                name="licenseId"
                placeholder="License / Registration ID"
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
              />

              <input
                type="text"
                name="address"
                placeholder="Full Address"
                onChange={handleChange}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                required
              />

              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-2.5 border-2 border-dashed rounded-lg hover:border-yellow-400"
              >
                {gettingLocation
                  ? 'Getting location...'
                  : location
                  ? `Location captured`
                  : 'Click to get current location'}
              </button>

              <div className="grid md:grid-cols-2 gap-5">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-yellow-600 font-medium">
                Already have an account? Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
}