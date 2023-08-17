export function generateRandomCode(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
      const randomNum = Math.floor(Math.random() * 10);
      result += randomNum.toString();
  }
  return result;
}