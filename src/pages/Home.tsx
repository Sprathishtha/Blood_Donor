// src/pages/Home.tsx

import { Link } from 'react-router-dom';
import { Droplet, MapPin, Bell, Zap, Users, Shield } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';

export function Home() {
  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50">
        <main>
          {/* HERO */}
          <section id="hero" className="py-20 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Droplet className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Save Lives with GeoBlood
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Real-time blood donor matching system using geolocation technology.
                Connect hospitals with eligible donors instantly during emergencies.
              </p>

              <div className="flex justify-center space-x-4">
                <Link
                  to="/register/donor"
                  className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition font-medium text-lg"
                >
                  Become a Donor
                </Link>

                <Link
                  to="/register/hospital"
                  className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-50 transition font-medium text-lg border-2 border-gray-200"
                >
                  Register Hospital
                </Link>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="py-16 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                How It Works
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Register</h3>
                  <p className="text-gray-600">
                    Sign up as a donor or hospital with verified details.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
                  <p className="text-gray-600">
                    Nearby donors are found using GPS-based radius expansion.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Alerts</h3>
                  <p className="text-gray-600">
                    Donors receive instant alerts to respond quickly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why GeoBlood?
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <Feature icon={<Zap />} title="Fast Matching" />
                <Feature icon={<Shield />} title="Secure & Verified" />
                <Feature icon={<MapPin />} title="Location Based" />
                <Feature icon={<Bell />} title="Smart Notifications" />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 px-4 bg-red-500 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Save Lives?
              </h2>
              <p className="text-xl mb-8 text-red-100">
                Join donors and hospitals making a difference every day.
              </p>

              <Link
                to="/register"
                className="bg-white text-red-500 px-8 py-3 rounded-lg hover:bg-red-50 transition font-medium text-lg inline-block"
              >
                Get Started
              </Link>
            </div>
          </section>
        </main>
      </div>
    </PublicLayout>
  );
}

function Feature({ icon, title }: { icon: any; title: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="w-10 h-10 text-red-500 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">
        Built for speed, accuracy, and real-world emergencies.
      </p>
    </div>
  );
}
