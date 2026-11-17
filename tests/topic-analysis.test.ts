import { describe, expect, it } from "vitest";
import {
  analyzeSegment,
  extractEvents,
  extractListItems,
  extractQuantities,
  extractSteps,
} from "@/lib/whiteboard/layout/topic-analysis";

describe("extractSteps", () => {
  it("reads explicitly marked stages in order", () => {
    const steps = extractSteps(
      "First, blood enters the right atrium. Then it drops into the right ventricle. Finally it is pushed out to the lungs."
    );

    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].toLowerCase()).toContain("blood");
    expect(steps[2].toLowerCase()).toContain("pushed");
  });

  it("falls back to causal chains when no markers exist", () => {
    const steps = extractSteps(
      "The chloroplast produces glucose, which leads to stored chemical energy."
    );
    expect(steps.length).toBeGreaterThanOrEqual(1);
  });
});

describe("extractListItems", () => {
  it("splits an enumeration into named parts", () => {
    const items = extractListItems(
      "A request consists of a method, a path and a set of headers."
    );
    expect(items).toContain("Method");
    expect(items.length).toBeGreaterThanOrEqual(3);
  });
});

describe("extractEvents", () => {
  it("pairs years with what happened", () => {
    const events = extractEvents(
      "In 1981 the Osborne 1 shipped. By 1995 the ThinkPad 701C arrived."
    );
    expect(events.map((e) => e.when)).toEqual(["1981", "1995"]);
    expect(events[0].label.length).toBeGreaterThan(0);
  });
});

describe("extractQuantities", () => {
  it("captures values with their units", () => {
    const values = extractQuantities("It weighed 24.5 lbs, drew 60 watts and ran for 2 hours.");
    expect(values.map((v) => v.unit)).toEqual(["lbs", "watts", "hours"]);
    expect(values[0].value).toBeCloseTo(24.5);
  });
});

describe("analyzeSegment", () => {
  it("chooses a process diagram for sequential narration", () => {
    const analysis = analyzeSegment({
      heading: "How a request travels",
      narration:
        "First the client opens a connection. Then the server validates the token. Next the database is queried. Finally the response is returned.",
    });

    expect(analysis.archetype).toBe("process");
    expect(analysis.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("chooses a timeline when the narration is dated", () => {
    const analysis = analyzeSegment({
      heading: "Evolution of the laptop",
      narration:
        "In 1981 the Osborne 1 shipped at 24 pounds. By 1991 the PowerBook defined the modern layout. In 2008 the MacBook Air made thin normal.",
    });

    expect(analysis.archetype).toBe("timeline");
    expect(analysis.events.length).toBeGreaterThanOrEqual(3);
  });

  it("chooses a cycle when the narration loops", () => {
    const analysis = analyzeSegment({
      heading: "The water cycle",
      narration:
        "First water evaporates from the ocean. Then it condenses into clouds. Next it falls as rain. Finally it flows back to the sea and the cycle repeats.",
    });

    expect(analysis.archetype).toBe("cycle");
  });

  it("chooses a comparison when two things are contrasted", () => {
    const analysis = analyzeSegment({
      heading: "TCP vs UDP",
      narration:
        "TCP guarantees delivery and order. In contrast UDP sends packets without acknowledgement, which keeps latency low.",
    });

    expect(analysis.archetype).toBe("comparison");
    expect(analysis.comparison).not.toBeNull();
  });

  it("falls back to a concept board when there is no structure", () => {
    const analysis = analyzeSegment({
      heading: "What inflation means",
      narration: "Inflation describes a general rise in prices across an economy over time.",
    });

    expect(analysis.archetype).toBe("concept");
  });

  it("never invents steps it did not find", () => {
    const analysis = analyzeSegment({
      heading: "A short chapter",
      narration: "This is a brief statement with no structure at all.",
    });

    expect(analysis.steps.length).toBe(0);
    expect(analysis.archetype).toBe("concept");
  });
});
