import { harmonies, norm, hsl, rgb, toHex, hexToHsl, colorName, ratio, simulateBlindness, BlindType } from './colorMath.js';

interface ColorState { h: number; s: number; l: number; m: string }
interface SavedPalette { id: number; colors: string[]; harmony: string; date: string }

function $<T extends Element = HTMLElement>(s: string): T {
  return document.querySelector(s) as T;
}
function $$<T extends Element = HTMLElement>(s: string): T[] {
  return [...document.querySelectorAll(s)] as T[];
}

const wheel = $<HTMLDivElement>('#wheel'), marker = $<HTMLElement>('#marker'), overlay = $<SVGSVGElement>('#harmonyOverlay'),
  sat = $<HTMLInputElement>('#sat'), light = $<HTMLInputElement>('#light'), hex = $<HTMLInputElement>('#hex'),
  palette = $<HTMLElement>('#palette'), toast = $<HTMLElement>('#toast');

let hue = 217, saturation = 85, lightness = 55, mode = 'complementary';
// Nomeado undoStack/redoStack (não "history") de propósito: no script.js original,
// "history" sombreava o window.history do navegador e quebrava a função share(),
// que chamava history.replaceState(...) esperando a API do navegador.
let undoStack: ColorState[] = [], redoStack: ColorState[] = [];
let saved: SavedPalette[] = JSON.parse(localStorage.getItem('chromatica-palettes') || '[]');

function snapshot(): ColorState { return { h: hue, s: saturation, l: lightness, m: mode }; }
function applySnapshot(x: ColorState): void { hue = x.h; saturation = x.s; lightness = x.l; mode = x.m; }

function push(): void {
  undoStack.push(snapshot());
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
}
function undo(): void {
  if (!undoStack.length) return;
  const x = undoStack.pop()!;
  redoStack.push(snapshot());
  applySnapshot(x);
  syncMode(); render();
}
function redo(): void {
  if (!redoStack.length) return;
  const x = redoStack.pop()!;
  undoStack.push(snapshot());
  applySnapshot(x);
  syncMode(); render();
}

