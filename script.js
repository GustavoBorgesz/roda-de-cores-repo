const wheel = document.querySelector('#colorWheel');
const marker = document.querySelector('#wheelMarker');
const preview = document.querySelector('#colorPreview');
const colorName = document.querySelector('#colorName');
const hexInput = document.querySelector('#hexInput');
const rgbValue = document.querySelector('#rgbValue');
const hslValue = document.querySelector('#hslValue');
const hueBadge = document.querySelector('#hueBadge');
const satRange = document.querySelector('#satRange');
const lightRange = document.querySelector('#lightRange');
const satOut = document.querySelector('#satOut');
const lightOut = document.querySelector('#lightOut');
const palette = document.querySelector('#palette');
const harmonyTitle = document.querySelector('#harmonyTitle');
const harmonyDescription = document.querySelector('#harmonyDescription');
const toast = document.querySelector('#toast');
const savedSection = document.querySelector('#savedSection');
const savedPalettes = document.querySelector('#savedPalettes');
const savedCount = document.querySelector('#savedCount');

let hue = 217;
let saturation = 85;
let lightness = 55;
let mode = 'complementary';
let saved = JSON.parse(localStorage.getItem('chromatica-palettes') || '[]');

const harmonies = {
  complementary: { offsets: [0, 180], title: 'Complementar', description: 'Cores opostas na roda cromática. Excelente para criar contraste e destacar elementos.' },
  analogous: { offsets: [-45, -22, 0, 22, 45], title: 'Análoga', description: 'Cores vizinhas na roda. Cria transições suaves e uma sensação visual coesa.' },
  triadic: { offsets: [0, 120, 240], title: 'Triádica', description: 'Três cores igualmente espaçadas. Equilibra variedade, contraste e harmonia.' },
  split: { offsets: [0, 150, 210], title: 'Complementar dividida', description: 'Usa a cor base e as duas vizinhas de sua complementar, reduzindo o contraste extremo.' },
  tetradic: { offsets: [0, 90, 180, 270], title: 'Tetrádica', description: 'Quatro cores formando dois pares complementares. Rica e versátil para composições.' },
  monochromatic: { offsets: [0, 0, 0, 0, 0], title: 'Monocromática', description: 'Variações de luminosidade da mesma matiz. Ideal para interfaces consistentes e elegantes.' }
};

function normalizeHue(value) { return ((value % 360) + 360) % 360; }

function hslToRgb(h, s, l) {
  h = normalizeHue(h) / 360; s /= 100; l /= 100;
  const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q-p)*6*t; if (t < 1/2) return q; if (t < 2/3) return p + (q-p)*(2/3-t)*6; return p; };
  if (s === 0) { const v = Math.round(l*255); return [v,v,v]; }
  const q = l < .5 ? l*(1+s) : l+s-l*s;
  const p = 2*l-q;
  return [hue2rgb(p,q,h+1/3),hue2rgb(p,q,h),hue2rgb(p,q,h-1/3)].map(v => Math.round(v*255));
}

function rgbToHex(rgb) { return '#' + rgb.map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase(); }
function colorHsl(h, s=saturation, l=lightness) { return `hsl(${normalizeHue(h)} ${s}% ${l}%)`; }
function colorHex(h, s=saturation, l=lightness) { return rgbToHex(hslToRgb(h,s,l)); }

function getColorName(h) {
  const names = ['Vermelho','Laranja','Amarelo','Verde','Ciano','Azul','Violeta','Magenta'];
  return names[Math.floor((normalizeHue(h)+22.5)/45) % 8];
}

function updateMarker() {
  const size = wheel.clientWidth;
  const angle = (hue - 90) * Math.PI / 180;
  const radius = size * .39;
  const center = size / 2;
  marker.style.left = `${center + Math.cos(angle)*radius}px`;
  marker.style.top = `${center + Math.sin(angle)*radius}px`;
}

function render() {
  const rgb = hslToRgb(hue, saturation, lightness);
  const hex = rgbToHex(rgb);
  const cssColor = colorHsl(hue);
  preview.style.background = cssColor;
  colorName.textContent = getColorName(hue);
  hexInput.value = hex;
  rgbValue.textContent = rgb.join(', ');
  hslValue.textContent = `${Math.round(hue)}°, ${saturation}%, ${lightness}%`;
  hueBadge.textContent = `HUE ${Math.round(hue)}°`;
  satOut.textContent = `${saturation}%`;
  lightOut.textContent = `${lightness}%`;
  wheel.setAttribute('aria-valuenow', Math.round(hue));
  updateMarker();
  renderPalette();
}

function renderPalette() {
  const harmony = harmonies[mode];
  harmonyTitle.textContent = harmony.title;
  harmonyDescription.textContent = harmony.description;
  palette.innerHTML = '';

  const colors = harmony.offsets.map((offset, index) => {
    const h = normalizeHue(hue + offset);
    const l = mode === 'monochromatic' ? [25,40,55,70,85][index] : lightness;
    const s = mode === 'monochromatic' ? Math.max(25, saturation - index*8) : saturation;
    return { h, s, l, hex: colorHex(h,s,l) };
  });

  colors.forEach(({h,s,l,hex}) => {
    const swatch = document.createElement('button');
    swatch.className = 'swatch';
    swatch.style.background = colorHsl(h,s,l);
    swatch.innerHTML = `<span>${hex}<small>Copiar</small></span>`;
    swatch.setAttribute('aria-label', `Copiar ${hex}`);
    swatch.addEventListener('click', () => copyText(hex));
    palette.appendChild(swatch);
  });
}

