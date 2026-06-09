import { describe, expect, it } from "bun:test";
import { RingBuffer } from "../ui/history";

describe("RingBuffer", () => {
  it("pushes and retrieves entries", () => {
    const buf = new RingBuffer(3);
    buf.push({ timestamp: new Date(), level: "info", message: "a" });
    buf.push({ timestamp: new Date(), level: "info", message: "b" });
    expect(buf.length).toBe(2);
    expect(buf.all.map((e) => e.message)).toEqual(["a", "b"]);
  });

  it("shifts oldest when over maxSize", () => {
    const buf = new RingBuffer(2);
    buf.push({ timestamp: new Date(), level: "info", message: "a" });
    buf.push({ timestamp: new Date(), level: "info", message: "b" });
    buf.push({ timestamp: new Date(), level: "info", message: "c" });
    expect(buf.length).toBe(2);
    expect(buf.all.map((e) => e.message)).toEqual(["b", "c"]);
  });

  it("flush returns all entries and clears buffer", () => {
    const buf = new RingBuffer(3);
    buf.push({ timestamp: new Date(), level: "info", message: "a" });
    const flushed = buf.flush();
    expect(flushed).toHaveLength(1);
    expect(flushed[0].message).toBe("a");
    expect(buf.length).toBe(0);
  });

  it("all returns a copy, not a reference", () => {
    const buf = new RingBuffer(3);
    buf.push({ timestamp: new Date(), level: "info", message: "a" });
    const copy = buf.all;
    copy.push({ timestamp: new Date(), level: "info", message: "b" });
    expect(buf.length).toBe(1);
  });

  it("defaults maxSize to 50", () => {
    const buf = new RingBuffer();
    for (let i = 0; i < 60; i++) {
      buf.push({ timestamp: new Date(), level: "info", message: `entry-${i}` });
    }
    expect(buf.length).toBe(50);
  });

  it("empty buffer has length 0", () => {
    const buf = new RingBuffer();
    expect(buf.length).toBe(0);
    expect(buf.all).toEqual([]);
  });

  it("flush on empty buffer returns empty array", () => {
    const buf = new RingBuffer();
    const flushed = buf.flush();
    expect(flushed).toEqual([]);
  });
});
