/*
  # GeoBlood Database Schema

  ## Overview
  Complete database schema for GeoBlood - a real-time donor-hospital matching system
  using geospatial queries for location-based blood donor matching.

  ## New Tables Created

  ### 1. `donors`
  - `id` (uuid, primary key) - Unique donor identifier
  - `user_id` (uuid, references auth.users) - Link to authentication
  - `full_name` (text) - Donor's full name
  - `email` (text, unique) - Contact email
  - `phone` (text) - Contact phone number
  - `blood_group` (text) - Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-)
  - `location` (geography point) - Current GPS location (PostGIS)
  - `address` (text) - Human-readable address
  - `last_donation_date` (date) - Date of last blood donation
  - `is_available` (boolean) - Current availability status
  - `is_eligible` (boolean) - Eligibility based on last donation (90 days rule)
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `hospitals`
  - `id` (uuid, primary key) - Unique hospital identifier
  - `user_id` (uuid, references auth.users) - Link to authentication
  - `name` (text) - Hospital name
  - `email` (text, unique) - Contact email
  - `phone` (text) - Contact phone number
  - `location` (geography point) - Hospital GPS location (PostGIS)
  - `address` (text) - Hospital address
  - `license_number` (text, unique) - Hospital license/registration number
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `blood_requests`
  - `id` (uuid, primary key) - Unique request identifier
  - `hospital_id` (uuid, references hospitals) - Requesting hospital
  - `blood_group` (text) - Required blood type
  - `urgency_level` (text) - critical, urgent, normal
  - `quantity` (integer) - Units needed
  - `location` (geography point) - Request location (usually hospital)
  - `status` (text) - pending, matched, fulfilled, cancelled
  - `radius_km` (integer) - Current search radius (starts at 5, expands to 10, 20)
  - `matched_donor_id` (uuid, references donors) - Matched donor if any
  - `fulfilled_at` (timestamptz) - When request was fulfilled
  - `created_at` (timestamptz) - Request timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `notifications`
  - `id` (uuid, primary key) - Unique notification identifier
  - `request_id` (uuid, references blood_requests) - Related request
  - `donor_id` (uuid, references donors) - Target donor
  - `hospital_id` (uuid, references hospitals) - Source hospital
  - `message` (text) - Notification message
  - `notification_type` (text) - push, sms, both
  - `status` (text) - sent, delivered, read, ignored, expired
  - `sent_at` (timestamptz) - When notification was sent
  - `expires_at` (timestamptz) - When notification expires (5 min from sent)
  - `response` (text) - Donor response (accepted, declined, null)
  - `responded_at` (timestamptz) - When donor responded
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. `notification_queue`
  - `id` (uuid, primary key) - Queue entry identifier
  - `request_id` (uuid, references blood_requests) - Related request
  - `donor_id` (uuid, references donors) - Next donor to notify
  - `distance_km` (numeric) - Distance from hospital
  - `priority` (integer) - Queue priority (lower = higher priority)
  - `notified_at` (timestamptz) - When this donor was notified
  - `status` (text) - pending, notified, skipped, expired
  - `created_at` (timestamptz) - Queue entry timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Donors can read/update their own data
  - Hospitals can read/update their own data
  - Hospitals can create requests and read notifications
  - Public can register as donor or hospital
  - Geospatial indexes for performance

  ## Indexes
  - Spatial indexes on all location columns for fast geospatial queries
  - Indexes on foreign keys and status columns for performance
*/

-- Enable PostGIS extension for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Donors table
CREATE TABLE IF NOT EXISTS donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  location geography(POINT, 4326),
  address text NOT NULL,
  last_donation_date date,
  is_available boolean DEFAULT true,
  is_eligible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  location geography(POINT, 4326) NOT NULL,
  address text NOT NULL,
  license_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blood requests table
CREATE TABLE IF NOT EXISTS blood_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE NOT NULL,
  blood_group text NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  urgency_level text NOT NULL CHECK (urgency_level IN ('critical', 'urgent', 'normal')) DEFAULT 'normal',
  quantity integer NOT NULL CHECK (quantity > 0),
  units_fulfilled integer DEFAULT 0,
  location geography(POINT, 4326) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'matched', 'fulfilled', 'cancelled')) DEFAULT 'pending',
  radius_km integer DEFAULT 5,
  matched_donor_id uuid REFERENCES donors(id),
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES blood_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('donor', 'hospital', 'bloodbank')),
  message text,
  notification_type text DEFAULT 'both',
  status text DEFAULT 'pending',
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '5 minutes'),
  response text CHECK (response IN ('accepted', 'declined', NULL)),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES blood_requests(id) ON DELETE CASCADE NOT NULL,
  donor_id uuid REFERENCES donors(id) ON DELETE CASCADE NOT NULL,
  distance_km numeric NOT NULL,
  priority integer NOT NULL,
  notified_at timestamptz,
  status text NOT NULL CHECK (status IN ('pending', 'notified', 'skipped', 'expired')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create spatial indexes for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_donors_location ON donors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_blood_requests_location ON blood_requests USING GIST(location);

-- Create regular indexes for performance
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_is_available ON donors(is_available);
CREATE INDEX IF NOT EXISTS idx_donors_is_eligible ON donors(is_eligible);
CREATE INDEX IF NOT EXISTS idx_donors_user_id ON donors(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital_id ON blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_request_id ON notification_queue(request_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate donor eligibility (90 days since last donation)
CREATE OR REPLACE FUNCTION check_donor_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_donation_date IS NULL THEN
    NEW.is_eligible := true;
  ELSIF (CURRENT_DATE - NEW.last_donation_date) >= 90 THEN
    NEW.is_eligible := true;
  ELSE
    NEW.is_eligible := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate eligibility
CREATE TRIGGER calculate_donor_eligibility BEFORE INSERT OR UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION check_donor_eligibility();

-- Enable Row Level Security
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donors table
CREATE POLICY "Donors can view own profile"
  ON donors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Donors can update own profile"
  ON donors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can register as donor"
  ON donors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Hospitals can view available donors"
  ON donors FOR SELECT
  TO authenticated
  USING (is_available = true AND is_eligible = true);

-- RLS Policies for hospitals table
CREATE POLICY "Hospitals can view own profile"
  ON hospitals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Hospitals can update own profile"
  ON hospitals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can register as hospital"
  ON hospitals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for blood_requests table
CREATE POLICY "Hospitals can view own requests"
  ON blood_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = blood_requests.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Hospitals can create requests"
  ON blood_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = blood_requests.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Hospitals can update own requests"
  ON blood_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = blood_requests.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE hospitals.id = blood_requests.hospital_id
      AND hospitals.user_id = auth.uid()
    )
  );

CREATE POLICY "Donors can view requests"
  ON blood_requests FOR SELECT
  TO authenticated
  USING (status = 'pending');

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notification_queue table
CREATE POLICY "Hospitals can view queue for their requests"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_requests br
      JOIN hospitals h ON h.id = br.hospital_id
      WHERE br.id = notification_queue.request_id
      AND h.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage queue"
  ON notification_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);