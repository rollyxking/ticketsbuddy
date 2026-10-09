import { useState, useEffect } from "react";
import { SECTIONS, US, INTL, ALL, VIPS, VIP_PRICES, TOUR, SETLIST, FAQS, REVIEWS, MORE_REVIEWS, FANS, DAYS, MONTHS, applyFilters, money } from "../data.js";
import { HERO, VIP_IMG, NEWS_IMG, FAN_IMGS } from "../images.js";
import { MONTH_OPTS } from "../Header.jsx";
import { Modal } from "../ui.jsx";

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const buy = (id, vip) => { location.hash = "#/checkout?event=" + id + (vip !== undefined ? "&vip=" + vip : ""); };
const toRev = ([title, by, text]) => ({ title, by, text, rating: 5 });

function Pic({ src }) {
  const [ok, setOk] = useState(true);
  return ok ? <img src={src} alt="" loading="lazy" onError={() => setOk(false)} /> : null;
}

function EventRow({ e }) {
  const d = new Date(e.date + "T12:00:00");
  return (
    <div className="ev">
      <div className="dt"><i>{MONTHS[d.getMonth()]}</i><b>{String(d.getDate()).padStart(2, "0")}</b><u>{d.getFullYear()}</u></div>
      <div className="dw"><b>{DAYS[d.getDay()]}</b>{e.time}</div>
      <div className="lc"><b>{e.city}</b><span>{e.venue} · Oasis Live '27</span></div>
      <button className="btn" onClick={() => buy(e.id)}>Buy Ticket</button>
    </div>
  );
}

