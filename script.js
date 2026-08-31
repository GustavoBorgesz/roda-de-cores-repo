const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const wheel=$('#wheel'),marker=$('#marker'),overlay=$('#harmonyOverlay'),sat=$('#sat'),light=$('#light'),hex=$('#hex'),palette=$('#palette'),toast=$('#toast');
let hue=217,saturation=85,lightness=55,mode='complementary',history=[],future=[],saved=JSON.parse(localStorage.getItem('chromatica-palettes')||'[]');
const harmonies={complementary:{o:[0,180],d:'Cores opostas na roda cromática. Excelente para criar contraste e destacar elementos.'},analogous:{o:[-45,-22,0,22,45],d:'Cores próximas criam transições suaves e naturalmente harmoniosas.'},triadic:{o:[0,120,240],d:'Três cores igualmente espaçadas para uma composição vibrante e equilibrada.'},split:{o:[0,150,210],d:'Uma alternativa à complementar, com contraste mais equilibrado.'},tetradic:{o:[0,90,180,270],d:'Quatro cores para paletas ricas e expressivas.'},monochromatic:{o:[0,0,0,0,0],d:'Variações de luminosidade da mesma matiz para uma paleta consistente.'}};
const norm=h=>((h%360)+360)%360;
function hsl(h,s=saturation,l=lightness){return 'hsl('+norm(h)+' '+s+'% '+l+'%)'}
function rgb(h,s=saturation,l=lightness){s/=100;l/=100;let c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return[r,g,b].map(v=>Math.round((v+m)*255))}
function toHex(a){return '#'+a.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()}
function hexToHsl(v){let [r,g,b]=v.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0,l=(mx+mn)/2,s=d?d/(1-Math.abs(2*l-1)):0;if(d){if(mx===r)h=60*((g-b)/d%6);else if(mx===g)h=60*((b-r)/d+2);else h=60*((r-g)/d+4)}return{h:norm(Math.round(h)),s:Math.round(s*100),l:Math.round(l*100)}}
function name(h){return['Vermelho','Laranja','Amarelo','Verde-limão','Verde','Turquesa','Ciano','Azul','Violeta','Magenta','Rosa','Vermelho'][Math.floor(norm(h)/30)]}
function push(){history.push({h:hue,s:saturation,l:lightness,m:mode});if(history.length>50)history.shift();future=[]}
function restore(x){if(!x)return;future.push({h:hue,s:saturation,l:lightness,m:mode});({h:hue,s:saturation,l:lightness,m:mode}=x);syncMode();render()}
function undo(){if(!history.length)return;let x=history.pop();future.push({h:hue,s:saturation,l:lightness,m:mode});({h:hue,s:saturation,l:lightness,m:mode}=x);syncMode();render()}
function redo(){if(!future.length)return;let x=future.pop();history.push({h:hue,s:saturation,l:lightness,m:mode});({h:hue,s:saturation,l:lightness,m:mode}=x);syncMode();render()}
function syncMode(){$$('#modes button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode))}
function markerPos(){let a=(hue-90)*Math.PI/180,r=wheel.clientWidth*.39,c=wheel.clientWidth/2;marker.style.left=c+Math.cos(a)*r+'px';marker.style.top=c+Math.sin(a)*r+'px';wheel.setAttribute('aria-valuenow',Math.round(hue))}
const svgNS='http://www.w3.org/2000/svg';
function drawHarmonyOverlay(){
  const size=wheel.clientWidth,c=size/2,r=size*.39;
  overlay.setAttribute('width',size);overlay.setAttribute('height',size);
  overlay.innerHTML='';
  if(mode==='monochromatic')return;
  const offsets=harmonies[mode].o;
  const points=offsets.map(o=>{const a=(norm(hue+o)-90)*Math.PI/180;return{x:c+Math.cos(a)*r,y:c+Math.sin(a)*r}});
  if(points.length===2){
    const line=document.createElementNS(svgNS,'line');
    line.setAttribute('x1',points[0].x);line.setAttribute('y1',points[0].y);
    line.setAttribute('x2',points[1].x);line.setAttribute('y2',points[1].y);
    line.setAttribute('stroke','rgba(13,15,20,.85)');line.setAttribute('stroke-width','2.5');
    overlay.appendChild(line);
  }else{
    const shape=document.createElementNS(svgNS,mode==='analogous'?'polyline':'polygon');
    shape.setAttribute('points',points.map(p=>p.x+','+p.y).join(' '));
    shape.setAttribute('fill','none');
    shape.setAttribute('stroke','rgba(13,15,20,.85)');shape.setAttribute('stroke-width','2.5');
    overlay.appendChild(shape);
  }
  points.forEach((p,i)=>{
    if(i===0)return;
    const dot=document.createElementNS(svgNS,'circle');
    dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);dot.setAttribute('r','7');
    dot.setAttribute('fill','#fff');dot.setAttribute('stroke','rgba(13,15,20,.85)');dot.setAttribute('stroke-width','2.5');
    overlay.appendChild(dot);
  });
}
function colors(){if(mode==='monochromatic')return[22,38,55,72,88].map(l=>({h:hue,s:saturation,l}));return harmonies[mode].o.map(o=>({h:norm(hue+o),s:saturation,l:lightness}))}
function renderPalette(){palette.querySelectorAll('.swatch').forEach(x=>x.remove());colors().forEach(c=>{let v=toHex(rgb(c.h,c.s,c.l)),b=document.createElement('button');b.className='swatch';b.style.background=hsl(c.h,c.s,c.l);b.innerHTML='<span>'+v+'<small>Copiar</small></span>';b.onclick=()=>copy(v);palette.appendChild(b)});$('#description').textContent=harmonies[mode].d;drawHarmonyOverlay()}
function render(){sat.value=saturation;light.value=lightness;$('#satOut').textContent=saturation+'%';$('#lightOut').textContent=lightness+'%';let a=rgb(hue),v=toHex(a);hex.value=v;$('#rgb').textContent=a.join(', ');$('#hsl').textContent=Math.round(hue)+'°, '+saturation+'%, '+lightness+'%';$('#name').textContent=name(hue);markerPos();renderPalette()}
function setPointer(e){let r=wheel.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y);if(d<r.width*.19||d>r.width*.52)return;hue=norm(Math.atan2(y,x)*180/Math.PI+90);render()}
function copy(t){navigator.clipboard?.writeText(t).then(()=>show(t+' copiado!')).catch(()=>show('Copie manualmente: '+t))}
function show(t){toast.textContent=t;toast.classList.add('show');clearTimeout(show.t);show.t=setTimeout(()=>toast.classList.remove('show'),1700)}
function paletteValues(){return colors().map(c=>toHex(rgb(c.h,c.s,c.l)))}
function save(){saved.unshift({id:Date.now(),colors:paletteValues(),harmony:mode,date:new Date().toLocaleDateString('pt-BR')});saved=saved.slice(0,12);localStorage.setItem('chromatica-palettes',JSON.stringify(saved));renderSaved();show('Paleta salva!')}
function renderSaved(){let box=$('#saved');box.innerHTML='';$('#count').textContent=saved.length||'';$('#empty').hidden=!!saved.length;saved.forEach(p=>{let card=document.createElement('article');card.className='saved-card';let cs=document.createElement('div');cs.className='saved-colors';p.colors.forEach(v=>{let b=document.createElement('button');b.style.background=v;b.onclick=()=>copy(v);cs.appendChild(b)});let meta=document.createElement('div');meta.className='saved-meta';meta.innerHTML='<span>'+p.harmony+' • '+p.date+'</span>';let del=document.createElement('button');del.textContent='×';del.onclick=()=>{saved=saved.filter(x=>x.id!==p.id);localStorage.setItem('chromatica-palettes',JSON.stringify(saved));renderSaved()};meta.appendChild(del);card.append(cs,meta);box.appendChild(card)})}
wheel.addEventListener('pointerdown',e=>{push();setPointer(e);wheel.setPointerCapture(e.pointerId);const move=e=>setPointer(e);wheel.addEventListener('pointermove',move);wheel.addEventListener('pointerup',()=>wheel.removeEventListener('pointermove',move),{once:true})});
wheel.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)){push();hue=norm(hue+(e.key==='ArrowLeft'||e.key==='ArrowDown'?-2:2));render()}});
sat.onchange=light.onchange=push;sat.oninput=e=>{saturation=+e.target.value;render()};light.oninput=e=>{lightness=+e.target.value;render()};
$('#apply').onclick=()=>{let v=hex.value.trim();if(!/^#?[\da-f]{6}$/i.test(v))return show('HEX inválido');push();if(v[0]!=='#')v='#'+v;({h:hue,s:saturation,l:lightness}=hexToHsl(v));render();show('Cor aplicada!')};hex.onkeydown=e=>e.key==='Enter'&&$('#apply').click();
$$('#modes button').forEach(b=>b.onclick=()=>{if(b.dataset.mode!==mode){push();mode=b.dataset.mode;syncMode();renderPalette()}});
$$('[data-copy]').forEach(b=>b.onclick=()=>copy(b.dataset.copy==='rgb'?$('#rgb').textContent:$('#hsl').textContent));
$('#random').onclick=()=>{push();hue=Math.random()*360;saturation=60+Math.floor(Math.random()*35);lightness=45+Math.floor(Math.random()*25);render()};
$('#copyPalette').onclick=()=>copy(paletteValues().join(', '));$('#save').onclick=save;
$('#theme').onclick=()=>{document.body.classList.toggle('light');$('#theme').textContent=document.body.classList.contains('light')?'☾':'☀'};
$('#undo').onclick=undo;$('#redo').onclick=redo;window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();e.shiftKey?redo():undo()}});
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.toggle('active',x===b));$('#wheelTab').hidden=b.dataset.tab!=='wheel';$('#imageTab').hidden=b.dataset.tab!=='image'});
const drop=$('#drop'),input=$('#image'),canvas=$('#canvas'),imageColors=$('#imageColors'),imgPreview=$('#imgPreview'),changeImage=$('#changeImage');
function imageFile(f){if(!f?.type.startsWith('image/'))return show('Escolha uma imagem');let rd=new FileReader();rd.onload=()=>{imgPreview.src=rd.result;imgPreview.hidden=false;drop.hidden=true;changeImage.hidden=false;let im=new Image();im.onload=()=>extract(im);im.src=rd.result};rd.readAsDataURL(f)}
changeImage.onclick=()=>input.click();
function extract(im){let n=70,ctx=canvas.getContext('2d');canvas.width=canvas.height=n;ctx.drawImage(im,0,0,n,n);let d=ctx.getImageData(0,0,n,n).data,map=new Map();for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;let k=[d[i],d[i+1],d[i+2]].map(x=>Math.round(x/32)*32).join(',');map.set(k,(map.get(k)||0)+1)}imageColors.innerHTML='';[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([k])=>{let v=toHex(k.split(',').map(Number)),b=document.createElement('button');b.style.background=v;b.title='Usar '+v;b.onclick=()=>{push();({h:hue,s:saturation,l:lightness}=hexToHsl(v));render();show('Cor aplicada!')};imageColors.appendChild(b)})}
drop.onclick=()=>input.click();drop.ondragover=e=>{e.preventDefault();drop.classList.add('drag')};drop.ondragleave=()=>drop.classList.remove('drag');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('drag');imageFile(e.dataTransfer.files[0])};input.onchange=()=>imageFile(input.files[0]);
$('#favorites').onclick=()=>{$('#drawer').hidden=false;$('#scrim').hidden=false};function close(){$('#drawer').hidden=true;$('#scrim').hidden=true}$('#close').onclick=close;$('#clear').onclick=()=>{saved=[];localStorage.removeItem('chromatica-palettes');renderSaved();show('Paletas removidas')};window.onresize=()=>{markerPos();drawHarmonyOverlay()};render();renderSaved();
function openTool(title){$('#toolModalTitle').textContent=title;$('#toolModal').hidden=false;$('#scrim').hidden=false}
function closeTool(){$('#toolModal').hidden=true}
function closeOverlays(){close();closeTool()}
$('#closeTool').onclick=closeTool;
$('#scrim').onclick=closeOverlays;
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays()});
function download(name,blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function exportCSS(){let c=paletteValues();let text=':root {\n'+c.map((v,i)=>'  --chromatica-'+(i+1)+': '+v+';').join('\n')+'\n}\n\n.palette {\n  background: linear-gradient(90deg, '+c.join(', ')+');\n}\n';download('chromatica-palette.css',new Blob([text],{type:'text/css'}));show('CSS exportado!')}
function exportPNG(){let c=paletteValues(),can=document.createElement('canvas'),ctx=can.getContext('2d'),w=1600,h=520;can.width=w;can.height=h;ctx.fillStyle='#111318';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff';ctx.font='700 42px Arial';ctx.textAlign='left';ctx.fillText('CHROMATICA — PALETA DE CORES',70,85);let y=150,sw=w/c.length;c.forEach((v,i)=>{let x=i*sw;ctx.fillStyle=v;ctx.fillRect(x,y,sw,230);ctx.fillStyle='#fff';ctx.font='700 26px Arial';ctx.textAlign='center';ctx.fillText(v,x+sw/2,430)});can.toBlob(b=>{if(b){download('chromatica-palette.png',b);show('Paleta baixada em PNG!')}else show('Não foi possível gerar o PNG')},'image/png');}
function gradient(){let c=paletteValues(),css='linear-gradient(135deg, '+c.join(', ')+')';openTool('Gradiente automático');let body=$('#toolModalBody');body.innerHTML='<div class="gradient-preview"></div><code>'+css+'</code><button class="action-btn png-btn" id="copyGradient" style="margin-top:10px;width:100%">Copiar CSS</button>';body.querySelector('.gradient-preview').style.background='linear-gradient(135deg,'+c.join(',')+')';body.querySelector('#copyGradient').onclick=()=>{copy(css);show('Gradiente copiado!')}}
function lum(hex){let a=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function ratio(a,b){let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function contrast(){let c=paletteValues();openTool('Análise WCAG');let rows='';for(let i=0;i<c.length-1;i++){let r=ratio(c[i],c[i+1]);let level=r>=7?'AAA':r>=4.5?'AA':r>=3?'AA grande':'Falha';rows+='<div class="contrast-row"><span>'+c[i]+' × '+c[i+1]+'</span><strong>'+r.toFixed(2)+':1 <span class="badge">'+level+'</span></strong></div>'}let base=hex.value,white=ratio(base,'#FFFFFF'),black=ratio(base,'#000000'),text=white>=black?'#FFFFFF':'#000000',best=Math.max(white,black);$('#toolModalBody').innerHTML=rows+'<div class="recommendation">Para <b>'+base+'</b>, a melhor cor para texto é <b>'+text+'</b> ('+best.toFixed(2)+':1) — '+(best>=7?'AAA':best>=4.5?'AA':'baixo contraste')+'.</div>'}
function share(){let p=new URLSearchParams({c:paletteValues().map(x=>x.slice(1)).join(','),m:mode});let u=location.origin+location.pathname+'?'+p.toString();if(navigator.share)navigator.share({title:'Chromatica Palette',url:u}).catch(()=>{});else copy(u);history.replaceState({},'',u);show('Link compartilhável copiado!')}
function loadShared(){let q=new URLSearchParams(location.search),c=q.get('c'),m=q.get('m');if(m&&harmonies[m]){mode=m;syncMode()}if(c){let arr=c.split(',');if(arr[0]&&/^[\da-f]{6}$/i.test(arr[0]))({h:hue,s:saturation,l:lightness}=hexToHsl('#'+arr[0]));render();show('Paleta compartilhada carregada!')}}
$('#exportCss').onclick=exportCSS;$('#exportPng').onclick=exportPNG;$('#gradientBtn').onclick=gradient;$('#contrastBtn').onclick=contrast;$('#share').onclick=share;
loadShared();
function uiPreview(){let c=paletteValues();openTool('Preview UI');let bg=c[0],surface=c[1]||c[0],primary=c[2]||c[0],text=ratio(bg,'#fff')>=ratio(bg,'#000')?'#fff':'#000';$('#toolModalBody').innerHTML='<div class="ui-preview" style="--preview-bg:'+bg+';--preview-surface:'+surface+';--preview-primary:'+primary+';--preview-text:'+text+'"><div class="ui-nav"><b>CHROMATICA UI</b><span>Home &nbsp; Projetos</span></div><div class="ui-card"><h3>Preview da sua paleta</h3><p>Veja como as cores podem funcionar em uma interface real.</p><button>Ação principal</button></div></div><p class="recommendation">Tokens sugeridos: <b>Background '+bg+'</b> · Surface '+surface+' · Primary '+primary+' · Text '+text+'</p>'}
function matrix(rgbv,type){let m={protanopia:[[.567,.433,0],[.558,.442,0],[0,.242,.758]],deuteranopia:[[.625,.375,0],[.70,.30,0],[0,.30,.70]],tritanopia:[[.95,.05,0],[0,.433,.567],[0,.475,.525]],achromatopsia:[[.299,.587,.114],[.299,.587,.114],[.299,.587,.114]]}[type];return m.map(row=>Math.round(row.reduce((s,v,i)=>s+v*rgbv[i],0))).map(v=>Math.max(0,Math.min(255,v)))}
function simulateBlind(){let c=paletteValues(),types=['protanopia','deuteranopia','tritanopia','achromatopsia'],labels={protanopia:'Protanopia',deuteranopia:'Deuteranopia',tritanopia:'Tritanopia',achromatopsia:'Acromatopsia'};openTool('Simulador de percepção de cores');$('#toolModalBody').innerHTML='<div class="blind-grid">'+types.map(t=>'<div class="blind-card"><span>'+labels[t]+'</span><div class="blind-strip">'+c.map(v=>'<i style="background:'+toHex(matrix(v.match(/[a-f\\d]{2}/gi).map(x=>parseInt(x,16)),t))+'"></i>').join('')+'</div></div>').join('')+'</div><div class="blind-note">Simulação aproximada para ajudar a avaliar diferenciação visual. Não substitui testes de acessibilidade com usuários.</div>'}
$('#previewBtn').onclick=uiPreview;$('#blindBtn').onclick=simulateBlind;
