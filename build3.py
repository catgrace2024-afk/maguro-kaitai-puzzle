# -*- coding: utf-8 -*-
"""本マグロ解体パズル のビルド
  index.html      … Artifact 用（<head> は Artifact 側が付けるので body だけ）
  docs/index.html … GitHub Pages 用（PWA。完全なHTML＋manifest＋ServiceWorker＋three.jsを同梱）
"""
import io, os, re

shell = io.open("src3/shell3.html", encoding="utf-8").read()
geom  = io.open("src3/geom3.js",   encoding="utf-8").read()
app   = io.open("src3/app3.js",    encoding="utf-8").read()

ver = re.search(r'var APP_VERSION\s*=\s*"([^"]+)"', app)
VER = ver.group(1) if ver else "0"

body = shell + "\n<script>\n" + geom + "\n" + app + "\n</script>\n"

# ---- Artifact 用（three.js は CDN） ----
art = body.replace("<script>\n" + geom,
      '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\n' + geom, 1)
io.open("index.html", "w", encoding="utf-8").write(art)

# ---- GitHub Pages 用（three.js は同梱 → オフラインでも動く） ----
pages_head = u'''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>マグロ部位パズル</title>
<meta name="description" content="マグロを3Dで分解・組み立てして、部位の名前をおぼえる知育パズル。">
<meta name="robots" content="noindex,nofollow">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1B74D8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="マグロパズル">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png" sizes="192x192" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>:root{color-scheme:light}html,body{margin:0;padding:0;background:#E9F4FD;color:#22303A}
img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
'''
pages_tail = u'''
<script src="vendor/three.min.js"></script>
<script>
''' + geom + u"\n" + app + u'''
</script>
<script>
if("serviceWorker" in navigator){
  addEventListener("load",function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
}
</script>
</body>
</html>
'''
os.makedirs("docs", exist_ok=True)
# <title> は head 側にあるので、body から取り除く
shell_pages = shell.replace("<title>マグロ部位パズル</title>\n", "", 1)
io.open("docs/index.html", "w", encoding="utf-8").write(pages_head + shell_pages + pages_tail)

# ---- Service Worker（版数は APP_VERSION に自動で合わせる） ----
sw = io.open("src3/sw.js", encoding="utf-8").read().replace("__VERSION__", VER)
io.open("docs/sw.js", "w", encoding="utf-8").write(sw)

print("built v%s  artifact=%dKB  pages=%dKB" % (VER, len(art)//1024,
      (len(pages_head)+len(shell)+len(pages_tail))//1024))
