const NAV = ["Concerts", "Sports", "Arts, Theater & Comedy", "Family", "Cities", "More"];
export const MONTH_OPTS = [["all", "All dates"], ["05", "May 2027"], ["06", "June 2027"], ["07", "July 2027"], ["08", "August 2027"], ["09", "September 2027"]];
const go = (id) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 60);

export default function Header({ showSearch, filters, setFilters, notify }) {
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  return (
    <div className="top">
      <div className="w nav">
        <a className="logo" href="#/">TicketBubby</a>
        <ul className="links">
          {NAV.map((n) => (
            <li key={n}>
              <a href="#/" onClick={(e) => {
                if (n === "Concerts") { if (location.hash && location.hash !== "#/") location.hash = "#/"; go("concerts"); e.preventDefault(); }
                else { e.preventDefault(); notify(n + " is coming soon"); }
              }}>{n}</a>
            </li>
          ))}
        </ul>
        <a className="dash" href="#/dashboard">⌕ Dashboard</a>
      </div>
      {showSearch && (
        <div className="w srow">
          <label>Location<input value={filters.loc} onChange={set("loc")} placeholder="City or Zip Code" /></label>
          <label>Dates<select value={filters.month} onChange={set("month")}>{MONTH_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="grow">Search<input value={filters.q} onChange={set("q")} placeholder="Artist, Event or Venue" /></label>
          <button className="btn" onClick={() => go("concerts")}>Search</button>
        </div>
      )}
    </div>
  );
}
