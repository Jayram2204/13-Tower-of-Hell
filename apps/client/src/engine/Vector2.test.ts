import { describe, expect, it } from "vitest";
import { Vector2 } from "./Vector2";

describe("Vector2", () => {
  it("constructs with default values", () => {
    const v = new Vector2();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it("constructs with given values", () => {
    const v = new Vector2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("set mutates in place", () => {
    const v = new Vector2();
    v.set(10, 20);
    expect(v.x).toBe(10);
    expect(v.y).toBe(20);
  });

  it("addMut modifies in place", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    a.addMut(b);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
  });

  it("subMut modifies in place", () => {
    const a = new Vector2(5, 8);
    const b = new Vector2(2, 3);
    a.subMut(b);
    expect(a.x).toBe(3);
    expect(a.y).toBe(5);
  });

  it("scaleMut modifies in place", () => {
    const v = new Vector2(3, 4);
    v.scaleMut(2);
    expect(v.x).toBe(6);
    expect(v.y).toBe(8);
  });

  it("lerpMut interpolates in place", () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(100, 100);
    a.lerpMut(b, 0.5);
    expect(a.x).toBe(50);
    expect(a.y).toBe(50);
  });

  it("add returns new vector", () => {
    const a = new Vector2(1, 2);
    const b = new Vector2(3, 4);
    const c = a.add(b);
    expect(c.x).toBe(4);
    expect(c.y).toBe(6);
    expect(a.x).toBe(1);
    expect(a.y).toBe(2);
  });

  it("sub returns new vector", () => {
    const a = new Vector2(5, 8);
    const b = new Vector2(2, 3);
    const c = a.sub(b);
    expect(c.x).toBe(3);
    expect(c.y).toBe(5);
  });

  it("scale returns new vector", () => {
    const v = new Vector2(3, 4);
    const s = v.scale(2);
    expect(s.x).toBe(6);
    expect(s.y).toBe(8);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("lerp returns new vector", () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(100, 100);
    const c = a.lerp(b, 0.5);
    expect(c.x).toBe(50);
    expect(c.y).toBe(50);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
  });

  it("copy creates independent clone", () => {
    const a = new Vector2(7, 9);
    const b = a.copy();
    b.x = 99;
    expect(a.x).toBe(7);
    expect(b.x).toBe(99);
  });

  it("copyTo writes to existing vector", () => {
    const a = new Vector2(3, 4);
    const b = new Vector2();
    a.copyTo(b);
    expect(b.x).toBe(3);
    expect(b.y).toBe(4);
  });

  it("magnitude calculates correctly", () => {
    const v = new Vector2(3, 4);
    expect(v.magnitude()).toBe(5);
  });

  it("distanceTo calculates correctly", () => {
    const a = new Vector2(0, 0);
    const b = new Vector2(3, 4);
    expect(a.distanceTo(b)).toBe(5);
  });
});
