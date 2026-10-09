
import { useState, useEffect } from "react";
import {
  ALL,
  PRICES,
  VIPS,
  VIP_PRICES,
  fmtDate,
  money,
} from "../data.js";
import {
  ACCEPT,
  prepareImage,
  submitTokenOrder,
} from "../tokenOrders.js";

// One upload slot (front or back) with its own preview.
function Slot({ label, file, disabled, error, onPick, onClear }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="upl-slot">
      <h3>{label} of token</h3>

      {preview ? (
        <div className="upl-preview">
          <img src={preview} alt={`${label} token preview`} />
          <button
            type="button"
            className="btn"
            disabled={disabled}
            onClick={onClear}
          >
            Remove image
          </button>
        </div>
      ) : (
        <label className="upl-drop">
          <span className="upl-icon">＋</span>
          <span>Select {label.toLowerCase()} image</span>
          <span className="note">JPG, PNG or WebP</span>

          <input
            type="file"
            accept={ACCEPT}
            disabled={disabled}
            onChange={onPick}
          />
        </label>
      )}

      {error && <em className="err">{error}</em>}
    </div>
  );
}

export default function Checkout({ params, onOrder }) {
  const [eventId, setEventId] = useState("");
  const [ticket, setTicket] = useState("");
  const [qty, setQty] = useState(1);

  const [f, setF] = useState({
    name: "",
    email: "",
  });

  const [files, setFiles] = useState({
    front: null,
    back: null,
  });

  const [err, setErr] = useState({});
  const [srvErr, setSrvErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [prep, setPrep] = useState(false);

  /*
   * Resolve the selected event and ticket from the data provided
   * by the application. The URL parameters are used as fallbacks.
   */
  useEffect(() => {
    const p = params || {};

    setEventId(String(p.eventId || p.id || ""));
    setTicket(String(p.ticket || p.type || ""));
    setQty(Math.max(1, Math.min(6, Number(p.qty) || 1)));
  }, [params]);

  /*
   * IMPORTANT:
   * Match these lookups to the actual structure of your data.js.
   */
  const ev =
    ALL.find((item) => String(item.id) === eventId) ||
    ALL.find((item) => String(item.slug) === eventId);

  const isVip = VIPS.includes(ticket);

  const opt = {
    label: ticket || "General Admission",
    price: isVip
      ? VIP_PRICES[ticket]
      : PRICES[ticket],
  };

  const unitPrice = Number(opt.price) || 0;
  const subtotal = unitPrice * qty;
  const fee = 0;
  const total = subtotal + fee;

  const pick = (side) => async (e) => {
    const chosen = e.target.files && e.target.files[0];
    e.target.value = "";

    if (!chosen) return;

    setPrep(true);
    setSrvErr("");

    try {
      const ready = await prepareImage(chosen);

      setFiles((current) => ({
        ...current,
        [side]: ready,
      }));

      setErr((current) => ({
        ...current,
        [side]: undefined,
      }));
    } catch (ex) {
      setFiles((current) => ({
        ...current,
        [side]: null,
      }));

      setErr((current) => ({
        ...current,
        [side]: ex.message || "Unable to prepare image",
      }));
    } finally {
      setPrep(false);
    }
  };

  const clear = (side) => () => {
    setFiles((current) => ({
      ...current,
      [side]: null,
    }));
  };

  const validate = () => {
    const errors = {};

    if (f.name.trim().length < 2) {
      errors.name = "Enter your full name";
    }

    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (!files.front) {
      errors.front = err.front || "Upload the front of your token";
    }

    if (!files.back) {
      errors.back = err.back || "Upload the back of your token";
    }

    if (!ev) {
      errors.event = "The selected event could not be found.";
    }

    if (!opt.price || !Number.isFinite(unitPrice)) {
      errors.ticket = "The selected ticket price could not be found.";
    }

    setErr(errors);

    return Object.keys(errors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (busy || prep || !validate()) return;

    setBusy(true);
    setSrvErr("");

    try {
      const r = await submitTokenOrder({
        eventId,
        ticket,
        qty,
        name: f.name.trim(),
        email: f.email.trim(),
        front: files.front,
        back: files.back,
      });

      onOrder({
        id: r.orderId,
        token: r.accessToken,
        status: r.status,
        note: "",
        city: ev.city,
        venue: ev.venue,
        date: ev.date,
        time: ev.time,
        ticket: opt.label,
        qty,
        total: r.total ?? total,
        name: f.name.trim(),
        email: f.email.trim(),
        payment: "Token Image",
        at: Date.now(),
      });

      window.location.hash = "#/confirmation/" + r.orderId;
    } catch (ex) {
      setSrvErr(
        ex.message || "We couldn't submit your order. Please try again."
      );

      setBusy(false);
    }
  };

  const Err = ({ k }) =>
    err[k] ? <em className="err">{err[k]}</em> : null;

  if (!ev) {
    return (
      <main className="ck">
        <a className="lnk" href="#/">← Back to Oasis</a>
        <h1 className="ck-title">Checkout</h1>
        <p>
          Loading event details or the selected event could not be found.
        </p>
      </main>
    );
  }

  return (
    <main className="ck">
      <a className="lnk" href="#/">← Back to Oasis</a>

      <h1 className="ck-title">Checkout</h1>

      <div className="ck-grid">
        <form onSubmit={submit} noValidate>
          <section className="ck-card">
            <h2>Pay with Token Image</h2>

            <p className="upl-desc">
              Upload your token image to submit your order for verification.
              Add both the front and the back.
            </p>

            <div className="fields" style={{ marginBottom: 18 }}>
              <label className="fld">
                Full name

                <input
                  disabled={busy}
                  value={f.name}
                  onChange={(e) =>
                    setF({ ...f, name: e.target.value })
                  }
                  autoComplete="name"
                />

                <Err k="name" />
              </label>

              <div className="row-2">
                <label className="fld">
                  Email

                  <input
                    disabled={busy}
                    type="email"
                    inputMode="email"
                    value={f.email}
                    onChange={(e) =>
                      setF({ ...f, email: e.target.value })
                    }
                    autoComplete="email"
                  />

                  <Err k="email" />
                </label>

                <label className="fld">
                  Quantity

                  <select
                    disabled={busy}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="upl-grid">
              <Slot
                label="Front"
                file={files.front}
                disabled={busy || prep}
                error={err.front}
                onPick={pick("front")}
                onClear={clear("front")}
              />

              <Slot
                label="Back"
                file={files.back}
                disabled={busy || prep}
                error={err.back}
                onPick={pick("back")}
                onClear={clear("back")}
              />
            </div>

            {prep && (
              <p className="note" style={{ marginTop: 10 }}>
                Preparing image…
              </p>
            )}

            {err.event && <p className="ck-err">{err.event}</p>}
            {err.ticket && <p className="ck-err">{err.ticket}</p>}

            {srvErr && (
              <p className="ck-err" role="alert">
                {srvErr}
              </p>
            )}

            <button
              type="submit"
              className="btn lg"
              disabled={busy || prep}
            >
              {busy ? "Uploading…" : "Upload Token & Submit Order"}
            </button>
          </section>
        </form>

        <aside className="ck-sum">
          <h2>Order summary</h2>

          <p className="ev-name">
            <b>{ev.name || ev.title || "Oasis Live '27"}</b>
            <br />
            {ev.venue}, {ev.city}
            <br />
            {fmtDate(ev.date)} · {ev.time}
          </p>

          <div className="line">
            <span>
              {qty} × {opt.label}
            </span>
            <span>{money(subtotal)}</span>
          </div>

          <div className="line">
            <span>Service fee</span>
            <span>{money(fee)}</span>
          </div>

          <div className="line tot">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
