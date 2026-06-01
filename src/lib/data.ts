/* La Caza J — typed data */

import { supabase } from '@/lib/supabase'

export const PRICE = 1.30;

export interface Product {
  id: string;
  name: string;
  short: string;
  desc: string;
  price: number;
  allergens: string[];
  hue: string;
  photo: string;
}

export interface Slot {
  id: string;
  label: string;
  count: number;
  max: number;
}

export interface Weekend {
  id: string;
  label: string;
  pickupDate: string;
  pickupDateLong: string;
  deadline: number;
  stockTotal: number;
  stockLeft: number;
  address: string;
  status: 'open' | 'full';
  photo: string;
  slots: Slot[];
}

export interface OrderLine {
  id: string;
  qty: number;
}

export interface Order {
  ref: string;
  weekendLabel: string;
  pickupDate: string;
  slot: string;
  address: string;
  status: 'done' | 'paid' | 'wait';
  lines: OrderLine[];
  total: number;
}

export interface AdminOrder {
  ref: string;
  client: string;
  tel: string;
  slot: string;
  porc: number;
  poulet: number;
  crevette: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'porc',
    name: 'Nems au porc',
    short: 'porc',
    desc: 'Servis avec salade, menthe et sauce nem.',
    price: PRICE,
    allergens: ['Gluten', 'Soja', 'Œuf'],
    hue: '#C45C39',
    photo: 'photo · nems porc',
  },
  {
    id: 'poulet',
    name: 'Nems au poulet',
    short: 'poulet',
    desc: 'Servis avec salade, menthe et sauce nem.',
    price: PRICE,
    allergens: ['Gluten', 'Soja', 'Œuf'],
    hue: '#D49A3A',
    photo: 'photo · nems poulet',
  },
  {
    id: 'crevette',
    name: 'Nems à la crevette',
    short: 'crevette',
    desc: 'Servis avec salade, menthe et sauce nem.',
    price: PRICE,
    allergens: ['Gluten', 'Soja', 'Œuf', 'Crustacés'],
    hue: '#5E7A41',
    photo: 'photo · nems crevette',
  },
];

function buildSlots(fullList: Record<string, number> = {}): Slot[] {
  const slots: Slot[] = [];
  for (let h = 17; h < 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      const label = `${h}h${m === 0 ? '00' : m}`;
      const id = `${h}:${m}`;
      const count = fullList[id] != null ? fullList[id] : 0;
      slots.push({ id, label, count, max: 3 });
    }
  }
  return slots;
}

export const ADDRESS = '12 chemin des Vergers, 44117 Saint-André-des-Eaux';

const now = Date.now();
const DAY = 86400000;

export const WEEKENDS: Weekend[] = [
  {
    id: 'wk-13juin',
    label: 'Week-end du 13 juin',
    pickupDate: 'Samedi 13 juin',
    pickupDateLong: 'Samedi 13 juin 2026',
    deadline: now + 2 * DAY + 5 * 3600000 + 42 * 60000,
    stockTotal: 200,
    stockLeft: 84,
    address: ADDRESS,
    status: 'open',
    photo: 'photo · plat de nems',
    slots: buildSlots({ '17:0': 3, '17:30': 2, '18:15': 3, '19:0': 1 }),
  },
  {
    id: 'wk-20juin',
    label: 'Week-end du 20 juin',
    pickupDate: 'Samedi 20 juin',
    pickupDateLong: 'Samedi 20 juin 2026',
    deadline: now + 9 * DAY,
    stockTotal: 200,
    stockLeft: 176,
    address: ADDRESS,
    status: 'open',
    photo: 'photo · apéro nems',
    slots: buildSlots({ '17:0': 1 }),
  },
  {
    id: 'wk-6juin',
    label: 'Week-end du 6 juin',
    pickupDate: 'Samedi 6 juin',
    pickupDateLong: 'Samedi 6 juin 2026',
    deadline: now - 1 * DAY,
    stockTotal: 200,
    stockLeft: 0,
    address: ADDRESS,
    status: 'full',
    photo: 'photo · nems dorés',
    slots: buildSlots({}),
  },
];

export const PAST_ORDERS: Order[] = [
  {
    ref: 'CZ-1043',
    weekendLabel: 'Week-end du 30 mai',
    pickupDate: 'Samedi 30 mai',
    slot: '18h30',
    address: ADDRESS,
    status: 'done',
    lines: [{ id: 'porc', qty: 6 }, { id: 'poulet', qty: 3 }],
    total: 9 * PRICE,
  },
];

