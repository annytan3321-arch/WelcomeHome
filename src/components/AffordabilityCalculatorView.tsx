import React, { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';

type Residency = 'Singapore Citizen' | 'Permanent Resident' | 'Foreigner';
type PropertyCount = '1st Property' | '2nd Property' | '3rd+ Property';
type CalcCategory = 'HDB / EC (Initial)' | 'Private Condo / Post-MOP EC / Landed';

function computeBsd(price: number): number {
  let remaining = price;
  let bsd = 0;
  const tiers: Array<[number, number]> = [
    [180000, 0.01],
    [180000, 0.02],
    [640000, 0.03],
    [500000, 0.04],
    [1500000, 0.05],
    [Infinity, 0.06],
  ];
  for (const [cap, rate] of tiers) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, cap);
    bsd += slice * rate;
    remaining -= slice;
  }
  return Math.round(bsd);
}

function computeAbsdRate(residency: Residency, count: PropertyCount): number {
  if (residency === 'Singapore Citizen') {
    if (count === '1st Property') return 0;
    if (count === '2nd Property') return 0.2;
    return 0.3;
  }
  if (residency === 'Permanent Resident') {
    if (count === '1st Property') return 0.05;
    if (count === '2nd Property') return 0.3;
    return 0.35;
  }
  return 0.6;
}