function syncMode(): void {
  $$('#modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

function markerPos(): void {
  const a = (hue - 90) * Math.PI / 180, r = wheel.clientWidth * .39, c = wheel.clientWidth / 2;
  marker.style.left = c + Math.cos(a) * r + 'px';
  marker.style.top = c + Math.sin(a) * r + 'px';
  wheel.setAttribute('aria-valuenow', String(Math.round(hue)));
}

const svgNS = 'http://www.w3.org/2000/svg';

function drawHarmonyOverlay(): void {
  const size = wheel.clientWidth, c = size / 2, r = size * .39;
  overlay.setAttribute('width', String(size));
  overlay.setAttribute('height', String(size));
  overlay.innerHTML = '';
  if (mode === 'monochromatic') return;
  const offsets = harmonies[mode].o;
  const points = offsets.map(o => {
    const a = (norm(hue + o) - 90) * Math.PI / 180;
    return { x: c + Math.cos(a) * r, y: c + Math.sin(a) * r };
  });
  if (points.length === 2) {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', String(points[0].x)); line.setAttribute('y1', String(points[0].y));
    line.setAttribute('x2', String(points[1].x)); line.setAttribute('y2', String(points[1].y));
    line.setAttribute('stroke', 'rgba(13,15,20,.85)'); line.setAttribute('stroke-width', '2.5');
    overlay.appendChild(line);
  } else {
    const shape = document.createElementNS(svgNS, mode === 'analogous' ? 'polyline' : 'polygon');
    shape.setAttribute('points', points.map(p => p.x + ',' + p.y).join(' '));
    shape.setAttribute('fill', 'none');
    shape.setAttribute('stroke', 'rgba(13,15,20,.85)'); shape.setAttribute('stroke-width', '2.5');
    overlay.appendChild(shape);
  }
  points.forEach((p, i) => {
    if (i === 0) return;
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', String(p.x)); dot.setAttribute('cy', String(p.y)); dot.setAttribute('r', '7');
    dot.setAttribute('fill', '#fff'); dot.setAttribute('stroke', 'rgba(13,15,20,.85)'); dot.setAttribute('stroke-width', '2.5');
    overlay.appendChild(dot);
  });
}

function colors(): { h: number; s: number; l: number }[] {
  if (mode === 'monochromatic') return [22, 38, 55, 72, 88].map(l => ({ h: hue, s: saturation, l }));
  return harmonies[mode].o.map(o => ({ h: norm(hue + o), s: saturation, l: lightness }));
}

function renderPalette(): void {
  palette.querySelectorAll('.swatch').forEach(x => x.remove());
  colors().forEach(c => {
    const v = toHex(rgb(c.h, c.s, c.l));
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.background = hsl(c.h, c.s, c.l);
    b.innerHTML = '<span>' + v + '<small>Copiar</small></span>';
    b.onclick = () => copy(v);
    palette.appendChild(b);
  });
  $('#description').textContent = harmonies[mode].d;
  drawHarmonyOverlay();
}

function render(): void {
  sat.value = String(saturation); light.value = String(lightness);
  $('#satOut').textContent = saturation + '%'; $('#lightOut').textContent = lightness + '%';
  const a = rgb(hue, saturation, lightness), v = toHex(a);
  hex.value = v;
  $('#rgb').textContent = a.join(', ');
  $('#hsl').textContent = Math.round(hue) + '°, ' + saturation + '%, ' + lightness + '%';
  $('#name').textContent = colorName(hue);
  markerPos();
  renderPalette();
}

function setPointer(e: PointerEvent): void {
  const r = wheel.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2, d = Math.hypot(x, y);
  if (d < r.width * .19 || d > r.width * .52) return;
  hue = norm(Math.atan2(y, x) * 180 / Math.PI + 90);
  render();
}

function copy(t: string): void {
  navigator.clipboard?.writeText(t).then(() => show(t + ' copiado!')).catch(() => show('Copie manualmente: ' + t));
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function show(t: string): void {
  toast.textContent = t;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
}

function paletteValues(): string[] {
  return colors().map(c => toHex(rgb(c.h, c.s, c.l)));
}

function save(): void {
  saved.unshift({ id: Date.now(), colors: paletteValues(), harmony: mode, date: new Date().toLocaleDateString('pt-BR') });
  saved = saved.slice(0, 12);
  localStorage.setItem('chromatica-palettes', JSON.stringify(saved));
  renderSaved();
  show('Paleta salva!');
}

function renderSaved(): void {
  const box = $('#saved');
  box.innerHTML = '';
  $('#count').textContent = saved.length ? String(saved.length) : '';
  $<HTMLElement>('#empty').hidden = !!saved.length;
  saved.forEach(p => {
    const card = document.createElement('article');
    card.className = 'saved-card';
    const cs = document.createElement('div');
    cs.className = 'saved-colors';
    p.colors.forEach(v => {
      const b = document.createElement('button');
      b.style.background = v;
      b.onclick = () => copy(v);
      cs.appendChild(b);
    });
    const meta = document.createElement('div');
    meta.className = 'saved-meta';
    meta.innerHTML = '<span>' + p.harmony + ' • ' + p.date + '</span>';
    const del = document.createElement('button');
    del.textContent = '×';
    del.onclick = () => {
      saved = saved.filter(x => x.id !== p.id);
      localStorage.setItem('chromatica-palettes', JSON.stringify(saved));
      renderSaved();
    };
    meta.appendChild(del);
    card.append(cs, meta);
    box.appendChild(card);
  });
}

wheel.addEventListener('pointerdown', (e: PointerEvent) => {
  push();
  setPointer(e);
  wheel.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent) => setPointer(ev);
  wheel.addEventListener('pointermove', move);
  wheel.addEventListener('pointerup', () => wheel.removeEventListener('pointermove', move), { once: true });
  wheel.addEventListener('pointercancel', () => wheel.removeEventListener('pointermove', move), { once: true });
});
wheel.addEventListener('keydown', (e: KeyboardEvent) => {
  if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
    push();
    hue = norm(hue + (e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -2 : 2));
    render();
  }
});

sat.onchange = light.onchange = push;
sat.oninput = (e: Event) => { saturation = +(e.target as HTMLInputElement).value; render(); };
light.oninput = (e: Event) => { lightness = +(e.target as HTMLInputElement).value; render(); };

$<HTMLButtonElement>('#apply').onclick = () => {
  let v = hex.value.trim();
  if (!/^#?[\da-f]{6}$/i.test(v)) { show('HEX inválido'); return; }
  push();
  if (v[0] !== '#') v = '#' + v;
  const c = hexToHsl(v);
  hue = c.h; saturation = c.s; lightness = c.l;
  render();
  show('Cor aplicada!');
};
hex.onkeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') $<HTMLButtonElement>('#apply').click(); };

$$<HTMLButtonElement>('#modes button').forEach(b => b.onclick = () => {
  if (b.dataset.mode !== mode) {
    push();
    mode = b.dataset.mode!;
    syncMode();
    renderPalette();
  }
});

$$<HTMLButtonElement>('[data-copy]').forEach(b => b.onclick = () => copy(b.dataset.copy === 'rgb' ? $('#rgb').textContent! : $('#hsl').textContent!));

$<HTMLButtonElement>('#random').onclick = () => {
  push();
  hue = Math.random() * 360;
  saturation = 60 + Math.floor(Math.random() * 35);
  lightness = 45 + Math.floor(Math.random() * 25);
  render();
};

$<HTMLButtonElement>('#copyPalette').onclick = () => copy(paletteValues().join(', '));
$<HTMLButtonElement>('#save').onclick = save;

$<HTMLButtonElement>('#theme').onclick = () => {
  document.body.classList.toggle('light');
  $<HTMLButtonElement>('#theme').textContent = document.body.classList.contains('light') ? '☾' : '☀';
};

$<HTMLButtonElement>('#undo').onclick = undo;
$<HTMLButtonElement>('#redo').onclick = redo;
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && (document.activeElement as HTMLElement)?.tagName !== 'INPUT') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  }
});

