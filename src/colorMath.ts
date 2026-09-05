export interface HarmonyConfig { o: number[]; d: string }

export const harmonies: Record<string, HarmonyConfig> = {
  complementary: { o: [0, 180], d: 'Cores opostas na roda cromática. Excelente para criar contraste e destacar elementos.' },
  analogous: { o: [-45, -22, 0, 22, 45], d: 'Cores próximas criam transições suaves e naturalmente harmoniosas.' },
  triadic: { o: [0, 120, 240], d: 'Três cores igualmente espaçadas para uma composição vibrante e equilibrada.' },
  split: { o: [0, 150, 210], d: 'Uma alternativa à complementar, com contraste mais equilibrado.' },
  tetradic: { o: [0, 90, 180, 270], d: 'Quatro cores para paletas ricas e expressivas.' },
  monochromatic: { o: [0, 0, 0, 0, 0], d: 'Variações de luminosidade da mesma matiz para uma paleta consistente.' }
};

export function norm(h: number): number {
  return ((h % 360) + 360) % 360;
}

export function hsl(h: number, s: number, l: number): string {
  return 'hsl(' + norm(h) + ' ' + s + '% ' + l + '%)';
}

export function rgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r, g, b].map(v => Math.round((v + m) * 255)) as [number, number, number];
}

export function toHex(a: number[]): string {
  return '#' + a.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexToHsl(v: string): { h: number; s: number; l: number } {
  const matches = v.match(/[a-f\d]{2}/gi);
  if (!matches || matches.length < 3) return { h: 0, s: 0, l: 0 };
  const [r, g, b] = matches.map(x => parseInt(x, 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  if (d) {
    if (mx === r) h = 60 * ((g - b) / d % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: norm(Math.round(h)), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const HUE_NAMES = ['Vermelho', 'Laranja', 'Amarelo', 'Verde-limão', 'Verde', 'Turquesa', 'Ciano', 'Azul', 'Violeta', 'Magenta', 'Rosa', 'Vermelho'];

export function colorName(h: number): string {
  return HUE_NAMES[Math.floor(norm(h) / 30)];
}

export function lum(hexColor: string): number {
  const matches = hexColor.match(/[a-f\d]{2}/gi);
  if (!matches || matches.length < 3) return 0;
  const a = matches.map(x => parseInt(x, 16) / 255).map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  return .2126 * a[0] + .7152 * a[1] + .0722 * a[2];
}

export function ratio(a: string, b: string): number {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

export type BlindType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

const BLIND_MATRICES: Record<BlindType, number[][]> = {
  protanopia: [[.567, .433, 0], [.558, .442, 0], [0, .242, .758]],
  deuteranopia: [[.625, .375, 0], [.70, .30, 0], [0, .30, .70]],
  tritanopia: [[.95, .05, 0], [0, .433, .567], [0, .475, .525]],
  achromatopsia: [[.299, .587, .114], [.299, .587, .114], [.299, .587, .114]]
};

export function simulateBlindness(rgbv: number[], type: BlindType): number[] {
  const m = BLIND_MATRICES[type];
  return m.map(row => Math.round(row.reduce((s, v, i) => s + v * rgbv[i], 0))).map(v => Math.max(0, Math.min(255, v)));
}
