(function(){
"use strict";
var APP_VERSION="1.0.4";
var $=function(s){return document.querySelector(s);};
var canvas=$("#gl"), stageEl=canvas.parentNode, app=$(".app"), strip=$("#strip");
if(!window.THREE){ $("#loading").textContent="3Dの読み込みに失敗しました"; return; }

/* ================= 3D ================= */
var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(36,16/10,0.1,400);
scene.add(new THREE.AmbientLight(0xfff6f2,0.52));
scene.add(new THREE.HemisphereLight(0xffffff,0x93a2ab,0.45));
var d1=new THREE.DirectionalLight(0xffffff,0.72); d1.position.set(6,12,11); scene.add(d1);
var d2=new THREE.DirectionalLight(0xe6eef5,0.34); d2.position.set(-9,5,-8); scene.add(d2);
var d3=new THREE.DirectionalLight(0xffffff,0.2); d3.position.set(0,-8,4); scene.add(d3);
var root=new THREE.Group(); scene.add(root);

var TONE={dark:0x2C3238,eyeball:0xFFFFFF,silver:0xC9D4DA,skin:0xD3DDE2,organ2:0x8A4F3C,oo:0xF2909F,chu:0xE85C72,aka:0xC62B3C,rare:0xD8465A,
          bone:0xF2EDE2,organ:0x8E1F2C,egg:0xD86B4E,eye:0xE9E4DA};

function hx(n){return '#'+('000000'+n.toString(16)).slice(-6);}
function cv(w,h,draw){var c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),c);return c;}
function grainOn(x,w,h,dark){
  for(var i=0;i<26;i++){
    x.strokeStyle=i%4===0?"rgba(255,255,255,.26)":"rgba(255,255,255,.12)";
    x.lineWidth=2+Math.random()*5; x.beginPath();
    var y=Math.random()*h; x.moveTo(-10,y); x.bezierCurveTo(w*0.3,y-h*0.08,w*0.7,y+h*0.08,w+10,y+2); x.stroke();
  }
  for(var j=0;j<16;j++){
    x.strokeStyle="rgba("+(dark||"150,110,115")+",.17)"; x.lineWidth=2+Math.random()*3; x.beginPath();
    var y2=Math.random()*h; x.moveTo(-10,y2); x.bezierCurveTo(w*0.3,y2+h*0.06,w*0.7,y2-h*0.06,w+10,y2); x.stroke();
  }
}
/* 部位名を彫り込んだテクスチャ */
function partTex(kind,wu,wt,noLabel,lsh){
  var k=KIND[kind], W=512,H=256;
  var c=cv(W,H,function(x){
    var base=(k.tone==="skin")?"#ffffff":hx(TONE[k.tone]||0xdddddd);
    x.fillStyle=base; x.fillRect(0,0,W,H);
    if(k.tone!=="skin"&&k.tone!=="silver"&&k.tone!=="eyeball"&&k.tone!=="dark") grainOn(x,W,H);
    if(kind==="medama"){
      x.beginPath(); x.arc(W*0.5,H*0.52,66,0,6.3); x.fillStyle="#f7f7f5"; x.fill();
      x.lineWidth=7; x.strokeStyle="rgba(60,60,60,.55)"; x.stroke();
      x.beginPath(); x.arc(W*0.5,H*0.52,38,0,6.3); x.fillStyle="#20262b"; x.fill();
      x.beginPath(); x.arc(W*0.5+13,H*0.52-13,12,0,6.3); x.fillStyle="#fff"; x.fill();
      return;
    }
    if(k.ribs){
      x.strokeStyle="#FBF8F1"; x.lineCap="round";
      for(var rb=0;rb<11;rb++){
        var bx=26+rb*44;
        x.lineWidth=13; x.beginPath();
        x.moveTo(bx,H*0.46); x.bezierCurveTo(bx+16,H*0.66,bx+12,H*0.86,bx-10,H*0.99); x.stroke();
        x.lineWidth=11; x.beginPath();
        x.moveTo(bx,H*0.44); x.bezierCurveTo(bx+14,H*0.28,bx+10,H*0.14,bx-8,H*0.03); x.stroke();
      }
      for(var sg=0;sg<13;sg++){
        var sx=20+sg*38;
        x.fillStyle="#FFFDF6"; x.beginPath();
        x.ellipse(sx,H*0.45,17,13,0,0,6.3); x.fill();
        x.strokeStyle="rgba(180,172,155,.55)"; x.lineWidth=2; x.stroke();
      }
    }
    if(noLabel) return;
    var t=k.label||k.n;
    /* 文字は「実物の大きさ」でまっすぐに彫る（細長い部位ではタテ書きにする） */
    var K=100, ww=Math.max(0.25,wu||1), hh=Math.max(0.25,wt||1);
    x.save();
    x.setTransform((W/ww)/K,0,0,(H/hh)/K,W*0.5,H*0.5);
    var vert=hh>ww*1.30, n=t.length, fh;
    x.font="700 "+K+"px 'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif";
    var w1=x.measureText(t).width/K;                 /* 高さ1のときの横幅（実寸） */
    if(vert) fh=Math.min(0.72*ww, 0.86*hh/(n*1.04), 1.15);   /* タテ書き（1字ずつ積む） */
    else     fh=Math.min(0.80*ww/Math.max(0.01,w1), 0.62*hh, 1.15);
    x.font="700 "+Math.round(fh*K)+"px 'M PLUS Rounded 1c','Hiragino Maru Gothic ProN',sans-serif";
    x.textAlign="center"; x.textBaseline="middle";
    var dk=(k.tone==="dark")?"rgba(230,235,240,.5)":((k.tone==="skin"||k.tone==="silver")?"rgba(60,70,78,.42)":"rgba(96,18,28,.62)");
    function two(ch,cx,cy){
      x.fillStyle="rgba(255,255,255,.55)"; x.fillText(ch,cx,cy+fh*0.06*K);
      x.fillStyle=dk; x.fillText(ch,cx,cy-fh*0.02*K);
    }
    var yo=(lsh||0)*hh*K;
    if(vert){
      var step=fh*1.04*K, y0=yo-(n-1)/2*step;
      for(var ci=0;ci<n;ci++) two(t.charAt(ci),0,y0+ci*step);
    } else two(t,0,yo);
    x.restore();
  });
  var tx=new THREE.CanvasTexture(c); tx.anisotropy=4; return tx;
}
function mkMat(kind,ghost,wu,wt,lsh){
  var k=KIND[kind];
  if(ghost) return new THREE.MeshStandardMaterial({color:0xE8323F,transparent:true,opacity:.3,depthWrite:false,
    roughness:.9,side:THREE.DoubleSide,emissive:0x4a0a10});
  var o={color:0xffffff,roughness:.52,metalness:.05,side:THREE.DoubleSide,map:partTex(kind,wu,wt,false,lsh)};
  if(k.tone==="skin"){ o.metalness=.42; o.roughness=.3; o.color=0xffffff; o.vertexColors=true; }
  if(k.tone==="silver"){ o.metalness=.4; o.roughness=.32; }
  if(k.tone==="dark"){ o.metalness=.3; o.roughness=.45; }
  if(k.tone==="eyeball"){ o.metalness=.05; o.roughness=.22; }
  return new THREE.MeshStandardMaterial(o);
}
/* 本マグロの体色：背は濃紺、側面は青銀、腹は真珠のような白 */
var SKINC=[[0.00,0xFBFDFE],[0.20,0xF2F7F9],[0.34,0xDCE6EC],[0.45,0xBACAD6],
           [0.54,0x93AEC4],[0.63,0x6389AC],[0.73,0x3C6288],[0.85,0x213F63],[1.00,0x11243E]]
  .map(function(e){ return [e[0],new THREE.Color(e[1])]; });
function skinRamp(k,c){
  var i=0; while(i<SKINC.length-2&&SKINC[i+1][0]<k) i++;
  var a=SKINC[i],b=SKINC[i+1],t=(k-a[0])/((b[0]-a[0])||1);
  return c.copy(a[1]).lerp(b[1],t<0?0:(t>1?1:t));
}
function skinColors(geo){
  var pos=geo.attributes.position,col=[],c=new THREE.Color();
  var oe=geo.userData.outerEnd||pos.count;
  for(var i=0;i<pos.count;i++){
    var y=pos.getY(i),k=Math.max(0,Math.min(1,(y+1.78)/3.45));
    if(i>=oe) c.setHex(0xB7C5CE);
    else{
      skinRamp(k,c);
      if(k>0.44&&k<0.60){                 /* 側線のあたりを少しきらり */
        var g=1-Math.abs(k-0.52)/0.08;
        c.lerp(new THREE.Color(0xEAF2F6),g*0.18);
      }
    }
    col.push(c.r,c.g,c.b);
  }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
}

