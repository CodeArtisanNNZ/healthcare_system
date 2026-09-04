import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedUrl,
  priceFromText,
  rankResult,
  extractProduct,
} from "../src/lib/medicine-utils";
import { entities, entitySchema } from "../src/lib/entities";
test("seller URL validation rejects alternate origins and credential tricks", () => {
  assert.equal(
    allowedUrl("https://www.arogga.com/product/1", "arogga.com"),
    true,
  );
  for (const url of [
    "http://arogga.com/x",
    "https://arogga.com.evil.test/x",
    "https://arogga.com@evil.test",
    "https://127.0.0.1/x",
    "https://arogga.com:8080/x",
    "https://user:pass@arogga.com/x",
  ])
    assert.equal(allowedUrl(url, "arogga.com"), false);
});
test("missing and ambiguous prices remain unknown", () => {
  assert.equal(priceFromText("No listed price"), null);
  assert.equal(priceFromText("BDT 1,234.50"), 1234.5);
  const hit = {
    title: "Example product",
    link: "https://arogga.com/product/1",
    snippet: "Contact seller",
  };
  assert.equal(
    extractProduct("<div>Unrelated price BDT 50</div>", hit).price,
    null,
  );
  assert.equal(
    extractProduct(
      '<script type="application/ld+json">{"@type":"Product","offers":{"price":"25.50","priceCurrency":"BDT"}}</script>',
      hit,
    ).price,
    25.5,
  );
  assert.equal(
    extractProduct(
      '<script type="application/ld+json">[{"@type":"Product","offers":{"price":25}},{"@type":"Product","offers":{"price":99}}]</script>',
      hit,
    ).price,
    null,
  );
  assert.equal(
    rankResult({ ...hit, title: "Unrelated product" }, "aspirin", "arogga.com"),
    -1,
  );
});
test("directory inputs reject invalid IDs, negative prices and unsafe seller links", () => {
  assert.equal(
    entitySchema(entities.medicine_offers).safeParse({
      medicine_id: "bad",
      seller: "X",
      price: -1,
      url: "javascript:alert(1)",
      checked_on: "bad",
    }).success,
    false,
  );
  assert.equal(
    entitySchema(entities.specialties).safeParse({ name: "   " }).success,
    false,
  );
  assert.equal(
    entitySchema(entities.specialties).safeParse({
      name: "Test",
      role: "admin",
    }).success,
    false,
  );
});
