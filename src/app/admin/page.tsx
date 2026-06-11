'use client';

import { useState, useEffect } from 'react';
import { PRICE, eur } from '@/lib/data';
import './admin.css';

// ---- Icon (inline) ----
function Icon({ name, size = 20, color = 'currentColor', stroke = 1.8, fill = 'none' }: {
  name: string; size?: number; color?: string; stroke?: number; fill?: string;
}) {
  const p = { fill, stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    insta: <><rect x="3" y="3" width="18" height="18" rx="5" {...p} /><circle cx="12" cy="12" r="4" {...p} /><circle cx="17.3" cy="6.7" r="0.6" fill={color} stroke="none" /></>,
    clock: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 7.5V12l3 2" {...p} /></>,
    pin: <><path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11Z" {...p} /><circle cx="12" cy="10" r="2.6" {...p} /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...p} />,
    plus: <path d="M12 5v14M5 12h14" {...p} />,
    minus: <path d="M5 12h14" {...p} />,
    chevR: <path d="M9 5l7 7-7 7" {...p} />,
    chevL: <path d="M15 5l-7 7 7 7" {...p} />,
    chevD: <path d="M5 9l7 7 7-7" {...p} />,
    flame: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.6.7-2.8 1.4-3.6.2 1 .8 1.8 1.6 2.1 0-2.3.9-5.3 2-7.5Z" {...p} />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...p} />,
    lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" {...p} /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...p} /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M4 7l8 6 8-6" {...p} /></>,
    phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L19 16l4 1.5V20a2 2 0 0 1-2 2A16 16 0 0 1 5 6a2 2 0 0 1 0-2Z" transform="translate(-1 -1)" {...p} />,
    info: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 11v5M12 8h.01" {...p} /></>,
    user: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...p} /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M3 9.5h18" {...p} /></>,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2.5" {...p} /><path d="M4 9.5h16M8 3v4M16 3v4" {...p} /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
}

// ---- helpers ----
// ===== Données réelles (vue d'ensemble depuis la base) =====
interface OvWeekend {
  id: string; label: string; pickup_date: string; pickup_date_long: string; deadline: string;
  stock_total: number; stock_left: number; address: string; status: string;
}
interface OvOrder {
  ref: string; weekendId: string; client: string; tel: string;
  slot: string; slotKey: string; porc: number; poulet: number; crevette: number;
}
interface Overview { weekends: OvWeekend[]; orders: OvOrder[] }

function useOverview(): Overview | null {
  const [data, setData] = useState<Overview | null>(null);
  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then((d) => {
        // tri par date de retrait (du plus proche au plus loin)
        const weekends = ([...(d.weekends ?? [])] as OvWeekend[]).sort(
          (a, b) => longToInputDate(a.pickup_date_long).localeCompare(longToInputDate(b.pickup_date_long)),
        );
        setData({ weekends, orders: d.orders ?? [] });
      })
      .catch(() => setData({ weekends: [], orders: [] }));
  }, []);
  return data;
}

const nems = (o: OvOrder) => o.porc + o.poulet + o.crevette;
function agg(orders: OvOrder[]) {
  return orders.reduce(
    (a, o) => { a.porc += o.porc; a.poulet += o.poulet; a.crevette += o.crevette; return a; },
    { porc: 0, poulet: 0, crevette: 0 }
  );
}
const STATUS_CHIP: Record<string, { cls: string; label: string }> = {
  open: { cls: 'open', label: 'Ouvert' },
  full: { cls: 'full', label: 'Épuisé' },
  closed: { cls: 'full', label: 'Fermé' },
  archived: { cls: 'full', label: 'Archivé' },
};
const admLoading = (
  <div className="adm-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>Chargement…</div>
);

