import type { CreditPullProvider, CreditPullRequest, CreditPullResult } from "./types.js";

/** Sandbox tri-merge data — realistic California debtor tradeline mix */
export const SANDBOX_TRADELINES: CreditPullResult["tradelines"] = [
  {
    id: "tl-001",
    creditorName: "Wells Fargo Home Mortgage",
    accountNumberLast4: "4821",
    accountType: "Mortgage",
    balance: "312450.00",
    monthlyPayment: "2185.00",
    collateralDescription: "Primary residence — 2847 Riverside Blvd, Sacramento CA",
    isSecured: true,
    status: "Open",
  },
  {
    id: "tl-002",
    creditorName: "Toyota Financial Services",
    accountNumberLast4: "7733",
    accountType: "Auto Loan",
    balance: "8420.00",
    monthlyPayment: "285.00",
    collateralDescription: "2019 Toyota Camry",
    isSecured: true,
    status: "Open",
  },
  {
    id: "tl-003",
    creditorName: "Capital One Bank",
    accountNumberLast4: "9012",
    accountType: "Credit Card",
    balance: "4523.17",
    monthlyPayment: "125.00",
    isRevolving: true,
    isSecured: false,
    status: "Open",
  },
  {
    id: "tl-004",
    creditorName: "Chase Bank USA",
    accountNumberLast4: "3344",
    accountType: "Credit Card",
    balance: "2891.44",
    monthlyPayment: "75.00",
    isRevolving: true,
    isSecured: false,
    status: "Open",
  },
  {
    id: "tl-005",
    creditorName: "Internal Revenue Service",
    accountNumberLast4: "0000",
    accountType: "Tax Lien",
    balance: "3500.00",
    isPriority: true,
    priorityClass: "taxes",
    isSecured: false,
    status: "Open",
  },
  {
    id: "tl-006",
    creditorName: "Pacific Gas & Electric",
    accountNumberLast4: "5566",
    accountType: "Utility",
    balance: "0.00",
    isLease: true,
    status: "Open",
  },
  {
    id: "tl-007",
    creditorName: "Verizon Wireless",
    accountNumberLast4: "7788",
    accountType: "Telecom Lease",
    balance: "0.00",
    monthlyPayment: "89.99",
    isLease: true,
    status: "Open",
  },
  {
    id: "tl-008",
    creditorName: "Fresno County Child Support Services",
    accountNumberLast4: "1122",
    accountType: "Domestic Support",
    balance: "4200.00",
    isPriority: true,
    priorityClass: "domestic_support",
    isSecured: false,
    status: "Delinquent",
  },
];

export class SandboxCreditProvider implements CreditPullProvider {
  readonly name = "sandbox";

  async pullTriMerge(request: CreditPullRequest): Promise<CreditPullResult> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      pullId: crypto.randomUUID(),
      matterId: request.matterId,
      bureau: "tri_merge",
      tradelines: SANDBOX_TRADELINES,
      pulledAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}

/** CRS Credit API provider — swap in when CRS_CREDIT_API_KEY is configured */
export class CrsCreditProvider implements CreditPullProvider {
  readonly name = "crs";

  constructor(
    private apiKey: string,
    private baseUrl = "https://api.crscreditapi.com/api"
  ) {}

  async pullTriMerge(request: CreditPullRequest): Promise<CreditPullResult> {
    const response = await fetch(`${this.baseUrl}/v1/tri-merge/pull`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: request.debtorFirstName,
        lastName: request.debtorLastName,
        ssnLast4: request.ssnLast4,
        consentAt: request.consentTimestamp,
        externalReferenceId: request.matterId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`CRS credit pull failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      pullId: string;
      tradelines: CreditPullResult["tradelines"];
    };

    return {
      pullId: data.pullId,
      matterId: request.matterId,
      bureau: "tri_merge",
      tradelines: data.tradelines,
      pulledAt: new Date().toISOString(),
      provider: this.name,
    };
  }
}

export function createCreditProvider(): CreditPullProvider {
  const apiKey = process.env.CRS_CREDIT_API_KEY;
  if (apiKey) {
    return new CrsCreditProvider(apiKey, process.env.CRS_CREDIT_API_URL);
  }
  return new SandboxCreditProvider();
}
