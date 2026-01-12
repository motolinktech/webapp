export function dateMask(value: string): string {
  const numbers = value.replace(/\D/g, '');
  
  let masked = '';
  
  if (numbers.length > 0) {
    masked = numbers.substring(0, 2);
  }
  if (numbers.length >= 3) {
    masked += '/' + numbers.substring(2, 4);
  }
  if (numbers.length >= 5) {
    masked += '/' + numbers.substring(4, 8);
  }
  
  return masked;
}