-- Trips module

CREATE TABLE IF NOT EXISTS trips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own trips" ON trips FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trip_flights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  depart_airport text NOT NULL,
  depart_terminal text,
  depart_datetime timestamptz NOT NULL,
  flight_number text,
  booking_reference text,
  booked_via text,
  arrive_airport text NOT NULL,
  arrive_terminal text,
  arrive_datetime timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trip_flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own trip_flights" ON trip_flights FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trip_parking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text,
  reference text,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trip_parking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own trip_parking" ON trip_parking FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trip_taxis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text,
  collection_address text NOT NULL,
  collection_datetime timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trip_taxis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own trip_taxis" ON trip_taxis FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS trip_accommodations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accommodation_type text NOT NULL DEFAULT 'hotel',
  name text,
  address text,
  booking_reference text,
  check_in_date date,
  check_out_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE trip_accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own trip_accommodations" ON trip_accommodations FOR ALL USING (auth.uid() = user_id);
