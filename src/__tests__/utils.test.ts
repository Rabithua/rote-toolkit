import { describe, it, expect } from "vitest";
import {
  parseTags,
  isValidDateFormat,
  isValidCalendarDate,
  validatePagination,
} from "../utils.js";

describe("parseTags", () => {
  it("should return empty array for undefined input", () => {
    expect(parseTags(undefined)).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    expect(parseTags("")).toEqual([]);
  });

  it("should parse single tag", () => {
    expect(parseTags("ai")).toEqual(["ai"]);
  });

  it("should parse multiple tags", () => {
    expect(parseTags("ai,notes,knowledge")).toEqual([
      "ai",
      "notes",
      "knowledge",
    ]);
  });

  it("should trim whitespace from tags", () => {
    expect(parseTags("ai , notes , knowledge")).toEqual([
      "ai",
      "notes",
      "knowledge",
    ]);
  });

  it("should filter out empty tags", () => {
    expect(parseTags("ai,,notes,")).toEqual(["ai", "notes"]);
  });

  it("should handle tags with only whitespace", () => {
    expect(parseTags("ai,   ,notes")).toEqual(["ai", "notes"]);
  });

  it("should handle Chinese tags", () => {
    expect(parseTags("知识,笔记,AI")).toEqual(["知识", "笔记", "AI"]);
  });

  it("should handle tags with special characters", () => {
    expect(parseTags("c++,node.js,@work")).toEqual(["c++", "node.js", "@work"]);
  });
});

describe("isValidDateFormat", () => {
  it("should return true for valid format", () => {
    expect(isValidDateFormat("2024-01-01")).toBe(true);
    expect(isValidDateFormat("2024-12-31")).toBe(true);
  });

  it("should return false for invalid format", () => {
    expect(isValidDateFormat("2024/01/01")).toBe(false);
    expect(isValidDateFormat("01-01-2024")).toBe(false);
    expect(isValidDateFormat("2024-1-1")).toBe(false);
    expect(isValidDateFormat("20240101")).toBe(false);
    expect(isValidDateFormat("")).toBe(false);
  });
});

describe("isValidCalendarDate", () => {
  it("should return true for valid calendar dates", () => {
    expect(isValidCalendarDate("2024-01-01")).toBe(true);
    expect(isValidCalendarDate("2024-02-29")).toBe(true); // Leap year
    expect(isValidCalendarDate("2024-12-31")).toBe(true);
  });

  it("should return false for invalid calendar dates", () => {
    expect(isValidCalendarDate("2024-02-30")).toBe(false); // Feb 30 doesn't exist
    expect(isValidCalendarDate("2024-04-31")).toBe(false); // Apr has 30 days
    expect(isValidCalendarDate("2023-02-29")).toBe(false); // Not a leap year
    expect(isValidCalendarDate("2024-13-01")).toBe(false); // Invalid month
    expect(isValidCalendarDate("2024-00-01")).toBe(false); // Invalid month
  });

  it("should return false for invalid format", () => {
    expect(isValidCalendarDate("2024/01/01")).toBe(false);
    expect(isValidCalendarDate("invalid")).toBe(false);
  });
});

describe("validatePagination", () => {
  it("should use defaults when not provided", () => {
    expect(validatePagination()).toEqual({ limit: 10, skip: 0 });
  });

  it("should accept valid values", () => {
    expect(validatePagination(20, 10)).toEqual({ limit: 20, skip: 10 });
  });

  it("should throw for invalid limit", () => {
    expect(() => validatePagination(0, 0)).toThrow("Invalid limit");
    expect(() => validatePagination(-1, 0)).toThrow("Invalid limit");
    expect(() => validatePagination(NaN, 0)).toThrow("Invalid limit");
    expect(() => validatePagination(Infinity, 0)).toThrow("Invalid limit");
  });

  it("should throw for invalid skip", () => {
    expect(() => validatePagination(10, -1)).toThrow("Invalid skip");
    expect(() => validatePagination(10, NaN)).toThrow("Invalid skip");
    expect(() => validatePagination(10, Infinity)).toThrow("Invalid skip");
  });

  it("should accept skip of 0", () => {
    expect(validatePagination(10, 0)).toEqual({ limit: 10, skip: 0 });
  });
});
