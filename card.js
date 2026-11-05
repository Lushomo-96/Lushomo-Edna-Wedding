/* Draws the invitation card to a canvas and builds a PDF. Used by invite.html. */
const PHOTO="assets/couple.jpg";
const slug=s=>s.trim().toLowerCase().replace(/&/g," and ").replace(/[^\p{L}\p{N}\s-]/gu,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
/* ---------- Card drawing ---------- */
const CW=1080,CH=1960,GOLD="#e3c77d",INK="#f6f3ea";
let photo=null,fontsReady=null;
function ready(){
  if(!fontsReady)fontsReady=Promise.all([
    document.fonts.load('54px "Gloock"'),document.fonts.load('60px "Pinyon Script"'),document.fonts.load('32px "Figtree"'),document.fonts.load('600 32px "Figtree"'),
    new Promise((res,rej)=>{photo=new Image();photo.onload=res;photo.onerror=()=>rej(new Error("Photo failed to load"));photo.src=PHOTO})
  ]).catch(e=>{fontsReady=null;throw e});
  return fontsReady}
function fit(ctx,text,font,px,maxW){let s=px;do{ctx.font=font.replace("{}",s+"px");if(ctx.measureText(text).width<=maxW||s<=24)break;s-=2}while(true);return s}
function diamonds(ctx,y){ctx.fillStyle=GOLD;ctx.globalAlpha=.6;for(let x=96;x<=CW-96;x+=34){ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+9,y);ctx.lineTo(x,y+9);ctx.lineTo(x-9,y);ctx.closePath();ctx.fill()}ctx.globalAlpha=1}
function rule(ctx,y){ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(CW/2-90,y);ctx.lineTo(CW/2+90,y);ctx.stroke();
  ctx.fillStyle=GOLD;ctx.beginPath();ctx.moveTo(CW/2,y-12);ctx.lineTo(CW/2+12,y);ctx.lineTo(CW/2,y+12);ctx.lineTo(CW/2-12,y);ctx.closePath();ctx.fill()}
function tx(ctx,t,y,font,color,spacing){ctx.font=font;ctx.fillStyle=color;const ls="letterSpacing" in ctx;if(ls)ctx.letterSpacing=spacing||"0px";
  ctx.fillText(spacing&&!ls?t.split("").join(" "):t,CW/2+(spacing&&ls?parseFloat(spacing)/2:0),y);if(ls)ctx.letterSpacing="0px"}
async function drawCard(g){
  await ready();
  const c=document.createElement("canvas");c.width=CW;c.height=CH;const ctx=c.getContext("2d");ctx.textAlign="center";ctx.textBaseline="alphabetic";
  const bg=ctx.createLinearGradient(0,0,0,CH);bg.addColorStop(0,"#14246b");bg.addColorStop(.45,"#0f1d4d");bg.addColorStop(1,"#0a1438");ctx.fillStyle=bg;ctx.fillRect(0,0,CW,CH);
  ctx.strokeStyle=GOLD;ctx.lineWidth=4;ctx.strokeRect(34,34,CW-68,CH-68);
  ctx.globalAlpha=.4;ctx.lineWidth=2;ctx.strokeRect(54,54,CW-108,CH-108);ctx.globalAlpha=1;
  diamonds(ctx,96);diamonds(ctx,CH-96);
  if(g&&g.name){const s=fit(ctx,"Dear "+g.name+",",'{} "Pinyon Script"',76,840);tx(ctx,"Dear "+g.name+",",200,s+'px "Pinyon Script"',GOLD)}
  tx(ctx,"WITH JOY",g&&g.name?276:226,'600 24px "Figtree"',GOLD,"7px");
  tx(ctx,"Pastor O. Mwiinde",362,'56px "Gloock"',GOLD);
  tx(ctx,"and",424,'60px "Pinyon Script"',INK);
  tx(ctx,"Mr. E. Mumba",494,'56px "Gloock"',GOLD);
  tx(ctx,"are inviting you to the wedding of",570,'32px "Figtree"',INK);
  tx(ctx,"their son and daughter",614,'32px "Figtree"',INK);
  rule(ctx,672);
  const w=420,h=540,x0=CW/2-w/2,top=724,r=w/2;
  const arch=i=>{ctx.beginPath();ctx.moveTo(x0+i,top+h-i);ctx.lineTo(x0+i,top+r);ctx.arc(CW/2,top+r,r-i,Math.PI,0);ctx.lineTo(x0+w-i,top+h-i);ctx.closePath()};
  arch(0);ctx.strokeStyle=GOLD;ctx.lineWidth=4;ctx.stroke();
  ctx.save();arch(12);ctx.clip();
  const iw=photo.naturalWidth,ih=photo.naturalHeight,sw=ih*((w-24)/(h-24)),sx=Math.max(0,(iw-sw)*.42);
  ctx.drawImage(photo,sx,0,Math.min(sw,iw),ih,x0+12,top+12,w-24,h-24);ctx.restore();
  tx(ctx,"Lushomo",1380,'120px "Gloock"',INK);
  tx(ctx,"and",1450,'76px "Pinyon Script"',GOLD);
  tx(ctx,"Edna",1560,'120px "Gloock"',INK);
  tx(ctx,"Sunday, 27 December 2026",1650,'46px "Gloock"',INK,"2px");
  tx(ctx,"LUSAKA · ZAMBIA",1696,'600 24px "Figtree"',GOLD,"7px");
  rule(ctx,1740);
  ctx.globalAlpha=.85;
  tx(ctx,"Venue and programme times will be shared soon.",1788,'28px "Figtree"',INK);
  tx(ctx,"Kindly reply by 10 December 2026.",1826,'28px "Figtree"',INK);ctx.globalAlpha=1;
  return c}
