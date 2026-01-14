export function moneyMask(value: string) {
  // Remove everything except digits
  let digits = value.replace(/\D/g, "");

  // Remove leading zeros
  digits = digits.replace(/^0+/, "") || "0";

  // Pad with zeros if less than 3 digits (for cents)
  digits = digits.padStart(3, "0");

  // Split into integer and decimal parts
  const integerPart = digits.slice(0, -2);
  const decimalPart = digits.slice(-2);

  // Format integer part with thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${formattedInteger},${decimalPart}`;
}

export function clearMoneyMask(value: string): number {
  // Remove "R$ " prefix and all non-digit characters except the last comma
  const digits = value.replace(/\D/g, "");

  if (!digits) return 0;

  // Convert to number (cents to reais)
  return Number(digits) / 100;
}
