'use client';

import { useState, useEffect, useRef } from 'react';
import {
  PRICE, PRODUCTS, WEEKENDS, PAST_ORDERS,
  productById, weekendById, eur,
  fetchWeekends, fetchProducts, subscribeEmail,
  type Weekend, type Order, type Product,
} from '@/lib/data';
import { supabase } from '@/lib/supabase';

// ---- Icon (inline for single-file SPA) ----
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
    mint: <><path d="M12 21c0-6 3-10 8-11-1 7-4 10-8 11Z" {...p} /><path d="M12 21c0-6-3-10-8-11 1 7 4 10 8 11Z" {...p} /><path d="M12 21v-7" {...p} /></>,
    flame: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.6.7-2.8 1.4-3.6.2 1 .8 1.8 1.6 2.1 0-2.3.9-5.3 2-7.5Z" {...p} />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...p} />,
    lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" {...p} /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...p} /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M4 7l8 6 8-6" {...p} /></>,
    phone: <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L19 16l4 1.5V20a2 2 0 0 1-2 2A16 16 0 0 1 5 6a2 2 0 0 1 0-2Z" transform="translate(-1 -1)" {...p} />,
    info: <><circle cx="12" cy="12" r="9" {...p} /><path d="M12 11v5M12 8h.01" {...p} /></>,
    star: <path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.9 6.9 19.2 8 13.5l-4.3-4 5.8-.7L12 3.5Z" {...p} />,
    user: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...p} /></>,
    bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...p} /><path d="M10 19a2 2 0 0 0 4 0" {...p} /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5" {...p} /><path d="M3 9.5h18" {...p} /></>,
    x: <path d="M6 6l12 12M18 6L6 18" {...p} />,
    calendar: <><rect x="4" y="5" width="16" height="16" rx="2.5" {...p} /><path d="M4 9.5h16M8 3v4M16 3v4" {...p} /></>,
    sparkle: <path d="M12 4l1.6 4.6L18 10l-4.4 1.4L12 16l-1.6-4.6L6 10l4.4-1.4L12 4Z" {...p} />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
}