export const A_ORDERS: AdminOrder[] = [
  { ref: 'CZ-1201', client: 'Camille Roux',   tel: '06 50 11 22 33', slot: '17h00', porc: 6,  poulet: 0,  crevette: 3 },
  { ref: 'CZ-1202', client: 'Théo Bernard',   tel: '06 12 90 45 67', slot: '17h00', porc: 9,  poulet: 3,  crevette: 0 },
  { ref: 'CZ-1203', client: 'Léa Fontaine',   tel: '07 81 23 44 09', slot: '17h15', porc: 3,  poulet: 6,  crevette: 3 },
  { ref: 'CZ-1204', client: 'Marc Lemoine',   tel: '06 77 65 43 21', slot: '17h30', porc: 6,  poulet: 6,  crevette: 6 },
  { ref: 'CZ-1205', client: 'Sophie Garnier', tel: '06 33 22 11 00', slot: '17h30', porc: 0,  poulet: 6,  crevette: 6 },
  { ref: 'CZ-1206', client: 'Yann Dupont',    tel: '07 60 12 34 56', slot: '17h45', porc: 12, poulet: 0,  crevette: 0 },
  { ref: 'CZ-1207', client: 'Inès Morel',     tel: '06 45 78 90 12', slot: '18h00', porc: 6,  poulet: 3,  crevette: 3 },
  { ref: 'CZ-1208', client: 'Hugo Petit',     tel: '06 22 33 44 55', slot: '18h15', porc: 3,  poulet: 9,  crevette: 0 },
  { ref: 'CZ-1209', client: 'Nadia Benali',   tel: '07 11 22 33 44', slot: '18h30', porc: 6,  poulet: 6,  crevette: 6 },
  { ref: 'CZ-1210', client: 'Paul Girard',    tel: '06 98 76 54 32', slot: '18h45', porc: 9,  poulet: 0,  crevette: 6 },
  { ref: 'CZ-1211', client: 'Émilie Faure',   tel: '06 14 25 36 47', slot: '19h00', porc: 3,  poulet: 6,  crevette: 3 },
  { ref: 'CZ-1212', client: 'Lucas Henry',    tel: '07 89 56 23 10', slot: '19h15', porc: 6,  poulet: 3,  crevette: 6 },
  { ref: 'CZ-1213', client: 'Chloé Masson',   tel: '06 55 44 33 22', slot: '19h30', porc: 9,  poulet: 3,  crevette: 0 },
  { ref: 'CZ-1214', client: 'Adam Schmitt',   tel: '06 66 77 88 99', slot: '19h45', porc: 0,  poulet: 0,  crevette: 9 },
];

export const productById = (id: string, products: Product[] = PRODUCTS): Product | undefined =>
  products.find((p) => p.id === id);

export const weekendById = (id: string, weekends: Weekend[] = WEEKENDS): Weekend | undefined =>
  weekends.find((w) => w.id === id);

export const eur = (n: number): string =>
  n.toFixed(2).replace('.', ',') + ' €';

// ---- Supabase fetch functions ----

export async function fetchWeekends(): Promise<Weekend[]> {
  try {
    const { data, error } = await supabase
      .from('weekends')
      .select('*, slots(*)')
      .order('deadline', { ascending: true })
    if (error || !data) return []
    return data.map((row) => ({
      id: row.id,
      label: row.label,
      pickupDate: row.pickup_date,
      pickupDateLong: row.pickup_date_long,
      deadline: new Date(row.deadline).getTime(),
      stockTotal: row.stock_total,
      stockLeft: row.stock_left,
      address: row.address,
      status: row.status as Weekend['status'],
      photo: row.photo,
      slots: (row.slots || []).map((s: { id: string; time_label: string; orders_count: number; max_orders: number }) => ({
        id: s.id,
        label: s.time_label,
        count: s.orders_count,
        max: s.max_orders,
      })),
    }))
  } catch {
    return []
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
    if (error || !data) return []
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      short: row.short,
      desc: row.description,
      price: row.price_cents / 100,
      allergens: row.allergens || [],
      hue: row.hue,
      photo: row.photo_url,
    }))
  } catch {
    return []
  }
}

export async function subscribeEmail(email: string): Promise<void> {
  const { error } = await supabase
    .from('subscribers')
    .insert({ email, active: true })
  if (error) throw error
}