function Calendar({ events }) {
  const groups = {};
  events.forEach((e) => (groups[e.date.slice(0, 7)] ||= []).push(e));
  return Object.keys(groups).sort().map((k) => (
    <div key={k} className="calm">
      <h3>{MONTHS[+k.slice(5) - 1]} {k.slice(0, 4)}</h3>
      <div className="calg">
        {groups[k].map((e) => {
          const d = new Date(e.date + "T12:00:00");
          return (
            <button key={e.id} className="chip" onClick={() => buy(e.id)}>
              <b>{d.getDate()}</b> {DAYS[d.getDay()]}<span>{e.city.split(",")[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  ));
}

function Accordion({ title, sub, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"acc" + (open ? " open" : "")}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}{sub && <small>{sub}</small>}</span><b>⌄</b>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default function Artist({ filters, setFilters, notify }) {
  const [fav, setFav] = useState(false);
  const [shown, setShown] = useState(14);
  const [view, setView] = useState("list");
  const [tab, setTab] = useState(0);
  const [vipOpen, setVipOpen] = useState({});
  const [aboutOpen, setAboutOpen] = useState(false);
  const [current, setCurrent] = useState("concerts");
  const [revs, setRevs] = useState(REVIEWS.map(toRev));
  const [pool, setPool] = useState(MORE_REVIEWS);
  const [modal, setModal] = useState(false);
  const [rf, setRf] = useState({ rating: 5, title: "", by: "", text: "" });

  const us = applyFilters(US, filters);
  const intl = applyFilters(INTL, filters);
  const total = us.length + intl.length;
  const intlShown = intl.slice(0, shown);
  const loaded = us.length + intlShown.length;
  const filtered = filters.loc || filters.q || filters.month !== "all";

  useEffect(() => {
    const spy = () => {
      let cur = SECTIONS[0][0];
      SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 160) cur = id; });
      setCurrent(cur);
    };
    window.addEventListener("scroll", spy); spy();
    return () => window.removeEventListener("scroll", spy);
  }, []);

  const submitReview = (e) => {
    e.preventDefault();
    if (!rf.title.trim() || !rf.by.trim() || !rf.text.trim()) return notify("Please fill in every field");
    setRevs([{ ...rf }, ...revs]); setModal(false); setRf({ rating: 5, title: "", by: "", text: "" }); notify("Review posted");
  };
  const moreReviews = () => { setRevs([...revs, ...pool.slice(0, 5).map(toRev)]); setPool(pool.slice(5)); };
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <header className="hero" style={{ backgroundImage: `linear-gradient(180deg,rgba(10,15,20,.45),rgba(10,15,20,.92)),url(${HERO})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="w">
          <div className="crumbs"><a href="#/">Home</a><span>›</span><a href="#/" onClick={(e) => { e.preventDefault(); go("concerts"); }}>Concerts</a><span>›</span>Rock<span>›</span>Oasis Tickets</div>
          <p className="kick">Rock</p>
          <h1>Oasis Tickets</h1>
          <div className="meta">
            <button className={"circ" + (fav ? " on" : "")} aria-pressed={fav} aria-label="Save to favorites"
              onClick={() => { setFav(!fav); notify(fav ? "Removed from favorites" : "Saved Oasis to favorites"); }}>{fav ? "♥" : "♡"}</button>
            <a className="rate" href="#/" onClick={(e) => { e.preventDefault(); go("reviews"); }}><span className="star">★</span>4.8</a>
          </div>
        </div>
      </header>

      <nav className="sub"><div className="w"><ul>
        {SECTIONS.map(([id, label]) => (
          <li key={id}><a href="#/" className={current === id ? "cur" : ""} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a></li>
        ))}
      </ul></div></nav>

      <section id="concerts"><div className="w">
        <h2>Concerts<small>{total} Results</small></h2>
        <div className="bar">
          <input value={filters.loc} onChange={set("loc")} placeholder="City or Zip Code" aria-label="Location" />
          <select value={filters.month} onChange={set("month")} aria-label="Dates">{MONTH_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <div className="vt">
            <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} aria-label="List view">☰</button>
            <button className={view === "cal" ? "on" : ""} onClick={() => setView("cal")} aria-label="Calendar view">🗓</button>
          </div>
        </div>

        {total === 0 ? (
          <div className="empty">No events match your search.<br />
            <button className="btn o" style={{ marginTop: 12 }} onClick={() => setFilters({ loc: "", month: "all", q: "" })}>Clear filters</button>
          </div>
        ) : view === "cal" ? (
          <Calendar events={[...us, ...intl]} />
        ) : (
          <>
            {us.length > 0 && <><h3>Concerts in United States</h3>{us.map((e) => <EventRow key={e.id} e={e} />)}</>}
            {!filtered && (
              <div className="promo">
                <div><em>Promoted</em> <b>EXCLUSIVE: Ticket + Hotel Packages</b><p>Bundle with a hotel stay and save on your trip.</p></div>
                <button className="btn o" onClick={() => { setTab(1); go("experience"); }}>Book Now</button>
              </div>
            )}
            {intl.length > 0 && <><h3>International Concerts</h3>{intlShown.map((e) => <EventRow key={e.id} e={e} />)}</>}
            <div className="more">
              <div>Loaded {loaded} out of {total} events</div>
              <div className="prog"><i style={{ width: (loaded / total) * 100 + "%" }} /></div>
              {shown < intl.length && <button className="btn o" onClick={() => setShown(shown + 12)}>More Events ▾</button>}
            </div>
          </>
        )}
      </div></section>

      <section id="experience"><div className="w">
        <h2>Experience</h2>
        <div className="tabs">
          {["VIP packages", "Hotel VIP packages"].map((t, i) => <button key={t} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{t}</button>)}
        </div>
        {tab === 0 ? (
          <div className="car">
            {VIPS.map(([name, items], i) => (
              <div className="card" key={name}>
                <div className="img"><Pic src={VIP_IMG} /></div>
                <div className="b">
                  <h4>{name}</h4>
                  <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
                  {vipOpen[i] && <p className="note">Pick your show at checkout. Package perks are confirmed on your ticket.</p>}
                  <div className="row2">
                    <span className="price">from {money(VIP_PRICES[i])}</span>
                    <button className="btn" onClick={() => buy(ALL[0].id, i)}>Buy Ticket</button>
                  </div>
                  <p><button className="lnk" onClick={() => setVipOpen({ ...vipOpen, [i]: !vipOpen[i] })}>{vipOpen[i] ? "Show less" : "Read More"}</button></p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="note">No hotel packages are available right now. Check back soon.</p>}
      </div></section>

      <section id="about" className="abt"><div className="w">
        <h2>About</h2>
        <div className={aboutOpen ? "" : "clip"}>
          <p>Oasis announced the Oasis Live '27 tour for the UK, Europe and USA, with 38 shows across nine countries. Tour dates:</p>
          <ul>{Object.entries(TOUR).map(([k, v]) => <li key={k}><b>{k}</b>: {v}</li>)}</ul>
          <p>Following the massive Live '25 run, the band returns to the stage with a fresh set of locations, plus homecoming nights in Manchester. Formed in Manchester in the 1990s, Oasis defined a generation, and all seven studio albums reached #1 in the UK.</p>
        </div>
        <p style={{ marginTop: 12 }}><button className="btn o" onClick={() => setAboutOpen(!aboutOpen)}>{aboutOpen ? "Show less ▴" : "Show more ▾"}</button></p>
      </div></section>

      <section id="setlists"><div className="w">
        <h2>Setlists</h2>
        <Accordion title="Oasis Live '25" sub="São Paulo, Brazil · Sun, Nov 23, 2025"><ol>{SETLIST.map((s) => <li key={s}>{s}</li>)}</ol></Accordion>
        <p className="note">Powered by setlist.fm</p>
      </div></section>

      <section id="news"><div className="w">
        <h2>News</h2>
        <div className="news">
          <div className="img"><Pic src={NEWS_IMG} /></div>
          <div className="b">
            <h4>Oasis Announce 2027 North American Shows: See Dates</h4>
            <p>Oasis is coming back to the United States in 2027. Check the dates and learn how to get tickets.</p>
            <a className="btn o" href="https://blog.ticketmaster.com/oasis-2027-tour-dates/" target="_blank" rel="noreferrer noopener" style={{ display: "inline-block" }}>Read More ↗</a>
          </div>
        </div>
      </div></section>

      <section id="faqs"><div className="w">
        <h2>FAQS</h2>
        {FAQS.map(([q, a]) => <Accordion key={q} title={q}>{a}</Accordion>)}
      </div></section>

      <section id="reviews"><div className="w">
        <h2>Reviews<small>713 Results</small></h2>
        <div className="bar" style={{ alignItems: "center" }}>
          <span className="rate"><span className="star">★</span> 4.8</span>
          <button className="btn o" style={{ marginLeft: "auto" }} onClick={() => setModal(true)}>Write a review ✎</button>
        </div>
        {revs.map((r, i) => (
          <div className="rev" key={r.title + i}>
            <span className="star">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
            <h4>{r.title}</h4><small>by {r.by}</small><p>{r.text}</p>
          </div>
        ))}
        <div className="more">
          <div>Loaded {revs.length} out of 713 reviews</div>
          <div className="prog"><i style={{ width: Math.max(1, (revs.length / 713) * 100) + "%" }} /></div>
          {pool.length > 0 ? <button className="btn o" onClick={moreReviews}>More Reviews ▾</button> : null}
        </div>
      </div></section>

      <section id="fans-also-viewed" style={{ border: 0 }}><div className="w">
        <h2>Fans Also Viewed</h2>
        <div className="tiles">
          {FANS.map((f, i) => (
            <button className="tile" key={f} onClick={() => notify(f + " is coming soon")}>
              <div style={{ background: `linear-gradient(135deg,hsl(${140 + i * 12},55%,26%),hsl(${190 + i * 8},50%,14%))` }}><Pic src={FAN_IMGS[i]} /></div>
              <p>{f}</p>
            </button>
          ))}
        </div>
      </div></section>

      {modal && (
        <Modal title="Write a review" onClose={() => setModal(false)}>
          <form className="form" onSubmit={submitReview}>
            <label>Rating
              <select value={rf.rating} onChange={(e) => setRf({ ...rf, rating: +e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
              </select>
            </label>
            <label>Title<input value={rf.title} onChange={(e) => setRf({ ...rf, title: e.target.value })} /></label>
            <label>Your name<input value={rf.by} onChange={(e) => setRf({ ...rf, by: e.target.value })} /></label>
            <label>Review<textarea rows="4" value={rf.text} onChange={(e) => setRf({ ...rf, text: e.target.value })} /></label>
            <button className="btn">Post review</button>
          </form>
        </Modal>
      )}
    </>
  );
}
