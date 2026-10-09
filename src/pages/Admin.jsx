import { useState, useEffect, useCallback } from "react";
import { fmtDate, money } from "../data.js";
import { adminApi } from "../tokenOrders.js";

const TABS = [["Pending Verification", "Pending"], ["Approved", "Approved"], ["Rejected", "Rejected"], ["all", "All"]];
const BADGE = { "Pending Verification": "wait", Approved: "ok", Rejected: "bad" };

export default function Admin({ orderId }) {
  const [auth, setAuth] = useState(null); // null = checking
  const [pw, setPw] = useState("");
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("Pending Verification");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [imgFail, setImgFail] = useState({});

  const load = useCallback(async () => {
    try { setOrders((await adminApi.list()).orders); setAuth(true); setErr(""); }
    catch (e) { if (e.status === 401) setAuth(false); else { setAuth(true); setErr(e.message); } }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setNote(""); setErr(""); setImgFail({}); }, [orderId]);

  const login = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await adminApi.login(pw); setPw(""); await load(); } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };
  const logout = async () => { try { await adminApi.logout(); } catch {} setOrders([]); setAuth(false); };

  const decide = async (o, decision) => {
    const word = decision === "approve" ? "APPROVE" : "REJECT";
    if (!window.confirm(`${word} order ${o.id}? This can't be undone.`)) return;
    setBusy(true); setErr("");
    try { await adminApi.decide(o.id, decision, note); await load(); }
    catch (ex) { setErr(ex.message); await load(); }
    setBusy(false);
  };

  if (auth === null) return <main className="w co"><p className="note">Checking sign-in…</p></main>;

  if (!auth) {
    return (
      <main className="w co">
        <h1 className="co-h">Admin sign in</h1>
        <form className="ck-card adm-login" onSubmit={login}>
          <label className="fld">Password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
          </label>
          {err && <p className="ck-err" role="alert">{err}</p>}
          <button className="btn lg" disabled={busy || !pw}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </main>
    );
  }

  const sel = orderId ? orders.find((o) => o.id === orderId) : null;
  const shown = orders.filter((o) => tab === "all" || o.status === tab);
  const count = (t) => (t === "all" ? orders.length : orders.filter((o) => o.status === t).length);

  return (
    <main className="w co">
      <div className="row2" style={{ marginTop: 0 }}>
        <h1 className="co-h">Token verification</h1>
        <button className="btn o" onClick={logout}>Sign out</button>
      </div>
      {err && <p className="ck-err" role="alert">{err}</p>}

      {orderId ? (
        <>
          <a className="lnk" href="#/admin">← All orders</a>
          {!sel ? <p className="empty" style={{ marginTop: 14 }}>Order {orderId} not found.</p> : (
            <div className="ck-card adm-detail">
              <p style={{ margin: 0 }}><span className={"badge " + BADGE[sel.status]}>{sel.status}</span></p>
              <h2 style={{ marginTop: 12 }}>Order {sel.id}</h2>
              <div className="adm-meta">
                <span>Customer</span><b>{sel.customer_name}</b>
                <span>Email</span><b>{sel.customer_email}</b>
                <span>Amount</span><b>{money(sel.amount_cents / 100)}</b>
                <span>Tickets</span><b>{sel.qty} × {sel.ticket_label}</b>
                <span>Show</span><b>{fmtDate(sel.event_date)} · {sel.event_city}</b>
                <span>Submitted</span><b>{new Date(sel.created_at).toLocaleString()}</b>
                {sel.decided_at && <><span>Decided</span><b>{new Date(sel.decided_at).toLocaleString()}</b></>}
                {sel.admin_note && <><span>Rejection note</span><b>{sel.admin_note}</b></>}
              </div>
              <h3 style={{ margin: "18px 0 8px" }}>Token images</h3>
              <div className="adm-imgs">
                {["front", "back"].map((side) => (
                  <figure key={side} className="adm-fig">
                    <figcaption>{side === "front" ? "Front" : "Back"}</figcaption>
                    {imgFail[side] ? <p className="ck-err">The image couldn't be loaded.</p> : (
                      <img className="adm-img" src={adminApi.imageUrl(sel.id, side)} alt={`${side} of token for ${sel.id}`} referrerPolicy="no-referrer" onError={() => setImgFail((x) => ({ ...x, [side]: true }))} />
                    )}
                    <a className="lnk" href={adminApi.imageUrl(sel.id, side)} target="_blank" rel="noopener noreferrer">Open full size</a>
                  </figure>
                ))}
              </div>

              {sel.status === "Pending Verification" && (
                <>
                  <label className="fld" style={{ marginTop: 14 }}>Reason shown to the customer if rejected (optional)
                    <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The image is unclear" />
                  </label>
                  <div className="row2" style={{ gap: 12 }}>
                    <button className="btn" disabled={busy} onClick={() => decide(sel, "approve")}>Approve</button>
                    <button className="btn o" disabled={busy} onClick={() => decide(sel, "reject")}>Reject</button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="chips" style={{ margin: "6px 0 14px" }}>
            {TABS.map(([v, l]) => <button key={v} className={"chip" + (tab === v ? " sel" : "")} onClick={() => setTab(v)}>{l} ({count(v)})</button>)}
          </div>
          {shown.length === 0 ? <p className="empty">No orders here.</p> : shown.map((o) => (
            <a key={o.id} className="adm-row" href={"#/admin/order/" + o.id}>
              <div><b>{o.id}</b><br /><small>{o.customer_name} · {new Date(o.created_at).toLocaleString()}</small></div>
              <div style={{ textAlign: "right" }}>{money(o.amount_cents / 100)}<br /><span className={"badge " + BADGE[o.status]}>{o.status}</span></div>
            </a>
          ))}
        </>
      )}
    </main>
  );
}
