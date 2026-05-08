-- Trip shares table
CREATE TABLE IF NOT EXISTS trip_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, shared_with_user_id)
);
ALTER TABLE trip_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage trip_shares" ON trip_shares FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "recipients view trip_shares" ON trip_shares FOR SELECT USING (auth.uid() = shared_with_user_id);

-- Allow shared users to SELECT trips they've been given access to
CREATE POLICY "shared users view trips" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trips.id AND trip_shares.shared_with_user_id = auth.uid())
);

-- Allow shared users to SELECT items for shared trips
CREATE POLICY "shared users view trip_flights" ON trip_flights FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trip_flights.trip_id AND trip_shares.shared_with_user_id = auth.uid())
);

CREATE POLICY "shared users view trip_parking" ON trip_parking FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trip_parking.trip_id AND trip_shares.shared_with_user_id = auth.uid())
);

CREATE POLICY "shared users view trip_taxis" ON trip_taxis FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trip_taxis.trip_id AND trip_shares.shared_with_user_id = auth.uid())
);

CREATE POLICY "shared users view trip_accommodations" ON trip_accommodations FOR SELECT USING (
  EXISTS (SELECT 1 FROM trip_shares WHERE trip_shares.trip_id = trip_accommodations.trip_id AND trip_shares.shared_with_user_id = auth.uid())
);
