# GeoBlood - Real-time Blood Donor Matching System

A production-ready web application that connects hospitals with eligible blood donors using geolocation technology, real-time notifications, and intelligent matching algorithms.

## Features

### Core Functionality
- **Real-time Donor Matching** - Uses PostgreSQL with PostGIS for geospatial queries
- **Intelligent Search** - Automatic radius expansion (5km → 10km → 20km)
- **Haversine Distance Calculation** - Accurate distance calculations between donors and hospitals
- **Smart Notifications** - Push notifications with 5-minute timeout and automatic fallback
- **Eligibility Management** - Automatic 90-day donation interval enforcement
- **Secure Authentication** - JWT-based authentication with role-based access control

### User Types

#### Donors
- Register with blood type and location
- Set availability status
- Receive real-time notifications for nearby requests
- Track donation history and eligibility
- Respond to emergency requests instantly

#### Hospitals
- Register with verified license
- Create emergency blood requests with urgency levels
- View matched donors automatically
- Track request status in real-time
- Access donor contact information upon match

## Technology Stack

### Frontend
- **React.js** - Modern UI framework
- **TypeScript** - Type-safe development
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **Lucide React** - Icon library
- **date-fns** - Date formatting

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **PostGIS** - Geospatial extension
- **Row Level Security** - Database-level access control

### Geospatial
- **PostGIS ST_DWithin** - Efficient radius searches
- **PostGIS ST_Distance** - Precise distance calculations
- **Haversine Formula** - Fallback distance calculation
- **GeoJSON** - Standardized location format

## Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd geoblood
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
- Go to your Supabase project dashboard
- Navigate to Settings > API
- Copy the Project URL and anon/public key

4. **Database Setup**

The database schema is automatically created through migrations. The application includes:
- Donors table with geospatial indexing
- Hospitals table with location data
- Blood requests with matching logic
- Notifications with queue system
- Row Level Security policies

All migrations are in the project and will be applied automatically.

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
geoblood/
├── src/
│   ├── components/       # Reusable UI components
│   │   └── Layout.tsx    # Main layout wrapper
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── lib/              # Library configurations
│   │   └── supabase.ts   # Supabase client setup
│   ├── pages/            # Page components
│   │   ├── Home.tsx      # Landing page
│   │   ├── Login.tsx     # Login page
│   │   ├── RegisterSelect.tsx  # Registration type selection
│   │   ├── DonorRegister.tsx   # Donor registration
│   │   ├── HospitalRegister.tsx  # Hospital registration
│   │   ├── DonorDashboard.tsx   # Donor profile
│   │   ├── DonorNotifications.tsx  # Donor notifications
│   │   ├── HospitalDashboard.tsx   # Hospital requests view
│   │   └── NewRequest.tsx  # Create blood request
│   ├── services/         # Business logic services
│   │   ├── matchingService.ts    # Donor matching engine
│   │   └── notificationService.ts  # Notification handling
│   ├── utils/            # Utility functions
│   │   └── geospatial.ts  # Haversine and location utilities
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Database Schema

### Tables

#### donors
- Stores donor information and location
- Includes blood type and eligibility status
- Geospatial index on location column
- Automatic eligibility calculation

#### hospitals
- Hospital registration data
- Verified with license number
- Location stored as GeoJSON point

#### blood_requests
- Emergency blood requests
- Tracks status and matched donors
- Supports urgency levels (critical, urgent, normal)
- Dynamic radius expansion

#### notifications
- Notification log with expiration
- Tracks donor responses
- 5-minute timeout mechanism

#### notification_queue
- Priority queue for donor notifications
- Distance-based ordering
- Automatic retry logic

## API Endpoints (Supabase Client)

All interactions are handled through the Supabase client library with automatic authentication.

### Authentication
```typescript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()
```

### Donor Operations
```typescript
// Create donor profile
await supabase.from('donors').insert({ ... })

// Update availability
await supabase.from('donors').update({ is_available: true }).eq('id', donorId)

// Get donor notifications
await supabase.from('notifications').select('*').eq('donor_id', donorId)
```

### Hospital Operations
```typescript
// Create blood request
await supabase.from('blood_requests').insert({
  hospital_id,
  blood_group,
  urgency_level,
  quantity,
  location
})

// Get hospital requests
await supabase.from('blood_requests').select('*').eq('hospital_id', hospitalId)
```

