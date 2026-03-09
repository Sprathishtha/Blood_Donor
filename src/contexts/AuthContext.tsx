// /**
//  * Authentication Context
//  * Manages user authentication state and provides auth methods
//  */

// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { User, Session } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';

// interface AuthContextType {
//   user: User | null;
//   session: Session | null;
//   loading: boolean;
//   userType: 'donor' | 'hospital' | null;
//   userProfile: any | null;
//   signUp: (email: string, password: string, type: 'donor' | 'hospital') => Promise<User | null>;
//   signIn: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   refreshProfile: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [userType, setUserType] = useState<'donor' | 'hospital' | null>(null);
//   const [userProfile, setUserProfile] = useState<any | null>(null);

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       if (session?.user) {
//         loadUserProfile(session.user.id);
//       } else {
//         setLoading(false);
//       }
//     });

//     // Listen for auth changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       (async () => {
//         setSession(session);
//         setUser(session?.user ?? null);
//         if (session?.user) {
//           await loadUserProfile(session.user.id);
//         } else {
//           setUserType(null);
//           setUserProfile(null);
//           setLoading(false);
//         }
//       })();
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const loadUserProfile = async (userId: string) => {
//     try {
//       // Check if user is a donor
//       const { data: donorData } = await supabase
//         .from('donors')
//         .select('*')
//         .eq('auth_user_id', userId) // 👈 match schema
//         .maybeSingle();

//       if (donorData) {
//         setUserType('donor');
//         setUserProfile(donorData);
//         setLoading(false);
//         return;
//       }

//       // Check if user is a hospital
//       const { data: hospitalData } = await supabase
//         .from('hospitals')
//         .select('*')
//         .eq('auth_user_id', userId) // 👈 match schema
//         .maybeSingle();

//       if (hospitalData) {
//         setUserType('hospital');
//         setUserProfile(hospitalData);
//         setLoading(false);
//         return;
//       }

//       setLoading(false);
//     } catch (error) {
//       console.error('Error loading user profile:', error);
//       setLoading(false);
//     }
//   };

//   const signUp = async (
//     email: string,
//     password: string,
//     type: 'donor' | 'hospital'
//   ): Promise<User | null> => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           user_type: type,
//         },
//       },
//     });

//     if (error) throw error;

//     // Return the created user (may be null if email confirmation pending)
//     return data.user ?? null;
//   };

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) throw error;
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;

//     setUser(null);
//     setSession(null);
//     setUserType(null);
//     setUserProfile(null);
//   };

//   const refreshProfile = async () => {
//     if (user) {
//       await loadUserProfile(user.id);
//     }
//   };

//   const value: AuthContextType = {
//     user,
//     session,
//     loading,
//     userType,
//     userProfile,
//     signUp,
//     signIn,
//     signOut,
//     refreshProfile,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }
/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userType: 'donor' | 'hospital' | 'bloodbank' | null; // ✅ added bloodbank
  userProfile: any | null;
  signUp: (
    email: string,
    password: string,
    type: 'donor' | 'hospital' | 'bloodbank' // ✅ added bloodbank
  ) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<
    'donor' | 'hospital' | 'bloodbank' | null // ✅ added bloodbank
  >(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserType(null);
          setUserProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // 🔴 Check if donor
      const { data: donorData } = await supabase
        .from('donors')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (donorData) {
        setUserType('donor');
        setUserProfile(donorData);
        setLoading(false);
        return;
      }

      // 🔵 Check if hospital
      const { data: hospitalData } = await supabase
        .from('hospitals')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (hospitalData) {
        setUserType('hospital');
        setUserProfile(hospitalData);
        setLoading(false);
        return;
      }

      // 🟡 NEW: Check if blood bank
      const { data: bloodBankData } = await supabase
        .from('blood_banks')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (bloodBankData) {
        setUserType('bloodbank');
        setUserProfile(bloodBankData);
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    type: 'donor' | 'hospital' | 'bloodbank' // ✅ extended type
  ): Promise<User | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: type,
        },
      },
    });

    if (error) throw error;

    return data.user ?? null;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setSession(null);
    setUserType(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    userType,
    userProfile,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}