function setHueFromPointer(event) {
  const rect = wheel.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width/2;
  const y = event.clientY - rect.top - rect.height/2;
  if (Math.hypot(x,y) > rect.width*.50 || Math.hypot(x,y) < rect.width*.19) return;
  hue = normalizeHue(Math.atan2(y,x)*180/Math.PI + 90);
  render();
}

function copyText(text) {
  if (!navigator.clipboard) { showToast('Copie manualmente: ' + text); return; }
  navigator.clipboard.writeText(text).then(() => showToast(`${text} copiado!`));
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800); }

function paletteColors() {
  return [...palette.querySelectorAll('.swatch')].map(s => s.textContent.split('Copiar')[0]);
}

function savePalette() {
  const colors = paletteColors();
  const item = { id: Date.now(), colors, harmony: harmonies[mode].title, created: new Date().toLocaleDateString('pt-BR') };
  saved.unshift(item);
  saved = saved.slice(0, 12);
  localStorage.setItem('chromatica-palettes', JSON.stringify(saved));
  renderSaved();
  showToast('Paleta salva!');
}

function renderSaved() {
  savedSection.hidden = saved.length === 0;
  savedCount.textContent = `${saved.length} ${saved.length === 1 ? 'paleta' : 'paletas'}`;
  savedPalettes.innerHTML = '';
  saved.forEach(item => {
    const card = document.createElement('article');
    card.className = 'saved-palette';
    const colors = document.createElement('div');
    colors.className = 'saved-colors';
    item.colors.forEach(hex => { const c = document.createElement('div'); c.style.background = hex; c.title = `Copiar ${hex}`; c.onclick = () => copyText(hex); colors.appendChild(c); });
    const meta = document.createElement('div');
    meta.className = 'saved-meta';
    meta.innerHTML = `<span>${item.harmony} • ${item.created}</span>`;
    const del = document.createElement('button'); del.className = 'delete-saved'; del.textContent = '×'; del.setAttribute('aria-label','Excluir paleta'); del.onclick = () => { saved = saved.filter(x => x.id !== item.id); localStorage.setItem('chromatica-palettes', JSON.stringify(saved)); renderSaved(); };
    meta.appendChild(del); card.append(colors,meta); savedPalettes.appendChild(card);
  });
}

function applyHex() {
  let value = hexInput.value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(value)) { showToast('HEX inválido'); return; }
  value = value.replace('#','');
  const r=parseInt(value.slice(0,2),16), g=parseInt(value.slice(2,4),16), b=parseInt(value.slice(4,6),16);
  const max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,l=(max+min)/2;
  let h=0,s=0,d=max-min;
  if(d){s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0));break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;}
  hue=h;saturation=Math.round(s*100);lightness=Math.round(l*100);satRange.value=saturation;lightRange.value=lightness;render();showToast('Cor aplicada!');
}

wheel.addEventListener('pointerdown', event => { setHueFromPointer(event); wheel.setPointerCapture(event.pointerId); wheel.addEventListener('pointermove', setHueFromPointer); });
wheel.addEventListener('pointerup', () => wheel.removeEventListener('pointermove', setHueFromPointer));
wheel.addEventListener('keydown', event => { if(['ArrowLeft','ArrowDown'].includes(event.key)){hue=normalizeHue(hue-2);render();} if(['ArrowRight','ArrowUp'].includes(event.key)){hue=normalizeHue(hue+2);render();} });
satRange.addEventListener('input', e => { saturation=+e.target.value; render(); });
lightRange.addEventListener('input', e => { lightness=+e.target.value; render(); });
document.querySelectorAll('#harmonyButtons button').forEach(button => button.addEventListener('click', () => { document.querySelector('#harmonyButtons .active').classList.remove('active'); button.classList.add('active'); mode=button.dataset.mode; renderPalette(); }));
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy==='rgb'?rgbValue.textContent:hslValue.textContent)));
document.querySelector('#applyHex').addEventListener('click', applyHex);
hexInput.addEventListener('keydown', e => { if(e.key==='Enter') applyHex(); });
document.querySelector('#randomBtn').addEventListener('click', () => { hue=Math.floor(Math.random()*360); saturation=60+Math.floor(Math.random()*35); lightness=45+Math.floor(Math.random()*25); satRange.value=saturation; lightRange.value=lightness; render(); });
document.querySelector('#saveBtn').addEventListener('click', savePalette);
document.querySelector('#copyPalette').addEventListener('click', () => copyText(paletteColors().join(', ')));
document.querySelector('#clearSaved').addEventListener('click', () => { saved=[]; localStorage.removeItem('chromatica-palettes'); renderSaved(); showToast('Paletas removidas'); });
document.querySelector('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('light'); document.querySelector('#themeToggle').textContent=document.body.classList.contains('light')?'☾':'☀'; });
window.addEventListener('resize', updateMarker);
render();
renderSaved();