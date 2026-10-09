import { useState, useEffect } from "react";
import "./oasis.css";

/* ---------- data ---------- */
const SECTIONS = [
  ["concerts", "Concerts"], ["experience", "Experience"], ["about", "About"],
  ["setlists", "Setlists"], ["news", "News"], ["faqs", "FAQS"],
  ["reviews", "Reviews"], ["fans-also-viewed", "Fans Also Viewed"],
];

const US_EVENTS = [
  ["2027-08-10", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-13", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-14", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-20", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
  ["2027-08-21", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
  ["2027-08-24", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
];

const mk = (dates, city, venue, time) => dates.map((d) => ["2027-" + d, city, venue, time]);
const INTL_EVENTS = [
  ...mk(["05-21", "05-23", "05-25", "05-28", "05-29"], "Glasgow, UK", "Celtic Park", "5:00 PM"),
  ...mk(["06-04", "06-06", "06-08", "06-11", "06-12", "06-15", "06-18", "06-19", "06-22", "06-25", "06-26"], "Manchester, UK", "Etihad Stadium", "5:00 PM"),
  ...mk(["07-02", "07-03", "07-06"], "Munich, DE", "Allianz Arena", "TBA"),
  ...mk(["07-10", "07-11"], "Barcelona, ES", "Estadi Olímpic", "TBA"),
  ...mk(["07-16", "07-17"], "Amsterdam, NL", "Johan Cruijff ArenA", "TBA"),
  ...mk(["07-20", "07-23"], "Paris, FR", "Stade de France", "TBA"),
  ...mk(["07-26", "07-29", "07-30"], "Rome, IT", "Stadio Olimpico", "TBA"),
  ...mk(["09-04", "09-05"], "Slane, IE", "Slane Castle", "TBA"),
  ...mk(["09-11", "09-12", "09-18", "09-19", "09-25", "09-26"], "Stevenage, UK", "Knebworth", "TBA"),
];

const VIPS = [
  ["Pre-Show Fan Experience, Seated", ["One Tier 1 reserved seat", "Premium merchandise bundle", "Pre-show hub with host team", "Fast-track entry"]],
  ["Pre-Show Fan Experience, Front Standing", ["One front standing ticket", "Premium merchandise bundle", "Pre-show hub with host team", "Fast-track entry"]],
  ["Premium Seated Package", ["One premium reserved ticket", "Exclusive merchandise item", "Commemorative wristband"]],
  ["Premium Standing Package", ["One front general admission ticket", "Exclusive merchandise item", "Commemorative wristband"]],
];

const TOUR = {
  Glasgow: "May 21, 23, 25, 28, 29", Manchester: "Jun 4 to 26 (11 nights)",
  Munich: "Jul 2, 3, 6", Barcelona: "Jul 10, 11", Amsterdam: "Jul 16, 17",
  Paris: "Jul 20, 23", Rome: "Jul 26, 29, 30", Foxborough: "Aug 10, 13, 14",
  "Las Vegas": "Aug 20, 21, 24", Slane: "Sep 4, 5", Knebworth: "Sep 11, 12, 18, 19, 25, 26",
};

const SETLIST = ["Hello", "Acquiesce", "Morning Glory", "Some Might Say", "Bring It On Down", "Cigarettes & Alcohol", "Fade Away", "Supersonic", "Roll With It", "Talk Tonight", "Half the World Away", "Little by Little", "D'You Know What I Mean?", "Stand by Me", "Cast No Shadow", "Slide Away", "Whatever", "Live Forever", "Rock 'n' Roll Star", "The Masterplan", "Don't Look Back in Anger", "Wonderwall", "Champagne Supernova"];

const FAQS = [
  ["When is Oasis going on tour?", "Oasis Live '27 begins in May 2027 with shows in Glasgow, Manchester, Munich, Barcelona, Amsterdam, Paris and Rome, then North America and Ireland, closing with Knebworth in September."],
  ["When does the Oasis tour start?", "The North American leg starts August 10 with three shows at Gillette Stadium in Foxborough, Massachusetts."],
  ["When do tickets go on sale for the Oasis tour?", "Fans register on the official site first. Registration does not guarantee access or tickets. Face Value Exchange lets fans resell tickets at the price paid."],
  ["Where can I find venue and ticket price information?", "Check the Help Center for venue guides and ticket price details."],
];

const REVIEWS = [
  ["Biblical", "Luke", "The most spiritual night I have ever had at a show."],
  ["Best sounding reunion", "TXbolt", "Saw Manchester and the Rose Bowl in 2025. Huge sound and a wild crowd."],
  ["Amazing Live '25 shows", "Elle", "Chicago and Rose Bowl were both incredible. A fan since 95, hoping for 2027."],
  ["An unforgettable night", "Daniel", "The Pasadena Sunday show was electric from start to finish."],
  ["Rock and roll stars", "Mike", "They sound better live than on the radio, and the whole crowd lifted the night."],
];

const FANS = ["Beck", "Limp Bizkit", "The Smashing Pumpkins", "Morrissey", "Creed", "Metallica", "Foster the People", "Weezer"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ---------- small components ---------- */
function EventRow({ e }) {
  const d = new Date(e[0] + "T12:00:00");
  return (
    <div className="ev">
      <div className="dt">
        <i>{MONTHS[d.getMonth()]}</i>
        <b>{String(d.getDate()).padStart(2, "0")}</b>
        <u>{d.getFullYear()}</u>
      </div>
      <div className="dw"><b>{DAYS[d.getDay()]}</b>{e[3]}</div>
      <div className="lc">
        <b>{e[1]}</b>
        <span>{e[2]} · Oasis Live '27</span>
      </div>
      <button className="btn">Find Tickets</button>
    </div>
  );
}

function Accordion({ title, sub, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"acc" + (open ? " open" : "")}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}{sub && <small>{sub}</small>}</span>
        <b>⌄</b>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

/* ---------- page ---------- */
export default function OasisTickets() {
  const [fav, setFav] = useState(false);
  const [shown, setShown] = useState(14);
  const [tab, setTab] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [current, setCurrent] = useState("concerts");

  const total = US_EVENTS.length + INTL_EVENTS.length;
  const loaded = US_EVENTS.length + shown;

  useEffect(() => {
    const spy = () => {
      let cur = SECTIONS[0][0];
      SECTIONS.forEach(([id]) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 160) cur = id;
      });
      setCurrent(cur);
    };
    window.addEventListener("scroll", spy);
    spy();
    return () => window.removeEventListener("scroll", spy);
  }, []);

  return (
    <div className="page">
      <div className="top">
        <div className="w nav">
          <a className="logo" href="/">TicketBubby</a>
          <ul className="links">
            {["Concerts", "Sports", "Arts, Theater & Comedy", "Family", "Cities", "More"].map((n) => (
              <li key={n}><a href="#">{n}</a></li>
            ))}
          </ul>
          <a className="dash" href="/dashboard">⌕ Dashboard</a>
        </div>
        <div className="w srow">
          <label>Location<input placeholder="City or Zip Code" /></label>
          <label>Dates<select><option>All dates</option></select></label>
          <label className="grow">Search<input placeholder="Artist, Event or Venue" /></label>
          <button className="btn">Search</button>
        </div>
      </div>

      <header className="hero"><div className="w">
        <div className="crumbs">Home<span>›</span>Concerts<span>›</span>Rock<span>›</span>Oasis Tickets</div>
        <p className="kick">Rock</p>
        <h1>Oasis Tickets</h1>
        <div className="meta">
          <button className={"circ" + (fav ? " on" : "")} onClick={() => setFav(!fav)} aria-label="Save to favorites">
            {fav ? "♥" : "♡"}
          </button>
          <a className="rate" href="#reviews"><span className="star">★</span>4.8</a>
        </div>
      </div></header>

      <nav className="sub"><div className="w"><ul>
        {SECTIONS.map(([id, label]) => (
          <li key={id}><a href={"#" + id} className={current === id ? "cur" : ""}>{label}</a></li>
        ))}
      </ul></div></nav>

      <section id="concerts"><div className="w">
        <h2>Concerts<small>{total} Results</small></h2>
        <div className="bar">
          <input placeholder="City or Zip Code" aria-label="Location" />
          <button>📅 All Dates ▾</button>
          <div className="vt"><button className="on">☰</button><button>🗓</button></div>
        </div>
        <h3>Concerts in United States</h3>
        {US_EVENTS.map((e) => <EventRow key={e[0]} e={e} />)}
        <div className="promo">
          <div><em>Promoted</em> <b>EXCLUSIVE: Ticket + Hotel Packages</b><p>Bundle with a hotel stay and save on your trip.</p></div>
          <button className="btn o">Book Now</button>
        </div>
        <h3>International Concerts</h3>
        {INTL_EVENTS.slice(0, shown).map((e) => <EventRow key={e[0] + e[1]} e={e} />)}
        <div className="more">
          <div>Loaded {loaded} out of {total} events</div>
          <div className="prog"><i style={{ width: (loaded / total) * 100 + "%" }} /></div>
          {shown < INTL_EVENTS.length && (
            <button className="btn o" onClick={() => setShown(Math.min(INTL_EVENTS.length, shown + 12))}>More Events ▾</button>
          )}
        </div>
      </div></section>

      <section id="experience"><div className="w">
        <h2>Experience</h2>
        <div className="tabs">
          {["VIP packages", "Hotel VIP packages"].map((t, i) => (
            <button key={t} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
        {tab === 0 ? (
          <div className="car">
            {VIPS.map(([name, items]) => (
              <div className="card" key={name}>
                <div className="img" />
                <div className="b">
                  <h4>{name}</h4>
                  <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>
                  <p><a href="#" style={{ color: "var(--ac)" }}>Read More</a></p>
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ color: "var(--mu)" }}>No hotel packages available right now.</p>}
      </div></section>

      <section id="about" className="abt"><div className="w">
        <h2>About</h2>
        <div className={aboutOpen ? "" : "clip"}>
          <p>Oasis announced the Oasis Live '27 tour for the UK, Europe and USA, with 38 shows across nine countries. Tour dates:</p>
          <ul>{Object.entries(TOUR).map(([k, v]) => <li key={k}><b>{k}</b>: {v}</li>)}</ul>
          <p>Following the massive Live '25 run, the band returns to the stage with a fresh set of locations, plus homecoming nights in Manchester. Formed in Manchester in the 1990s, Oasis defined a generation, and all seven studio albums reached #1 in the UK.</p>
        </div>
        <p style={{ marginTop: 12 }}>
          <button className="btn o" onClick={() => setAboutOpen(!aboutOpen)}>{aboutOpen ? "Show less ▴" : "Show more ▾"}</button>
        </p>
      </div></section>

      <section id="setlists"><div className="w">
        <h2>Setlists</h2>
        <Accordion title="Oasis Live '25" sub="São Paulo, Brazil · Sun, Nov 23, 2025">
          <ol>{SETLIST.map((s) => <li key={s}>{s}</li>)}</ol>
        </Accordion>
        <p className="note">Powered by setlist.fm</p>
      </div></section>

      <section id="news"><div className="w">
        <h2>News</h2>
        <div className="news">
          <div className="img" />
          <div className="b">
            <h4>Oasis Announce 2027 North American Shows: See Dates</h4>
            <p>Oasis is coming back to the United States in 2027. Check the dates and learn how to get tickets.</p>
            <a className="btn o" href="#" style={{ display: "inline-block" }}>Read More ↗</a>
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
          <button className="btn o" style={{ marginLeft: "auto", minWidth: 0 }}>Write a review ✎</button>
        </div>
        {REVIEWS.map(([title, by, text]) => (
          <div className="rev" key={title}>
            <span className="star">★★★★★</span>
            <h4>{title}</h4>
            <small>by {by}</small>
            <p>{text}</p>
          </div>
        ))}
        <div className="more">
          <div>Loaded 5 out of 713 reviews</div>
          <div className="prog"><i style={{ width: "1%" }} /></div>
          <button className="btn o">More Reviews ▾</button>
        </div>
      </div></section>

      <section id="fans-also-viewed" style={{ border: 0 }}><div className="w">
        <h2>Fans Also Viewed</h2>
        <div className="tiles">
          {FANS.map((f, i) => (
            <a className="tile" href="#" key={f}>
              <div style={{ background: `linear-gradient(135deg,hsl(${140 + i * 12},55%,26%),hsl(${190 + i * 8},50%,14%))` }} />
              <p>{f}</p>
            </a>
          ))}
        </div>
      </div></section>

      <footer><div className="w">TicketBubby · sample data for layout preview</div></footer>
    </div>
  );
}