$$<HTMLButtonElement>('.tab').forEach(b => b.onclick = () => {
  $$('.tab').forEach(x => x.classList.toggle('active', x === b));
  $<HTMLElement>('#wheelTab').hidden = b.dataset.tab !== 'wheel';
  $<HTMLElement>('#imageTab').hidden = b.dataset.tab !== 'image';
});

const drop = $<HTMLElement>('#drop'), input = $<HTMLInputElement>('#image'), canvas = $<HTMLCanvasElement>('#canvas'),
  imageColors = $<HTMLElement>('#imageColors'), imgPreview = $<HTMLImageElement>('#imgPreview'), changeImage = $<HTMLButtonElement>('#changeImage');

function imageFile(f: File | undefined): void {
  if (!f?.type.startsWith('image/')) { show('Escolha uma imagem'); return; }
  const rd = new FileReader();
  rd.onload = () => {
    imgPreview.src = rd.result as string;
    imgPreview.hidden = false;
    drop.hidden = true;
    changeImage.hidden = false;
    const im = new Image();
    im.onload = () => extract(im);
    im.src = rd.result as string;
  };
  rd.readAsDataURL(f);
}
changeImage.onclick = () => input.click();

function extract(im: HTMLImageElement): void {
  const n = 70, ctx = canvas.getContext('2d')!;
  canvas.width = canvas.height = n;
  ctx.drawImage(im, 0, 0, n, n);
  const d = ctx.getImageData(0, 0, n, n).data;
  const map = new Map<string, number>();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const k = [d[i], d[i + 1], d[i + 2]].map(x => Math.round(x / 32) * 32).join(',');
    map.set(k, (map.get(k) || 0) + 1);
  }
  imageColors.innerHTML = '';
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([k]) => {
    const v = toHex(k.split(',').map(Number));
    const b = document.createElement('button');
    b.style.background = v;
    b.title = 'Usar ' + v;
    b.onclick = () => {
      push();
      const c = hexToHsl(v);
      hue = c.h; saturation = c.s; lightness = c.l;
      render();
      show('Cor aplicada!');
    };
    imageColors.appendChild(b);
  });
}

