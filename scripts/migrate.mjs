// Migration La Caza J — à exécuter une seule fois
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lilmpljaiwdwstelycay.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const sql = `
-- =============================================
-- La Caza J — Schéma complet
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  short       TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 130,
  allergens   TEXT[] DEFAULT '{}',
  hue         TEXT,
  photo_url   TEXT,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weekends (
  id               TEXT PRIMARY KEY,
  label            TEXT NOT NULL,
  pickup_date      TEXT NOT NULL,
  pickup_date_long TEXT,
  deadline         TIMESTAMPTZ NOT NULL,
  stock_total      INTEGER NOT NULL DEFAULT 200,
  stock_left       INTEGER NOT NULL DEFAULT 200,
  address          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','full','closed','archived')),
  photo            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekend_id   TEXT NOT NULL REFERENCES weekends(id) ON DELETE CASCADE,
  time_label   TEXT NOT NULL,
  time_key     TEXT NOT NULL,
  orders_count INTEGER NOT NULL DEFAULT 0,
  max_orders   INTEGER NOT NULL DEFAULT 3,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (weekend_id, time_key)
);

CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  nom               TEXT,
  telephone         TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref               TEXT UNIQUE NOT NULL DEFAULT '',
  profile_id        UUID REFERENCES profiles(id),
  weekend_id        TEXT NOT NULL REFERENCES weekends(id),
  slot_id           UUID REFERENCES slots(id),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','picked_up','cancelled')),
  total_nems        INTEGER NOT NULL DEFAULT 0,
  amount_cents      INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       TEXT NOT NULL REFERENCES products(id),
  quantity         INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL DEFAULT 130,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
`

const rls = `
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekends    ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Lecture publique
DROP POLICY IF EXISTS "public_read_products" ON products;
DROP POLICY IF EXISTS "public_read_weekends" ON weekends;
DROP POLICY IF EXISTS "public_read_slots"    ON slots;
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_read_weekends" ON weekends FOR SELECT USING (true);
CREATE POLICY "public_read_slots"    ON slots    FOR SELECT USING (true);

-- Profils
DROP POLICY IF EXISTS "own_profile_select" ON profiles;
DROP POLICY IF EXISTS "own_profile_insert" ON profiles;
DROP POLICY IF EXISTS "own_profile_update" ON profiles;
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Commandes
DROP POLICY IF EXISTS "own_orders_select" ON orders;
DROP POLICY IF EXISTS "own_orders_insert" ON orders;
DROP POLICY IF EXISTS "service_orders_update" ON orders;
CREATE POLICY "own_orders_select"    ON orders FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "own_orders_insert"    ON orders FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "service_orders_update" ON orders FOR UPDATE USING (true);

-- Lignes
DROP POLICY IF EXISTS "own_lines_select" ON order_lines;
DROP POLICY IF EXISTS "own_lines_insert" ON order_lines;
CREATE POLICY "own_lines_select" ON order_lines FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_lines.order_id AND orders.profile_id = auth.uid()));
CREATE POLICY "own_lines_insert" ON order_lines FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_lines.order_id AND orders.profile_id = auth.uid()));

-- Abonnés
DROP POLICY IF EXISTS "public_subscribe" ON subscribers;
DROP POLICY IF EXISTS "service_slots_update" ON slots;
DROP POLICY IF EXISTS "service_weekends_update" ON weekends;
CREATE POLICY "public_subscribe"       ON subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "service_slots_update"   ON slots       FOR UPDATE USING (true);
CREATE POLICY "service_weekends_update" ON weekends   FOR UPDATE USING (true);
`

const data = `
INSERT INTO products (id, name, short, description, price_cents, allergens, hue) VALUES
  ('porc',     'Nems au porc',       'porc',     'Servis avec salade, menthe et sauce nem.', 130, ARRAY['Gluten','Soja','Œuf'],              '#C45C39'),
  ('poulet',   'Nems au poulet',     'poulet',   'Servis avec salade, menthe et sauce nem.', 130, ARRAY['Gluten','Soja','Œuf'],              '#D49A3A'),
  ('crevette', 'Nems à la crevette', 'crevette', 'Servis avec salade, menthe et sauce nem.', 130, ARRAY['Gluten','Soja','Œuf','Crustacés'],  '#5E7A41')
ON CONFLICT (id) DO NOTHING;

INSERT INTO weekends (id, label, pickup_date, pickup_date_long, deadline, stock_total, stock_left, address, status) VALUES
  ('wk-13juin', 'Week-end du 13 juin', 'Samedi 13 juin', 'Samedi 13 juin 2026', now() + interval '2 days 5 hours', 200, 84,  '12 chemin des Vergers, 73190 Saint-André', 'open'),
  ('wk-20juin', 'Week-end du 20 juin', 'Samedi 20 juin', 'Samedi 20 juin 2026', now() + interval '9 days',         200, 176, '12 chemin des Vergers, 73190 Saint-André', 'open'),
  ('wk-6juin',  'Week-end du 6 juin',  'Samedi 6 juin',  'Samedi 6 juin 2026',  now() - interval '1 day',          200, 0,   '12 chemin des Vergers, 73190 Saint-André', 'full')
ON CONFLICT (id) DO NOTHING;

DO \$\$
DECLARE
  wk_ids TEXT[] := ARRAY['wk-13juin','wk-20juin','wk-6juin'];
  wk_id  TEXT;
  h      INTEGER;
  m      INTEGER;
  lbl    TEXT;
  tkey   TEXT;
  cnt    INTEGER;
BEGIN
  FOREACH wk_id IN ARRAY wk_ids LOOP
    FOR h IN 17..19 LOOP
      FOR m IN 0, 15, 30, 45 LOOP
        lbl  := h || 'h' || LPAD(m::TEXT, 2, '0');
        tkey := h || ':' || m;
        cnt := CASE
          WHEN wk_id = 'wk-13juin' AND tkey IN ('17:0','18:15') THEN 3
          WHEN wk_id = 'wk-13juin' AND tkey = '17:30' THEN 2
          WHEN wk_id = 'wk-13juin' AND tkey = '19:0'  THEN 1
          WHEN wk_id = 'wk-20juin' AND tkey = '17:0'  THEN 1
          ELSE 0
        END;
        INSERT INTO slots (weekend_id, time_label, time_key, orders_count)
          VALUES (wk_id, lbl, tkey, cnt)
          ON CONFLICT (weekend_id, time_key) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END \$\$;
`

const triggers = `
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS \$\$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
\$\$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
`

async function run() {
  const steps = [
    ['Création des tables', sql],
    ['RLS & politiques', rls],
    ['Données initiales', data],
    ['Triggers', triggers],
  ]

  for (const [label, query] of steps) {
    process.stdout.write(`⏳ ${label}... `)
    const { error } = await supabase.rpc('exec_sql', { query }).catch(() => ({ error: null }))
    // exec_sql n'existe pas, on utilise l'API REST directement
    const res = await fetch(`https://lilmpljaiwdwstelycay.supabase.co/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    })
    if (!res.ok) {
      // Fallback: use pg directly via the management API
      const mgmt = await fetch(`https://api.supabase.com/v1/projects/lilmpljaiwdwstelycay/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })
      const result = await mgmt.json()
      if (result.error || mgmt.status >= 400) {
        console.error(`❌\n`, JSON.stringify(result).slice(0, 300))
      } else {
        console.log(`✅`)
      }
    } else {
      console.log(`✅`)
    }
  }
  console.log('\n🎉 Migration terminée !')
}

run().catch(console.error)
