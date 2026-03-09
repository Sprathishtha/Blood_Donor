# GeoBlood API Testing Guide

This guide shows how to test GeoBlood's functionality using Supabase client directly or through the application.

## Authentication Testing

### Sign Up (Donor)
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'john@example.com',
  password: 'test123',
  options: {
    data: {
      user_type: 'donor'
    }
  }
});
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'john@example.com',
  password: 'test123'
});
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut();
```

## Donor Operations

### Create Donor Profile
```javascript
const { data, error } = await supabase
  .from('donors')
  .insert({
    user_id: 'auth-user-id',
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    blood_group: 'O+',
    location: 'POINT(-74.0060 40.7128)',
    address: '123 Main St, New York, NY',
    is_available: true
  });
```

### Update Donor Availability
```javascript
const { data, error } = await supabase
  .from('donors')
  .update({ is_available: false })
  .eq('id', 'donor-id');
```

### Get Donor Profile
```javascript
const { data, error } = await supabase
  .from('donors')
  .select('*')
  .eq('user_id', 'auth-user-id')
  .single();
```

## Hospital Operations

### Create Hospital Profile
```javascript
const { data, error } = await supabase
  .from('hospitals')
  .insert({
    user_id: 'auth-user-id',
    name: 'City Hospital',
    email: 'hospital@example.com',
    phone: '+1987654321',
    location: 'POINT(-74.0070 40.7130)',
    address: '456 Hospital Ave, New York, NY',
    license_number: 'HL-12345-2024'
  });
```

### Create Blood Request
```javascript
const { data, error } = await supabase
  .from('blood_requests')
  .insert({
    hospital_id: 'hospital-id',
    blood_group: 'O+',
    urgency_level: 'critical',
    quantity: 2,
    location: 'POINT(-74.0070 40.7130)',
    status: 'pending',
    radius_km: 5
  })
  .select()
  .single();
```

### Get Hospital Requests
```javascript
const { data, error } = await supabase
  .from('blood_requests')
  .select(`
    *,s
    donors (
      full_name,
      phone
    )
  `)
  .eq('hospital_id', 'hospital-id')
  .order('created_at', { ascending: false });
```

## Geospatial Queries

### Find Donors Within Radius
```javascript
const { data, error } = await supabase.rpc('find_donors_within_radius', {
  blood_type: 'O+',
  lat: 40.7128,
  lng: -74.0060,
  radius_meters: 5000
});
```

### Response Format
```json
[
  {
    "id": "uuid",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "blood_group": "O+",
    "location": "POINT(-74.0060 40.7128)",
    "is_available": true,
    "is_eligible": true,
    "distance_km": 0.15
  }
]
```

## Notification Operations

### Create Notification
```javascript
const { data, error } = await supabase
  .from('notifications')
  .insert({
    request_id: 'request-id',
    donor_id: 'donor-id',
    hospital_id: 'hospital-id',
    message: 'City Hospital needs O+ blood urgently.',
    notification_type: 'both',
    status: 'sent',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  });
```

### Get Donor Notifications
```javascript
const { data, error } = await supabase
  .from('notifications')
  .select(`
    *,
    blood_requests (
      blood_group,
      urgency_level,
      quantity
    ),
    hospitals (
      name,
      address,
      phone
    )
  `)
  .eq('donor_id', 'donor-id')
  .in('status', ['sent', 'delivered'])
  .order('created_at', { ascending: false });
```

### Respond to Notification
```javascript
const { error } = await supabase
  .from('notifications')
  .update({
    response: 'accepted', // or 'declined'
    responded_at: new Date().toISOString(),
    status: 'read'
  })
  .eq('id', 'notification-id');
```

## Testing Scenarios

### Scenario 1: Complete Blood Request Flow

1. **Hospital creates request**
```javascript
// Hospital: hospital@example.com
const request = await createBloodRequest({
  bloodGroup: 'O+',
  urgencyLevel: 'critical',
  quantity: 2
});
```

2. **System finds donors**
```javascript
const donors = await findDonorsWithinRadius({
  bloodGroup: 'O+',
  location: { lat: 40.7128, lng: -74.0060 },
  radiusKm: 5
});
```

3. **System creates notification queue**
```javascript
await createNotificationQueue(request.id, donors);
```

4. **Nearest donor gets notified**
```javascript
await sendNotification({
  requestId: request.id,
  donorId: donors[0].id,
  hospitalId: hospital.id,
  message: 'City Hospital needs O+ blood. 0.5km away.',
  type: 'both'
});
```

5. **Donor accepts**
```javascript
// Donor: john@example.com
await respondToNotification(notification.id, 'accepted');
```

6. **Request updated**
```javascript
await supabase
  .from('blood_requests')
  .update({
    matched_donor_id: donor.id,
    status: 'matched',
    message: `Urgent ${bloodGroup} blood request from nearby hospital`
  })
  .eq('id', requestId);