/* ---- 外れない骨組み ---- */
var frameMat=new THREE.MeshStandardMaterial({color:0x1B3151,roughness:.46,metalness:.22,side:THREE.DoubleSide});
var skinFrameMat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,metalness:.42,roughness:.3,side:THREE.DoubleSide});
var frameGroup=new THREE.Group(); root.add(frameGroup);
FRAME.forEach(function(g){
  var geo=g.hole?holeGeo(g):shellGeo(g);
  if(g.skin){ skinColors(geo); frameGroup.add(new THREE.Mesh(geo,skinFrameMat)); }
  else frameGroup.add(new THREE.Mesh(geo,frameMat));
});
/* ---- かしらAの大きな目（外れない） ---- */
(function(){
  var ec=P(0.105,-0.40,0.90);
  var dir=P(0.105,-0.40,1.60).sub(ec).normalize();          /* 目の外向き */
  var w=new THREE.Mesh(new THREE.SphereGeometry(0.40,24,18),
    new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:.3,metalness:.02}));
  w.position.copy(ec); frameGroup.add(w);
  var b=new THREE.Mesh(new THREE.SphereGeometry(0.235,20,16),
    new THREE.MeshStandardMaterial({color:0x14181C,roughness:.25,metalness:.05}));
  b.position.copy(ec).addScaledVector(dir,0.285); frameGroup.add(b);
  var h=new THREE.Mesh(new THREE.SphereGeometry(0.078,12,10),
    new THREE.MeshStandardMaterial({color:0xffffff,emissive:0x777777,roughness:.2}));
  h.position.copy(ec).addScaledVector(dir,0.44); h.position.y+=0.11; h.position.x-=0.07;
  frameGroup.add(h);
})();
/* ---- ひれ ---- */
function finMesh(pts,depth,x,y,z,mat){
  var sh=new THREE.Shape(); sh.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++) sh.lineTo(pts[i][0],pts[i][1]);
  var geo=new THREE.ExtrudeGeometry(sh,{depth:depth,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1});
  geo.translate(0,0,-depth/2);
  var m=new THREE.Mesh(geo,mat||frameMat); m.position.set(x||0,y||0,z||0); return m;
}
frameGroup.add(finMesh([[-2.0,1.7],[-1.55,3.15],[-0.9,3.3],[-0.2,1.9],[-0.8,2.05]],0.15));
frameGroup.add(finMesh([[4.1,0.15],[6.2,3.0],[5.4,0.9],[6.3,-2.7],[4.1,-0.2]],0.17));
/* ---- 胴体の外がわのひれ（根もとは背・腹のふちの中にかくれる＝パーツに当たらない） ---- */
var finYMat=new THREE.MeshStandardMaterial({color:0xE2C03E,roughness:.42,metalness:.22,side:THREE.DoubleSide});
function UX(u){ return (u-0.5)*L; }
function TY(u,k){ var q=prof(u); return q.yc+q.ry*(k===undefined?1.015:k); }
function BY(u,k){ var q=prof(u); return q.yc-q.ry*(k===undefined?1.015:k); }
/* 第二背びれ */
frameGroup.add(finMesh([[UX(0.552),TY(0.552)],[UX(0.580),TY(0.580)+0.62],
  [UX(0.616),TY(0.616)+0.26],[UX(0.655),TY(0.655)]],0.10,0,0,0,finYMat));
/* しりびれ */
frameGroup.add(finMesh([[UX(0.618),BY(0.618)],[UX(0.646),BY(0.646)-0.60],
  [UX(0.682),BY(0.682)-0.25],[UX(0.718),BY(0.718)]],0.10,0,0,0,finYMat));
/* 腹びれ */
frameGroup.add(finMesh([[UX(0.338),BY(0.338)],[UX(0.366),BY(0.366)-0.60],
  [UX(0.396),BY(0.396)-0.22],[UX(0.418),BY(0.418)]],0.09,0,0,0,frameMat));
/* 小離鰭（黄色い三角のならび） */
for(var fi=0;fi<5;fi++){
  var fu0=0.700+fi*0.041, fu1=fu0+0.030;
  frameGroup.add(finMesh([[UX(fu0),TY(fu0)],[UX(fu0)+0.09,TY(fu0)+0.26],[UX(fu1),TY(fu1)]],
    0.075,0,0,0,finYMat));
  frameGroup.add(finMesh([[UX(fu0),BY(fu0)],[UX(fu0)+0.09,BY(fu0)-0.24],[UX(fu1),BY(fu1)]],
    0.075,0,0,0,finYMat));
}
var pectL=finMesh([[0,0],[1.7,-0.65],[2.3,-1.3],[0.6,-0.6]],0.1,-2.1,-0.3,-1.53);
pectL.rotation.y=0.5; pectL.rotation.z=0.15; frameGroup.add(pectL);
var pectR=finMesh([[0,0],[1.7,-0.65],[2.3,-1.3],[0.6,-0.6]],0.1,-2.1,-0.3,1.53);
pectR.rotation.y=-0.5; pectR.rotation.z=0.15; root.add(pectR);

/* ---- パーツ ---- */
var byId={},meshes={},ghosts={};
PARTS.forEach(function(p){
  byId[p.id]=p;
  var geo=p.g.blob?blobGeo(p.g):(p.g.slab?slabGeo(p.g):shellGeo(p.g));
  geo.computeBoundingBox(); var home=new THREE.Vector3(); geo.boundingBox.getCenter(home);
  geo.translate(-home.x,-home.y,-home.z);
  if(KIND[p.kind].tone==="skin") skinColors(geo);
  var wu=1,wt=1;
  if(!p.g.blob){
    var um=(p.g.u0+p.g.u1)/2, tm=(p.g.t0+p.g.t1)/2, s1=p.g.s1;
    wu=P(p.g.u0,tm,s1).distanceTo(P(p.g.u1,tm,s1));
    wt=P(um,p.g.t0,s1).distanceTo(P(um,p.g.t1,s1));
    if(p.g.lwu) wu*=p.g.lwu;
  }
  var mat=mkMat(p.kind,false,wu,wt,p.g.lsh);
  var m=new THREE.Mesh(geo,mat); m.position.copy(home); m.userData={id:p.id};
  p.texLabel=mat.map; p.texPlain=partTex(p.kind,wu,wt,true,p.g.lsh);
  if(p.kind==="medama"){
    var pup=new THREE.Mesh(new THREE.SphereGeometry(0.185,20,16),
      new THREE.MeshStandardMaterial({color:0x14181C,roughness:.25,metalness:.05}));
    var oc=P(p.g.u,p.g.t,p.g.s+0.22).sub(home); pup.position.copy(oc); m.add(pup);
    var hl=new THREE.Mesh(new THREE.SphereGeometry(0.062,12,10),
      new THREE.MeshStandardMaterial({color:0xffffff,roughness:.2,emissive:0x666666}));
    hl.position.copy(oc).multiplyScalar(1.22); hl.position.y+=0.09; m.add(hl);
  }
  root.add(m); meshes[p.id]=m;
  var gm=new THREE.Mesh(geo,mkMat(p.kind,true)); gm.position.copy(home); gm.visible=false;
  root.add(gm); ghosts[p.id]=gm;
  var dir;
  if(p.pull) dir=new THREE.Vector3(p.pull[0],p.pull[1],p.pull[2]).normalize();
  else if(p.g.slab) dir=new THREE.Vector3(0,(home.y-prof(0.5).yc)*0.30,1).normalize();
  else { dir=new THREE.Vector3(0,home.y-prof(0.5).yc,home.z); if(dir.length()<0.3) dir.set(0,0,1); dir.normalize(); }
  p.home=home.clone(); p.dir=dir; p.mesh=m; p.state="home";
  geo.computeBoundingBox();
  var ex=new THREE.Vector3(); geo.boundingBox.getSize(ex);
  var ax=(ex.x<=ex.y&&ex.x<=ex.z)?new THREE.Vector3(1,0,0):((ex.y<=ex.z)?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1));
  p.flatQ=new THREE.Quaternion().setFromUnitVectors(ax,new THREE.Vector3(0,1,0));
});
var FISH_CENTER=new THREE.Vector3(0.3,0.15,0);

