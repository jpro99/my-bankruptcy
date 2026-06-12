import { describe, it, expect } from "vitest";
import { classifyTradeline } from "../classifiers/tradeline-classifier.js";

describe("Tradeline classifier", () => {
  it("classifies secured auto loan to Schedule D", () => {
    const result = classifyTradeline({
      id: "1",
      creditorName: "Toyota Financial",
      accountType: "Auto Loan",
      balance: "8420.00",
      isSecured: true,
      collateralDescription: "2019 Toyota Camry",
    });
    expect(result.schedule).toBe("D");
  });

  it("classifies credit card to Schedule F", () => {
    const result = classifyTradeline({
      id: "2",
      creditorName: "Capital One",
      accountType: "Credit Card",
      balance: "4523.17",
      isRevolving: true,
    });
    expect(result.schedule).toBe("F");
  });

  it("classifies tax debt to Schedule E", () => {
    const result = classifyTradeline({
      id: "3",
      creditorName: "IRS",
      accountType: "Tax Lien",
      balance: "3500.00",
      isPriority: true,
      priorityClass: "taxes",
    });
    expect(result.schedule).toBe("E");
  });

  it("classifies utility to Schedule G", () => {
    const result = classifyTradeline({
      id: "4",
      creditorName: "PG&E",
      accountType: "Utility",
      balance: "0.00",
      isLease: true,
    });
    expect(result.schedule).toBe("G");
  });
});