export const AffordabilityCalculatorView: React.FC = () => {
  const [mode, setMode] = useState<'buy' | 'rent'>('buy');

  // Buy State
  const [residency, setResidency] = useState<Residency>('Singapore Citizen');
  const [propertyCount, setPropertyCount] = useState<PropertyCount>('1st Property');
  const [category, setCategory] = useState<CalcCategory>('HDB / EC (Initial)');
  const [purchasePrice, setPurchasePrice] = useState(928000);
  const [ltvPct, setLtvPct] = useState(75);
  const [interestRate, setInterestRate] = useState(2.85);
  const [tenureYears, setTenureYears] = useState(25);
  const [grossIncome, setGrossIncome] = useState(11500);
  const [existingDebt, setExistingDebt] = useState(650);

  // Rent State
  const [monthlyIncome, setMonthlyIncome] = useState(6500);
  const [monthlyRent, setMonthlyRent] = useState(3800);
  const [roommates, setRoommates] = useState(2);
  const [utilitiesMonthly, setUtilitiesMonthly] = useState(260);
  const [leaseMonths, setLeaseMonths] = useState(12);

  const buyResults = useMemo(() => {
    const loanAmount = (purchasePrice * ltvPct) / 100;
    const downpayment = purchasePrice - loanAmount;
    const minCashDownpayment = purchasePrice * 0.05;
    const monthlyRate = interestRate / 100 / 12;
    const nPayments = Math.max(tenureYears * 12, 12);

    const monthlyMortgage =
      monthlyRate > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, nPayments))) /
          (Math.pow(1 + monthlyRate, nPayments) - 1)
        : loanAmount / nPayments;

    // Stress-test rate 4.0% often applied by MAS TDSR/MSR guidelines
    const stressRate = 0.04 / 12;
    const stressMortgage =
      (loanAmount * (stressRate * Math.pow(1 + stressRate, nPayments))) /
      (Math.pow(1 + stressRate, nPayments) - 1);

    const safeIncome = Math.max(grossIncome, 1);
    const msrPct = (stressMortgage / safeIncome) * 100;
    const tdsrPct = ((stressMortgage + existingDebt) / safeIncome) * 100;

    const bsd = computeBsd(purchasePrice);
    const absdRate = computeAbsdRate(residency, propertyCount);
    const absd = Math.round(purchasePrice * absdRate);

    return {
      loanAmount,
      downpayment,
      minCashDownpayment,
      monthlyMortgage,
      stressMortgage,
      msrPct,
      tdsrPct,
      bsd,
      absd,
      absdRate,
      totalUpfront: downpayment + bsd + absd,
    };
  }, [purchasePrice, ltvPct, interestRate, tenureYears, grossIncome, existingDebt, residency, propertyCount]);

  const rentResults = useMemo(() => {
    const perPersonRent = monthlyRent / Math.max(roommates, 1);
    const perPersonTotal = (monthlyRent + utilitiesMonthly) / Math.max(roommates, 1);
    const securityDeposit = leaseMonths >= 24 ? monthlyRent * 2 : monthlyRent;
    const irasStampDuty = Math.round(monthlyRent * leaseMonths * 0.004);
    const incomeSharePct = (perPersonTotal / Math.max(monthlyIncome, 1)) * 100;

    return {
      perPersonRent,
      perPersonTotal,
      securityDeposit,
      irasStampDuty,
      upfrontCash: monthlyRent + securityDeposit + irasStampDuty,
      incomeSharePct,
    };
  }, [monthlyIncome, monthlyRent, roommates, utilitiesMonthly, leaseMonths]);

  const msrApplies = category === 'HDB / EC (Initial)';
  const tdsrOk = buyResults.tdsrPct <= 55;
  const msrOk = !msrApplies || buyResults.msrPct <= 30;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-emerald-700">Singapore Financing & Lease Estimator · Indicative Simulation</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Affordability & Stamp Duty Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Estimate monthly mortgage repayments, MSR/TDSR ratios, IRAS BSD/ABSD, or split co-living rental costs.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 self-start">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'buy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Purchase & Mortgage
          </button>
          <button
            type="button"
            onClick={() => setMode('rent')}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === 'rent' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rent & Co-Living Split
          </button>
        </div>
      </div>

      {mode === 'buy' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Inputs */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-700" />
              Buyer Profile & Loan Parameters
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Residency Status</label>
                <select
                  value={residency}
                  onChange={(e) => setResidency(e.target.value as Residency)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>Singapore Citizen</option>
                  <option>Permanent Resident</option>
                  <option>Foreigner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Residential Property Count</label>
                <select
                  value={propertyCount}
                  onChange={(e) => setPropertyCount(e.target.value as PropertyCount)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>1st Property</option>
                  <option>2nd Property</option>
                  <option>3rd+ Property</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700">Property Rule Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CalcCategory)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option>HDB / EC (Initial)</option>
                  <option>Private Condo / Post-MOP EC / Landed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Purchase Price (S$)</label>
                <input
                  type="number"
                  min={200000}
                  step={10000}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Loan-to-Value (LTV %)</label>
                <input
                  type="number"
                  min={20}
                  max={75}
                  value={ltvPct}
                  onChange={(e) => setLtvPct(Math.min(75, Math.max(10, Number(e.target.value) || 0)))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Est. Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Loan Tenure (Years)</label>
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Math.min(30, Math.max(5, Number(e.target.value) || 5)))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Gross Monthly Household Income (S$)</label>
                <input
                  type="number"
                  min={1000}
                  step={250}
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Other Monthly Debt Obligations (S$)</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={existingDebt}
                  onChange={(e) => setExistingDebt(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500">Estimated Monthly Mortgage ({interestRate.toFixed(2)}%)</span>
                <div className="mt-0.5 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                  S${Math.round(buyResults.monthlyMortgage).toLocaleString()}/mo
                </div>
                <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                  Stress-tested @ 4.0% MAS floor: S${Math.round(buyResults.stressMortgage).toLocaleString()}/mo
                </p>
              </div>

              {/* TDSR & MSR Ratio Checks */}
              <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">TDSR Ratio (Cap: 55%)</span>
                    <span className={`font-mono font-semibold tabular-nums ${tdsrOk ? 'text-emerald-700' : 'text-red-700'}`}>
                      {buyResults.tdsrPct.toFixed(1)}% · {tdsrOk ? 'Within Limit' : 'Exceeds 55%'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${tdsrOk ? 'bg-emerald-600' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(buyResults.tdsrPct, 100)}%` }}
                    />
                  </div>
                </div>

                {msrApplies && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700">MSR Ratio for HDB/EC (Cap: 30%)</span>
                      <span className={`font-mono font-semibold tabular-nums ${msrOk ? 'text-emerald-700' : 'text-red-700'}`}>
                        {buyResults.msrPct.toFixed(1)}% · {msrOk ? 'Within Limit' : 'Exceeds 30%'}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full ${msrOk ? 'bg-emerald-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(buyResults.msrPct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upfront Breakdown */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Loan Amount ({ltvPct}% LTV)</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    S${Math.round(buyResults.loanAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Downpayment (Min 5% Cash: S${Math.round(buyResults.minCashDownpayment).toLocaleString()})</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    S${Math.round(buyResults.downpayment).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimated IRAS BSD</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    S${buyResults.bsd.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Estimated IRAS ABSD ({(buyResults.absdRate * 100).toFixed(0)}%)</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    S${buyResults.absd.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                  <span>Total Upfront Cash/CPF Required</span>
                  <span className="font-mono tabular-nums">S${Math.round(buyResults.totalUpfront).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Tenant & Co-Living Budget Inputs</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Your Monthly Take-Home Income (S$)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Total Unit Monthly Rent (S$)</label>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Number of Paying Tenants / Co-Tenants</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={roommates}
                  onChange={(e) => setRoommates(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Est. Utilities, WiFi & Aircon (S$/mo)</label>
                <input
                  type="number"
                  min={0}
                  value={utilitiesMonthly}
                  onChange={(e) => setUtilitiesMonthly(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Lease Duration</label>
                <select
                  value={leaseMonths}
                  onChange={(e) => setLeaseMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value={6}>6 Months (Co-Living / Exchange)</option>
                  <option value={12}>12 Months (1-Year Standard)</option>
                  <option value={24}>24 Months (2-Year Family/Expat)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div>
              <span className="text-xs text-slate-500">Your Share (Rent + Utilities)</span>
              <div className="mt-0.5 font-mono text-3xl font-semibold text-slate-900 tabular-nums">
                S${Math.round(rentResults.perPersonTotal).toLocaleString()}/mo
              </div>
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                {rentResults.incomeSharePct.toFixed(1)}% of monthly income ({rentResults.incomeSharePct <= 35 ? 'Comfortable <= 35%' : 'Above 35% guideline'})
              </p>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Base Rent per Person</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  S${Math.round(rentResults.perPersonRent).toLocaleString()}/mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unit Security Deposit ({leaseMonths >= 24 ? '2 mos' : '1 mo'})</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  S${rentResults.securityDeposit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IRAS Tenancy Stamp Duty (0.4% total lease)</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  S${rentResults.irasStampDuty.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                <span>Total Unit Upfront Move-In Cash</span>
                <span className="font-mono tabular-nums">S${rentResults.upfrontCash.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
        <p>
          <strong>Financial Disclaimer:</strong> Figures are indicative simulations for budgeting convenience only and do not constitute licensed financial advice, bank In-Principle Approval (IPA), or official IRAS tax assessment. Verify final eligibility via HDB Flat Portal, IRAS myTax Portal, and MAS-regulated lenders.
        </p>
      </div>
    </div>
  );
};