/* ---- サムネイル ---- */
var THUMB={};
function buildThumbs(){
  var sc=new THREE.Scene();
  sc.add(new THREE.AmbientLight(0xffffff,0.66));
  var l1=new THREE.DirectionalLight(0xffffff,0.8); l1.position.set(4,8,6); sc.add(l1);
  var l2=new THREE.DirectionalLight(0xffffff,0.3); l2.position.set(-5,2,-4); sc.add(l2);
  var cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,100);
  var W=220,H=170,old=new THREE.Vector2(); renderer.getSize(old); renderer.setSize(W,H,false);
  PARTS.forEach(function(p){
    var m=new THREE.Mesh(p.mesh.geometry,p.mesh.material);
    m.quaternion.copy(p.flatQ); m.updateMatrixWorld(); sc.add(m);
    var bb=new THREE.Box3().setFromObject(m),sz=new THREE.Vector3(); bb.getSize(sz);
    var cx=new THREE.Vector3(); bb.getCenter(cx);
    var r=Math.max(sz.x,sz.z)*0.62+0.3;
    cam.left=-r*(W/H)*0.85; cam.right=r*(W/H)*0.85; cam.top=r*0.95; cam.bottom=-r*0.95;
    cam.position.set(cx.x+1.6,cx.y+6,cx.z+2.6); cam.lookAt(cx); cam.updateProjectionMatrix();
    renderer.render(sc,cam);
    THUMB[p.id]=renderer.domElement.toDataURL("image/png");
    sc.remove(m);
  });
  renderer.setSize(old.x,old.y,false);
}

/* ================= 音 ================= */
var ac=null;
function actx(){ if(ac===null){ try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ac=false;} } return ac; }
function sfx(kind){
  var c=actx(); if(!c) return; if(c.state==="suspended") c.resume();
  var t=c.currentTime,g=c.createGain(); g.connect(c.destination);
  if(kind==="snap"){
    var o=c.createOscillator(); o.type="triangle"; o.connect(g);
    o.frequency.setValueAtTime(1180,t); o.frequency.exponentialRampToValueAtTime(660,t+0.07);
    g.gain.setValueAtTime(.001,t); g.gain.exponentialRampToValueAtTime(.3,t+0.008);
    g.gain.exponentialRampToValueAtTime(.001,t+0.12); o.start(t); o.stop(t+0.14);
  }else if(kind==="cut"){
    var len=Math.floor(c.sampleRate*0.14),buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4);
    var src=c.createBufferSource(); src.buffer=buf;
    var f=c.createBiquadFilter(); f.type="bandpass"; f.frequency.value=2400; f.Q.value=1.2;
    src.connect(f); f.connect(g); g.gain.setValueAtTime(.26,t); src.start(t);
  }else if(kind==="ng"){
    var o2=c.createOscillator(); o2.type="square"; o2.connect(g);
    o2.frequency.setValueAtTime(180,t); o2.frequency.setValueAtTime(130,t+0.08);
    g.gain.setValueAtTime(.13,t); g.gain.exponentialRampToValueAtTime(.001,t+0.18);
    o2.start(t); o2.stop(t+0.2);
  }else{
    var o3=c.createOscillator(); o3.type="triangle"; o3.connect(g);
    g.gain.setValueAtTime(.001,t);
    [660,880,1046,1320].forEach(function(hz,k){ o3.frequency.setValueAtTime(hz,t+k*0.11);
      g.gain.setValueAtTime(.24,t+k*0.11); g.gain.exponentialRampToValueAtTime(.02,t+k*0.11+0.1); });
    o3.start(t); o3.stop(t+0.5);
  }
}
/* ================= 状態 ================= */
var state={screen:"title",mode:"kaitai",removed:[],placed:[],order:[],drag:null,
  finished:false,hintId:null,t0:0,acc:0,started:false,tick:null,miss:0,hints:0,hintUntil:0,spin:true,hideLabel:false,
  cam:{yaw:-0.55,pitch:0.22,zoom:1,tYaw:-0.55,tPitch:0.22,tZoom:1,
       target:FISH_CENTER.clone(),tTarget:FISH_CENTER.clone()}};
var LNAME={0:"皮",1:"頭の部位",2:"外の身A",3:"あかみA",4:"なかおち",5:"あかみB",6:"中の身B・内臓"};
function fmt(s){var m=Math.floor(s/60),x=(s%60).toFixed(1);return m+":"+(x<10?"0":"")+x;}

/* ================= アニメーション ================= */
var tw=[];
function ease(k){return 1-Math.pow(1-k,3);}
function anim(o){o.start=performance.now();o.p0=o.mesh.position.clone();o.s0=o.mesh.scale.x;tw.push(o);return o;}
function stepTw(now){
  for(var i=tw.length-1;i>=0;i--){
    var a=tw[i],k=Math.min(1,(now-a.start)/a.dur),e=ease(k);
    a.mesh.position.lerpVectors(a.p0,a.p1,e);
    if(a.s1!=null){var s=a.s0+(a.s1-a.s0)*e;a.mesh.scale.set(s,s,s);}
    if(a.fade!=null) a.mesh.material.opacity=1-e;
    if(k>=1){tw.splice(i,1); if(a.end)a.end();}
  }
}

