/************************************************************
 *  マグロ部位パズル ─ みんなのタイムをためる係
 *
 *  Googleスプレッドシートの「拡張機能 ▸ Apps Script」に
 *  このコードをまるごと貼りつけて、ウェブアプリとして公開します。
 *  くわしい手順は、いっしょにお渡ししたメモをごらんください。
 ************************************************************/

var SHEET_NAME = "きろく";   // 記録を書き込むシートの名前（自動で作られます）
var KEEP       = 300;        // これより古い記録は、少しずつ消していきます

/* ---- スプレッドシートを用意する ---- */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["日時", "あそびかた", "なまえ", "タイム（秒）", "ミス"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---- アプリから呼ばれる入口 ---- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.mode === "add") return add_(p);                       // 記録をためる
    return json_({ ok: true, list: top_(game_(p.game), 10) });  // ベスト10を返す
  } catch (err) {
    return json_({ ok: false, err: String(err) });
  }
}

function game_(g) { return (g === "kaitai") ? "kaitai" : "kumitate"; }

/* ---- 記録をひとつ追加して、新しいベスト10を返す ---- */
function add_(p) {
  var name = String(p.name || "ゲスト").slice(0, 8);
  var sec  = Number(p.sec);
  var miss = Number(p.miss) || 0;
  var game = game_(p.game);

  // おかしな値は受けつけない（0秒や、10時間ごえなど）
  if (!(sec > 0) || sec > 36000) return json_({ ok: false, err: "bad" });

  var lock = LockService.getScriptLock();
  try { lock.waitLock(8000); } catch (err) { return json_({ ok: false, err: "busy" }); }
  try {
    var sh = sheet_();
    sh.appendRow([new Date(), game, name, Math.round(sec * 10) / 10, miss]);
    trim_(sh);
    return json_({ ok: true, list: top_(game, 10) });
  } finally {
    lock.releaseLock();
  }
}

/* ---- タイムの速い順にならべる ---- */
function top_(game, n) {
  var sh = sheet_(), last = sh.getLastRow();
  if (last < 2) return [];
  var rows = sh.getRange(2, 1, last - 1, 5).getValues();
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]) !== game) continue;
    var sec = Number(r[3]);
    if (!(sec > 0)) continue;
    out.push({
      who:  String(r[2] || "ゲスト"),
      sec:  sec,
      miss: Number(r[4]) || 0,
      at:   fmtDate_(r[0])
    });
  }
  out.sort(function (a, b) { return a.sec - b.sec; });
  return out.slice(0, n);
}

function fmtDate_(d) {
  try { return Utilities.formatDate(new Date(d), "Asia/Tokyo", "M/d"); }
  catch (e) { return ""; }
}

/* ---- 行が増えすぎたら、古いほうから消す ---- */
function trim_(sh) {
  var last = sh.getLastRow();
  var over = last - 1 - KEEP;
  if (over > 0) sh.deleteRows(2, over);
}
