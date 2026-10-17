const express = require("express");
const config = require("../config");
const facade = require("../facade");
//
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

// exercises the real (development only) image handler.
describe("facade event images", () => {
  const app = express();
  facade.serveImages(app, config);

  it("serves an existing image", () => {
    return request(app).get("/eventimages/bike.jpg").expect(200);
  });
  it("keeps not found behavior for a missing image", () => {
    return request(app).get("/eventimages/nonexistent.jpg").expect(404);
  });
  it("rejects traversal in the id", async () => {
    for (const id of ["..%2F..%2Fpackage", "%2e%2e%2f%2e%2e%2fpackage", "..%5Cpackage"]) {
      const res = await request(app).get(`/eventimages/${id}.json`);
      assert.notEqual(res.status, 200, id);
    }
  });
  it("rejects unexpected separators in the id or extension", async () => {
    await request(app).get("/eventimages/a%2Fb.jpg").expect(400);
    await request(app).get("/eventimages/bike.j%2Fpg").expect(400);
  });
});
