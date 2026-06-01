'use client';

import { useState } from 'react';
import { WEEKENDS, A_ORDERS, PRICE, weekendById, eur, type AdminOrder } from '@/lib/data';
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
function agg(orders: AdminOrder[]) {
  return orders.reduce(
    (a, o) => { a.porc += o.porc; a.poulet += o.poulet; a.crevette += o.crevette; return a; },
    { porc: 0, poulet: 0, crevette: 0 }
  );
}
function nems(o: AdminOrder) { return o.porc + o.poulet + o.crevette; }

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
          <span className="role">espace Jayjay</span>
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
  const wk13 = weekendById('wk-13juin')!;
  const a13 = agg(A_ORDERS);
  const n13 = a13.porc + a13.poulet + a13.crevette;

  const wk20 = weekendById('wk-20juin')!;
  const sold20 = wk20.stockTotal - wk20.stockLeft;

  const cards = [
    { wk: wk13, orders: A_ORDERS.length, sold: n13, ca: n13 * PRICE },
    { wk: wk20, orders: 4, sold: sold20, ca: sold20 * PRICE },
  ];

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Tableau de bord</h1>
          <p className="adm-sub">Vue d&apos;ensemble des week-ends de vente en cours.</p>
        </div>
      </div>
      <div className="adm-grid">
        {cards.map(({ wk, orders, sold, ca }) => {
          const pct = Math.round((sold / wk.stockTotal) * 100);
          return (
            <div key={wk.id} className="adm-card dash-card">
              <div className="dash-top">
                <div>
                  <div className="eyebrow" style={{ fontSize: 10.5 }}>Retrait · {wk.pickupDate}</div>
                  <div className="dash-date">{wk.label}</div>
                </div>
                <span className="status-chip open">Ouvert</span>
              </div>
              <div className="dash-stats">
                <div className="stat"><div className="v">{orders}</div><div className="l">commandes payées</div></div>
                <div className="stat"><div className="v">{sold}</div><div className="l">nems vendus</div></div>
                <div className="stat accent"><div className="v">{Math.round(ca)} €</div><div className="l">chiffre d&apos;affaires</div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6, fontWeight: 600 }}>
                  <span>{sold} / {wk.stockTotal} nems</span>
                  <span>{wk.stockTotal - sold} restants</span>
                </div>
                <div className="bar-track"><div className="bar-fill" style={{ width: pct + '%' }} /></div>
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
    </div>
  );
}

// ========================== PRODUCTION ==========================
function Production() {
  const wk = weekendById('wk-13juin')!;
  const a = agg(A_ORDERS);
  const total = a.porc + a.poulet + a.crevette;
  const ca = total * PRICE;

  return (
    <div>
      <div className="adm-head no-print">
        <div>
          <h1 className="adm-title">Fiche de production</h1>
          <p className="adm-sub">{wk.label} · à cuisiner pour le {wk.pickupDate.toLowerCase()}</p>
        </div>
        <button className="abtn primary" onClick={() => window.print()}>
          <Icon name="card" size={15} color="#fff" /> Imprimer
        </button>
      </div>

      <div className="adm-card prod-sheet">
        <div className="print-only" style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 24 }}>La Caza J — Fiche de production</div>
          <div style={{ color: '#555' }}>{wk.label} · retrait {wk.pickupDate}</div>
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
            <div><div className="v">{A_ORDERS.length}</div><div className="l">commandes</div></div>
            <div><div className="v">{eur(ca)}</div><div className="l">total encaissé</div></div>
          </div>
        </div>

        <p className="adm-sub" style={{ marginTop: 18 }}>
          Stock prévu : {wk.stockTotal} nems · marge restante : {wk.stockTotal - total} nems.
        </p>
      </div>
    </div>
  );
}

// ========================== PICKUP LIST ==========================
function Pickup() {
  const wk = weekendById('wk-13juin')!;
  const [done, setDone] = useState<Record<string, string | null>>({});
  const toggle = (ref: string) =>
    setDone((d) => ({
      ...d,
      [ref]: d[ref] ? null : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }));

  const slots = [...new Set(A_ORDERS.map((o) => o.slot))].sort();
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div>
      <div className="adm-head no-print">
        <div>
          <h1 className="adm-title">Liste de retrait</h1>
          <p className="adm-sub">{wk.label} · {wk.address} · {doneCount}/{A_ORDERS.length} retirées</p>
        </div>
        <button className="abtn primary" onClick={() => window.print()}>
          <Icon name="card" size={15} color="#fff" /> Imprimer
        </button>
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
            {slots.map((slotTime) => {
              const group = A_ORDERS.filter((o) => o.slot === slotTime);
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
function Weekends() {
  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-title">Week-ends de vente</h1>
          <p className="adm-sub">Créez et pilotez vos créneaux de vente.</p>
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
              {WEEKENDS.map((wk) => (
                <tr key={wk.id}>
                  <td style={{ fontWeight: 700 }}>{wk.label}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{wk.pickupDate}</td>
                  <td className="num">{wk.stockLeft}/{wk.stockTotal}</td>
                  <td>
                    <span className={`status-chip ${wk.status === 'open' ? 'open' : 'full'}`}>
                      {wk.status === 'open' ? 'Ouvert' : 'Complet'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="abtn ghost" style={{ padding: '7px 12px' }}>
                      {wk.status === 'open' ? 'Fermer' : 'Archiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* create form */}
        <div className="adm-card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--ff-display)', fontSize: 20, marginBottom: 16 }}>Nouveau week-end</h3>
          <div className="adm-form">
            <div className="full">
              <label>Label</label>
              <input className="input" placeholder="Week-end du 27 juin" />
            </div>
            <div>
              <label>Date de retrait</label>
              <input className="input" type="date" />
            </div>
            <div>
              <label>Date limite</label>
              <input className="input" type="date" />
            </div>
            <div>
              <label>Stock total (nems)</label>
              <input className="input" type="number" placeholder="200" />
            </div>
            <div>
              <label>Créneaux</label>
              <input className="input" defaultValue="17h–20h · auto" readOnly style={{ color: 'var(--ink-faint)' }} />
            </div>
            <div className="full">
              <label>Adresse de retrait</label>
              <input className="input" defaultValue="12 chemin des Vergers, 44117 Saint-André-des-Eaux" />
            </div>
            <div className="full">
              <button className="abtn primary" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                <Icon name="plus" size={16} color="#fff" /> Créer le week-end
              </button>
            </div>
            <p className="full adm-sub" style={{ margin: 0 }}>
              Les créneaux de 15 min (17h → 20h) sont générés automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================== ADMIN ROOT ==========================
export default function AdminPage() {
  const [tab, setTab] = useState('dashboard');

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