/* ================= 表示の更新 ================= */
function layerNow(){
  for(var l=6;l>=0;l--) if(PARTS.some(function(p){return p.layer===l&&state.placed.indexOf(p.id)<0;})) return l;
  return -1;
}
function refresh(){
  var kaitai=state.mode==="kaitai";
  PARTS.forEach(function(p){
    var m=p.mesh,g=ghosts[p.id];
    if(kaitai){ m.visible=(p.state==="home"); g.visible=false;
      if(m.material.emissive)
        m.material.emissive.setHex((performance.now()<state.hintUntil&&state.hintId===p.id)?0x7a5200:0x000000);
    }
    else{
      var placed=(p.state==="home");
      m.visible=placed||p.state==="fly";
      var hintOn=(performance.now()<state.hintUntil);
      var act=(state.hintId===p.id);
      if(!placed&&hintOn&&act){
        g.visible=true; g.material.color.setHex(0xFFC02E);
        g.material.emissive.setHex(0x6a4500); g.material.opacity=0.62;
      }else if(!placed&&(p.layer>=5||p.kind==="kama"||p.kind==="kamatoro")){
                                                  /* 中の身・内臓・カマまわりは「はまる場所」がうっすら見える */
        g.visible=true; g.material.color.setHex(0x5B6A74);
        g.material.emissive.setHex(0x000000); g.material.opacity=0.16;
      }else g.visible=false;
    }
  });
  pectR.visible=(byId["dotai"].state==="home");
  layoutBottom();
  $("#layerPill").textContent=kaitai?(performance.now()<state.hintUntil?"ヒント：光った所をタップ":"手前の皮からはずせます"):(performance.now()<state.hintUntil?"ヒント：光った所へ":"形を見てはめこもう（置いたパーツはタップで外せます）");
}
function updateHud(){
  var n=state.mode==="kaitai"?state.removed.length:state.placed.length;
  $("#countPill").textContent=n+"/"+TOTAL;
  $("#barFill").style.width=(n/TOTAL*100)+"%";
  $("#vbLeftN").textContent=TOTAL-n;
  $("#hdrTime").hidden=!(state.screen==="play"&&state.mode==="kumitate");
  $("#vbMiss").hidden=!(state.screen==="play"&&state.mode==="kumitate");
  $("#vbMissN").textContent=state.miss;
}
function showNow(id){
  var b=$("#nowBar");
  if(!id){ b.className="nowbar idle";
    b.innerHTML='<span class="tx"><span class="nm">'+
      (state.mode==="kaitai"?"パーツをタップしてね":"下のパーツをマグロへドラッグ")+
      '</span><span class="ds">'+(state.mode==="kaitai"
        ?"ドラッグで回転、2本指で拡大。"
        :"わからなくなったら 💡ヒント。")+'</span></span>';
    return; }
  var p=byId[id],k=KIND[p.kind];
  b.className="nowbar";
  b.innerHTML='<img src="'+(THUMB[id]||"")+'" alt=""><span class="tx"><span class="nm">'+k.n+
    (k.g!=="その他"?'<span style="font-size:11.5px;font-weight:700;color:var(--ink-2)">　'+k.g+'</span>':"")+
    (k.rare?'<span style="font-size:10px;font-weight:800;color:var(--gold);border:1.5px solid var(--gold);border-radius:99px;padding:0 6px;margin-left:6px">希少</span>':"")+
    '</span><span class="ds">'+k.d+'</span></span>';
}
function renderStrip(){
  var kaitai=state.mode==="kaitai",list;
  if(kaitai) list=state.order.slice();
  else list=state.order.slice();
  strip.textContent="";
  list.forEach(function(id){
    var p=byId[id],k=KIND[p.kind];
    var b=document.createElement("button");
    b.className="pcard2"+(k.rare?" rare":"");
    b.setAttribute("data-id",id);
    b.innerHTML='<img src="'+(THUMB[id]||"")+'" alt=""><b>'+k.n+(p.side||'')+'</b>';
    strip.appendChild(b);
  });
  $("#stripEmpty").hidden=list.length>0;
  $("#stripCount").textContent=list.length+" 個";
  stripArrows();
}
function stripArrows(){                    /* あふれているときだけ、左右の矢印を出す */
  var over=strip.scrollWidth-strip.clientWidth;
  var x=strip.scrollLeft;
  $("#stripL").hidden=!(over>8 && x>4);
  $("#stripR").hidden=!(over>8 && x<over-4);
}
strip.addEventListener("scroll",stripArrows);
window.addEventListener("resize",stripArrows);
function stripScroll(v){ try{ strip.scrollBy({left:v,behavior:"smooth"}); }catch(e){ strip.scrollLeft+=v; } }
$("#stripL").addEventListener("click",function(){ stripScroll(-186); });
$("#stripR").addEventListener("click",function(){ stripScroll(186); });
/* ================= 記録 ================= */
/* ===== プレイヤーのなまえ ===== */
function esc(t){ return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function playerName(){ try{ return localStorage.getItem("maguro3d3-name")||""; }catch(e){ return ""; } }
function setPlayerName(n){ try{ localStorage.setItem("maguro3d3-name",n); }catch(e){}
  $("#whoName").textContent=n||"ゲスト"; }
function loadRecs(){try{return JSON.parse(localStorage.getItem("maguro3d3-rec"))||{};}catch(e){return{};}}
function saveRec(m,sec,miss){try{var r=loadRecs();r[m]=r[m]||[];var d=new Date(),id=Date.now();
  r[m].push({sec:+sec.toFixed(1),miss:miss,at:(d.getMonth()+1)+"/"+d.getDate(),who:playerName(),id:id});
  r[m].sort(function(a,b){return a.sec-b.sec;});r[m]=r[m].slice(0,8);
  localStorage.setItem("maguro3d3-rec",JSON.stringify(r));
  state.recId=id; return r[m].length>0&&r[m][0].id===id;}catch(e){return false;}}
function renderRec(){
  var r=loadRecs(),l=r[state.mode]||[];
  var h='<h4>'+(state.mode==="kaitai"?"かいたいタイム ベスト":"組み立てタイム ベスト")+'</h4>';
  if(!l.length) h+='<p class="none">まだ記録がありません。</p>';
  else{h+='<ol class="reclist">';
    l.slice(0,5).forEach(function(e){
      h+='<li'+(e.id&&e.id===state.recId?' class="now"':'')+'>'+
         '<span class="who">'+esc(e.who||"ゲスト")+'</span>'+
         '<span class="tm">'+fmt(e.sec)+'</span>'+
         '<span class="ms">'+(e.miss?'ミス'+e.miss:'ミス0')+'</span></li>';
    });
    h+='</ol>';}
  $("#doneRec").innerHTML=h;
}
/* ================= 進行 ================= */
function elapsed(){ return (state.acc+(state.t0?performance.now()-state.t0:0))/1000; }
function tickOn(){ if(state.tick)return;
  state.tick=setInterval(function(){$("#hdrTime").textContent="⏱ "+fmt(elapsed());},100); }
function startClock(){ if(state.mode!=="kumitate")return; if(state.t0)return; state.started=true; state.t0=performance.now(); tickOn(); }
function pauseClock(){ if(state.t0){ state.acc+=performance.now()-state.t0; state.t0=0; }
  if(state.tick){clearInterval(state.tick);state.tick=null;} $("#hdrTime").textContent="⏱ "+fmt(elapsed()); }
function resumeClock(){ if(state.started&&!state.t0){ state.t0=performance.now(); tickOn(); } }
function stopClock(){ pauseClock(); state.started=false; state.acc=0; }
function removePart(id){
  var p=byId[id]; if(p.state!=="home") return;
  startClock(); p.state="fly"; state.removed.push(id); state.order.push(id);
  sfx('cut');
  p.mesh.material.transparent=true;
  anim({mesh:p.mesh,p1:p.home.clone().addScaledVector(p.dir,3.6),s1:0.8,fade:1,dur:520,
    end:function(){ p.state="off"; p.mesh.visible=false; p.mesh.material.opacity=1; p.mesh.material.transparent=false;
      p.mesh.position.copy(p.home); p.mesh.scale.set(1,1,1); }});
  showNow(id); updateHud(); refresh(); renderStrip();
  var c=strip.querySelector('[data-id="'+id+'"]'); if(c) c.classList.add("in");
  if(state.removed.length===TOTAL) setTimeout(finish,900);
}
function flash(mesh){
  var m=mesh.material; if(!m.emissive) return;
  m.emissive.setHex(0xffffff); m.emissiveIntensity=1;
  var st=performance.now();
  (function fade(){
    var k=Math.min(1,(performance.now()-st)/420);
    m.emissive.setScalar(0.9*(1-k));
    if(k<1) requestAnimationFrame(fade); else m.emissive.setHex(0x000000);
  })();
}
function unplacePart(id){
  var p=byId[id]; if(p.state!=="home") return;
  p.state="off";
  var i=state.placed.indexOf(id); if(i>=0) state.placed.splice(i,1);
  if(state.order.indexOf(id)<0) state.order.unshift(id);
  sfx("cut");
  p.mesh.material.transparent=true;
  anim({mesh:p.mesh,p1:p.home.clone().addScaledVector(p.dir,3.0),s1:0.85,fade:1,dur:380,
    end:function(){ p.mesh.visible=false; p.mesh.material.opacity=1; p.mesh.material.transparent=false;
      p.mesh.position.copy(p.home); p.mesh.scale.set(1,1,1); }});
  showNow(id); updateHud(); refresh(); renderStrip();
}
function placePart(id){
  var p=byId[id]; p.state="home"; state.placed.push(id);
  if(state.order.indexOf(id)>=0) state.order.splice(state.order.indexOf(id),1);
  p.mesh.visible=true; p.mesh.scale.set(1,1,1);
  p.mesh.position.copy(p.home).addScaledVector(p.dir,2.4);
  anim({mesh:p.mesh,p1:p.home.clone(),dur:300});
  sfx("snap"); flash(p.mesh);
  showNow(id); updateHud(); refresh(); renderStrip();
  if(state.placed.length===TOTAL) setTimeout(finish,700);
}
function rankOf(sec,miss,mode){
  var v=(mode==="kaitai")?sec:sec+miss*5;
  if(v<=75)  return {n:3,t:"まぐろ名人！"};
  if(v<=165) return {n:2,t:"いい腕まえ！"};
  return {n:1,t:"よくできました！"};
}
function confetti(on){
  var box=$("#confetti"); if(!box) return; box.innerHTML="";
  if(!on) return;
  var cols=["#E0353F","#F2A23C","#2E8AEC","#3DBE6B","#C9922B","#E86A8E","#FFFFFF"];
  for(var i=0;i<46;i++){
    var s=document.createElement("i");
    s.style.left=(Math.random()*100).toFixed(1)+"%";
    s.style.background=cols[i%cols.length];
    s.style.animationDelay=(Math.random()*2.2).toFixed(2)+"s";
    s.style.animationDuration=(2.4+Math.random()*2.2).toFixed(2)+"s";
    box.appendChild(s);
  }
}
/* ===== 完成画面を自由に泳ぐ、ちいさなマグロ ===== */
var FISH_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 42">'
 +'<path d="M19 21 L3 5 L10 21 L3 37 Z" fill="#26456A"/>'
 +'<path d="M36 9 L45 2 L49 11 Z" fill="#26456A"/>'
 +'<path d="M34 30 L40 40 L48 30 Z" fill="#26456A"/>'
 +'<ellipse cx="39" cy="21" rx="25" ry="13.5" fill="#3E6E9B"/>'
 +'<ellipse cx="40" cy="26.5" rx="22" ry="7.5" fill="#EDF4F8"/>'
 +'<path d="M36 24 L30 32 L42 28 Z" fill="#2E5580" opacity=".92"/>'
 +'<circle cx="53" cy="18" r="5" fill="#fff"/><circle cx="54.4" cy="18" r="2.8" fill="#18202A"/>'
 +'<circle cx="55.5" cy="16.7" r="1" fill="#fff"/>'
 +'<ellipse cx="48" cy="25" rx="3.6" ry="2.3" fill="#F2929F" opacity=".8"/>'
 +'<path d="M63 22 q-3.5 2.4 -6 .4" stroke="#18202A" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
 +'</svg>';
/* キハダマグロ（黄色いひれと側線） */
var FISH2_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 68 42">'
 +'<path d="M19 21 L3 5 L10 21 L3 37 Z" fill="#E9C33C"/>'
 +'<path d="M33 12 Q29 2 22 1 Q31 6 32 13 Z" fill="#F4D24B"/>'
 +'<path d="M33 30 Q29 40 22 41 Q31 36 32 29 Z" fill="#F4D24B"/>'
 +'<path d="M36 9 L45 2 L49 11 Z" fill="#31618C"/>'
 +'<ellipse cx="39" cy="21" rx="25" ry="13.5" fill="#4C82AB"/>'
 +'<ellipse cx="40" cy="26.5" rx="22" ry="7.5" fill="#F7F3DF"/>'
 +'<path d="M17 19.5 Q36 16.5 61 19 L61 22.4 Q36 20.4 17 23 Z" fill="#F0CB46" opacity=".9"/>'
 +'<path d="M22 11 l3 -3 l2 3 Z M27 9.5 l3 -3 l2 3 Z" fill="#F0CB46"/>'
 +'<path d="M22 31 l3 3 l2 -3 Z M27 32.5 l3 3 l2 -3 Z" fill="#F0CB46"/>'
 +'<path d="M36 24 L30 32 L42 28 Z" fill="#E9C33C" opacity=".95"/>'
 +'<circle cx="53" cy="18" r="5" fill="#fff"/><circle cx="54.4" cy="18" r="2.8" fill="#18202A"/>'
 +'<circle cx="55.5" cy="16.7" r="1" fill="#fff"/>'
 +'<ellipse cx="48" cy="25" rx="3.6" ry="2.3" fill="#F2929F" opacity=".8"/>'
 +'<path d="M63 22 q-3.5 2.4 -6 .4" stroke="#18202A" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
 +'</svg>';
var swimRaf=null, swimBub=0;
function swimStart(on){
  var box=$("#swim"); if(!box) return;
  if(swimRaf){ cancelAnimationFrame(swimRaf); swimRaf=null; }
  box.innerHTML=""; if(!on) return;
  var rr=box.getBoundingClientRect(), W=rr.width||360, H=rr.height||560, FW=56, FH=35;
  var fs=[];
  for(var i=0;i<4;i++){
    var el=document.createElement("div"); el.className="fishy";
    el.innerHTML=(i===3)?FISH2_SVG:FISH_SVG;        /* 1ぴきは キハダマグロ */
    box.appendChild(el);
    fs.push({el:el,x:Math.random()*Math.max(10,W-FW),y:26+Math.random()*Math.max(10,H*0.55),
      vx:(Math.random()<0.5?-1:1)*(1.6+Math.random()*0.9),
      vy:(Math.random()<0.5?-1:1)*(0.5+Math.random()*0.6),
      ph:Math.random()*6.3,sc:(i===3?0.98:0.78+Math.random()*0.44)});
  }
  var last=performance.now();
  (function step(now){
    var dt=Math.min(48,now-last); last=now;
    var r2=box.getBoundingClientRect(), w=r2.width, h=r2.height;
    fs.forEach(function(f){
      var fw=FW*f.sc, fh=FH*f.sc;
      f.x+=f.vx*dt*0.055; f.y+=f.vy*dt*0.055; f.ph+=dt*0.005;
      if(f.x<0){f.x=0;f.vx=Math.abs(f.vx);}
      if(f.x>w-fw){f.x=w-fw;f.vx=-Math.abs(f.vx);}
      if(f.y<0){f.y=0;f.vy=Math.abs(f.vy);}
      if(f.y>h-fh){f.y=h-fh;f.vy=-Math.abs(f.vy);}
      var bob=Math.sin(f.ph)*3.5, tilt=Math.sin(f.ph)*4;
      f.el.style.transform="translate("+f.x.toFixed(1)+"px,"+(f.y+bob).toFixed(1)+"px) "
        +"scale("+(f.vx<0?-f.sc:f.sc)+","+f.sc+") rotate("+tilt.toFixed(1)+"deg)";
    });
    if(now-swimBub>700){                 /* ときどき あぶく */
      swimBub=now;
      var f0=fs[Math.floor(Math.random()*fs.length)];
      var b=document.createElement("span"); b.className="bub";
      var d=5+Math.random()*7;
      b.style.width=b.style.height=d+"px";
      b.style.left=(f0.x+(f0.vx<0?2:48))+"px"; b.style.top=(f0.y+8)+"px";
      b.style.animationDuration=(1.6+Math.random()*1.2)+"s";
      box.appendChild(b); setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); },3000);
    }
    swimRaf=requestAnimationFrame(step);
  })(last);
}
function finish(){
  if(state.mode==="kaitai"){          /* 解体はタイムも結果画面もなし。つぎの行き先を出すだけ */
    state.finished=true; sfx("done");
    $("#vbLeft").hidden=true; $("#vbHint").hidden=true; $("#vbMiss").hidden=true;
    $("#doneNav").hidden=false;
    return;
  }
  var sec=elapsed();                 /* ← タイマーを止める前に読む */
  stopClock();
  var best=saveRec(state.mode,sec,state.miss);
  var rk=rankOf(sec,state.miss,state.mode);
  var nm=playerName();
  $("#doneHello").textContent=nm?nm+"さん、おつかれさま！":"おつかれさま！";
  $("#doneStars").innerHTML="<i>★</i><i"+(rk.n<2?' class="off"':"")+">★</i><i"+(rk.n<3?' class="off"':"")+">★</i>";
  $("#doneRank").textContent=rk.t;
  $("#doneBest").hidden=!best;
  $("#doneTtl").textContent=state.mode==="kaitai"?"解体完了！":"完成！";
  $("#doneTime").textContent=fmt(sec);
  $("#doneMeta").textContent=(state.mode==="kaitai"
    ?TOTAL+"パーツ ぜんぶはずせました！"
    :"ミス "+state.miss+"かい／ヒント "+state.hints+"かい。");
  $("#doneOther").textContent=state.mode==="kaitai"?"組み立てに挑戦":"もう一度 解体する";
  renderRec(); sfx("done");
  state.finished=true;
  $("#vbHint").hidden=true; $("#vbMiss").hidden=true;
  $("#doneBanner").innerHTML="✨ 完成！　回してながめられます<br>タップで結果へ";
  $("#doneBanner").hidden=false;
}
function showDone(){ state.finished=false; $("#doneBanner").hidden=true; $("#doneNav").hidden=true;
  if(state.mode==="kaitai"){ startMode("kumitate"); return; }
  go("done"); }
