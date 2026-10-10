import { useState, useEffect, useCallback, useRef } from "react";
import "./oasis.css";
import Header from "./Header.jsx";
import Artist from "./pages/Artist.jsx";
import Checkout from "./pages/Checkout.jsx";
import { Confirmation, Orders } from "./pages/Orders.jsx";
import Admin from "./pages/Admin.jsx";
import { Toast } from "./ui.jsx";
import { fetchStatus, PENDING } from "./tokenOrders.js";

const parse = () => {
  const [path, qs = ""] = location.hash.replace(/^#\/?/, "").split("?");
  return { path, params: new URLSearchParams(qs) };
};
const loadOrders = () => { try { return JSON.parse(localStorage.getItem("tb_orders") || "[]"); } catch { return []; } };

export default function App() {
  const [route, setRoute] = useState(parse());
  const [orders, setOrders] = useState(loadOrders);
  const [filters, setFilters] = useState({ loc: "", month: "all", q: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const f = () => setRoute(parse());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => { if (route.path) window.scrollTo(0, 0); }, [route.path]);

  const notify = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(""), 2600); }, []);
  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  const persist = (next) => {
    ordersRef.current = next;
    setOrders(next);
    try { localStorage.setItem("tb_orders", JSON.stringify(next)); } catch {}
  };
  const addOrder = (o) => persist([o, ...ordersRef.current]);

  // Pull the latest verification status (Approved / Rejected) for this browser's pending orders.
  const refreshStatuses = useCallback(async () => {
    const pending = ordersRef.current.filter((o) => o.token && o.status === PENDING);
    if (!pending.length) return;
    const found = {};
    await Promise.all(pending.map(async (o) => { try { found[o.id] = await fetchStatus(o.id, o.token); } catch {} }));
    let changed = false;
    const next = ordersRef.current.map((o) => {
      const r = found[o.id];
      if (r && (r.status !== o.status || (r.note || "") !== (o.note || ""))) { changed = true; return { ...o, status: r.status, note: r.note || "" }; }
      return o;
    });
    if (changed) persist(next);
  }, []);

  const p = route.path;
  useEffect(() => {
    if (p !== "dashboard" && !p.startsWith("confirmation/")) return;
    refreshStatuses();
    const t = setInterval(refreshStatuses, 15000);
    return () => clearInterval(t);
  }, [p, refreshStatuses]);

  return (
    <div className="page">
      <Header showSearch={p === ""} filters={filters} setFilters={setFilters} notify={notify} />
      {p === "" && <Artist filters={filters} setFilters={setFilters} notify={notify} />}
      {p === "checkout" && <Checkout params={route.params} onOrder={addOrder} />}
      {p.startsWith("confirmation/") && <Confirmation orders={orders} id={p.split("/")[1]} />}
      {p === "dashboard" && <Orders orders={orders} />}
      {(p === "admin" || p.startsWith("admin/order/")) && <Admin orderId={p.startsWith("admin/order/") ? p.split("/")[2] : null} />}
      <footer><div className="w">© TicketBuddy</div></footer>
      <Toast msg={msg} />
    </div>
  );
}
