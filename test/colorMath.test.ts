import { describe, it, expect } from 'vitest';
import { norm, hsl, rgb, toHex, hexToHsl, colorName, ratio, lum, simulateBlindness, harmonies } from '../src/colorMath';

describe('norm', () => {
  it('mantém valores já dentro de 0-360', () => {
    expect(norm(180)).toBe(180);
    expect(norm(0)).toBe(0);
  });
  it('envolve valores negativos', () => {
    expect(norm(-10)).toBe(350);
    expect(norm(-370)).toBe(350);
  });
  it('envolve valores acima de 360', () => {
    expect(norm(370)).toBe(10);
    expect(norm(720)).toBe(0);
  });
});

describe('hsl', () => {
  it('formata a string CSS hsl() corretamente', () => {
    expect(hsl(217, 85, 55)).toBe('hsl(217 85% 55%)');
  });
  it('normaliza a matiz antes de formatar', () => {
    expect(hsl(-10, 50, 50)).toBe('hsl(350 50% 50%)');
  });
});

describe('rgb', () => {
  it('converte azul puro (217°, 85%, 55%) de forma consistente com toHex', () => {
    const [r, g, b] = rgb(217, 85, 55);
    expect(toHex([r, g, b])).toBe('#2B75EE');
  });
  it('vermelho puro (0°, 100%, 50%) vira #FF0000', () => {
    expect(toHex(rgb(0, 100, 50))).toBe('#FF0000');
  });
  it('luminosidade 0 sempre resulta em preto, independente da matiz/saturação', () => {
    expect(toHex(rgb(217, 85, 0))).toBe('#000000');
  });
  it('luminosidade 100 sempre resulta em branco', () => {
    expect(toHex(rgb(90, 60, 100))).toBe('#FFFFFF');
  });
});

describe('toHex', () => {
  it('preenche com zero à esquerda e usa maiúsculas', () => {
    expect(toHex([0, 5, 255])).toBe('#0005FF');
  });
});

describe('hexToHsl', () => {
  it('converte branco corretamente', () => {
    expect(hexToHsl('#FFFFFF')).toEqual({ h: 0, s: 0, l: 100 });
  });
  it('converte preto corretamente', () => {
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });
  it('aceita hex sem o #', () => {
    expect(hexToHsl('FF0000').h).toBe(0);
  });
  it('faz ida e volta (hsl -> hex -> hsl) preservando a matiz aproximadamente', () => {
    const original = { h: 217, s: 85, l: 55 };
    const hex = toHex(rgb(original.h, original.s, original.l));
    const back = hexToHsl(hex);
    expect(back.h).toBeGreaterThanOrEqual(original.h - 1);
    expect(back.h).toBeLessThanOrEqual(original.h + 1);
  });
});

describe('colorName', () => {
  it('nomeia vermelho perto de 0°', () => {
    expect(colorName(0)).toBe('Vermelho');
  });
  it('nomeia azul perto de 210°', () => {
    expect(colorName(217)).toBe('Azul');
  });
  it('volta pra vermelho perto de 360°', () => {
    expect(colorName(355)).toBe('Vermelho');
  });
});

describe('lum e ratio (contraste WCAG)', () => {
  it('branco tem luminância relativa 1', () => {
    expect(lum('#FFFFFF')).toBeCloseTo(1, 5);
  });
  it('preto tem luminância relativa 0', () => {
    expect(lum('#000000')).toBeCloseTo(0, 5);
  });
  it('contraste entre preto e branco é 21:1 (o máximo possível)', () => {
    expect(ratio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('contraste de uma cor com ela mesma é 1:1', () => {
    expect(ratio('#3266EA', '#3266EA')).toBeCloseTo(1, 5);
  });
  it('é simétrico (ordem dos argumentos não importa)', () => {
    expect(ratio('#3266EA', '#FFFFFF')).toBeCloseTo(ratio('#FFFFFF', '#3266EA'), 5);
  });
});

describe('simulateBlindness', () => {
  it('retorna um RGB válido (0-255) para cada tipo', () => {
    const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
    types.forEach(t => {
      const result = simulateBlindness([50, 120, 220], t);
      result.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      });
    });
  });
  it('acromatopsia produz um cinza (R, G e B aproximadamente iguais)', () => {
    const [r, g, b] = simulateBlindness([220, 60, 60], 'achromatopsia');
    expect(Math.abs(r - g)).toBeLessThanOrEqual(1);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(1);
  });
});

describe('harmonies', () => {
  it('complementar tem exatamente 2 cores opostas (180°)', () => {
    expect(harmonies.complementary.o).toEqual([0, 180]);
  });
  it('tetrádica tem 4 cores igualmente espaçadas (90° cada)', () => {
    expect(harmonies.tetradic.o).toEqual([0, 90, 180, 270]);
  });
  it('toda harmonia (exceto monocromática) tem offsets únicos', () => {
    Object.entries(harmonies).forEach(([key, h]) => {
      if (key === 'monochromatic') return;
      const unique = new Set(h.o);
      expect(unique.size).toBe(h.o.length);
    });
  });
});
