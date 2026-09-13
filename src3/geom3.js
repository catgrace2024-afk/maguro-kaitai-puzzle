/* ===== マグロの立体パーツ（かみ合う波形の合わせ目つき） ===== */
var L=9;
var PROF=[
 [0.00,0.08,0.09,0.22],[0.05,0.72,0.72,0.14],[0.11,1.24,1.18,0.07],[0.18,1.62,1.50,0.02],
 [0.27,1.87,1.66,0.00],[0.38,1.95,1.70,0.00],[0.50,1.84,1.56,0.02],[0.62,1.56,1.26,0.05],
 [0.74,1.20,0.88,0.09],[0.84,0.82,0.56,0.12],[0.92,0.50,0.32,0.14],[0.97,0.29,0.17,0.15],
 [1.00,0.19,0.11,0.15]];
function cr(p0,p1,p2,p3,t){var t2=t*t,t3=t2*t;
  return 0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
function prof(u){
  u=Math.max(0,Math.min(1,u));
  var i=0; while(i<PROF.length-2&&PROF[i+1][0]<u) i++;
  var a=PROF[Math.max(0,i-1)],b=PROF[i],c=PROF[i+1],d=PROF[Math.min(PROF.length-1,i+2)];
  var t=(u-b[0])/(c[0]-b[0]||1);
  return {ry:Math.max(0.02,cr(a[1],b[1],c[1],d[1],t)),rz:Math.max(0.02,cr(a[2],b[2],c[2],d[2],t)),yc:cr(a[3],b[3],c[3],d[3],t)};
}
function P(u,t,s,o){
  var th=t*Math.PI,p=prof(u);
  o=o||new THREE.Vector3();
  return o.set((u-0.5)*L, p.yc+s*p.ry*Math.cos(th), s*p.rz*Math.sin(th));
}
/* 合わせ目の波（凹凸）。同じ境界値なら両側で必ず同じ形になる */
function knob(x){ return Math.tanh(2.6*Math.sin(2*Math.PI*x)); }
function ph(v){ var x=Math.sin(v*97.13)*43758.5453; return x-Math.floor(x); }
var AU=0.030, AT=0.055;
function seamU(uv,t){ return uv+AU*knob(ph(uv)+t*0.62); }
function seamT(tv,u){ return tv+AT*knob(ph(tv*3.1)+u*1.15); }

function addGrid(st,fn,na,nb,uva,uvb,flip){
  var base=st.pos.length/3,v=new THREE.Vector3(),i,j;
  for(i=0;i<=na;i++) for(j=0;j<=nb;j++){
    fn(i/na,j/nb,v); st.pos.push(v.x,v.y,v.z); st.uv.push(i/na*uva,j/nb*uvb);
  }
  for(i=0;i<na;i++) for(j=0;j<nb;j++){
    var a=base+i*(nb+1)+j,b=a+1,c=a+(nb+1),d=c+1;
    if(flip) st.idx.push(a,b,d,a,d,c); else st.idx.push(a,d,b,a,c,d);
  }
}
function shellGeo(g){
  var full=Math.abs(g.t1-g.t0)>=1.98;
  var EU=g.blob?0:0.007, ET=full?0:0.012;
  var RD=(g.round===0)?0:0.30;          /* ふちの丸み */
  function pos(a0,b0,c,o){
    var a=EU+a0*(1-2*EU), b=ET+b0*(1-2*ET);
    if(RD>0){
      var dd=Math.min(a0,1-a0,full?1:b0,full?1:(1-b0));
      var kk=Math.min(1,dd/0.10);
      c=c*(1-RD*(1-kk)*(1-kk));
    }
    var un=g.u0+(g.u1-g.u0)*a, tn=g.t0+(g.t1-g.t0)*b;
    var uL=g.ulo?g.ulo(tn):(g.wu0?seamU(g.u0,tn):g.u0),
        uR=g.uhi?g.uhi(tn):(g.wu1?seamU(g.u1,tn):g.u1);
    var tA=g.wt0?seamT(g.t0,un):g.t0, tB=g.wt1?seamT(g.t1,un):g.t1;
    return P(uL+(uR-uL)*a, tA+(tB-tA)*b, g.s0+(g.s1-g.s0)*c, o);
  }
  var q=(g.chunky?0.85:1);
  var nu=Math.max(3,Math.round((g.u1-g.u0)*44*q)),
      nt=Math.max(3,Math.round(Math.abs(g.t1-g.t0)*24*q)), ns=2;
  var st={pos:[],uv:[],idx:[]};
  var P0=0.06;   /* 側面は左上の無地エリアに寄せる */
  addGrid(st,function(a,b,v){pos(a,1-b,1,v);},nu,nt,1,1,true);              /* 外＝彫り文字面 */
  st.outerEnd=st.pos.length/3;
  addGrid(st,function(a,b,v){pos(a,b,0,v);},nu,nt,P0,P0,true);             /* 内 */
  addGrid(st,function(a,b,v){pos(0,a,b,v);},nt,ns,P0,P0,true);
  addGrid(st,function(a,b,v){pos(1,a,b,v);},nt,ns,P0,P0,false);
  if(!full){
    addGrid(st,function(a,b,v){pos(a,0,b,v);},nu,ns,P0,P0,false);
    addGrid(st,function(a,b,v){pos(a,1,b,v);},nu,ns,P0,P0,true);
  }
  var geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(st.pos,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(st.uv,2));
  geo.setIndex(st.idx); geo.computeVertexNormals();
  geo.userData={outerEnd:st.outerEnd};
  return geo;
}
function holeGeo(g){
  /* 長方形の板に「丸い穴」をあけたパーツ（めだま用） */
  var N=44, st={pos:[],uv:[],idx:[]};
  var wu=P(g.u0,(g.t0+g.t1)/2,g.s1).distanceTo(P(g.u1,(g.t0+g.t1)/2,g.s1));
  var wt=P((g.u0+g.u1)/2,g.t0,g.s1).distanceTo(P((g.u0+g.u1)/2,g.t1,g.s1));
  var ra=g.hr/Math.max(0.01,wu), rb=g.hr/Math.max(0.01,wt);
  var ca=g.ha||0.5, cb=g.hb||0.5;
  function ab(a,b,c,o){
    return P(g.u0+(g.u1-g.u0)*a, g.t0+(g.t1-g.t0)*b, g.s0+(g.s1-g.s0)*c, o);
  }
  function edge(th){
    var dx=Math.cos(th),dy=Math.sin(th),best=1e9;
    if(dx>1e-6) best=Math.min(best,(1-ca)/dx); if(dx<-1e-6) best=Math.min(best,(0-ca)/dx);
    if(dy>1e-6) best=Math.min(best,(1-cb)/dy); if(dy<-1e-6) best=Math.min(best,(0-cb)/dy);
    return [ca+dx*best, cb+dy*best];
  }
  var v=new THREE.Vector3();
  function push(a,b,c,ua,ub){ ab(a,b,c,v); st.pos.push(v.x,v.y,v.z); st.uv.push(ua,ub); }
  function quad(i0,i1,i2,i3){ st.idx.push(i0,i1,i2, i0,i2,i3); }
  for(var face=0;face<2;face++){
    var cc=face?0:1, base=st.pos.length/3;
    for(var i=0;i<=N;i++){
      var th=i/N*Math.PI*2;
      var ha=ca+Math.cos(th)*ra, hb=cb+Math.sin(th)*rb;
      var e=edge(th);
      push(ha,1-hb,cc,ha,hb); push(e[0],1-e[1],cc,e[0],e[1]);
    }
    for(var i2=0;i2<N;i2++){
      var o=base+i2*2;
      if(face) quad(o,o+1,o+3,o+2); else quad(o,o+2,o+3,o+1);
    }
  }
  var wb=st.pos.length/3;
  for(var i3=0;i3<=N;i3++){
    var th3=i3/N*Math.PI*2;
    var ha3=ca+Math.cos(th3)*ra, hb3=cb+Math.sin(th3)*rb;
    push(ha3,1-hb3,1,0.05,0.05); push(ha3,1-hb3,0,0.05,0.05);
  }
  for(var i4=0;i4<N;i4++){ var o4=wb+i4*2; quad(o4,o4+2,o4+3,o4+1); }
  var geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(st.pos,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(st.uv,2));
  geo.setIndex(st.idx); geo.computeVertexNormals();
  geo.userData={outerEnd:st.pos.length/3};
  return geo;
}
function blobGeo(g){
  var geo=new THREE.SphereGeometry(1,22,16);
  geo.scale(g.r[0],g.r[1],g.r[2]);
  var c=P(g.u,g.t,g.s); geo.translate(c.x,c.y,c.z);
  return geo;
}
/* ===== 胴体ブロック（スラブ）=====
   横から見たすがた（シルエット）は A も B も同じ。
   ちがうのは「奥ゆき」。手前から  A → なかおち → B  と重なる。
   せ（上）とはら（下）で胴体をぜんぶ分け合い、その合わせ目のまわりに
   「木の葉形のくぼみ」がある。そこへ「あかみ」の板がはまる。 */
var SO=0.86;            /* 身のいちばん外がわ（皮のすぐ内がわ） */
var ZA=0.440, ZAK=0.300, ZP1=0.290, ZP0=0.190, ZB=0.175;
function cl(z,qz){ var l=qz*0.995; return z>l?l:(z<-l?-l:z); }

/* --- せとはらの分かれ目と、あかみの木の葉形 --- */
var AKU0=0.322, AKU1=0.898;    /* 木の葉の前はしと後ろはし */
var AKW=0.140;                 /* いちばん太いところの半分 */
var AKDEEP=0.160;              /* くぼみの深さ（＝あかみの厚み） */
function akMid(u){             /* せ と はら の分かれ目 */
  var w=Math.max(0,Math.min(1,(u-0.322)/0.578));
  return 0.515-0.055*w;
}
function akHalf(u){
  if(u<=AKU0||u>=AKU1) return 0;
  var w=(u-AKU0)/(AKU1-AKU0);
  return Math.max(0.014, AKW*Math.pow(Math.sin(Math.PI*Math.pow(w,0.82)),0.62));
}
function akTop(u){ return akMid(u)-akHalf(u); }
function akBot(u){ return akMid(u)+akHalf(u); }
function akIn(u,t){            /* 1＝くぼみのまん中、0＝くぼみの外 */
  var h=akHalf(u); if(h<=0.002) return 0;
  var d=Math.abs(t-akMid(u))/h;
  if(d>=1.18) return 0;
  if(d<=0.72) return 1;
  var s=(1.18-d)/0.46;
  return s*s*(3-2*s);
}
/* カマ と カマとろ の境目。上は細く、下（腹がわ）へいくほどカマとろが広がる */
function ss(x){ x=x<0?0:(x>1?1:x); return x*x*(3-2*x); }
function kbk(t){        /* カマの後ろのふち＝カマとろの前のふち（カマのほうが少し小さい） */
  return 0.236-0.026*ss((t-0.20)/0.45);
}
function aDish(u,t,qz,rz){ return qz-AKDEEP*rz*akIn(u,t); }               /* Aがわのくぼみ */
function bDish(u,t,qz,rz){ return cl((ZB-AKDEEP*akIn(u,t))*rz,qz); }      /* Bがわのくぼみ */

function zFace(k,u,t,qz,rz){
  if(k==="S")  return  qz;               /* 手前の身の表面 */
  if(k==="F")  return -qz;               /* 向こうがわの表面 */
  if(typeof k==="function") return k(u,t,qz,rz);
  return cl(k*rz,qz);                    /* 平らな面（奥ゆき一定） */
}
/* はらの下がわのくぼみ＝内臓の上がわ。両方で同じ式を使うのでピタリ合う */
var ORG=[[0.348,0.468],[0.525,0.660],[0.735,0.865]];
var ORGBASE=0.950, ORGD=0.225;
function bellyLo(u){
  for(var i=0;i<ORG.length;i++){
    var o=ORG[i];
    if(u>o[0]&&u<o[1]){
      var w=(u-o[0])/(o[1]-o[0]);
      return ORGBASE-ORGD*Math.pow(Math.sin(Math.PI*w),0.55);
    }
  }
  return ORGBASE;
}
function slabGeo(g){
  var RD=(g.round===0)?0:0.40;     /* ふちの面取り（うすくなる） */
  var BV=(g.round===0)?0:0.055;    /* 表と裏の面のふちを少し内がわへ */
  var qv=new THREE.Vector3();
  function pos(a0,b0,c0,o){
    var dd=Math.min(a0,1-a0,b0,1-b0), kk=Math.min(1,dd/0.085);
    var c=0.5+(c0-0.5)*(1-RD*(1-kk)*(1-kk));
    var dc=Math.min(c0,1-c0), kc=Math.min(1,dc/0.32);
    var sh=BV*(1-kc)*(1-kc);
    var a=sh+a0*(1-2*sh), b=sh+b0*(1-2*sh);
    var un=g.u0+(g.u1-g.u0)*a, tn=g.t0+(g.t1-g.t0)*b;
    var uL=g.ulo?g.ulo(tn):(g.wu0?seamU(g.u0,tn):g.u0),
        uR=g.uhi?g.uhi(tn):(g.wu1?seamU(g.u1,tn):g.u1);
    var u=uL+(uR-uL)*a;
    var tA=g.lo?g.lo(u):(g.wt0?seamT(g.t0,un):g.t0);
    var tB=g.hi?g.hi(u):(g.wt1?seamT(g.t1,un):g.t1);
    var t=tA+(tB-tA)*b;
    P(u,t,SO,qv);
    var rz=prof(u).rz;
    var zn=zFace(g.zn,u,t,qv.z,rz), zf=zFace(g.zf,u,t,qv.z,rz);
    if(zn<zf){ var mm=(zn+zf)*0.5; zn=mm; zf=mm; }      /* ふちで薄くつぶれる */
    return o.set(qv.x,qv.y,zf+(zn-zf)*c);
  }
  var fine=(g.dish||g.lo||g.hi||g.ulo||g.uhi)?1:0;
  var nu=Math.max(8,Math.round((g.u1-g.u0)*(fine?92:50))),
      nt=Math.max(5,Math.round((g.t1-g.t0)*(g.dish?68:((g.ulo||g.uhi)?46:26)))), ns=3;
  var st={pos:[],uv:[],idx:[]}, P0=0.06;
  addGrid(st,function(a,b,v){pos(a,1-b,1,v);},nu,nt,1,1,true);     /* 手前＝彫り文字の面 */
  st.outerEnd=st.pos.length/3;
  addGrid(st,function(a,b,v){pos(a,b,0,v);},nu,nt,P0,P0,true);     /* 向こうがわ */
  addGrid(st,function(a,b,v){pos(0,a,b,v);},nt,ns,P0,P0,true);
  addGrid(st,function(a,b,v){pos(1,a,b,v);},nt,ns,P0,P0,false);
  addGrid(st,function(a,b,v){pos(a,0,b,v);},nu,ns,P0,P0,false);
  addGrid(st,function(a,b,v){pos(a,1,b,v);},nu,ns,P0,P0,true);
  var geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(st.pos,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(st.uv,2));
  geo.setIndex(st.idx); geo.computeVertexNormals();
  geo.userData={outerEnd:st.outerEnd};
  return geo;
}
/* ===== 部位マスタ（20パーツ・骨単体なし／中落ちに背骨とあばらが付く） ===== */
var KIND={
  dotai:{n:"どうたい",y:"胴体（皮）",g:"皮",tone:"skin",rare:0,label:"どうたい",
    d:"銀色に光る手前側の皮。これを外すと中の身が見える。まずはここから。"},
  nouten:{n:"のうてん",y:"脳天",g:"大トロ",tone:"dark",rare:1,label:"のうてん",
    d:"頭の上、目と目のあいだの細長い部位。1匹からごくわずか。ねっとり甘い。"},
  medama:{n:"めだま",y:"目玉",g:"その他",tone:"eyeball",rare:1,label:"",
    d:"目のまわり。まるい玉を、かしらの穴にはめこむ。ゼラチン質でコラーゲンたっぷり。"},
  hohoniku:{n:"ほほにく",y:"頬肉",g:"赤身",tone:"silver",rare:1,label:"ほほにく",
    d:"ほっぺたの肉。ステーキのような食感。1匹から左右ふたつだけ。"},
  agoniku:{n:"あごにく",y:"顎肉",g:"その他",tone:"silver",rare:1,label:"あごにく",
    d:"あごの下の肉。よく動く部位なので旨みが濃く、皮ぎしの脂も楽しめる。"},
  kamatoro:{n:"カマとろ",y:"カマトロ",g:"大トロ",tone:"oo",rare:1,label:"カマとろ",
    d:"カマのすぐ内側、エラのふちにそった三日月形。とくに脂がのった最高級の希少部位。"},
  kama:{n:"カマ",y:"かま",g:"その他",tone:"chu",rare:0,label:"カマ",
    d:"エラの後ろ、胸びれの付け根。骨のまわりに旨みが集まる。塩焼きが定番。"},
  nakaochi:{n:"なかおち",y:"中落ち（背骨つき）",g:"赤身",tone:"rare",rare:1,label:"なかおち",ribs:1,
    d:"背骨とあばらが付いた中落ち。これを外すと、下からあかみが出てくる。解体の日だけの味。"},
  sekami:{n:"せかみ",y:"背上／中トロ",g:"中トロ",tone:"chu",rare:0,label:"せかみ",
    d:"背の頭側。赤身に近い上品な脂で、すっきりした中トロ。"},
  senaka:{n:"せなか",y:"背中／中トロ",g:"中トロ",tone:"chu",rare:0,label:"せなか",
    d:"背の中央。形がよく整い、サクどりの手本のような部位。"},
  seshimo:{n:"せしも",y:"背下／中トロ",g:"中トロ",tone:"chu",rare:0,label:"せしも",
    d:"背の尾側。よく泳ぐ部分なので身が締まっている。"},
  akami:{n:"あかみ",y:"赤身",g:"赤身",tone:"aka",rare:0,label:"あかみ",
    d:"背骨まわりの赤身。Aは中落ちの上、Bは中落ちの下に入る。鉄分が多くマグロらしい味。"},
  harakami:{n:"はらかみ",y:"腹上／大トロ",g:"大トロ",tone:"oo",rare:0,label:"はらかみ",
    d:"腹の頭側。いちばん脂がのる最高級の大トロ。口の中でとろける。"},
  haranaka:{n:"はらなか",y:"腹中／大トロ",g:"大トロ",tone:"oo",rare:0,label:"はらなか",
    d:"腹の中央。大トロと中トロの境目で、味が変わっていく。"},
  harashimo:{n:"はらしも",y:"腹下／中トロ",g:"中トロ",tone:"chu",rare:0,label:"はらしも",
    d:"腹の尾側。赤身と脂のバランスがよく、食べやすい。"},
  tail:{n:"テール",y:"尾の身",g:"赤身",tone:"aka",rare:1,label:"テール",
    d:"尾の付け根。筋は多いがステーキにすると絶品。競りで脂を見る場所。"},
  hatsu:{n:"ハツ",y:"心臓",g:"その他",tone:"organ",rare:1,label:"ハツ",
    d:"心臓。コリコリした食感で、刺身でも焼いても。"},
  wata:{n:"ワタ",y:"内臓",g:"その他",tone:"organ2",rare:1,label:"ワタ",
    d:"胃や腸などの内臓。しっかり掃除して湯引きに。市場ならではの部位。"},
  tamago:{n:"たまご",y:"卵巣",g:"その他",tone:"egg",rare:1,label:"たまご",
    d:"卵巣。煮付けにすると濃厚。雌の個体からしか取れない。"}
};
var PARTS=[];
function add(kind,layer,g,pull,side){
  PARTS.push({id:kind+(side||""),kind:kind,side:side||"",layer:layer,g:g,pull:pull||null});
}
/* layer 0=皮 1=頭 2=外の身A・カマ 3=あかみA 4=なかおち 5=あかみB 6=中の身B・内臓
   境界値は隣どうしで共有＝断面がピタリ合う */
add("dotai",0,{round:0,u0:0.158,u1:0.985,t0:0.02,t1:0.98,s0:0.88,s1:1.00,wu0:0,wu1:0,wt0:0,wt1:0});
add("nouten",1,{u0:0.06,u1:0.16,t0:0.04,t1:0.22,s0:0.78,s1:1.00,wu0:0,wu1:0,wt0:0,wt1:0});
add("medama",1,{blob:1,u:0.105,t:0.40,s:0.86,r:[0.30,0.30,0.30]});
add("hohoniku",1,{u0:0.06,u1:0.16,t0:0.56,t1:0.80,s0:0.78,s1:1.00,wu0:0,wu1:0,wt0:0,wt1:0});
add("agoniku",1,{u0:0.04,u1:0.16,t0:0.84,t1:0.99,s0:0.78,s1:1.00,wu0:0,wu1:0,wt0:0,wt1:0});
/* せ＝分かれ目より上、はら＝分かれ目より下。ふたつで胴体をぜんぶ分け合う。
   その表面にある木の葉形のくぼみへ「あかみ」がはまる。 */
function SE(o){ o.slab=1; o.dish=1; o.s1=SO; o.t0=0.045; o.t1=0.500; o.hi=akMid; o.lsh=-0.24; return o; }
function HA(o){ o.slab=1; o.dish=1; o.s1=SO; o.t0=0.490; o.t1=0.950; o.lo=akMid; o.lsh=0.20; return o; }
function HB(o){ HA(o); o.hi=bellyLo; return o; }   /* B側だけ内臓のくぼみあり */
function AK(o){ o.slab=1; o.dish=1; o.s1=SO; o.u0=AKU0; o.u1=AKU1; o.t0=0.340; o.t1=0.660;
                o.lo=akTop; o.hi=akBot; o.wu0=0; o.wu1=0; return o; }
function A_(o){ o.zn="S"; o.zf=ZA; o.dish=0; return o; }   /* 手前の身（A）：あかみの上にかぶさる */
function B_(o){ o.zn=bDish; o.zf="F"; return o; }  /* 中の身（B） */
/* --- 外の身（A）：手前の面は皮の下のふくらみ、裏は平ら --- */
add("kama",2,{slab:1,s1:SO,zn:"S",zf:"F",lwu:0.82,u0:0.166,u1:0.236,t0:0.045,t1:0.950,
              uhi:kbk,wu0:0,wu1:0,wt0:0,wt1:0});
add("sekami",  2,A_(SE({u0:0.322,u1:0.510,wu0:0,wu1:1,wt0:0})),null,"A");
add("senaka",  2,A_(SE({u0:0.510,u1:0.710,wu0:1,wu1:1,wt0:0})),null,"A");
add("seshimo", 2,A_(SE({u0:0.710,u1:0.900,wu0:1,wu1:1,wt0:0})),null,"A");
add("harakami",2,A_(HA({u0:0.322,u1:0.510,wu0:0,wu1:1})),null,"A");
add("haranaka",2,A_(HA({u0:0.510,u1:0.710,wu0:1,wu1:1})),null,"A");
add("harashimo",2,A_(HA({u0:0.710,u1:0.900,wu0:1,wu1:1})),null,"A");
add("akami",   3,AK({zn:ZA-0.012,zf:ZAK}),null,"A");   /* 外の身Aの下、なかおちの上 */
function TL(o){ o.slab=1; o.s1=SO; o.u0=0.900; o.u1=1.000; o.t0=0.045; o.t1=0.950;
                o.wu0=1; o.wu1=0; o.wt0=0; o.wt1=0; return o; }
add("tail",2,TL({zn:"S",zf:ZA}),null,"A");
/* --- なかおち（背骨つきのうすい板）とカマとろ（カマの内がわ） --- */
add("nakaochi",4,{slab:1,s1:SO,zn:ZP1,zf:ZP0,u0:0.322,u1:0.900,t0:0.045,t1:0.940,wu0:0,wu1:0,wt0:0,wt1:1});
add("kamatoro",2,{slab:1,s1:SO,zn:"S",zf:"F",lwu:0.82,u0:0.210,u1:0.290,t0:0.045,t1:0.950,
                  ulo:kbk,wu0:0,wu1:0,wt0:0,wt1:0});
/* --- 中の身（B）：Aとおなじ形。奥ゆきいっぱいの厚いブロック --- */
add("sekami",  6,B_(SE({u0:0.322,u1:0.510,wu0:0,wu1:1,wt0:0})),null,"B");
add("senaka",  6,B_(SE({u0:0.510,u1:0.710,wu0:1,wu1:1,wt0:0})),null,"B");
add("seshimo", 6,B_(SE({u0:0.710,u1:0.900,wu0:1,wu1:1,wt0:0})),null,"B");
add("harakami",6,B_(HB({u0:0.322,u1:0.510,wu0:0,wu1:1})),null,"B");
add("haranaka",6,B_(HB({u0:0.510,u1:0.710,wu0:1,wu1:1})),null,"B");
add("harashimo",6,B_(HB({u0:0.710,u1:0.900,wu0:1,wu1:1})),null,"B");
add("akami",   5,AK({zn:ZB,zf:bDish}),null,"B");    /* なかおちの下、中の身Bの上 */
add("tail",    6,TL({zn:ZA-0.012,zf:"F"}),null,"B");
/* --- 内臓：はらの下のくぼみにピタリとはまる丸いかたまり --- */
function OR(o){ o.slab=1; o.s1=SO; o.zn=ZB; o.zf="F"; o.t0=0.690; o.t1=0.950;
                o.lo=bellyLo; o.wu0=0; o.wu1=0; return o; }
add("hatsu", 6,OR({u0:0.310,u1:0.445}));
add("wata",  6,OR({u0:0.520,u1:0.660}));
add("tamago",6,OR({u0:0.735,u1:0.865}));
var TOTAL=PARTS.length;
/* ===== 外れない骨組み（かしらは半分が板＋3つの穴） ===== */
var FRAME=[
  {u0:0.18,u1:0.985,t0:-0.98,t1:-0.02,s0:0.88,s1:1.00,skin:1},        /* 向こう側の皮 */
  {u0:0.00,u1:0.18,t0:-0.99,t1:-0.02,s0:0.78,s1:1.00,skin:1,face:1},  /* かしらA（目のある側） */
  {u0:0.00,u1:0.18,t0:-0.07,t1:0.07,s0:0.78,s1:1.00,skin:1},          /* 頭の背 */
  {u0:0.00,u1:0.06,t0:0.02,t1:0.99,s0:0.78,s1:1.00,skin:1},           /* 口先 */
  {u0:0.158,u1:0.174,t0:0.02,t1:0.99,s0:0.70,s1:0.97,skin:1},         /* かしらのうしろの細いふち */
  {u0:0.290,u1:0.322,t0:0.02,t1:0.99,s0:0.72,s1:0.876,skin:1},        /* 銀のふち（カマとろのうしろ） */
  {u0:0.06,u1:0.16,t0:0.02,t1:0.045,s0:0.78,s1:1.00,skin:1},          /* 枠：上 */
  {hole:1,hr:0.33,u0:0.055,u1:0.165,t0:0.22,t1:0.56,s0:0.80,s1:1.00,skin:1}, /* 目のまるい穴 */
  {u0:0.06,u1:0.16,t0:0.80,t1:0.845,s0:0.78,s1:1.00,skin:1},          /* 枠：ほほとあごのあいだ */
  {u0:0.04,u1:0.172,t0:0.02,t1:0.99,s0:0.56,s1:0.74,skin:0},          /* 穴の底 */
  {u0:0.10,u1:0.985,t0:-0.05,t1:0.05,s0:0.82,s1:1.04,skin:0},         /* 背のふち */
  {u0:0.158,u1:0.94,t0:0.95,t1:1.05,s0:0.82,s1:1.04,skin:0}           /* 腹のふち */
];