drop.onclick = () => input.click();
drop.ondragover = (e: DragEvent) => { e.preventDefault(); drop.classList.add('drag'); };
drop.ondragleave = () => drop.classList.remove('drag');
drop.ondrop = (e: DragEvent) => { e.preventDefault(); drop.classList.remove('drag'); imageFile(e.dataTransfer?.files[0]); };
input.onchange = () => imageFile(input.files?.[0]);

$<HTMLButtonElement>('#favorites').onclick = () => { $<HTMLElement>('#drawer').hidden = false; $<HTMLElement>('#scrim').hidden = false; };
function closeDrawer(): void { $<HTMLElement>('#drawer').hidden = true; $<HTMLElement>('#scrim').hidden = true; }
$<HTMLButtonElement>('#close').onclick = closeDrawer;
$<HTMLButtonElement>('#clear').onclick = () => {
  saved = [];
  localStorage.removeItem('chromatica-palettes');
  renderSaved();
  show('Paletas removidas');
};
window.onresize = () => { markerPos(); drawHarmonyOverlay(); };

function openTool(title: string): void {
  $('#toolModalTitle').textContent = title;
  $<HTMLElement>('#toolModal').hidden = false;
  $<HTMLElement>('#scrim').hidden = false;
}
function closeTool(): void {
  $<HTMLElement>('#toolModal').hidden = true;
  $<HTMLElement>('#scrim').hidden = true;
}
function closeOverlays(): void { closeDrawer(); closeTool(); }
$<HTMLButtonElement>('#closeTool').onclick = closeTool;
$<HTMLElement>('#scrim').onclick = closeOverlays;
window.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Escape') closeOverlays(); });

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportCSS(): void {
  const c = paletteValues();
  const text = ':root {\n' + c.map((v, i) => '  --chromatica-' + (i + 1) + ': ' + v + ';').join('\n') +
    '\n}\n\n.palette {\n  background: linear-gradient(90deg, ' + c.join(', ') + ');\n}\n';
  downloadBlob('chromatica-palette.css', new Blob([text], { type: 'text/css' }));
  show('CSS exportado!');
}

function exportPNG(): void {
  const c = paletteValues(), can = document.createElement('canvas'), ctx = can.getContext('2d')!, w = 1600, h = 520;
  can.width = w; can.height = h;
  ctx.fillStyle = '#111318'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.font = '700 42px Arial'; ctx.textAlign = 'left';
  ctx.fillText('CHROMATICA — PALETA DE CORES', 70, 85);
  const y = 150, sw = w / c.length;
  c.forEach((v, i) => {
    const x = i * sw;
    ctx.fillStyle = v; ctx.fillRect(x, y, sw, 230);
    ctx.fillStyle = '#fff'; ctx.font = '700 26px Arial'; ctx.textAlign = 'center';
    ctx.fillText(v, x + sw / 2, 430);
  });
  can.toBlob(b => {
    if (b) { downloadBlob('chromatica-palette.png', b); show('Paleta baixada em PNG!'); }
    else show('Não foi possível gerar o PNG');
  }, 'image/png');
}

function gradient(): void {
  const c = paletteValues(), css = 'linear-gradient(135deg, ' + c.join(', ') + ')';
  openTool('Gradiente automático');
  const body = $('#toolModalBody');
  body.innerHTML = '<div class="gradient-preview"></div><div class="gradient-value" aria-label="Valor CSS do gradiente">' + css +
    '</div><button class="action-btn png-btn" id="copyGradient" style="margin-top:10px;width:100%">Copiar CSS</button>';
  (body.querySelector('.gradient-preview') as HTMLElement).style.background = 'linear-gradient(135deg,' + c.join(',') + ')';
  (body.querySelector('#copyGradient') as HTMLButtonElement).onclick = () => { copy(css); show('Gradiente copiado!'); };
}

