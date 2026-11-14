import assert from "node:assert/strict";
import { test } from "node:test";
import { dashboardWindow, fillDailySales, jakartaDay } from "../lib/dashboard";

test("dashboard calendar follows Jakarta midnight instead of host/UTC dates", () => {
  assert.equal(jakartaDay(new Date("2026-11-11T17:00:00Z")), "2026-11-12");
  assert.equal(jakartaDay(new Date("2026-11-11T16:59:59Z")), "2026-11-11");
  const now = new Date("2026-11-11T17:05:00Z");
  const period = dashboardWindow(7, now);
  assert.equal(period.start.toISOString(), "2026-11-05T17:00:00.000Z");
  assert.equal(period.end, now);
  assert.equal(fillDailySales(period.start,7,[]).at(-1)?.date,"2026-11-12");
});
test("daily series fills missing dates without inventing sales and handles leap days", () => {
  const period = dashboardWindow(3,new Date("2024-03-01T02:00:00Z"));
  assert.deepEqual(fillDailySales(period.start,3,[{date:"2024-02-29",revenue:"99900.50",count:2}]),[
    {date:"2024-02-28",revenue:"0",count:0},
    {date:"2024-02-29",revenue:"99900.50",count:2},
    {date:"2024-03-01",revenue:"0",count:0},
  ]);
});
test("range boundaries include exactly 7, 30 or 90 Jakarta calendar dates across year end", () => {
  for(const days of [7,30,90]) {
    const period=dashboardWindow(days,new Date("2026-01-01T03:00:00Z"));
    const rows=fillDailySales(period.start,days,[]);
    assert.equal(rows.length,days);
    assert.equal(rows.at(-1)?.date,"2026-01-01");
    assert.equal(new Set(rows.map(row=>row.date)).size,days);
    assert.ok(rows.every(row=>row.revenue==="0" && row.count===0));
  }
});
