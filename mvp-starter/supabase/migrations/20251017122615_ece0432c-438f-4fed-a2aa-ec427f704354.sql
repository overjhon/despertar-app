-- Allow service role to insert purchased ebooks into user_ebooks table
CREATE POLICY "Service can insert user ebooks"
ON user_ebooks FOR INSERT
TO service_role
WITH CHECK (true);