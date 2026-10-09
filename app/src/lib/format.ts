export function rand(cents: number): string {
  return "R" + (cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// VAT-inclusive breakdown: how much of a total is VAT, given a rate like 15.
export function vatPortion(totalCents: number, rate = 15): number {
  return Math.round((totalCents * rate) / (100 + rate));
}