// ========================== TOP BAR ==========================
function AdminBar({ tab, setTab }: { tab: string; setTab: (t: string) => void }) {
  const tabs: [string, string][] = [
    ['dashboard', 'Tableau de bord'],
    ['production', 'Fiche de production'],
    ['pickup', 'Liste de retrait'],
    ['weekends', 'Week-ends'],
  ];
  return (
    <div className="adm-bar no-print" style={{ margin: 0, padding: '0 24px' }}>
      <div className="adm-bar-inner">
        <div className="adm-brand">
          <span className="nm">La Caza J</span>
          <span className="role">espace Jenny</span>
        </div>
        <a href="/" className="abtn ghost" style={{ textDecoration: 'none' }}>
          <Icon name="arrow" size={15} /> Voir le site client
        </a>
      </div>
      <div className="adm-bar-inner" style={{ paddingTop: 0 }}>
        <div className="adm-tabs">
          {tabs.map(([id, label]) => (
            <button key={id} className={`adm-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================== DASHBOARD ==========================
function Dashboard({ setTab }: { setTab: (t: string) => void }) {
  const data = useOverview();
  if (!data) return admLoading;

  const cards = data.weekends
    .filter((w) => w.status !== 'archived')
    .map((w) => {
      const ords = data.orders.filter((o) => o.weekendId === w.id);
      const a = agg(ords);
      const sold = a.porc + a.poulet + a.crevette;
      return { wk: w, orders: ords.length, sold };
    });

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Tableau de bord</h1>
          <p className="adm-sub">Vue d&apos;ensemble des week-ends de vente en cours.</p>
        </div>
      </div>
      {cards.length === 0 ? (
        <div className="adm-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>
          Aucun week-end actif pour l&apos;instant.
        </div>
      ) : (
        <div className="adm-grid">
          {cards.map(({ wk, orders, sold }) => {
            const pct = wk.stock_total > 0 ? Math.round((sold / wk.stock_total) * 100) : 0;
            const chip = STATUS_CHIP[wk.status] ?? { cls: 'full', label: wk.status };
            return (
              <div key={wk.id} className="adm-card dash-card">
                <div className="dash-top">
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10.5 }}>Retrait · {wk.pickup_date}</div>
                    <div className="dash-date">{wk.label}</div>
                  </div>
                  <span className={`status-chip ${chip.cls}`}>{chip.label}</span>
                </div>
                <div className="dash-stats">
                  <div className="stat"><div className="v">{orders}</div><div className="l">commandes payées</div></div>
                  <div className="stat"><div className="v">{sold}</div><div className="l">nems vendus</div></div>
                  <div className="stat accent"><div className="v">{Math.round(sold * PRICE)} €</div><div className="l">chiffre d&apos;affaires</div></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6, fontWeight: 600 }}>
                    <span>{sold} / {wk.stock_total} nems</span>
                    <span>{Math.max(0, wk.stock_total - sold)} restants</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: Math.min(100, pct) + '%' }} /></div>
                </div>
                <div className="btn-row">
                  <button className="abtn primary" onClick={() => setTab('production')}>
                    <Icon name="flame" size={15} color="#fff" /> Fiche de production
                  </button>
                  <button className="abtn" onClick={() => setTab('pickup')}>
                    <Icon name="calendar" size={15} /> Retraits
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========================== PRODUCTION ==========================
function Production() {
  const data = useOverview();
  const [wkId, setWkId] = useState('');
  useEffect(() => {
    if (data && data.weekends.length && !wkId) setWkId(data.weekends[0].id);
  }, [data, wkId]);

  if (!data) return admLoading;
  const wk = data.weekends.find((w) => w.id === wkId) ?? data.weekends[0];
  if (!wk) return <div className="adm-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>Aucun week-end.</div>;

  const ords = data.orders.filter((o) => o.weekendId === wk.id);
  const a = agg(ords);
  const total = a.porc + a.poulet + a.crevette;
  const ca = total * PRICE;

  return (
    <div>
      <div className="adm-head no-print">
        <div>
          <h1 className="adm-title">Fiche de production</h1>
          <p className="adm-sub">{wk.label} · à cuisiner pour le {wk.pickup_date.toLowerCase()}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto' }} value={wk.id} onChange={(e) => setWkId(e.target.value)}>
            {data.weekends.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <button className="abtn primary" onClick={() => window.print()}>
            <Icon name="card" size={15} color="#fff" /> Imprimer
          </button>
        </div>
      </div>

      <div className="adm-card prod-sheet">
        <div className="print-only" style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 24 }}>La Caza J — Fiche de production</div>
          <div style={{ color: '#555' }}>{wk.label} · retrait {wk.pickup_date}</div>
        </div>

        <div style={{ fontSize: 15, color: 'var(--ink-soft)' }}>À rouler pour ce week-end :</div>

        <div className="prod-hero">
          <div className="prod-num porc"><div className="big">{a.porc}</div><div className="nm">nems au porc</div></div>
          <div className="prod-num poulet"><div className="big">{a.poulet}</div><div className="nm">nems au poulet</div></div>
          <div className="prod-num crevette"><div className="big">{a.crevette}</div><div className="nm">nems à la crevette</div></div>
        </div>

        <div className="prod-grand">
          <div className="eq">{a.porc} porc · {a.poulet} poulet · {a.crevette} crevette = {total} nems</div>
          <div className="meta">
            <div><div className="v">{ords.length}</div><div className="l">commandes</div></div>
            <div><div className="v">{eur(ca)}</div><div className="l">total encaissé</div></div>
          </div>
        </div>

        <p className="adm-sub" style={{ marginTop: 18 }}>
          Stock prévu : {wk.stock_total} nems · marge restante : {Math.max(0, wk.stock_total - total)} nems.
        </p>
      </div>
    </div>
  );
}

// ========================== PICKUP LIST ==========================
function Pickup() {
  const data = useOverview();
  const [wkId, setWkId] = useState('');
  const [done, setDone] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (data && data.weekends.length && !wkId) setWkId(data.weekends[0].id);
  }, [data, wkId]);
  const toggle = (ref: string) =>
    setDone((d) => ({
      ...d,
      [ref]: d[ref] ? null : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));

  if (!data) return admLoading;
  const wk = data.weekends.find((w) => w.id === wkId) ?? data.weekends[0];
  if (!wk) return <div className="adm-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>Aucun week-end.</div>;

  const ords = data.orders.filter((o) => o.weekendId === wk.id);
  const slots = [...new Set(ords.map((o) => o.slot))].sort();
  const doneCount = ords.filter((o) => done[o.ref]).length;

  return (
    <div>
      <div className="adm-head no-print">
        <div>
          <h1 className="adm-title">Liste de retrait</h1>
          <p className="adm-sub">{wk.label} · {wk.address} · {doneCount}/{ords.length} retirées</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto' }} value={wk.id} onChange={(e) => setWkId(e.target.value)}>
            {data.weekends.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
          <button className="abtn primary" onClick={() => window.print()}>
            <Icon name="card" size={15} color="#fff" /> Imprimer
          </button>
        </div>
      </div>

      <div className="adm-card" style={{ overflow: 'hidden' }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Contenu</th>
              <th className="num" style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ords.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: 24 }}>Aucune commande pour ce week-end.</td></tr>
            ) : slots.map((slotTime) => {
              const group = ords.filter((o) => o.slot === slotTime);
              return (
                <>
                  <tr key={`head-${slotTime}`} className="slot-group-head">
                    <td colSpan={5}>
                      {slotTime} <span className="cnt">· {group.length} commande{group.length > 1 ? 's' : ''}</span>
                    </td>
                  </tr>
                  {group.map((o) => {
                    const isDone = !!done[o.ref];
                    return (
                      <tr key={o.ref} className={isDone ? 'row-done' : ''}>
                        <td>
                          <button
                            className={`check-btn ${isDone ? 'on' : ''}`}
                            onClick={() => toggle(o.ref)}
                            title="Marquer comme retiré"
                          >
                            {isDone && <Icon name="check" size={16} color="#fff" stroke={2.6} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{o.client}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                            {o.ref}{isDone && <span className="ts"> · retiré {done[o.ref]}</span>}
                          </div>
                        </td>
                        <td style={{ color: 'var(--ink-soft)' }}>{o.tel}</td>
                        <td>
                          {o.porc > 0 && <span className="pill-q porc">{o.porc} porc</span>}
                          {o.poulet > 0 && <span className="pill-q poulet">{o.poulet} poulet</span>}
                          {o.crevette > 0 && <span className="pill-q crevette">{o.crevette} crevette</span>}
                        </td>
                        <td className="num" style={{ textAlign: 'right' }}>{eur(nems(o) * PRICE)}</td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================== WEEKENDS MGMT ==========================
interface AdminWeekend {
  id: string;
  label: string;
  pickup_date: string;
  pickup_date_long: string;
  deadline: string;
  stock_total: number;
  stock_left: number;
  address: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  full: 'Épuisé',
  closed: 'Fermé',
  archived: 'Archivé',
};

const DEFAULT_ADDRESS = '12 chemin des Vergers, 44117 Saint-André-des-Eaux';
const DEFAULT_TIME = '19:00';

const FR_MONTHS_ADMIN: Record<string, number> = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10,
  décembre: 11, decembre: 11,
};
// "Samedi 20 juin 2026" -> "2026-06-20"
function longToInputDate(long: string): string {
  const m = (long || '').toLowerCase().match(/(\d{1,2})\s+([a-zàâäéèêëîïôöûüç]+)\s+(\d{4})/);
  if (!m) return '';
  const month = FR_MONTHS_ADMIN[m[2]];
  if (month == null) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${m[3]}-${pad(month + 1)}-${pad(+m[1])}`;
}
// instant ISO -> { date, time } en heure de Paris (pour pré-remplir les champs)
function isoToParisInputs(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const p = dtf.formatToParts(new Date(iso)).reduce((a, x) => { a[x.type] = x.value; return a; }, {} as Record<string, string>);
  const hh = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hh}:${p.minute}` };
}

function Weekends() {
  const [list, setList] = useState<AdminWeekend[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState(DEFAULT_TIME);
  const [stockTotal, setStockTotal] = useState('');
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/weekends');
      const data = await res.json();
      const weekends = ([...(data.weekends ?? [])] as AdminWeekend[]).sort(
        (a, b) => longToInputDate(a.pickup_date_long).localeCompare(longToInputDate(b.pickup_date_long)),
      );
      setList(weekends);
    } catch {
      setFeedback({ type: 'err', msg: 'Impossible de charger les week-ends.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setLabel(''); setPickupDate(''); setDeadline(''); setDeadlineTime(DEFAULT_TIME);
    setStockTotal(''); setAddress(DEFAULT_ADDRESS);
  };

  const startEdit = (wk: AdminWeekend) => {
    setFeedback(null);
    setEditingId(wk.id);
    setLabel(wk.label);
    setPickupDate(longToInputDate(wk.pickup_date_long));
    const dl = isoToParisInputs(wk.deadline);
    setDeadline(dl.date);
    setDeadlineTime(dl.time || DEFAULT_TIME);
    setStockTotal(String(wk.stock_total));
    setAddress(wk.address || DEFAULT_ADDRESS);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    setFeedback(null);
    if (!pickupDate || !deadline || !stockTotal || !address.trim()) {
      setFeedback({ type: 'err', msg: 'Remplissez la date de retrait, la date limite, le stock et l’adresse.' });
      return;
    }
    setSubmitting(true);
    const editing = !!editingId;
    try {
      const res = await fetch('/api/weekends', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, label, pickupDate, deadline, deadlineTime, stockTotal: Number(stockTotal), address }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Enregistrement impossible');
      }
      setFeedback({ type: 'ok', msg: editing ? 'Week-end modifié !' : 'Week-end créé ! Les créneaux 18h–21h ont été générés.' });
      resetForm();
      await load();
    } catch (e) {
      setFeedback({ type: 'err', msg: e instanceof Error ? e.message : 'Enregistrement impossible' });
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/weekends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setFeedback({ type: 'err', msg: 'Mise à jour du statut impossible.' });
    }
  };

  const isEditing = !!editingId;

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Week-ends de vente</h1>
          <p className="adm-sub">Créez, modifiez et pilotez vos créneaux de vente.</p>
        </div>
      </div>

      <div className="wk-layout">
        {/* list */}
        <div className="adm-card" style={{ overflow: 'hidden' }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Week-end</th>
                <th>Retrait</th>
                <th>Stock</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: 24 }}>Chargement…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: 24 }}>Aucun week-end pour l’instant.</td></tr>
              ) : list.map((wk) => (
                <tr key={wk.id} style={editingId === wk.id ? { background: 'var(--terracotta-tint)' } : undefined}>
                  <td style={{ fontWeight: 700 }}>{wk.label}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{wk.pickup_date}</td>
                  <td className="num">{wk.stock_left}/{wk.stock_total}</td>
                  <td>
                    <span className={`status-chip ${wk.status === 'open' ? 'open' : 'full'}`}>
                      {STATUS_LABELS[wk.status] ?? wk.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="abtn ghost" style={{ padding: '7px 10px', marginRight: 6 }} onClick={() => startEdit(wk)}>
                      Modifier
                    </button>
                    {wk.status === 'open' ? (
                      <button className="abtn ghost" style={{ padding: '7px 10px' }} onClick={() => changeStatus(wk.id, 'closed')}>
                        Fermer
                      </button>
                    ) : wk.status === 'archived' ? (
                      <button className="abtn ghost" style={{ padding: '7px 10px' }} onClick={() => changeStatus(wk.id, 'open')}>
                        Rouvrir
                      </button>
                    ) : (
                      <button className="abtn ghost" style={{ padding: '7px 10px' }} onClick={() => changeStatus(wk.id, 'archived')}>
                        Archiver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* create / edit form */}
        <div className="adm-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, marginBottom: 16 }}>
            {isEditing ? 'Modifier le week-end' : 'Nouveau week-end'}
          </h3>
          <div className="adm-form">
            <div className="full">
              <label>Label (optionnel)</label>
              <input className="input" placeholder="Week-end du 27 juin" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <label>Date de retrait</label>
              <input className="input" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
            </div>
            <div>
              <label>Stock total (nems)</label>
              <input className="input" type="number" placeholder="200" value={stockTotal} onChange={(e) => setStockTotal(e.target.value)} />
            </div>
            <div>
              <label>Date limite</label>
              <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label>Heure limite</label>
              <input className="input" type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} />
            </div>
            <div className="full">
              <label>Créneaux de retrait</label>
              <input className="input" defaultValue="18h–21h · auto" readOnly style={{ color: 'var(--ink-faint)' }} />
            </div>
            <div className="full">
              <label>Adresse de retrait</label>
              <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="full">
              <button
                className="abtn primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', opacity: submitting ? 0.6 : 1 }}
                onClick={save}
                disabled={submitting}
              >
                <Icon name={isEditing ? 'check' : 'plus'} size={16} color="#fff" />{' '}
                {submitting ? 'Enregistrement…' : isEditing ? 'Enregistrer les modifications' : 'Créer le week-end'}
              </button>
            </div>
            {isEditing && (
              <button
                className="abtn ghost full"
                style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
                onClick={resetForm}
                disabled={submitting}
              >
                Annuler
              </button>
            )}
            {feedback && (
              <p className="full" style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: feedback.type === 'ok' ? 'var(--herb-deep)' : '#b3261e' }}>
                {feedback.msg}
              </p>
            )}
            <p className="full adm-sub" style={{ margin: 0 }}>
              Les créneaux de 30 min (18h → 21h) sont générés automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================== ADMIN ROOT ==========================
// ========================== LOGIN ==========================
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Connexion impossible');
      }
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#efe7d8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="adm-card" style={{ padding: 28, width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 24, marginBottom: 6 }}>Espace Jenny</h1>
        <p className="adm-sub" style={{ marginBottom: 18 }}>Entrez le mot de passe pour accéder à l’administration.</p>
        <div className="adm-form">
          <div className="full">
            <label>Mot de passe</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              autoFocus
            />
          </div>
          {error && <p className="full" style={{ margin: 0, color: '#b3261e', fontSize: 13.5, fontWeight: 600 }}>{error}</p>}
          <div className="full">
            <button
              className="abtn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', opacity: submitting ? 0.6 : 1 }}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    fetch('/api/admin-auth')
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#efe7d8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)' }}>
        Chargement…
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#efe7d8' }}>
      <AdminBar tab={tab} setTab={setTab} />
      <div className="adm-shell">
        {tab === 'dashboard' && <Dashboard setTab={setTab} />}
        {tab === 'production' && <Production />}
        {tab === 'pickup' && <Pickup />}
        {tab === 'weekends' && <Weekends />}
      </div>
    </div>
  );
}
