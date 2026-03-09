/*
  # Create Donor Search Function

  ## Purpose
  Creates a PostgreSQL function to efficiently search for donors within a radius
  using PostGIS geospatial functions for optimal performance.

  ## Function Details
  - `find_donors_within_radius` - Searches for eligible donors within specified radius
    - Parameters:
      - blood_type: Blood group to search for
      - lat: Latitude of search center
      - lng: Longitude of search center
      - radius_meters: Search radius in meters
    - Returns: Table of donors with calculated distances, sorted by distance
    - Uses PostGIS ST_DWithin for efficient spatial filtering
    - Uses ST_Distance for accurate distance calculation

  ## Security
  - Function is available to authenticated users
  - Returns only available and eligible donors
*/

-- Function to find donors within radius using PostGIS
CREATE OR REPLACE FUNCTION find_donors_within_radius(
  blood_type text,
  lat double precision,
  lng double precision,
  radius_meters double precision
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  blood_group text,
  location geography,
  is_available boolean,
  is_eligible boolean,
  distance_km numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.full_name,
    d.phone,
    d.blood_group,
    d.location,
    d.is_available,
    d.is_eligible,
    ROUND((ST_Distance(
      d.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000)::numeric, 2) as distance_km
  FROM donors d
  WHERE
    d.blood_group = blood_type
    AND d.is_available = true
    AND d.is_eligible = true
    AND ST_DWithin(
      d.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY
    ST_Distance(
      d.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
