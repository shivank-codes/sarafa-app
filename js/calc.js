export function lineTotal({ weight, ratePerGram, makingPaise }) {
  return Math.round(weight * ratePerGram) + Math.round(makingPaise);
}

export function billTotal(lines) {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}
