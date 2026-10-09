export const SECTIONS = [
  ["concerts", "Concerts"], ["experience", "Experience"], ["about", "About"],
  ["setlists", "Setlists"], ["news", "News"], ["faqs", "FAQS"],
  ["reviews", "Reviews"], ["fans-also-viewed", "Fans Also Viewed"],
];

export const US_EVENTS = [
  ["2027-08-10", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-13", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-14", "Foxborough, MA", "Gillette Stadium", "7:00 PM"],
  ["2027-08-20", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
  ["2027-08-21", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
  ["2027-08-24", "Las Vegas, NV", "Allegiant Stadium", "7:00 PM"],
];

export const mk = (dates, city, venue, time) => dates.map((d) => ["2027-" + d, city, venue, time]);
export const INTL_EVENTS = [
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

export const VIPS = [
  ["Pre-Show Fan Experience, Seated", ["One Tier 1 reserved seat", "Premium merchandise bundle", "Pre-show hub with host team", "Fast-track entry"]],
  ["Pre-Show Fan Experience, Front Standing", ["One front standing ticket", "Premium merchandise bundle", "Pre-show hub with host team", "Fast-track entry"]],
  ["Premium Seated Package", ["One premium reserved ticket", "Exclusive merchandise item", "Commemorative wristband"]],
  ["Premium Standing Package", ["One front general admission ticket", "Exclusive merchandise item", "Commemorative wristband"]],
];

export const TOUR = {
  Glasgow: "May 21, 23, 25, 28, 29", Manchester: "Jun 4 to 26 (11 nights)",
  Munich: "Jul 2, 3, 6", Barcelona: "Jul 10, 11", Amsterdam: "Jul 16, 17",
  Paris: "Jul 20, 23", Rome: "Jul 26, 29, 30", Foxborough: "Aug 10, 13, 14",
  "Las Vegas": "Aug 20, 21, 24", Slane: "Sep 4, 5", Knebworth: "Sep 11, 12, 18, 19, 25, 26",
};

export const SETLIST = ["Hello", "Acquiesce", "Morning Glory", "Some Might Say", "Bring It On Down", "Cigarettes & Alcohol", "Fade Away", "Supersonic", "Roll With It", "Talk Tonight", "Half the World Away", "Little by Little", "D'You Know What I Mean?", "Stand by Me", "Cast No Shadow", "Slide Away", "Whatever", "Live Forever", "Rock 'n' Roll Star", "The Masterplan", "Don't Look Back in Anger", "Wonderwall", "Champagne Supernova"];

export const FAQS = [
  ["When is Oasis going on tour?", "Oasis Live '27 begins in May 2027 with shows in Glasgow, Manchester, Munich, Barcelona, Amsterdam, Paris and Rome, then North America and Ireland, closing with Knebworth in September."],
  ["When does the Oasis tour start?", "The North American leg starts August 10 with three shows at Gillette Stadium in Foxborough, Massachusetts."],
  ["When do tickets go on sale for the Oasis tour?", "Fans register on the official site first. Registration does not guarantee access or tickets. Face Value Exchange lets fans resell tickets at the price paid."],
  ["Where can I find venue and ticket price information?", "Check the Help Center for venue guides and ticket price details."],
];

export const REVIEWS = [
  ["Biblical", "Luke", "The most spiritual night I have ever had at a show."],
  ["Best sounding reunion", "TXbolt", "Saw Manchester and the Rose Bowl in 2025. Huge sound and a wild crowd."],
  ["Amazing Live '25 shows", "Elle", "Chicago and Rose Bowl were both incredible. A fan since 95, hoping for 2027."],
  ["An unforgettable night", "Daniel", "The Pasadena Sunday show was electric from start to finish."],
  ["Rock and roll stars", "Mike", "They sound better live than on the radio, and the whole crowd lifted the night."],
];

export const FANS = ["Beck", "Limp Bizkit", "The Smashing Pumpkins", "Morrissey", "Creed", "Metallica", "Foster the People", "Weezer"];

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


export const PRICES = [
  { id: "ga", label: "General Admission (Standing)", price: 119 },
  { id: "res", label: "Reserved Seat", price: 159 },
  { id: "prem", label: "Premium Reserved Seat", price: 229 },
]; // sample prices: replace with your real pricing
export const VIP_PRICES = [349, 429, 279, 299];

const toEv = ([date, city, venue, time]) => ({ id: date + "-" + city.split(",")[0].replace(/\s/g, ""), date, city, venue, time });
export const US = US_EVENTS.map(toEv);
export const INTL = INTL_EVENTS.map(toEv);
export const ALL = [...US, ...INTL];

export const MORE_REVIEWS = [
  ["Worth every minute", "Sam", "Wall-to-wall classics and a crowd singing every word."],
  ["Chills at the encore", "Priya", "Don't Look Back in Anger with the whole stadium. Unreal."],
  ["Bucket list ticked", "Carlos", "Travelled across the country and it was worth it."],
  ["Louder than I expected", "Jo", "Great sound even from the back of the stadium."],
  ["Brothers back on stage", "Mark", "You can feel the history. Brilliant night."],
  ["Family trip", "Aisha", "Took my dad, who has loved them since 94. He cried."],
];

export const fmtDate = (iso) => {
  const d = new Date(iso + "T12:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
export const money = (n) => "$" + n.toFixed(2);

export const applyFilters = (list, f) =>
  list.filter((e) => {
    const loc = f.loc.trim().toLowerCase();
    const q = f.q.trim().toLowerCase();
    return (
      (!loc || (e.city + " " + e.venue).toLowerCase().includes(loc)) &&
      (f.month === "all" || e.date.slice(5, 7) === f.month) &&
      (!q || (e.city + " " + e.venue + " oasis live").toLowerCase().includes(q))
    );
  });
