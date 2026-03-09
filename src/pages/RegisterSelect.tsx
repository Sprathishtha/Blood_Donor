// // src/pages/RegisterSelect.tsx
// import { Link } from 'react-router-dom';
// import { Droplet, User, Building2 } from 'lucide-react';
// import { PublicLayout } from '../components/PublicLayout';
// import { Warehouse } from 'lucide-react';

// export function RegisterSelect() {
//   return (
//     <PublicLayout>
//       <div className="flex justify-center px-4 py-16">
//         <div className="max-w-4xl w-full">
//           <div className="text-center mb-10">
//             <div className="flex justify-center mb-4">
//               <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
//                 <Droplet className="w-10 h-10 text-white" />
//               </div>
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900">Join GeoBlood</h1>
//             <p className="text-gray-600 mt-2">Choose how you want to participate</p>
//           </div>

//           <div className="grid md:grid-cols-2 gap-6">
//             <Link to="/register/donor" className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition">
//               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
//                 <User className="w-8 h-8 text-red-600" />
//               </div>
//               <h2 className="text-2xl font-bold">Register as Donor</h2>
//               <p className="text-gray-600 mt-2">
//                 Save lives by donating blood.
//               </p>
//               <p className="mt-6 text-red-500 font-medium">Continue as Donor →</p>
//             </Link>
  
//             <div className="grid md:grid-cols-3 gap-6">
//               <Link to="/register/bloodbank" className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition">
//   <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
//     <Warehouse className="w-8 h-8 text-yellow-600" />
//   </div>
//   <h2 className="text-2xl font-bold">Register as Blood Bank</h2>
//   <p className="text-gray-600 mt-2">
//     Manage blood stock and support hospitals.
//   </p>
//   <p className="mt-6 text-yellow-600 font-medium">Continue as Blood Bank →</p>
// </Link>
//             </div>
//             <Link to="/register/hospital" className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition">
//               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
//                 <Building2 className="w-8 h-8 text-blue-600" />
//               </div>
//               <h2 className="text-2xl font-bold">Register as Hospital</h2>
//               <p className="text-gray-600 mt-2">
//                 Find donors quickly during emergencies.
//               </p>
//               <p className="mt-6 text-blue-500 font-medium">Continue as Hospital →</p>
//             </Link>
//           </div>

//           <p className="mt-8 text-center text-sm text-gray-600">
//             Already have an account?{' '}
//             <Link to="/login" className="text-red-500 font-medium">
//               Sign In
//             </Link>
//           </p>
//         </div>
//       </div>
//     </PublicLayout>
//   );
// }

import { Link } from 'react-router-dom';
import { Droplet, User, Building2, Warehouse } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';

export function RegisterSelect() {
  return (
    <PublicLayout>
      <div className="flex justify-center px-4 py-16">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                <Droplet className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Join GeoBlood</h1>
            <p className="text-gray-600 mt-2">
              Choose how you want to participate
            </p>
          </div>

          {/* 3 COLUMN GRID */}
          <div className="grid md:grid-cols-3 gap-6">

            {/* DONOR */}
            <Link
              to="/register/donor"
              className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold">Register as Donor</h2>
              <p className="text-gray-600 mt-2">
                Save lives by donating blood.
              </p>
              <p className="mt-6 text-red-500 font-medium">
                Continue as Donor →
              </p>
            </Link>

            {/* HOSPITAL */}
            <Link
              to="/register/hospital"
              className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold">Register as Hospital</h2>
              <p className="text-gray-600 mt-2">
                Find donors quickly during emergencies.
              </p>
              <p className="mt-6 text-blue-500 font-medium">
                Continue as Hospital →
              </p>
            </Link>

            {/* BLOOD BANK */}
            <Link
              to="/register/bloodbank"
              className="bg-white rounded-xl shadow-sm p-8 hover:shadow-md transition"
            >
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Warehouse className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold">Register as Blood Bank</h2>
              <p className="text-gray-600 mt-2">
                Manage blood stock and support hospitals.
              </p>
              <p className="mt-6 text-yellow-600 font-medium">
                Continue as Blood Bank →
              </p>
            </Link>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-red-500 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}