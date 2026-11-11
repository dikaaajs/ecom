import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeSiteSettings, defaultSiteSettings, siteSettingsSchema } from "../lib/site-settings";
import { MAX_SITE_IMAGE_BYTES, siteImageType } from "../lib/site-media";
import { hasSameOrigin } from "../lib/request-origin";

test("public settings do not expose shipping or unknown private keys", () => {
  const s = decodeSiteSettings([{ key: "shippingOrigin", value: '{"address":"private"}' }, { key: "secret", value: "private" }, { key: "siteName", value: "Toko Saya" }]);
  assert.equal(s.siteName, "Toko Saya");
  assert.equal("shippingOrigin" in s, false);
  assert.equal("secret" in s, false);
  assert.equal(siteSettingsSchema.partial().safeParse({ shippingOrigin: "override" }).success, false);
});
test("stored settings round trip and malformed legacy values recover individually", () => {
  const rows = Object.entries(defaultSiteSettings).map(([key,value])=>({key,value:JSON.stringify(value)}));
  assert.deepEqual(decodeSiteSettings(rows), defaultSiteSettings);
  const s = decodeSiteSettings([{key:"primaryColor",value:"red; background:url(evil)"},{key:"showFaq",value:"false"},{key:"faqItems",value:"{}"}]);
  assert.equal(s.primaryColor,defaultSiteSettings.primaryColor);
  assert.equal(s.showFaq,false);
  assert.deepEqual(s.faqItems,defaultSiteSettings.faqItems);
});
test("unsafe URLs, invalid colors and excessive content are rejected", () => {
  for(const logoUrl of ["javascript:alert(1)","//evil.example/a.png","data:image/svg+xml,evil","/\\evil.example"]) {
    assert.equal(siteSettingsSchema.partial().safeParse({logoUrl}).success,false);
  }
  assert.equal(siteSettingsSchema.partial().safeParse({primaryColor:"blue"}).success,false);
  assert.equal(siteSettingsSchema.partial().safeParse({heroOverlay:100}).success,false);
  assert.equal(siteSettingsSchema.partial().safeParse({siteName:" "}).success,false);
  assert.equal(siteSettingsSchema.partial().safeParse({heroTitle:"a".repeat(151)}).success,false);
  assert.equal(siteSettingsSchema.partial().safeParse({logoUrl:"/logo.png",heroImage:"https://example.com/banner.jpg"}).success,true);
});
test("site uploads check actual image signatures and size", () => {
  const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
  assert.equal(siteImageType(png)?.mime,"image/png");
  assert.equal(siteImageType(new TextEncoder().encode('<svg onload="alert(1)"></svg>')),null);
  assert.equal(siteImageType(new Uint8Array(MAX_SITE_IMAGE_BYTES+1)),null);
  assert.equal(siteImageType(new Uint8Array(4)),null);
});
test("origin checks use the actual Host when Next normalizes the internal URL", () => {
  const request = (origin: string) => new Request("http://localhost:3108/api/settings", {headers:{host:"127.0.0.1:3108",origin}});
  assert.equal(hasSameOrigin(request("http://127.0.0.1:3108")),true);
  assert.equal(hasSameOrigin(request("https://attacker.example")),false);
  assert.equal(hasSameOrigin(request("null")),false);
  assert.equal(hasSameOrigin(request("http://127.0.0.1:3108/other")),false);
});
