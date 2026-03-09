# GeoBlood - Quick Setup Guide

This guide will help you get GeoBlood up and running in minutes.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Supabase account (free tier works perfectly)

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - Name: GeoBlood (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select closest to your location
4. Wait for project to be created (takes ~2 minutes)

### 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Configure Environment Variables

1. In the project root, create a `.env` file
2. Copy the contents from `.env.example`
3. Replace with your actual values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Setup

The database schema is automatically applied through migrations. However, you need to ensure PostGIS is enabled:

1. In Supabase dashboard, go to **Database** → **Extensions**
2. Search for "postgis"
3. Click "Enable" if not already enabled

The application will automatically create all necessary tables, indexes, and functions when you first connect.

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Testing the Application

### Register Test Users

#### Test Donor
1. Go to Register → Donor
2. Fill in details:
   - Name: John Doe
   - Email: john@example.com
   - Phone: +1234567890
   - Blood Group: O+
   - Address: 123 Main St, New York
   - Click "Get Location" (or use coordinates: 40.7128, -74.0060)
   - Password: test123

#### Test Hospital
1. Go to Register → Hospital
2. Fill in details:
   - Name: City Hospital
   - Email: hospital@example.com
   - Phone: +1987654321
   - License: HL-12345-2024
   - Address: 456 Hospital Ave, New York
   - Click "Get Location" (or use coordinates: 40.7130, -74.0070)
   - Password: test123

### Test Blood Request Flow

1. **Login as Hospital** (hospital@example.com / test123)
2. Click **"New Request"**
3. Create a request:
   - Blood Group: O+
   - Urgency: Critical
   - Quantity: 2
4. Click **"Create Request"**
5. System will find nearby donors automatically

6. **Login as Donor** (john@example.com / test123)
7. Go to **"Notifications"**
8. You should see the blood request
9. Click **"Accept"** or **"Decline"**

10. **Switch back to Hospital account**
11. View dashboard to see matched donor

## Database Seed Data (Optional)

If you want to populate the database with test data, run this SQL in Supabase SQL Editor:

```sql
-- Note: You'll need actual user IDs from auth.users after registering
-- This is just an example structure

-- Example donor (replace user_id with actual auth user ID)
INSERT INTO donors (
  user_id,
  full_name,
  email,
  phone,
  blood_group,
  location,
  address,
  is_available,
  is_eligible
) VALUES (
  'your-auth-user-id-here',
  'John Doe',
  'john@example.com',
  '+1234567890',
  'O+',
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  '123 Main St, New York, NY',
  true,
  true
);
```

## Troubleshooting

### Location Not Working
- Make sure you're using HTTPS (required for geolocation)
- Grant browser permission for location access
- In development, `localhost` should work

### Database Errors
- Ensure PostGIS extension is enabled
- Check that migrations ran successfully
- Verify your Supabase connection in `.env`

### Build Errors
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 18+)

## Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Deploy to Vercel/Netlify/etc.

Set these environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Configure Production Notifications

For FCM (Push Notifications):
- Add Firebase configuration to `.env`
- Implement service worker for background notifications

For Twilio (SMS):
- Add Twilio credentials to `.env`
- Set up Twilio phone number

## Next Steps

1. Customize the UI colors and branding
2. Add Firebase Cloud Messaging for real push notifications
3. Integrate Twilio for SMS alerts
4. Add map visualization with Leaflet
5. Implement admin dashboard
6. Add analytics and monitoring

## Support

For issues or questions:
- Check the main README.md
- Review Supabase documentation
- Open an issue in the repository

---

**Congratulations!** You now have a fully functional blood donor matching system.
