CREATE TABLE public.theory_test_centres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  postcode text,
  lat numeric,
  lng numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.theory_test_centres TO anon;
GRANT SELECT ON public.theory_test_centres TO authenticated;
GRANT ALL ON public.theory_test_centres TO service_role;

ALTER TABLE public.theory_test_centres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active theory centres"
  ON public.theory_test_centres
  FOR SELECT
  USING (is_active = true);

ALTER TABLE public.pupils
  ADD COLUMN theory_test_centre_id uuid REFERENCES public.theory_test_centres(id) ON DELETE SET NULL;

INSERT INTO public.theory_test_centres (name, address, postcode) VALUES
  ('London (Southwark)', '15 Westminster Bridge Rd, London', 'SE1 7HR'),
  ('London (Kennington)', '23 Kennington Park Rd, London', 'SE11 4JU'),
  ('London (Wood Green)', 'Lymington Ave, London', 'N22 6JJ'),
  ('London (Sutton)', 'Throwley Way, Sutton', 'SM1 4AF'),
  ('London (Barking)', 'Linton Rd, Barking', 'IG11 8HE'),
  ('Manchester (Trafford)', 'Trafford House, Chester Rd, Manchester', 'M32 0RS'),
  ('Manchester (Cheetham Hill)', 'Cheetham Hill Rd, Manchester', 'M8 8EP'),
  ('Birmingham (Edgbaston)', '5 St Philips Pl, Birmingham', 'B3 2PW'),
  ('Birmingham (Wylde Green)', 'Birmingham Rd, Sutton Coldfield', 'B72 1QD'),
  ('Southampton', '146 Above Bar St, Southampton', 'SO14 7DW'),
  ('Bristol (Cabot Circus)', 'Glass House, Bristol', 'BS1 3BX'),
  ('Leeds (City Centre)', 'Park Row, Leeds', 'LS1 5HD'),
  ('Glasgow (City Centre)', '2 Cadogan Sq, Glasgow', 'G2 7PH'),
  ('Cardiff', 'Greyfriars Rd, Cardiff', 'CF10 3AE'),
  ('Newcastle upon Tyne', 'Eldon Garden, Newcastle', 'NE1 7RA'),
  ('Liverpool', 'Cunard Building, Liverpool', 'L3 1DS'),
  ('Sheffield', 'Carver St, Sheffield', 'S1 4FS'),
  ('Nottingham', 'Maid Marian Way, Nottingham', 'NG1 6HQ'),
  ('Edinburgh', 'Saltire Court, Castle Terrace, Edinburgh', 'EH1 2EU'),
  ('Aberdeen', 'Union Plaza, Union Wynd, Aberdeen', 'AB10 1SL'),
  ('Belfast', 'Chichester St, Belfast', 'BT1 4JE'),
  ('Brighton', 'Vantage Point, New England Rd, Brighton', 'BN1 4GW'),
  ('Cambridge', 'St Andrew''s House, St Andrew''s Rd, Cambridge', 'CB4 1DL'),
  ('Coventry', 'Earlsdon Park, Butts Rd, Coventry', 'CV1 3BH'),
  ('Derby', 'St Peters Churchyard, Derby', 'DE1 1NN'),
  ('Exeter', 'Renslade House, Bonhay Rd, Exeter', 'EX4 3AY'),
  ('Hull', 'Norwich House, Savile St, Hull', 'HU1 3ES'),
  ('Leicester', 'Belgrave Gate, Leicester', 'LE1 3GQ'),
  ('Norwich', 'St Crispins House, Duke St, Norwich', 'NR3 1UB'),
  ('Oxford', 'Seacourt Tower, West Way, Oxford', 'OX2 0JJ'),
  ('Plymouth', 'Walker Terrace, Plymouth', 'PL1 3BL'),
  ('Portsmouth', 'Lakeshore, Western Rd, Portsmouth', 'PO6 3EN'),
  ('Reading', 'Davidson House, Forbury Sq, Reading', 'RG1 3EU'),
  ('Stoke-on-Trent', 'Festival Park, Stoke-on-Trent', 'ST1 5SQ'),
  ('Swansea', 'Princess House, Princess Way, Swansea', 'SA1 3LW'),
  ('York', 'Tower Court, Oakdale Rd, York', 'YO30 4XL');