### Geospatial Queries
```typescript
// Find donors within radius using PostGIS
await supabase.rpc('find_donors_within_radius', {
  blood_type: 'O+',
  lat: 40.7128,
  lng: -74.0060,
  radius_meters: 5000
})
```

## Matching Algorithm

The donor matching system follows this flow:

1. **Hospital creates request** with blood type and urgency level
2. **System searches for donors** using PostGIS geospatial queries:
   - Start with 5km radius
   - Expand to 10km if no matches
   - Expand to 20km if still no matches
3. **Filter eligible donors**:
   - Exact blood group match
   - Available status = true
   - Eligible status = true (90 days since last donation)
4. **Sort by distance** using ST_Distance (most accurate)
5. **Create notification queue** with priority based on distance
6. **Notify nearest donor** via push notification and SMS
7. **Wait 5 minutes** for response
8. **If no response**, mark as ignored and notify next donor
9. **If accepted**, match donor with request and notify hospital
10. **If declined**, immediately notify next donor

## Notification System

### Push Notifications (Firebase Cloud Messaging)
Production implementation requires:
```typescript
// Firebase configuration in .env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### SMS Notifications (Twilio)
Production implementation requires:
```typescript
// Twilio configuration in .env
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_number
```

### Notification Logic
- **Critical requests** - Notify immediately with "CRITICAL" prefix
- **Urgent requests** - Notify immediately with "URGENT" prefix
- **Normal requests** - Standard notification
- **5-minute timeout** - Automatic expiration and retry
- **Fallback chain** - Moves to next donor if no response

## Security Features

### Row Level Security (RLS)
All database tables have RLS enabled with policies:

#### Donors
- Can view and update own profile
- Can view available blood requests
- Hospitals can view available donors for matching

#### Hospitals
- Can view and update own profile
- Can create and manage own requests
- Can view notifications for own requests

#### Notifications
- Donors can view own notifications
- Hospitals can view sent notifications
- Only authenticated users can respond

### Authentication
- JWT-based authentication via Supabase Auth
- Secure password hashing
- Session management
- Protected routes based on user type

### Data Validation
- Blood group validation (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Urgency level validation (critical, urgent, normal)
- Location coordinate validation
- 90-day donation interval enforcement

## Testing

### Manual Testing Checklist

#### Donor Flow
1. Register as donor with blood type and location
2. Verify profile shows correct information
3. Toggle availability status
4. Check eligibility calculation
5. Receive and respond to notifications

#### Hospital Flow
1. Register as hospital with license
2. Create blood request
3. Verify donor matching works
4. Check radius expansion
5. View matched donor information

#### Geospatial Testing
1. Create requests at different distances
2. Verify 5km, 10km, 20km radius search
3. Confirm distance calculations are accurate
4. Test with no donors available

### Sample Test Data

```sql
-- Insert test donor
INSERT INTO donors (full_name, email, phone, blood_group, location, address, is_available, is_eligible)
VALUES (
  'John Doe',
  'john@example.com',
  '+1234567890',
  'O+',
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  '123 Main St, New York, NY',
  true,
  true
);

-- Insert test hospital
INSERT INTO hospitals (name, email, phone, location, address, license_number)
VALUES (
  'City Hospital',
  'hospital@example.com',
  '+1987654321',
  ST_SetSRID(ST_MakePoint(-74.0070, 40.7130), 4326)::geography,
  '456 Hospital Ave, New York, NY',
  'HL-12345-2024'
);
```

## Deployment

### Environment Variables (Production)
```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_number
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Location Services
The application requires:
- Browser geolocation API support
- User permission for location access
- HTTPS in production (required for geolocation)

## Contributing
This is a production-ready application. For contributions:
1. Follow the existing code structure
2. Maintain TypeScript types
3. Add appropriate error handling
4. Test geospatial features thoroughly
5. Update documentation

## License
MIT

## Support
For issues or questions, please create an issue in the repository.

## Acknowledgments
- Built with React and TypeScript
- Powered by Supabase and PostGIS
- Uses Haversine formula for distance calculations
- Inspired by the need for efficient emergency blood matching

---

**GeoBlood** - Saving lives through technology