const blobOf=(c,type,q)=>new Promise(res=>c.toBlob(res,type,q));
const fname=(g,ext)=>"invitation-"+(slug(g.name)||"guest")+"."+ext;
/* ---------- PDF writer (one JPEG per page) ---------- */
const enc=new TextEncoder();
async function makePdf(canvases){
  const PW=405,PH=Math.round(405*CH/CW*100)/100,parts=[],offs=[];let len=0;
  const push=d=>{const u=typeof d==="string"?enc.encode(d):d;parts.push(u);len+=u.length};
  const obj=(n,body)=>{offs[n]=len;push(n+" 0 obj\n");push(body);push("\nendobj\n")};
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const n=canvases.length,kids=canvases.map((_,i)=>(3+i*3)+" 0 R").join(" ");
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);
  for(let i=0;i<n;i++){
    const p=3+i*3,im=p+1,ct=p+2;
    obj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
    const jpg=new Uint8Array(await (await blobOf(canvases[i],"image/jpeg",.93)).arrayBuffer());
    offs[im]=len;push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${CW} /Height ${CH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);push(jpg);push("\nendstream\nendobj\n");
    const cs=`q ${PW} 0 0 ${PH} 0 0 cm /Im${i} Do Q`;
    obj(ct,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`)}
  const xref=len,total=2+n*3;
  let x=`xref\n0 ${total+1}\n0000000000 65535 f \n`;for(let i=1;i<=total;i++)x+=String(offs[i]).padStart(10,"0")+" 00000 n \n";
  push(x+`trailer\n<< /Size ${total+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts,{type:"application/pdf"})}

/* ---------- ZIP writer (stored) ---------- */
const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=~0;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return ~c>>>0};
function makeZip(files){
  const parts=[],cen=[];let off=0;const d=new Date(),time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const u16=n=>[n&255,n>>8&255],u32=n=>[n&255,n>>8&255,n>>16&255,n>>24&255];
  for(const f of files){
    const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
    const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x800),...u16(0),...u16(time),...u16(date),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0)]);
    parts.push(lh,nm,f.data);
    cen.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x800),...u16(0),...u16(time),...u16(date),...u32(crc),...u32(sz),...u32(sz),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nm);
    off+=lh.length+nm.length+sz}
  let cl=0;for(const p of cen){parts.push(p);cl+=p.length}
  parts.push(new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cl),...u32(off),0,0]));
  return new Blob(parts,{type:"application/zip"})}