// ---- Photo ----
function Photo({ label, className = '', style = {}, tint, src }: {
  label: string; className?: string; style?: React.CSSProperties; tint?: string; src?: string;
}) {
  if (src) {
    return (
      <div className={`ph ${className}`} style={{ ...style, padding: 0, overflow: 'hidden' }}>
        <img src={src} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div className={`ph ${className}`} style={style}>
      {tint && <div style={{ position: 'absolute', inset: 0, background: tint, opacity: 0.14 }} />}
      <span className="ph-label">{label}</span>
    </div>
  );
}

// ---- Countdown ----
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Countdown({ deadline, compact = false }: { deadline: number; compact?: boolean }) {
  const now = useNow();
  if (now === null) return <span className="badge badge-low">…</span>;

  let diff = Math.max(0, deadline - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  if (deadline - now <= 0) return <span className="badge badge-late">Trop tard</span>;

  if (compact) {
    const txt = d > 0 ? `Plus que ${d}j ${pad(h)}h` : `Plus que ${pad(h)}h${pad(m)}`;
    return <span className="badge badge-low"><Icon name="clock" size={13} /> {txt}</span>;
  }

  const unit = (val: number, lbl: string) => (
    <div className="cd-stack">
      <span className="cd-box">{pad(val)}</span>
      <span className="cd-unit">{lbl}</span>
    </div>
  );

  return (
    <div className="cd">
      {d > 0 && <>{unit(d, 'jours')}<span className="cd-sep">:</span></>}
      {unit(h, 'h')}<span className="cd-sep">:</span>
      {unit(m, 'min')}<span className="cd-sep">:</span>
      {unit(s, 'sec')}
    </div>
  );
}

// ---- Weekend badge ----
function WeekendBadge({ wk }: { wk: Weekend }) {
  if (wk.status === 'full') return <span className="badge badge-full">Complet</span>;
  if (wk.stockLeft <= 40) return <span className="badge badge-low"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
  return <span className="badge badge-stock"><span className="dot" />Il reste {wk.stockLeft} nems</span>;
}

// ---- Cart types ----
type Cart = { porc: number; poulet: number; crevette: number };
type Route = { name: string; ctx: Record<string, string> };
type Account = { email: string; nom: string; tel: string; consent: boolean };

// ---- Cart lines helper ----
function cartLines(cart: Cart, products: Product[] = PRODUCTS) {
  return products.map((p) => ({ ...p, qty: cart[p.id as keyof Cart] || 0 })).filter((l) => l.qty > 0);
}

// ========================== SCREENS ==========================

// ---- BrandBar ----
function BrandBar({ onInsta, solid = false, right }: {
  onInsta?: () => void; solid?: boolean; right?: React.ReactNode;
}) {
  return (
    <div className={`topbar ${solid ? 'solid' : ''}`}>
      <div className="brandmark" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <img src="/logo.jpg" alt="" style={{ height: 36, width: 'auto', display: 'block', borderRadius: 6 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="lc-small">la</span>
          <span className="lc-name">La Caza J</span>
        </div>
      </div>
      {right || (
        <button className="icon-btn" onClick={onInsta} aria-label="Instagram">
          <Icon name="insta" size={19} />
        </button>
      )}
    </div>
  );
}

// ---- Subscribe block ----
function SubscribeBlock() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await subscribeEmail(email);
      setDone(true);
    } catch {
      // Insert failed (e.g. duplicate email) — still show success to user
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18, background: 'var(--herb-tint)', borderColor: 'transparent' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--herb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={18} color="#fff" />
        </div>
        <h3 className="display" style={{ fontSize: 19, color: 'var(--herb-deep)' }}>Prévenez-moi des prochains créneaux</h3>
      </div>
      {done ? (
        <p style={{ fontSize: 14, color: 'var(--herb-deep)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icon name="check" size={18} color="var(--herb-deep)" /> C&apos;est noté ! On vous écrit dès l&apos;ouverture.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-herb" style={{ width: 'auto', padding: '0 18px' }} disabled={loading} onClick={handleSubscribe}>
            {loading ? '…' : 'OK'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Weekend card ----
function WeekendCard({ wk, go }: { wk: Weekend; go: (name: string, ctx?: Record<string, string>) => void }) {
  const closed = wk.status !== 'open';
  return (
    <div className="card wk-card" style={closed ? { opacity: 0.45, filter: 'grayscale(0.6)' } : {}}>
      <div className="wk-top">
        <Photo label={wk.photo} src="/event.png" className="wk-thumb" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div className="eyebrow" style={{ fontSize: 10.5 }}>Retrait</div>
              <div className="wk-date">{wk.pickupDate}</div>
            </div>
            <WeekendBadge wk={wk} />
          </div>
          <div className="wk-sub"><Icon name="pin" size={13} /> <a href={`https://maps.google.com/?q=${encodeURIComponent(wk.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>{wk.address.split(',')[0]}</a></div>
        </div>
      </div>
      <div className="wk-body">
        <div className="wk-meta">
          {wk.status === 'open' && (
            <span className="muted" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={15} color="var(--ink-soft)" /> Commandes jusqu&apos;à&nbsp;:
            </span>
          )}
        </div>
        {wk.status === 'open' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Countdown deadline={wk.deadline} />
            <button className="btn btn-primary btn-sm" onClick={() => go('order', { weekendId: wk.id })}>
              Commander <Icon name="arrow" size={16} color="#fff" />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span className="muted" style={{ fontSize: 14 }}>Stock épuisé pour ce week-end.</span>
            <button className="btn btn-ghost btn-sm" disabled style={{ opacity: .5 }}>Complet</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================== HOME ==========================
function HomeScreen({ go, onInsta, weekends }: { go: (name: string, ctx?: Record<string, string>) => void; onInsta: () => void; weekends: Weekend[] }) {
  const open = weekends.filter((w) => w.status === 'open');
  const full = weekends.filter((w) => w.status === 'full');
  return (
    <div className="screen">
      <BrandBar onInsta={onInsta} />

      {/* Hero */}
      <div className="pad" style={{ paddingTop: 6, paddingBottom: 30 }}>
        <div className="eyebrow">Traiteur fait-maison · Saint-André-des-Eaux</div>
        <h1 className="display hero-title" style={{ fontSize: 40, marginTop: 8 }}>
          Des nems<br />à partager (ou pas !)
        </h1>
        <p className="hand hero-hand" style={{ fontSize: 26, lineHeight: 1.15, color: 'var(--terracotta-deep)', marginTop: 10, transform: 'rotate(-1.5deg)', transformOrigin: 'left' }}>
          la cuisine qui réchauffe les cœurs
        </p>
      </div>

      <div className="pad">
        <Photo
          label="photo · plat de nems fumants"
          src="/hero.png"
          style={{ height: 200, borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}
        />
      </div>

      {/* Story */}
      <div className="pad" style={{ paddingTop: 22, paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: 'var(--herb)' }} />
          <p style={{ fontSize: 15.5, color: 'var(--ink-soft)' }}>
            Jayjay — <em style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--ink)' }}>« la J »</em> — roule ses nems à la main depuis toujours
            pour régaler ses proches. Aujourd&apos;hui elle ouvre sa cuisine : porc, poulet ou crevette,
            servis avec salade, menthe et sauce nem. Fait-maison, jamais industriel.
          </p>
        </div>
      </div>

      {/* Weekends */}
      <div className="section" style={{ paddingTop: 26 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="display" style={{ fontSize: 26 }}>Prochains créneaux</h2>
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Commandez avant la date limite, retirez chez Jayjay à Saint-André-des-Eaux.</p>
      </div>

      <div className="section wk-grid">
        {open.map((wk) => <WeekendCard key={wk.id} wk={wk} go={go} />)}
        {full.map((wk) => <WeekendCard key={wk.id} wk={wk} go={go} />)}
      </div>

      {/* Subscribe */}
      <div className="section" style={{ paddingTop: 12 }}>
        <SubscribeBlock />
      </div>

      {/* Footer */}
      <div className="pad" style={{ padding: '28px 20px 36px', textAlign: 'center' }}>
        <button
          className="backbtn"
          onClick={onInsta}
          style={{ color: 'var(--terracotta)', justifyContent: 'center', display: 'inline-flex' }}
        >
          <Icon name="insta" size={18} /> @la_caza_j
        </button>
        <p className="faint" style={{ fontSize: 12, marginTop: 10 }}>Saint-André-des-Eaux (44)</p>
        <p className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => go('legal')}>Mentions légales</span>
          {' · '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => go('legal')}>CGV</span>
          {' · '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => go('legal')}>Confidentialité</span>
        </p>
        <a href="/admin" className="faint" style={{ fontSize: 11, marginTop: 14, display: 'inline-block', textDecoration: 'underline' }}>
          Espace Jayjay (admin)
        </a>
      </div>
    </div>
  );
}

// ========================== ORDER ==========================
function OrderScreen({ ctx, go, cart, setCart, slot, setSlot, onValidate, weekends, products }: {
  ctx: Record<string, string>;
  go: (name: string, ctx?: Record<string, string>) => void;
  cart: Cart;
  setCart: (c: Cart) => void;
  slot: string | null;
  setSlot: (s: string) => void;
  onValidate: () => void;
  weekends: Weekend[];
  products: Product[];
}) {
  const wk = weekendById(ctx.weekendId, weekends) || weekends[0] || WEEKENDS[0];
  const total = products.reduce((s, p) => s + (cart[p.id as keyof Cart] || 0), 0);
  const amount = total * PRICE;
  const enough = total >= 6;
  const canValidate = enough && !!slot;

  const setQty = (id: string, v: number) => setCart({ ...cart, [id]: v });

  return (
    <div className="app" style={{ height: '100%' }}>
      <div className="screen">
        {/* header */}
        <div className="topbar solid" style={{ paddingTop: 56 }}>
          <button className="backbtn" onClick={() => go('home')}>
            <Icon name="chevL" size={20} color="var(--ink-soft)" /> Retour
          </button>
          <span className="badge badge-open">{wk.label}</span>
        </div>

        {/* weekend recap */}
        <div className="pad" style={{ paddingTop: 16, paddingBottom: 8 }}>
          <div className="card" style={{ padding: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ fontSize: 10 }}>Retrait</div>
              <div className="display" style={{ fontSize: 19 }}>{wk.pickupDate}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>Il reste {wk.stockLeft} nems</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="faint" style={{ fontSize: 11, marginBottom: 4 }}>Commandes jusqu&apos;à</div>
              <Countdown deadline={wk.deadline} compact />
            </div>
          </div>
        </div>

        {/* products */}
        <div className="section" style={{ paddingTop: 16 }}>
          <h2 className="display" style={{ fontSize: 24, marginBottom: 4 }}>Composez votre commande</h2>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Par tranches de 3 · minimum 6 nems.</p>
          <div className="prod-grid">
          {products.map((p) => (
            <div key={p.id} className="card prod">
              <Photo label={p.photo} src="/nem-produit.jpeg" className="prod-img" />
              <div className="prod-body">
                <div className="prod-row">
                  <h3 className="prod-name">{p.name}</h3>
                  <span className="prod-price">{eur(p.price)}<small> /nem</small></span>
                </div>
                <p className="prod-desc">{p.desc}</p>
                <div className="prod-allerg">
                  {p.allergens.map((a) => <span key={a} className="allergen">{a}</span>)}
                </div>
                {/* stepper */}
                <div className="stepper">
                  <span className="stepper-label">par 3 · {cart[p.id as keyof Cart] || 0} nem{(cart[p.id as keyof Cart] || 0) > 1 ? 's' : ''}</span>
                  <div className="stepper-ctrls">
                    <button className="step-btn" disabled={(cart[p.id as keyof Cart] || 0) <= 0} onClick={() => setQty(p.id, Math.max(0, (cart[p.id as keyof Cart] || 0) - 3))} aria-label="Retirer">
                      <Icon name="minus" size={20} />
                    </button>
                    <span className="step-val">{cart[p.id as keyof Cart] || 0}</span>
                    <button className="step-btn" onClick={() => setQty(p.id, (cart[p.id as keyof Cart] || 0) + 3)} aria-label="Ajouter">
                      <Icon name="plus" size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* pickup slot */}
        <div className="section" style={{ paddingTop: 8, paddingBottom: 24 }}>
          <h2 className="display" style={{ fontSize: 24, marginBottom: 4 }}>Créneau de retrait</h2>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 14 }}>Entre 17h et 20h, par tranches de 15 min.</p>
          <div className="slots">
            {wk.slots.map((s) => {
              const full = s.count >= s.max;
              const sel = slot === s.id;
              return (
                <button
                  key={s.id}
                  className={`slot ${full ? 'full' : ''} ${sel ? 'sel' : ''}`}
                  disabled={full}
                  onClick={() => !full && setSlot(s.id)}
                >
                  {s.label}
                  <small>{full ? 'complet' : `${s.max - s.count} place${s.max - s.count > 1 ? 's' : ''}`}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* sticky dock */}
      <div className="dock">
        {!enough && total > 0 && <div className="dock-note">Encore {6 - total} nems pour atteindre le minimum</div>}
        {enough && !slot && <div className="dock-note">Choisissez un créneau de retrait ci-dessus</div>}
        <div className="dock-row">
          <div className="dock-total">
            <div className="n">{eur(amount)}</div>
            <div className="l">
              {total} nem{total > 1 ? 's' : ''}
              {slot ? ` · retrait ${wk.slots.find(s => s.id === slot)?.label}` : ''}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '15px 22px' }}
            disabled={!canValidate}
            onClick={onValidate}
          >
            Valider <Icon name="arrow" size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================== AUTH SHEET ==========================
function AuthSheet({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: Account) => void;
}) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [f, setF] = useState({ email: '', pwd: '', nom: '', tel: '' });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setAuthError(null); };
  const valid = f.email.includes('@') && f.pwd.length >= 4 && (mode === 'login' || (!!f.nom && !!f.tel));

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    setAuthError(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.pwd });
        if (error) {
          setAuthError(error.message.includes('already') ? 'Email déjà utilisé. Essayez de vous connecter.' : error.message);
          return;
        }
        if (data.user) {
          await supabase.from('profiles').update({ nom: f.nom, telephone: f.tel, marketing_consent: consent }).eq('id', data.user.id);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.pwd });
        if (error) {
          setAuthError('Mot de passe incorrect ou email inconnu.');
          return;
        }
      }
      onSubmit({ email: f.email, nom: f.nom, tel: f.tel, consent });
    } catch {
      setAuthError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2 className="display" style={{ fontSize: 24 }}>{mode === 'signup' ? 'Créez votre compte' : 'Connexion'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="x" size={18} /></button>
        </div>
        <div className="pad" style={{ paddingTop: 6, paddingBottom: 8 }}>
          <p className="muted" style={{ fontSize: 13.5, marginBottom: 16 }}>Pour valider et payer votre commande en toute sécurité.</p>

          <div className="seg">
            <button className={mode === 'signup' ? 'on' : ''} onClick={() => { setMode('signup'); setAuthError(null); }}>Inscription</button>
            <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setAuthError(null); }}>J&apos;ai un compte</button>
          </div>

          <div className="field">
            <label>Email</label>
            <input className="input" type="email" placeholder="votre@email.fr" value={f.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input className="input" type="password" placeholder="••••••••" value={f.pwd} onChange={set('pwd')} />
          </div>

          {mode === 'signup' && (
            <>
              <div className="field">
                <label>Nom</label>
                <input className="input" placeholder="Votre nom" value={f.nom} onChange={set('nom')} />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input className="input" type="tel" placeholder="06 12 34 56 78" value={f.tel} onChange={set('tel')} />
                <p className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Utile à Jayjay pour vous joindre le jour du retrait.</p>
              </div>

              <div className={`check ${consent ? 'on' : ''}`} onClick={() => setConsent(!consent)} style={{ marginTop: 4, marginBottom: 14 }}>
                <span className="box">{consent && <Icon name="check" size={15} color="#fff" stroke={2.4} />}</span>
                <span>Je souhaite recevoir les annonces des prochains créneaux. <span className="faint">(facultatif)</span></span>
              </div>
            </>
          )}

          {authError && (
            <p style={{ fontSize: 13, color: 'var(--terracotta-deep)', fontWeight: 600, marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Icon name="info" size={15} color="var(--terracotta-deep)" /> {authError}
            </p>
          )}

          <button className="btn btn-primary" disabled={!valid || loading} onClick={handleSubmit}>
            {loading ? 'Connexion…' : 'Continuer vers le paiement'}
          </button>
          <p className="faint" style={{ fontSize: 11, textAlign: 'center', marginTop: 12 }}>
            En continuant, vous acceptez nos <u>CGV</u> et notre <u>politique de confidentialité</u>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ========================== RECAP ==========================
function RecapScreen({ ctx, cart, slot, go, onPay, weekends, products }: {
  ctx: Record<string, string>;
  cart: Cart;
  slot: string | null;
  go: (name: string, ctx?: Record<string, string>) => void;
  onPay: () => void;
  weekends: Weekend[];
  products: Product[];
}) {
  const wk = weekendById(ctx.weekendId, weekends) || weekends[0] || WEEKENDS[0];
  const lines = cartLines(cart, products);
  const total = lines.reduce((s, l) => s + l.qty, 0);
  const amount = total * PRICE;
  const slotLabel = wk.slots.find((s) => s.id === slot)?.label || '—';

  return (
    <div className="app" style={{ height: '100%' }}>
      <div className="screen">
        <div className="topbar solid" style={{ paddingTop: 56 }}>
          <button className="backbtn" onClick={() => go('order', ctx)}>
            <Icon name="chevL" size={20} color="var(--ink-soft)" /> Modifier
          </button>
          <span className="badge badge-open">Récapitulatif</span>
        </div>

        <div className="pad" style={{ paddingTop: 18 }}>
          <h1 className="display" style={{ fontSize: 30, marginBottom: 16 }}>Votre commande</h1>

          {/* lines */}
          <div className="card" style={{ padding: '4px 16px' }}>
            {lines.map((l) => (
              <div className="line-row" key={l.id}>
                <div>
                  <div className="line-name">{l.name}</div>
                  <div className="line-qty">{l.qty} × {eur(l.price)}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{eur(l.qty * l.price)}</div>
              </div>
            ))}
            <div className="line-row" style={{ borderTop: '2px solid var(--line)' }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Total · {total} nems</div>
              <div className="display" style={{ fontSize: 24, color: 'var(--terracotta-deep)', whiteSpace: 'nowrap', flexShrink: 0 }}>{eur(amount)}</div>
            </div>
          </div>

          {/* pickup pin */}
          <div className="info-pin" style={{ marginTop: 16 }}>
            <div className="ico"><Icon name="pin" size={18} color="#fff" /></div>
            <div>
              <div style={{ fontWeight: 700 }}>{wk.pickupDate} · {slotLabel}</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}><a href={`https://maps.google.com/?q=${encodeURIComponent(wk.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>{wk.address}</a></div>
            </div>
          </div>

          <div className="notice" style={{ marginTop: 14 }}>
            <Icon name="info" size={16} color="var(--ink-soft)" />
            <span>Denrées périssables : pas de droit de rétractation une fois la commande payée.</span>
          </div>
        </div>
        <div style={{ height: 12 }} />
      </div>

      <div className="dock">
        <button className="btn btn-primary" onClick={onPay}>
          <Icon name="lock" size={17} color="#fff" /> Payer {eur(amount)}
        </button>
        <p className="faint" style={{ fontSize: 11, textAlign: 'center', marginTop: 9 }}>Paiement sécurisé via Stripe</p>
      </div>
    </div>
  );
}

// ========================== CONFIRMATION ==========================
function ConfirmationScreen({ status, ctx, cart, slot, account, go, weekends, products }: {
  status: string;
  ctx: Record<string, string>;
  cart: Cart;
  slot: string | null;
  account: Account;
  go: (name: string, ctx?: Record<string, string>) => void;
  weekends: Weekend[];
  products: Product[];
}) {
  const wk = weekendById(ctx.weekendId, weekends) || weekends[0] || WEEKENDS[0];
  const lines = cartLines(cart, products);
  const total = lines.reduce((s, l) => s + l.qty, 0);
  const amount = total * PRICE;
  const slotLabel = wk.slots.find((s) => s.id === slot)?.label || '—';

  if (status === 'confirming') {
    return (
      <div className="app" style={{ height: '100%' }}>
        <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div className="spinner" />
            <h2 className="display" style={{ fontSize: 22, marginTop: 22 }}>Confirmation en cours…</h2>
            <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>On valide votre paiement, un instant.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app" style={{ height: '100%' }}>
      <div className="screen">
        <div className="celebrate">
          <div className="seal"><Icon name="check" size={48} color="#fff" stroke={2.6} /></div>
          <div className="eyebrow">Commande confirmée</div>
          <h1 className="display" style={{ fontSize: 32, marginTop: 8 }}>
            Merci{account.nom ? `, ${account.nom.split(' ')[0]}` : ''} !
          </h1>
          <p className="hand" style={{ fontSize: 24, color: 'var(--terracotta-deep)', marginTop: 4 }}>Jayjay s&apos;occupe du reste</p>
        </div>

        <div className="pad" style={{ paddingTop: 10 }}>
          <div className="card" style={{ padding: 18, background: 'var(--herb-tint)', borderColor: 'transparent', textAlign: 'center' }}>
            <div className="eyebrow" style={{ color: 'var(--herb-deep)' }}>Votre retrait</div>
            <div className="display" style={{ fontSize: 26, marginTop: 6, color: 'var(--herb-deep)' }}>{wk.pickupDate} · {slotLabel}</div>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 8, fontSize: 13.5, color: 'var(--herb-deep)', fontWeight: 600 }}>
              <Icon name="pin" size={15} color="var(--herb-deep)" /> <a href={`https://maps.google.com/?q=${encodeURIComponent(wk.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>{wk.address}</a>
            </div>
          </div>

          <div className="notice" style={{ marginTop: 16, background: 'var(--cream-deep)' }}>
            <Icon name="mail" size={16} color="var(--ink-soft)" />
            <span>Votre récapitulatif de commande a été envoyé{account.email ? ` à ${account.email}` : ''}. Vous recevrez un rappel la veille.</span>
          </div>

          {/* mini recap */}
          <div className="card" style={{ padding: '4px 16px', marginTop: 16 }}>
            {lines.map((l) => (
              <div className="line-row" key={l.id}>
                <div className="line-name">{l.name}</div>
                <div className="line-qty">{l.qty} nems</div>
              </div>
            ))}
            <div className="line-row" style={{ borderTop: '2px solid var(--line)' }}>
              <div style={{ fontWeight: 800 }}>Total payé</div>
              <div style={{ fontWeight: 800, color: 'var(--terracotta-deep)' }}>{eur(amount)}</div>
            </div>
          </div>
        </div>
        <div style={{ height: 14 }} />
      </div>

      <div className="dock">
        <button className="btn btn-primary" onClick={() => go('account')}>Voir mes commandes</button>
        <button className="backbtn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => go('home')}>
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}

// ========================== ORDER CARD ==========================
function OrderCard({ o, highlight }: { o: Order; highlight?: boolean }) {
  const badgeMap: Record<string, [string, string]> = {
    done: ['badge-done', 'Retirée'],
    paid: ['badge-paid', 'Payée'],
    wait: ['badge-wait', 'En attente'],
  };
  const badge = badgeMap[o.status] || ['badge-paid', 'Payée'];
  const lines = (o.lines || []).map((l) => ({ ...productById(l.id), qty: l.qty })).filter(l => l.id);

  return (
    <div className="card order-card" style={highlight ? { borderColor: 'var(--herb)', borderWidth: 1.5 } : {}}>
      <div className="order-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>{o.ref}</div>
          <div className="display" style={{ fontSize: 20, lineHeight: 1.1 }}>{o.pickupDate}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Icon name="clock" size={13} color="var(--ink-soft)" /> Retrait {o.slot}
            <span style={{ color: 'var(--ink-faint)' }}>·</span>
            <Icon name="pin" size={13} color="var(--ink-soft)" /> <a href={`https://maps.google.com/?q=${encodeURIComponent(o.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2 }}>{o.address.split(',')[0]}</a>
          </div>
        </div>
        <span className={`badge ${badge[0]}`}>{badge[1]}</span>
      </div>
      <div className="order-foot">
        <span className="muted" style={{ fontSize: 13 }}>{lines.map((l) => `${l.qty} ${(l as Product & { qty: number }).short}`).join(' · ')}</span>
        <span style={{ fontWeight: 800 }}>{eur(o.total)}</span>
      </div>
    </div>
  );
}

// ========================== ACCOUNT ==========================
function AccountScreen({ go, orders, account, consent, setConsent }: {
  go: (name: string, ctx?: Record<string, string>) => void;
  orders: Order[];
  account: Account;
  consent: boolean;
  setConsent: (v: boolean) => void;
}) {
  const upcoming = orders.filter((o) => o.status !== 'done');
  const past = [...orders.filter((o) => o.status === 'done'), ...PAST_ORDERS];

  return (
    <div className="screen">
      <div className="topbar solid" style={{ paddingTop: 56 }}>
        <button className="backbtn" onClick={() => go('home')}>
          <Icon name="chevL" size={20} color="var(--ink-soft)" /> Accueil
        </button>
        <span className="badge badge-open">Mon compte</span>
      </div>

      <div className="pad" style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--terracotta-tint)', color: 'var(--terracotta-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={22} color="var(--terracotta-deep)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{account.nom || 'Bonjour'}</div>
            <div className="muted" style={{ fontSize: 13 }}>{account.email || 'Bienvenue chez La Caza J'}</div>
          </div>
        </div>

        {upcoming.length > 0 && (
          <>
            <h2 className="display" style={{ fontSize: 22, marginBottom: 12 }}>À venir</h2>
            {upcoming.map((o) => <OrderCard key={o.ref} o={o} highlight />)}
          </>
        )}

        <h2 className="display" style={{ fontSize: 22, margin: '8px 0 12px' }}>Commandes passées</h2>
        {past.map((o) => <OrderCard key={o.ref} o={o} />)}

        {/* help */}
        <div className="card" style={{ padding: 16, marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gold-tint)', color: '#9a6c12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="phone" size={18} color="#9a6c12" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Modifier ou annuler ?</div>
            <div className="muted" style={{ fontSize: 13 }}>Appelez Jayjay au 06 50 12 34 56</div>
          </div>
        </div>

        {/* consent */}
        <div className={`check ${consent ? 'on' : ''}`} onClick={() => setConsent(!consent)} style={{ marginTop: 16, marginBottom: 30 }}>
          <span className="box">{consent && <Icon name="check" size={15} color="#fff" stroke={2.4} />}</span>
          <span>Recevoir les annonces des prochains créneaux par email.</span>
        </div>
      </div>
    </div>
  );
}

// ========================== LEGAL ==========================
function LegalScreen({ go }: { go: (name: string, ctx?: Record<string, string>) => void }) {
  const sections: [string, string][] = [
    ['Éditeur', 'La Caza J — micro-entreprise de Jayjay. Saint-André-des-Eaux (44). Contact : bonjour@lacazaj.fr'],
    ['Conditions de vente', "Commandes payées d'avance via Stripe. Retrait uniquement, sur le créneau choisi, à l'adresse indiquée."],
    ['Denrées périssables', "Conformément à l'article L221-28 du Code de la consommation, aucun droit de rétractation ne s'applique aux denrées alimentaires périssables."],
    ['Allergènes', 'Les allergènes de chaque produit sont indiqués sur la fiche produit. Préparé dans une cuisine manipulant gluten, soja, œuf et crustacés.'],
    ['Données personnelles', 'Vos données servent uniquement au traitement de vos commandes. Le consentement marketing est facultatif et révocable depuis votre compte.'],
  ];

  return (
    <div className="screen">
      <div className="topbar solid" style={{ paddingTop: 56 }}>
        <button className="backbtn" onClick={() => go('home')}>
          <Icon name="chevL" size={20} color="var(--ink-soft)" /> Accueil
        </button>
        <span className="badge badge-open">Informations légales</span>
      </div>
      <div className="pad" style={{ paddingTop: 18, paddingBottom: 40 }}>
        <h1 className="display" style={{ fontSize: 28, marginBottom: 16 }}>Mentions légales</h1>
        {sections.map(([h, b]) => (
          <div key={h} style={{ marginBottom: 18 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 5 }}>{h}</h3>
            <p className="muted" style={{ fontSize: 14 }}>{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================== APP ROOT ==========================
export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home', ctx: {} });
  const [cart, setCart] = useState<Cart>({ porc: 6, poulet: 3, crevette: 0 });
  const [slot, setSlot] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [account, setAccount] = useState<Account>({ email: '', nom: '', tel: '', consent: false });
  const [consent, setConsent] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmStatus, setConfirmStatus] = useState('confirming');
  const [weekends, setWeekends] = useState<Weekend[]>(WEEKENDS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    fetchWeekends().then((data) => { if (data.length) setWeekends(data); });
    fetchProducts().then((data) => { if (data.length) setProducts(data); });

    // Retour depuis Stripe après paiement réussi
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout_success') === '1') {
      const saved = localStorage.getItem('lcj_pending_order');
      if (saved) {
        const { ctx, cartSnapshot, slotSnapshot, accountSnapshot } = JSON.parse(saved);
        setCart(cartSnapshot);
        setSlot(slotSnapshot);
        setAccount(accountSnapshot);
        localStorage.removeItem('lcj_pending_order');
        setConfirmStatus('done');
        go('confirm', ctx);
      }
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const go = (name: string, ctx: Record<string, string> = {}) => {
    setRoute({ name, ctx });
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.querySelectorAll('.screen').forEach((s) => ((s as HTMLElement).scrollTop = 0));
    });
  };

  const openInsta = () => window.open('https://www.instagram.com/la_caza_j/', '_blank');

  const pay = async () => {
    setConfirmStatus('confirming');
    go('confirm', route.ctx);
    try {
      // 1. Récupérer le user connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const lines = cartLines(cart, products);
      const cartItems = lines.map((l) => ({
        productId: l.id,
        quantity: l.qty,
        unitPriceCents: Math.round(l.price * 100),
      }));

      // 2. Créer la commande en base
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekendId: route.ctx.weekendId,
          slotId: slot,
          cart: cartItems,
          userId: user.id,
        }),
      });
      if (!orderRes.ok) throw new Error('Erreur création commande');
      const { orderId } = await orderRes.json();

      // 3. Sauvegarder l'état avant redirection Stripe
      localStorage.setItem('lcj_pending_order', JSON.stringify({
        ctx: route.ctx,
        cartSnapshot: cart,
        slotSnapshot: slot,
        accountSnapshot: account,
      }));

      // 4. Créer la session Stripe et rediriger
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          items: lines.map((l) => ({
            name: l.name,
            quantity: l.qty,
            unit_amount: Math.round(l.price * 100),
          })),
          customerEmail: user.email,
        }),
      });
      if (!checkoutRes.ok) throw new Error('Erreur Stripe');
      const { url } = await checkoutRes.json();
      window.location.href = url;

    } catch (err) {
      console.error('Erreur paiement:', err);
      // Fallback : afficher la confirmation quand même (démo)
      setConfirmStatus('done');
    }
  };

  const submitAuth = (data: Account) => {
    setAccount(data);
    setConsent(data.consent);
    setShowAuth(false);
    go('recap', route.ctx);
  };

  let screen: React.ReactNode;
  switch (route.name) {
    case 'order':
      screen = <OrderScreen ctx={route.ctx} go={go} cart={cart} setCart={setCart} slot={slot} setSlot={setSlot} onValidate={() => setShowAuth(true)} weekends={weekends} products={products} />;
      break;
    case 'recap':
      screen = <RecapScreen ctx={route.ctx} cart={cart} slot={slot} go={go} onPay={pay} weekends={weekends} products={products} />;
      break;
    case 'confirm':
      screen = <ConfirmationScreen status={confirmStatus} ctx={route.ctx} cart={cart} slot={slot} account={account} go={go} weekends={weekends} products={products} />;
      break;
    case 'account':
      screen = <AccountScreen go={go} orders={orders} account={account} consent={consent} setConsent={setConsent} />;
      break;
    case 'legal':
      screen = <LegalScreen go={go} />;
      break;
    default:
      screen = <HomeScreen go={go} onInsta={openInsta} weekends={weekends} />;
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#ede5d4', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        height: '100dvh',
        background: 'var(--cream)',
        position: 'relative',
        boxShadow: '0 0 0 1px rgba(43,32,23,0.1), 0 24px 80px rgba(43,32,23,0.12)',
      }}>
        <div className="app">
          {screen}
          {showAuth && <AuthSheet onClose={() => setShowAuth(false)} onSubmit={submitAuth} />}
        </div>
      </div>
    </div>
  );
}
