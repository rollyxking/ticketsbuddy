import { useState, useEffect } from "react";
import { ALL, PRICES, VIPS, VIP_PRICES, fmtDate, money } from "../data.js";
import { ACCEPT, prepareImage, submitTokenOrder } from "../tokenOrders.js";

// One upload slot (front or back) with its own preview.
function Slot({ label, file, disabled, error, onPick, onClear }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="slot">
      <span className="slot-t">{label}</span>
      <label className={"upl" + (file ? " has" : "")}>
        <input type="file" accept={ACCEPT} onChange={onPick} disabled={disabled} aria-label={label + " of your token image"} />
        {preview ? (
          <img className="upl-prev" src={preview} alt={"Preview of the " + label.toLowerCase()} />
        ) : (
          <span className="upl-empty"><b>Upload {label.toLowerCase()}</b><small>JPG, JPEG or PNG</small></span>
        )}
      </label>
      {file && !disabled && <button type="button" className="lnk back" onClick={onClear}>Remove</button>}
      {error && <em className="err">{error}</em>}
    </div>
  );
}

// Token Image is the ONLY payment/verification method.
// The show and ticket type come from the "Buy Ticket" click (URL params).
export default function Checkout({ params, onOrder }) {
  const eventId = params.get("event") || ALL[0].id;
  const ticket = params.get("vip") !== null ? "vip" + params.get("vip") : "ga";
  const [qty, setQty] = useState(2);
  const [f, setF] = useState({ name: "", email: "" });
  const [files, setFiles] = useState({ front: null, back: null });
  const [prep, setPrep] = useState(false);
  const [err, setErr] = useState({});
  const [srvErr, setSrvErr] = useState("");
  const [busy, setBusy] = useState(false);

  const ev = ALL.find((e) => e.id === eventId) || ALL[0];
  const options = [...PRICES, ...VIPS.map((v, i) => ({ id: "vip" + i, label: "VIP: " + v[0], price: VIP_PRICES[i] }))];
  const opt = options.find((o) => o.id === ticket) || options[0];
  const subtotal = opt.price * qty;
  const fee = Math.round(subtotal * 10) / 100;
  const total = subtotal + fee;

  const pick = (side) => async (e) => {
    const chosen = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!chosen) return;
    setPrep(true); setSrvErr("");
    try {
      const ready = await prepareImage(chosen);
      setFiles((x) => ({ ...x, [side]: ready }));
      setErr((x) => ({ ...x, [side]: undefined }));
    } catch (ex) {
      setFiles((x) => ({ ...x, [side]: null }));
      setErr((x) => ({ ...x, [side]: ex.message }));
    } finally { setPrep(false); }
  };
  const clear = (side) => () => setFiles((x) => ({ ...x, [side]: null }));

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email address";
    if (!files.front) e.front = err.front || "Upload the front of your token";
    if (!files.back) e.back = err.back || "Upload the back of your token";
    setErr(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy || prep || !validate()) return;
    setBusy(true); setSrvErr("");
    try {
      const r = await submitTokenOrder({ eventId: ev.id, ticket: opt.id, qty, name: f.name.trim(), email: f.email.trim(), front: files.front, back: files.back });
      onOrder({
        id: r.orderId, token: r.accessToken, status: r.status, note: "",
        city: ev.city, venue: ev.venue, date: ev.date, time: ev.time,
        ticket: opt.label, qty, total: r.total ?? total, name: f.name.trim(), email: f.email.trim(),
        payment: "Token Image", at: Date.now(),
      });
      location.hash = "#/confirmation/" + r.orderId;
    } catch (ex) {
      setSrvErr(ex.message || "We couldn't submit your order. Please try again.");
      setBusy(false);
    }
  };

  const Err = ({ k }) => (err[k] ? <em className="err">{err[k]}</em> : null);

  return (
    <main className="ck">
      <a className="lnk" href="#/">← Back to Oasis</a>
      <h1 className="ck-title">Checkout</h1>

      <div className="ck-grid">
        <form onSubmit={submit} noValidate>
          <section className="ck-card">
            <h2>Pay with Token Image</h2>
            <p className="upl-desc">Upload your token image to submit your order for verification. Add both the front and the back.</p>

            <div className="fields" style={{ marginBottom: 18 }}>
              <label className="fld">Full name
                <input disabled={busy} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
                <Err k="name" />
              </label>
              <div className="row-2">
                <label className="fld">Email
                  <input disabled={busy} type="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
                  <Err k="email" />
                </label>
                <label className="fld">Quantity
                  <select disabled={busy} value={qty} onChange={(e) => setQty(+e.target.value)}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
                </label>
              </div>
            </div>

            <div className="upl-grid">
              <Slot label="Front" file={files.front} disabled={busy || prep} error={err.front} onPick={pick("front")} onClear={clear("front")} />
              <Slot label="Back" file={files.back} disabled={busy || prep} error={err.back} onPick={pick("back")} onClear={clear("back")} />
            </div>
            {prep && <p className="note" style={{ marginTop: 10 }}>Preparing image…</p>}

            {srvErr && <p className="ck-err" role="alert">{srvErr}</p>}
            <button className="btn lg" disabled={busy || prep}>{busy ? "Uploading…" : "Upload Token & Submit Order"}</button>
          </section>
        </form>

        <aside className="ck-sum">
          <h2>Order summary</h2>
          <p className="ev-name"><b>Oasis Live '27</b><br />{ev.venue}, {ev.city}<br />{fmtDate(ev.date)} · {ev.time}</p>
          <div className="line"><span>{qty} × {opt.label}</span><span>{money(subtotal)}</span></div>
          <div className="line"><span>Service fee</span><span>{money(fee)}</span></div>
          <div className="line tot"><span>Total</span><span>{money(total)}</span></div>
        </aside>
      </div>
    </main>
  );
}
