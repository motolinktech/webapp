export function moneyMask(value: string) {
  let digits = value.replace(/\D/g, "");

  digits = digits.replace(/^0+/, "") || "0";

  digits = digits.padStart(3, "0");

  const integerPart = digits.slice(0, -2);
  const decimalPart = digits.slice(-2);

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${formattedInteger},${decimalPart}`;
}

export function clearMoneyMask(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "0.00";

  const padded = digits.padStart(3, "0");

  const reaisPart = padded.slice(0, -2).replace(/^0+/, "") || "0";
  const centsPart = padded.slice(-2);

  return `${reaisPart}.${centsPart}`;
}
