import { fmtDate, money } from "../data.js";

const isToken = (o) => !!o.status; // older demo orders have no status
const BADGE = { "Pending Verification": "wait", Approved: "ok", Rejected: "bad" };

function Ticket({ o }) {
  return (
    <div className="tix">
      <div><small>Order</small><b>{o.id}</b></div>
      {isToken(o) && <p style={{ margin: "8px 0 0" }}><span className={"badge " + BADGE[o.status]}>{o.status}</span></p>}
      <h3>Oasis Live '27</h3>
      <p>{o.venue}, {o.city}<br />{fmtDate(o.date)} · {o.time}</p>
      <p>{o.qty} × {o.ticket}<br />Name: {o.name}<br />{isToken(o) ? `Total ${money(o.total)} · Payment: Token Image` : `Paid ${money(o.total)} with ${o.payment}`}</p>
      {o.status === "Pending Verification" && <p className="vmsg">Your token image has been submitted and is waiting for manual verification. This page updates automatically.</p>}
      {o.status === "Rejected" && (
        <p className="vmsg bad">Your submission was rejected{o.note ? `: ${o.note}` : "."} <a className="lnk noprint" href={"#/checkout"}>Submit a new order</a></p>
      )}
    </div>
  );
}

export function Confirmation({ orders, id }) {
  const o = orders.find((x) => x.id === id);
  if (!o) return <main className="w co"><p className="empty">Order not found. <a className="lnk" href="#/dashboard">View my tickets</a></p></main>;
  const approved = !isToken(o) || o.status === "Approved";
  return (
    <main className="w co">
      <h1 className="co-h">
        {approved ? "You're going! 🎸" : o.status === "Rejected" ? "Submission rejected" : "Order received ✅"}
      </h1>
      <p className="note">
        {approved ? `Your receipt will be sent to ${o.email}.`
          : o.status === "Rejected" ? "We couldn't verify your token image."
          : "We've received your token image. Your tickets are confirmed once our team verifies it."}
      </p>
      <Ticket o={o} />
      <div className="row2 noprint" style={{ justifyContent: "flex-start", gap: 12 }}>
        {approved && <button className="btn" onClick={() => window.print()}>Download ticket (print / save as PDF)</button>}
        <a className="btn o" href="#/dashboard">My tickets</a>
        <a className="btn o" href="#/">Back to Oasis</a>
      </div>
    </main>
  );
}

export function Orders({ orders }) {
  return (
    <main className="w co">
      <h1 className="co-h">My tickets</h1>
      {orders.length === 0 ? (
        <p className="empty">You haven't bought any tickets yet.<br /><a className="btn" style={{ display: "inline-block", marginTop: 12 }} href="#/">Browse events</a></p>
      ) : orders.map((o) => (
        <div key={o.id}><Ticket o={o} /><p className="noprint"><a className="lnk" href={"#/confirmation/" + o.id}>Open ticket</a></p></div>
      ))}
    </main>
  );
}
