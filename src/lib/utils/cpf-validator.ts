export function cpfValidator(value: string): boolean {
  if (!value) throw new Error("CPF é obrigatório");

  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 11) throw new Error("CPF deve conter 11 dígitos");

  if (/^(\d)\1{10}$/.test(digits)) throw new Error("CPF inválido");

  const nums = digits.split("").map((d) => Number(d));

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += nums[i] * (10 - i);
  }
  let rem = sum % 11;
  const dig1 = rem < 2 ? 0 : 11 - rem;
  if (dig1 !== nums[9]) throw new Error("CPF inválido");

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += nums[i] * (11 - i);
  }
  rem = sum % 11;
  const dig2 = rem < 2 ? 0 : 11 - rem;
  if (dig2 !== nums[10]) throw new Error("CPF inválido");

  return true;
}

export default cpfValidator;