function contrast(): void {
  const c = paletteValues();
  openTool('Análise WCAG');
  let rows = '';
  for (let i = 0; i < c.length - 1; i++) {
    const r = ratio(c[i], c[i + 1]);
    const level = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'Falha';
    rows += '<div class="contrast-row"><span>' + c[i] + ' × ' + c[i + 1] + '</span><strong>' + r.toFixed(2) + ':1 <span class="badge">' + level + '</span></strong></div>';
  }
  const base = hex.value, white = ratio(base, '#FFFFFF'), black = ratio(base, '#000000');
  const text = white >= black ? '#FFFFFF' : '#000000', best = Math.max(white, black);
  $('#toolModalBody').innerHTML = rows + '<div class="recommendation">Para <b>' + base + '</b>, a melhor cor para texto é <b>' + text +
    '</b> (' + best.toFixed(2) + ':1) — ' + (best >= 7 ? 'AAA' : best >= 4.5 ? 'AA' : 'baixo contraste') + '.</div>';
}

function share(): void {
  const p = new URLSearchParams({ c: paletteValues().map(x => x.slice(1)).join(','), m: mode });
  const u = location.origin + location.pathname + '?' + p.toString();
  if (navigator.share) navigator.share({ title: 'Chromatica Palette', url: u }).catch(() => {});
  else copy(u);
  window.history.replaceState({}, '', u);
  show('Link compartilhável copiado!');
}

function loadShared(): void {
  const q = new URLSearchParams(location.search), c = q.get('c'), m = q.get('m');
  if (m && harmonies[m]) { mode = m; syncMode(); }
  if (c) {
    const arr = c.split(',');
    if (arr[0] && /^[\da-f]{6}$/i.test(arr[0])) {
      const parsed = hexToHsl('#' + arr[0]);
      hue = parsed.h; saturation = parsed.s; lightness = parsed.l;
    }
    render();
    show('Paleta compartilhada carregada!');
  }
}

$<HTMLButtonElement>('#exportCss').onclick = exportCSS;
$<HTMLButtonElement>('#exportPng').onclick = exportPNG;
$<HTMLButtonElement>('#gradientBtn').onclick = gradient;
$<HTMLButtonElement>('#contrastBtn').onclick = contrast;
$<HTMLButtonElement>('#share').onclick = share;

function uiPreview(): void {
  const c = paletteValues();
  openTool('Preview UI');
  const bg = c[0], surface = c[1] || c[0], primary = c[2] || c[0];
  const text = ratio(bg, '#fff') >= ratio(bg, '#000') ? '#fff' : '#000';
  $('#toolModalBody').innerHTML = '<div class="ui-preview" style="--preview-bg:' + bg + ';--preview-surface:' + surface +
    ';--preview-primary:' + primary + ';--preview-text:' + text + '"><div class="ui-nav"><b>CHROMATICA UI</b><span>Home &nbsp; Projetos</span></div>' +
    '<div class="ui-card"><h3>Preview da sua paleta</h3><p>Veja como as cores podem funcionar em uma interface real.</p><button>Ação principal</button></div></div>' +
    '<p class="recommendation">Tokens sugeridos: <b>Background ' + bg + '</b> · Surface ' + surface + ' · Primary ' + primary + ' · Text ' + text + '</p>';
}

function simulateBlind(): void {
  const c = paletteValues();
  const types: BlindType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
  const labels: Record<BlindType, string> = { protanopia: 'Protanopia', deuteranopia: 'Deuteranopia', tritanopia: 'Tritanopia', achromatopsia: 'Acromatopsia' };
  openTool('Simulador de percepção de cores');
  $('#toolModalBody').innerHTML = '<div class="blind-grid">' + types.map(t => '<div class="blind-card"><span>' + labels[t] +
    '</span><div class="blind-strip">' + c.map(v => '<i style="background:' + toHex(simulateBlindness(v.match(/[a-f\d]{2}/gi)!.map(x => parseInt(x, 16)), t)) + '"></i>').join('') +
    '</div></div>').join('') + '</div><div class="blind-note">Simulação aproximada para ajudar a avaliar diferenciação visual. Não substitui testes de acessibilidade com usuários.</div>';
}

$<HTMLButtonElement>('#previewBtn').onclick = uiPreview;
$<HTMLButtonElement>('#blindBtn').onclick = simulateBlind;

render();
renderSaved();
loadShared();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
