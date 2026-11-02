/*
  The live deal board. Add one block per deal inside CC_DEALS, separated by commas.
  event:  assignment | offmarket | lp | note | reo
  asset:  industrial | multifamily | retail | medical | office | hospitality | land | storage | other
  access: "direct" (principals only) or "broker" (brokers welcome)
  status: active | loi | closed
  Never put an address, a seller name, or an internal minimum price in this file. It is public.
*/
window.CC_DEALS = [];

/* Sample listings, shown only at marketplace.html?demo=1 so you can preview the layout. */
window.CC_DEMO_DEALS = [
  { id: "SAMPLE-A", sample: true, event: "assignment", asset: "industrial", market: "Dallas-Fort Worth, TX", size: "142,000 SF", ask: "On NCNDA", status: "active", access: "broker", posted: "2026-11-01", headline: "Cross-dock distribution center, contract in place" },
  { id: "SAMPLE-B", sample: true, event: "offmarket", asset: "medical", market: "Phoenix, AZ", size: "9,800 SF", ask: "On NCNDA", status: "active", access: "direct", posted: "2026-10-28", headline: "Owner-direct dental and specialty medical building" },
  { id: "SAMPLE-C", sample: true, event: "lp", asset: "multifamily", market: "Southeast US", size: "$6.0M equity", ask: "Pref option", status: "active", access: "broker", posted: "2026-10-20", headline: "Limited-partner equity, 240-unit value-add" },
  { id: "SAMPLE-D", sample: true, event: "reo", asset: "retail", market: "Midwest", size: "46,000 SF", ask: "On NCNDA", status: "loi", access: "direct", posted: "2026-10-12", headline: "Bank-owned neighborhood retail center" }
];
