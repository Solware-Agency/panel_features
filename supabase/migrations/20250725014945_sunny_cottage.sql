/*
  # Add ims column and immuno_requests table

  1. New Column
    - Add `ims` column to `medical_records_clean` table for storing immunoreactions

  2. New Table
    - `immuno_requests`
      - `id` (uuid, primary key)
      - `case_id` (uuid, references medical_records_clean)
      - `inmunorreacciones` (text, comma-separated immunoreactions)
      - `n_reacciones` (integer, number of reactions)
      - `precio_unitario` (numeric, unit price, default 18.00)
      - `total` (numeric, calculated total)
      - `pagado` (boolean, payment status, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on `immuno_requests` table
    - Add policies for authenticated users
    - Add trigger for updated_at timestamp
*/

-- Add 'ims' column to medical_records_clean table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records_clean' AND column_name = 'ims'
  ) THEN
    ALTER TABLE medical_records_clean ADD COLUMN ims text;
  END IF;
END $$;

-- Create immuno_requests table
CREATE TABLE IF NOT EXISTS immuno_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  inmunorreacciones text NOT NULL,
  n_reacciones integer NOT NULL,
  precio_unitario numeric(10,2) NOT NULL DEFAULT 18.00,
  total numeric(10,2) NOT NULL,
  pagado boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'immuno_requests_case_id_fkey'
  ) THEN
    ALTER TABLE immuno_requests 
    ADD CONSTRAINT immuno_requests_case_id_fkey 
    FOREIGN KEY (case_id) REFERENCES medical_records_clean(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE immuno_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for immuno_requests
CREATE POLICY "Authenticated users can read immuno requests"
  ON immuno_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert immuno requests"
  ON immuno_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update immuno requests"
  ON immuno_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Owners can delete immuno requests"
  ON immuno_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Create function to update updated_at timestamp for immuno_requests
CREATE OR REPLACE FUNCTION update_immuno_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_immuno_requests_updated_at
  BEFORE UPDATE ON immuno_requests
  FOR EACH ROW EXECUTE FUNCTION update_immuno_requests_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_immuno_requests_case_id ON immuno_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_immuno_requests_pagado ON immuno_requests(pagado);
CREATE INDEX IF NOT EXISTS idx_immuno_requests_created_at ON immuno_requests(created_at DESC);