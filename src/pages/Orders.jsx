import { fmtDate, money } from "../data.js";

const istoken = (o) => !!o.status; // older demo orders have no status
const BADGE = { "Pending Verification": "wait", Approved: "ok", Rejected: "bad" };

function Ticket({ o }) {
  const token = istoken(o);
  return (
    <article className={"tix" + (token ? " " + BADGE[o.status] : "")}>
      <div className="tix-top">
        <div><small>Order</small><b>{o.id}</b></div>
        {token && <span className={"badge " + BADGE[o.status]}>{o.status}</span>}
      </div>
      <h3>Oasis Live '27</h3>
      <p className="tix-where">{o.venue}, {o.city}</p>
      <dl className="tix-facts">
        <div><dt>Date</dt><dd>{fmtDate(o.date)}</dd></div>
        <div><dt>Time</dt><dd>{o.time}</dd></div>
        <div><dt>Tickets</dt><dd>{o.qty} × {o.ticket}</dd></div>
        <div><dt>Name</dt><dd>{o.name}</dd></div>
        <div><dt>{token ? "Total" : "Paid"}</dt><dd>{money(o.total)}</dd></div>
        <div><dt>Payment</dt><dd>{token ? "token Image" : o.payment}</dd></div>
      </dl>
      {o.status === "Pending Verification" && <p className="vmsg">Your token has been submitted and is waiting for manual verification. This page updates automatically.</p>}
      {o.status === "Approved" && <p className="vmsg ok">Your token was verified. Your tickets are confirmed.</p>}
      {o.status === "Rejected" && (
        <p className="vmsg bad">Your submission was rejected{o.note ? `: ${o.note}` : "."} <a className="lnk noprint" href="#/checkout">Submit a new order</a></p>
      )}
    </article>
  );
}

export function Confirmation({ orders, id }) {
  const o = orders.find((x) => x.id === id);
  if (!o) return <main className="w co"><p className="empty">Order not found. <a className="lnk" href="#/dashboard">View my tickets</a></p></main>;
  const approved = !istoken(o) || o.status === "Approved";
  return (
    <main className="w co">
      <h1 className="co-h">
        {approved ? "You're going! 🎸" : o.status === "Rejected" ? "Submission rejected" : "Order received ✅"}
      </h1>
      <p className="note co-sub">
        {approved ? `Your receipt will be sent to ${o.email}.`
          : o.status === "Rejected" ? "We couldn't verify your token."
          : "We've received your token. Your tickets are confirmed once our team verifies it."}
      </p>
      <Ticket o={o} />
      <div className="co-actions noprint">
        {approved && <button className="btn" onClick={() => window.print()}>Download ticket (print / save as PDF)</button>}
        <a className="btn o" href="#/dashboard">My tickets</a>
        <a className="btn o" href="#/">Back to Oasis</a>
      </div>
    </main>
  );
}

export function Orders({ orders }) {
  const pending = orders.filter((o) => o.status === "Pending Verification").length;
  return (
    <main className="w co">
      <h1 className="co-h">My tickets</h1>
      {orders.length > 0 && (
        <p className="note co-sub">{orders.length} order{orders.length > 1 ? "s" : ""}{pending ? ` · ${pending} waiting for verification` : ""}</p>
      )}
      {orders.length === 0 ? (
        <p className="empty">You haven't bought any tickets yet.<br /><a className="btn" style={{ display: "inline-block", marginTop: 12 }} href="#/">Browse events</a></p>
      ) : (
        <div className="tix-grid">
          {orders.map((o) => (
            <div key={o.id} className="tix-wrap">
              <Ticket o={o} />
              <p className="noprint tix-open"><a className="btn o" href={"#/confirmation/" + o.id}>Open ticket</a></p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