### Scenario 2: Radius Expansion

```javascript
// Start with 5km
let donors = await findDonorsWithinRadius(5);

if (donors.length === 0) {
  // Expand to 10km
  donors = await findDonorsWithinRadius(10);
}

if (donors.length === 0) {
  // Expand to 20km
  donors = await findDonorsWithinRadius(20);
}

if (donors.length === 0) {
  // No donors found
  console.log('No donors available within 20km');
}
```

### Scenario 3: Notification Timeout

```javascript
// 1. Send notification
const notification = await sendNotification({ ... });

// 2. Wait 5 minutes

// 3. Check if responded
const { data } = await supabase
  .from('notifications')
  .select('response')
  .eq('id', notification.id)
  .single();

if (data.response === null) {
  // No response - mark as ignored
  await supabase
    .from('notifications')
    .update({ status: 'ignored' })
    .eq('id', notification.id);

  // Notify next donor
  const nextDonor = await getNextDonorFromQueue(request.id);
  await sendNotification({ donorId: nextDonor.id, ... });
}
```

## SQL Testing Queries

### Check Donor Eligibility
```sql
SELECT
  full_name,
  blood_group,
  last_donation_date,
  is_eligible,
  CURRENT_DATE - last_donation_date as days_since_donation
FROM donors
WHERE id = 'donor-id';
```

### Find All Requests in Area
```sql
SELECT
  br.blood_group,
  br.urgency_level,
  br.status,
  h.name as hospital_name,
  ST_Distance(
    br.location,
    ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography
  ) / 1000 as distance_km
FROM blood_requests br
JOIN hospitals h ON h.id = br.hospital_id
WHERE ST_DWithin(
  br.location,
  ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
  20000
)
ORDER BY distance_km;
```

### Check Notification Status
```sql
SELECT
  n.*,
  br.blood_group,
  h.name as hospital_name,
  d.full_name as donor_name
FROM notifications n
JOIN blood_requests br ON br.id = n.request_id
JOIN hospitals h ON h.id = n.hospital_id
JOIN donors d ON d.id = n.donor_id
WHERE n.status = 'sent'
AND n.expires_at < NOW();
```

## Postman Collection

Here's a sample Postman collection structure:

```json
{
  "info": {
    "name": "GeoBlood API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Sign Up",
          "request": {
            "method": "POST",
            "url": "{{supabase_url}}/auth/v1/signup",
            "header": [
              {
                "key": "apikey",
                "value": "{{supabase_key}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"test123\"\n}"
            }
          }
        }
      ]
    },
    {
      "name": "Donors",
      "item": [
        {
          "name": "Create Donor",
          "request": {
            "method": "POST",
            "url": "{{supabase_url}}/rest/v1/donors",
            "header": [
              {
                "key": "apikey",
                "value": "{{supabase_key}}"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{access_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"full_name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"phone\": \"+1234567890\",\n  \"blood_group\": \"O+\",\n  \"location\": \"POINT(-74.0060 40.7128)\",\n  \"address\": \"123 Main St\"\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "supabase_url",
      "value": "https://your-project.supabase.co"
    },
    {
      "key": "supabase_key",
      "value": "your-anon-key"
    },
    {
      "key": "access_token",
      "value": "jwt-token-from-login"
    }
  ]
}
```

## Expected Response Times

- Authentication: < 500ms
- Donor search (5km radius): < 200ms
- Create request + find donors: < 1s
- Notification creation: < 300ms
- Database queries: < 100ms

## Error Codes

- `400` - Bad Request (invalid data)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (RLS policy violation)
- `404` - Not Found
- `409` - Conflict (duplicate email, etc.)
- `500` - Server Error

---

For more details, see the main README.md
