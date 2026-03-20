// src/components/Header.tsx

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, Bell, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
}

export function Header() {
  const { user, userType, userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- NOTIFICATIONS ---------------- */

  useEffect(() => {
    if (!user || !userProfile) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, userType, userProfile?.id]);

  const loadNotifications = async () => {

  if (!user) return;

  if (userType === 'donor') {

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('role', 'donor')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    setNotifications(data || []);

  }

  if (userType === 'bloodbank') {

    const { data } = await supabase
      .from('notifications')
      .select('id')
      .eq('role', 'blood_bank')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    setNotifications(data || []);

  }

};

  /* ---------------- CLOSE DROPDOWN ---------------- */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    await signOut();
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const getDashboardPath = () => {
    if (userType === 'donor') return '/donor/dashboard';
    if (userType === 'hospital') return '/hospital/dashboard';
    if (userType === 'bloodbank') return '/bloodbank/dashboard';
    return '/';
  };

  const getAvatarText = () => {
    if (userType === 'donor') return userProfile?.blood_group;
    if (userType === 'hospital') return 'H';
    if (userType === 'bloodbank') return 'BB';
    return '';
  };

  return (
    <header className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Droplet className="w-7 h-7 text-red-500" />
            <span className="font-semibold text-lg">GeoBlood</span>
          </Link>

          {!user && (
            <nav className="hidden md:flex gap-4 text-sm text-gray-700">
              <a href="/#hero" className="hover:text-red-600">Home</a>
              <a href="/#how-it-works" className="hover:text-red-600">How it works</a>
              <a href="/#features" className="hover:text-red-600">Features</a>
              <Link to="/contact" className="hover:text-red-600">Contact Us</Link>
            </nav>
          )}
        </div>

        {/* RIGHT */}
        {!user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-red-600"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">

            {/* Notifications */}
            {(userType === 'donor' || userType === 'bloodbank') && (
              <button
                onClick={() =>
                  navigate(
                    userType === 'donor'
                      ? '/donor/notifications'
                      : '/bloodbank/notifications'
                  )
                }
                className="relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700 hover:text-red-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
            )}

            {/* Dashboard Icon */}
{(userType === 'hospital' || userType === 'bloodbank' || userType === 'donor') && (
  <button
    onClick={() => navigate(getDashboardPath())}
    title="Dashboard"
    className="text-gray-600 hover:text-red-600"
  >
    <LayoutDashboard className="w-5 h-5" />
  </button>
)}

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setOpenProfile((p) => !p)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-sm">
                    {getAvatarText()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {openProfile && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </header>
  );
}