/* ================= カメラ（カーソル起点） ================= */
var ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ptrs=new Map();
var dragging=false,moved=0,lastX=0,lastY=0,pinch0=0;
function ndcOf(cx,cy){var r=canvas.getBoundingClientRect();
  ndc.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);return ndc;}
function allHit(){
  var out=[];
  PARTS.forEach(function(p){ if(p.mesh.visible) out.push(p.mesh); });
  frameGroup.children.forEach(function(m){ out.push(m); });
  return out;
}
function worldAt(cx,cy){
  ray.setFromCamera(ndcOf(cx,cy),camera);
  var h=ray.intersectObjects(allHit(),false);
  return h.length?h[0].point.clone():null;
}
function pivotAt(cx,cy){
  var w=worldAt(cx,cy);
  if(!w){                                     /* 何も無い所なら、いまの中心と同じ奥ゆきの面で取る */
    ray.setFromCamera(ndcOf(cx,cy),camera);
    var n=camera.getWorldDirection(new THREE.Vector3());
    var pl=new THREE.Plane().setFromNormalAndCoplanarPoint(n,state.cam.target);
    w=new THREE.Vector3(); if(!ray.ray.intersectPlane(pl,w)) return false;
  }
  state.cam.tTarget.copy(w); return true;
}
function pivotMark(cx,cy){                    /* 中心にした所に、印をひとつ出す */
  var m=document.createElement("span"); m.className="pivotmark";
  m.style.left=cx+"px"; m.style.top=cy+"px";
  document.body.appendChild(m);
  setTimeout(function(){ if(m.parentNode) m.parentNode.removeChild(m); },700);
}
function fitDist(){
  var vf=camera.fov*Math.PI/180,hh=Math.atan(Math.tan(vf/2)*camera.aspect);
  return Math.max(7.6/Math.tan(hh),5.0/Math.tan(vf/2));
}
function updateCam(){
  var c=state.cam;
  if(state.spin&&!dragging&&!state.drag) c.tYaw+=0.0028;
  c.yaw+=(c.tYaw-c.yaw)*0.15; c.pitch+=(c.tPitch-c.pitch)*0.15; c.zoom+=(c.tZoom-c.zoom)*0.14;
  c.target.lerp(c.tTarget,0.16);
  var d=fitDist()*c.zoom;
  camera.position.set(c.target.x+d*Math.cos(c.pitch)*Math.sin(c.yaw),
                      c.target.y+d*Math.sin(c.pitch),
                      c.target.z+d*Math.cos(c.pitch)*Math.cos(c.yaw));
  camera.lookAt(c.target);
}
function resetCam(){var c=state.cam;c.tYaw=-0.55;c.tPitch=0.22;c.tZoom=1;c.tTarget.copy(FISH_CENTER);}
/* ================= 入力 ================= */
canvas.addEventListener("pointerdown",function(ev){
  try{canvas.setPointerCapture(ev.pointerId);}catch(e){}
  ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(ptrs.size===2){var a=Array.from(ptrs.values());pinch0=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);return;}
  dragging=true; moved=0; lastX=ev.clientX; lastY=ev.clientY;
  canvas.classList.add("grabbing");
});
canvas.addEventListener("pointermove",function(ev){
  if(ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
  if(ptrs.size===2){
    var a=Array.from(ptrs.values()),d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
    if(pinch0>0){
      var mx=(a[0].x+a[1].x)/2,my=(a[0].y+a[1].y)/2;
      if(d>pinch0) pivotAt(mx,my);
      state.cam.tZoom=Math.max(0.28,Math.min(2.2,state.cam.tZoom*(pinch0/d)));
    }
    pinch0=d; moved=99; return;
  }
  if(dragging){
    var dx=ev.clientX-lastX,dy=ev.clientY-lastY;
    moved+=Math.abs(dx)+Math.abs(dy); lastX=ev.clientX; lastY=ev.clientY;
    if(moved>4){
      if(state.spin) state.spin=false;
      state.cam.tYaw-=dx*0.007;
      state.cam.tPitch=Math.max(-1.3,Math.min(1.3,state.cam.tPitch+dy*0.006));
    }
  }
});
var TAPWAIT=230, TAPNEAR=22;     /* この時間内に、この距離内で2回目が来たら「ダブルタップ」 */
var tapTimer=null, tapPend=null, lastTap=0, lastTX=0, lastTY=0;
function tapClear(){ if(tapTimer){ clearTimeout(tapTimer); tapTimer=null; } tapPend=null; }
function tapFlush(){                     /* 待っている分があれば、すぐ実行する */
  if(tapTimer){ clearTimeout(tapTimer); tapTimer=null; }
  var f=tapPend; tapPend=null; if(f) f();
}
function tapAction(cx,cy){
  ray.setFromCamera(ndcOf(cx,cy),camera);
  var list=[]; PARTS.forEach(function(p){ if(p.state==="home") list.push(p.mesh); });
  var h=ray.intersectObjects(list,false);
  if(h.length){ if(state.mode==="kaitai") removePart(h[0].object.userData.id);
                else unplacePart(h[0].object.userData.id); }
  else if(state.mode==="kaitai"){
    var hf=ray.intersectObject(frameGroup,true);
    if(hf.length){ sfx("ng"); tellFixed(); }
  }
}
function upCanvas(ev){
  ptrs.delete(ev.pointerId); if(ptrs.size<2) pinch0=0;
  var wasDrag=moved>4; dragging=false; canvas.classList.remove("grabbing");
  /* パーツをつまんでいる間／置いた直後は、置いたパーツを外さない */
  if(state.drag||performance.now()-(state.dropAt||0)<420) return;
  if(!wasDrag&&state.screen==="play"){
    if(state.finished){ if(state.mode!=="kaitai") showDone(); return; }     /* 完成後はどこをタップしても結果へ */
    var now=performance.now(), cx=ev.clientX, cy=ev.clientY;
    if(now-lastTap<TAPWAIT && Math.abs(cx-lastTX)<TAPNEAR && Math.abs(cy-lastTY)<TAPNEAR){
      tapClear();                        /* 同じ所の2回目 ＝ 1回目の動作は取り消す */
      lastTap=0;
      if(state.spin) state.spin=false;
      if(pivotAt(cx,cy)) pivotMark(cx,cy);
      return;
    }
    tapFlush();                          /* 別の所を続けて押したときは、前の分を先に実行 */
    lastTap=now; lastTX=cx; lastTY=cy;
    tapPend=function(){ tapAction(cx,cy); };
    tapTimer=setTimeout(function(){ tapTimer=null; var f=tapPend; tapPend=null; if(f) f(); }, TAPWAIT);
  }
}
canvas.addEventListener("pointerup",upCanvas);
canvas.addEventListener("pointercancel",function(ev){ptrs.delete(ev.pointerId);dragging=false;canvas.classList.remove("grabbing");});
canvas.addEventListener("wheel",function(ev){
  ev.preventDefault();
  if(ev.deltaY<0) pivotAt(ev.clientX,ev.clientY);
  state.cam.tZoom=Math.max(0.28,Math.min(2.2,state.cam.tZoom*(1+ev.deltaY*0.0013)));
},{passive:false});
/* ---- 下のパーツ置き場からドラッグ ---- */
function endDrag(){                     /* つまんでいる状態を必ず後始末する */
  var d=state.drag; if(!d) return;
  state.drag=null; state.dropAt=performance.now();
  if(d.el&&d.el.parentNode) d.el.parentNode.removeChild(d.el);
  if(d.card) d.card.classList.remove("held");
  refresh();
}
/* 指が離れずに中断された・アプリが裏に回った等でも、必ず戻す */
window.addEventListener("blur",function(){ sdrag=null; endDrag(); });
document.addEventListener("visibilitychange",function(){ if(document.hidden){ sdrag=null; endDrag(); } });
document.addEventListener("pointercancel",function(){ sdrag=null; endDrag(); });

/* ===== パーツ置き場の指づかい =====
   指の動く向きを自分で見て、横なら置き場をスクロール、縦ならパーツをつまむ。
   ブラウザに判断させると、途中で操作を横取りされてパーツが指から離れてしまう。 */
var sdrag=null;
function beginDrag(id,card,x,y){
  var f=document.createElement("img");
  f.className="floatpiece"; f.src=THUMB[id]||"";
  f.style.left=x+"px"; f.style.top=y+"px";
  document.body.appendChild(f);
  state.drag={id:id,el:f,card:card,ok:false};
  card.classList.add("held");
  refresh();
}
strip.addEventListener("pointerdown",function(ev){
  sdrag=null; endDrag();                /* 前のつまみが残っていたら先に片づける */
  var card=ev.target.closest(".pcard2"); if(!card) return;
  var id=card.getAttribute("data-id");
  showNow(id);
  if(state.mode!=="kumitate") return;
  ev.preventDefault();
  sdrag={id:id,card:card,x0:ev.clientX,y0:ev.clientY,sl:strip.scrollLeft,mode:0,pid:ev.pointerId};
  try{ strip.setPointerCapture(ev.pointerId); }catch(e){}   /* 置き場ごと押さえる（カードは入れ替わるので） */
});
strip.addEventListener("pointermove",function(ev){
  if(!sdrag||ev.pointerId!==sdrag.pid) return;
  var dx=ev.clientX-sdrag.x0, dy=ev.clientY-sdrag.y0;
  if(sdrag.mode===0){
    if(Math.abs(dx)<7&&Math.abs(dy)<7) return;             /* まだどちらか決まらない */
    if(Math.abs(dx)>Math.abs(dy)){ sdrag.mode=1; }         /* 横 → スクロール */
    else { sdrag.mode=2; beginDrag(sdrag.id,sdrag.card,ev.clientX,ev.clientY); }  /* 縦 → つまむ */
  }
  if(sdrag.mode===1){ strip.scrollLeft=sdrag.sl-dx; stripArrows(); }
});
function nearHome(cx,cy,p){
  var r=canvas.getBoundingClientRect();
  if(cx<r.left||cx>r.right||cy<r.top||cy>r.bottom) return false;
  ray.setFromCamera(ndcOf(cx,cy),camera);
  return ray.ray.distanceToPoint(p.home)<1.35;
}
document.addEventListener("pointermove",function(ev){
  var d=state.drag; if(!d) return;
  d.el.style.left=ev.clientX+"px"; d.el.style.top=ev.clientY+"px";
  var p=byId[d.id], ok=nearHome(ev.clientX,ev.clientY,p);
  if(ok!==d.ok){ d.ok=ok; if(performance.now()<state.hintUntil) d.el.classList.toggle("hit",ok); }
});
document.addEventListener("pointerup",function(ev){
  if(sdrag&&ev.pointerId===sdrag.pid) sdrag=null;
  var d=state.drag; if(!d) return;
  state.drag=null; state.dropAt=performance.now();
  if(d.el&&d.el.parentNode) d.el.parentNode.removeChild(d.el);
  d.card.classList.remove("held");
  var p=byId[d.id], r=canvas.getBoundingClientRect();
  var over=(ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom);
  startClock();
  var blk=nearHome(ev.clientX,ev.clientY,p)?blockedBy(p):null;
  if(!blk&&nearHome(ev.clientX,ev.clientY,p)) placePart(d.id);
  else { if(over){ state.miss++; updateHud(); sfx("ng"); if(blk) tellBlocked(blk);
      var c2=strip.querySelector('[data-id="'+d.id+'"]'); if(c2){ c2.classList.add("shake"); setTimeout(function(){c2.classList.remove("shake");},420); } }
    refresh(); }
});

/* ===== はめる順番のルール =====
   自分の上（手前）にかぶさるパーツが置かれていると、そこへはめられない。
   先にそれを外して、はめる場所が見えるようにしてもらう。 */
function fpBox(p){
  var g=p.g;
  if(g.blob) return [g.u-0.035,g.u+0.035,g.t-0.14,g.t+0.14];
  return [Math.min(g.u0,g.u1),Math.max(g.u0,g.u1),Math.min(g.t0,g.t1),Math.max(g.t0,g.t1)];
}
function depthRank(p){
  if(p.layer<=1) return 6;   /* 皮・あたま（いちばん手前） */
  if(p.layer===2) return 5;  /* 外の身A・カマ */
  if(p.layer===3) return 4;  /* あかみA */
  if(p.layer===4) return 3;  /* なかおち */
  if(p.layer===5) return 2;  /* あかみB */
  return 1;                  /* 中の身B・内臓 */
}
function blockedBy(p){
  var a=fpBox(p),r=depthRank(p),hit=null;
  PARTS.forEach(function(q){
    if(hit||q===p||q.state!=="home"||depthRank(q)<=r) return;
    var b=fpBox(q);
    var ou=Math.min(a[1],b[1])-Math.max(a[0],b[0]);      /* 前後の重なり */
    var ot=Math.min(a[3],b[3])-Math.max(a[2],b[2]);      /* 上下の重なり */
    if(ou<=0||ot<=0) return;
    /* ふちがかすっているだけなら「上にのっている」とはみなさない */
    var su=Math.min(a[1]-a[0], b[1]-b[0]), st=Math.min(a[3]-a[2], b[3]-b[2]);
    if(ou < Math.max(0.035, su*0.25)) return;
    if(ot < Math.max(0.06,  st*0.25)) return;
    hit=q;
  });
  return hit;
}
function tellFixed(){
  var b=$("#nowBar"); b.className="nowbar";
  b.innerHTML='<span class="tx"><span class="nm" style="color:var(--red-d)">ここは はずせません</span>'+
    '<span class="ds">あたま・ひれ・ふちは、はずせない部分です。</span></span>';
}
function tellBlocked(q){
  var b=$("#nowBar"); b.className="nowbar";
  b.innerHTML='<span class="sw"></span><span class="tx">'+
    '<span class="nm" style="color:var(--red-d)">まだ はめられません</span>'+
    '<span class="ds">上にのっている「'+KIND[q.kind].n+(q.side||"")+'」を先にタップして外してね。</span></span>';
}
function applyLabels(){
  PARTS.forEach(function(p){
    p.mesh.material.map=state.hideLabel?p.texPlain:p.texLabel;
    p.mesh.material.needsUpdate=true;
  });
}
/* ================= 画面 ================= */
function viewBtns(){ layoutBottom(); }
function layoutBottom(){        /* 下の列の高さに合わせて、完成の帯を上へ逃がす */
  var h=($("#cornerBar")&&$("#cornerBar").offsetHeight)||0;
  var b=(h?h+14:12)+"px";
  $("#doneBanner").style.bottom=b; $("#doneNav").style.bottom=b;
}
function go(name,opt){
  state.screen=name; app.className="app t-"+name;
  ["Title","Howto","Parts","Done","Name"].forEach(function(n){
    $("#ov"+n).classList.toggle("hide",name!==n.toLowerCase());
  });
  $("#hdr").classList.toggle("hide",name==="title"||name==="done"||name==="name");
  $("#playBody").hidden=name!=="play";
  $("#barWrap").hidden=name!=="play";
  $("#countPill").hidden=name!=="play";
  $("#btnPause").hidden=name!=="play";
  $("#layerPill").hidden=name!=="play";
  $("#vbHint").hidden=!(name==="play"&&state.mode==="kumitate");
  $("#vbMiss").hidden=!(name==="play"&&state.mode==="kumitate");
  $("#vbLeft").hidden=name!=="play";
  $("#hdrTime").hidden=!(name==="play"&&state.mode==="kumitate");
  if(name==="howto") $("#hdrTitle").textContent="あそびかた";
  if(name==="parts"){ $("#hdrTitle").textContent="パーツ一覧"; renderParts(); }
  if(name==="title"){ stopClock(); wholeFish(); state.spin=true; resetCam();
    state.cam.tTarget.set(0.3,-2.55,0); state.cam.target.set(0.3,-2.55,0);
    state.cam.tZoom=0.92; }
  if(name==="play"&&opt!=="resume") resetMode();
  canvas.classList.toggle("knife",name==="play"&&state.mode==="kaitai");
  tapClear(); viewBtns(); keepAwake(name==="play");
  confetti(name==="done"); swimStart(name==="done");
  setTimeout(resize,0);
}
function wholeFish(){
  tw.length=0; state.mode="kaitai";
  PARTS.forEach(function(p){ p.state="home"; p.mesh.position.copy(p.home); p.mesh.scale.set(1,1,1);
    p.mesh.material.opacity=1; p.mesh.material.transparent=false; });
  refresh();
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function resetMode(){
  stopClock(); tw.length=0; state.t0=0; state.acc=0; state.started=false; state.miss=0; state.drag=null;
  state.finished=false; $("#doneBanner").hidden=true;
  $("#hdrTime").textContent="⏱ 0:00";
  PARTS.forEach(function(p){ p.mesh.position.copy(p.home); p.mesh.scale.set(1,1,1);
    p.mesh.material.opacity=1; p.mesh.material.transparent=false; });
  if(state.mode==="kaitai"){
    state.removed=[];state.placed=[];state.order=[];
    PARTS.forEach(function(p){p.state="home";});
  }else{
    state.removed=[];state.placed=[];
    PARTS.forEach(function(p){p.state="off";});
    var by=[[],[],[],[],[],[],[]]; PARTS.forEach(function(p){by[p.layer].push(p.id);});
    state.order=shuffle(by[6]).concat(shuffle(by[5]),shuffle(by[4]),shuffle(by[3]),shuffle(by[2]),shuffle(by[1]),shuffle(by[0]));
  }
  resetCam(); state.spin=false;
  refresh(); renderStrip(); showNow(null); updateHud();
  $("#hdrTitle").textContent=state.mode==="kaitai"?"マグロを解体しよう":"元どおりに組み立てよう";
  $("#vbHint").hidden=state.mode!=="kumitate";
  $("#vbMiss").hidden=state.mode!=="kumitate";
  $("#vbLeft").hidden=false;
  state.hints=0; state.hintUntil=0;
}
function startMode(m){ state.mode=m; go("play"); }
var MI={sekami:1,senaka:1,seshimo:1,akami:1,harakami:1,haranaka:1,harashimo:1,kama:1,kamatoro:1};
function renderParts(){
  var g1=[],g2=[];
  PARTS.forEach(function(p){
    var k=KIND[p.kind];
    var h='<li><button class="pcard'+(k.rare?" rare":"")+'" aria-expanded="false"><img src="'+(THUMB[p.id]||"")+'" alt="">'+
      '<b>'+k.n+(p.side||'')+'</b><small>'+k.g+'</small>'+(k.rare?'<span class="rb">希少部位</span>':"")+
      '<span class="ds">'+k.d+'</span></button></li>';
    (MI[p.kind]?g2:g1).push(h);
  });
  $("#partsList").innerHTML='<div class="grp">皮・頭・骨・内臓・尾</div><ul class="plist">'+g1.join("")+'</ul>'+
    '<div class="grp">中トロ・大トロ・赤身などの身</div><ul class="plist">'+g2.join("")+'</ul>'+
    '<p style="font-size:11.5px;font-weight:700;color:var(--ink-2);text-align:center">カードをタップすると説明が出ます</p>';
}
$("#partsList").addEventListener("click",function(ev){
  var b=ev.target.closest(".pcard"); if(!b) return;
  b.setAttribute("aria-expanded",b.getAttribute("aria-expanded")==="true"?"false":"true");
});
$("#goKaitai").addEventListener("click",function(){startMode("kaitai");});
$("#goKumitate").addEventListener("click",function(){startMode("kumitate");});
$("#goHowto").addEventListener("click",function(){go("howto");});
$("#goParts").addEventListener("click",function(){go("parts");});
$("#howtoStart").addEventListener("click",function(){startMode("kaitai");});
function openSheet(){ pauseClock();
  $("#pauseTtl").textContent=(state.mode==="kumitate")?"ちょっと休けい（タイマーは止まっています）":"ちょっと休けい";
  $("#sheet").classList.remove("hide"); }
$("#btnBack").addEventListener("click",function(){ if(state.screen==="play") openSheet(); else go("title"); });
$("#btnPause").addEventListener("click",openSheet);
$("#pvResume").addEventListener("click",function(){$("#sheet").classList.add("hide");resumeClock();});
$("#pvRestart").addEventListener("click",function(){$("#sheet").classList.add("hide");resetMode();});
$("#pvTop").addEventListener("click",function(){$("#sheet").classList.add("hide");go("title");});
$("#sheet").addEventListener("click",function(ev){if(ev.target===this)this.classList.add("hide");});
$("#doneAgain").addEventListener("click",function(){startMode(state.mode);});
$("#doneOther").addEventListener("click",function(){startMode(state.mode==="kaitai"?"kumitate":"kaitai");});
$("#doneTop").addEventListener("click",function(){go("title");});
$("#doneBanner").addEventListener("click",showDone);
$("#navTop").addEventListener("click",function(){ state.finished=false; $("#doneNav").hidden=true; go("title"); });
$("#navAgain").addEventListener("click",function(){ state.finished=false; $("#doneNav").hidden=true; startMode("kaitai"); });
$("#navNext").addEventListener("click",function(){ state.finished=false; $("#doneNav").hidden=true; startMode("kumitate"); });
$("#pvLabel").addEventListener("click",function(){
  state.hideLabel=!state.hideLabel; applyLabels();
  this.textContent=state.hideLabel?"部位名をだす":"部位名をかくす（上級）";
});
function hintTarget(){
  if(state.drag) return state.drag.id;
  if(state.mode==="kaitai"){                 /* いま外せる＝ほかのパーツにおおわれていない */
    var free0=PARTS.filter(function(p){ return p.state==="home"&&!blockedBy(p); });
    free0.sort(function(a,b){ return a.layer-b.layer; });
    return free0.length?free0[0].id:null;
  }
  var l=layerNow(); if(l<0) return null;
  var cand=PARTS.filter(function(p){ return p.layer===l&&p.state!=="home"; });
  var free=cand.filter(function(p){ return !blockedBy(p); });
  if(free.length) return free[0].id;
  /* いまの層が全部ふさがっていたら、はめられるパーツをどれか指す */
  var any=PARTS.filter(function(p){ return p.state!=="home"&&!blockedBy(p); });
  if(any.length) return any[0].id;
  return cand.length?cand[0].id:null;
}
$("#vbHint").addEventListener("click",function(){
  var id=hintTarget(); if(!id) return;
  state.hints++; state.hintId=id; state.hintUntil=performance.now()+3500;
  var p=byId[id]; showNow(id); refresh();
  setTimeout(function(){ state.hintId=null; refresh(); },3600);
});
/* ---- なまえ ---- */
function askName(){ $("#nameInput").value=playerName(); go("name"); setTimeout(function(){$("#nameInput").focus();},60); }
$("#btnName").addEventListener("click",askName);
$("#nameOk").addEventListener("click",function(){
  var v=$("#nameInput").value.trim().slice(0,8);
  setPlayerName(v||"ゲスト"); go("title");
});
$("#nameInput").addEventListener("keydown",function(ev){ if(ev.key==="Enter") $("#nameOk").click(); });
document.addEventListener("keydown",function(ev){if(ev.key==="Escape")$("#sheet").classList.add("hide");});
/* ================= スマホでアプリらしく ================= */
(function(){
  try{
    var vp=document.querySelector('meta[name="viewport"]');
    if(vp&&vp.content.indexOf("viewport-fit")<0) vp.content+=",viewport-fit=cover";
    function meta(n,c){ var m=document.createElement("meta"); m.name=n; m.content=c; document.head.appendChild(m); }
    meta("apple-mobile-web-app-capable","yes");          /* ホーム画面から全画面で開く */
    meta("mobile-web-app-capable","yes");
    meta("apple-mobile-web-app-status-bar-style","default");
    meta("apple-mobile-web-app-title","マグロパズル");
    meta("theme-color","#1B74D8");
  }catch(e){}
})();
var wakeLock=null;                                        /* 遊んでいる間は画面を消さない */
function keepAwake(on){
  try{
    if(on){
      if(!wakeLock&&navigator.wakeLock) navigator.wakeLock.request("screen").then(function(w){
        wakeLock=w; w.addEventListener("release",function(){ wakeLock=null; });
      }).catch(function(){});
    }else if(wakeLock){ wakeLock.release(); wakeLock=null; }
  }catch(e){}
}
document.addEventListener("visibilitychange",function(){
  if(document.visibilityState==="visible"&&state.screen==="play") keepAwake(true);
});
/* ================= 起動 ================= */
function resize(){
  layoutBottom();
  var w=canvas.clientWidth||420,h=canvas.clientHeight||300;
  renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize);
if(window.ResizeObserver) new ResizeObserver(resize).observe(stageEl);
function loop(){requestAnimationFrame(loop);updateCam();stepTw(performance.now());renderer.render(scene,camera);}
window.__dbg={scene:scene,camera:camera,PARTS:PARTS,state:state,THREE:THREE};
resize();
try{ buildThumbs(); }catch(e){ window.__dbg.thumbErr=e.message; }
$("#loading").hidden=true;
try{$("#appVer").textContent=APP_VERSION;}catch(e){}
setPlayerName(playerName());
if(playerName()) go("title"); else { $("#nameInput").value=""; go("name"); }
loop();
})();
