/*
 * KhaelWorks screenshot viewer: image-level zoom and pan.
 *
 * Shared by the case-study pages. Any screenshot that already opened full
 * size on click (figure button[data-full] or figure a[href="*.png|jpg"])
 * now opens here instead. The viewer always loads the ORIGINAL file named in
 * data-full / href, and only when it is opened.
 *
 *   Fit / 100% / + / -     toolbar buttons (the % label resets to 100%)
 *   Mouse wheel            zoom around the cursor (the page behind is locked)
 *   Drag                   pan when the image is bigger than the viewer
 *   Double-click / tap     toggle Fit <-> close-up
 *   Pinch / touch drag     zoom and pan on phones and tablets
 *   Keys                   + and - zoom, 0 fit, 1 = 100%, Esc closes
 */
(function () {
  'use strict'
  if (window.__kwZoom) return
  window.__kwZoom = true

  var STEPS = [0.05, 0.1, 0.15, 0.25, 0.33, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6, 8, 12, 16]
  var MAX = 16 // 1600% of the original pixels

  var css =
    'dialog.kwz{position:fixed;inset:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;overflow:hidden;color:#fff}' +
    'dialog.kwz::backdrop{background:rgba(0,0,0,.82)}' +
    'dialog.kwz[open]{display:flex;flex-direction:column}' +
    '.kwz-x{position:fixed;top:12px;right:16px;z-index:2;background:#fff;color:#000;border:0;border-radius:999px;width:36px;height:36px;font-size:20px;line-height:1;cursor:pointer}' +
    '.kwz-stage{position:relative;flex:1 1 auto;min-height:0;margin:56px 2vw 0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.kwz-stage.can-pan{cursor:grab}.kwz-stage.panning{cursor:grabbing}' +
    'dialog.kwz img.kwz-img{position:absolute;left:0;top:0;max-width:none;max-height:none;width:auto;height:auto;margin:0;display:block;border-radius:8px;background:#fff;transform-origin:0 0;opacity:0;transition:opacity .15s;-webkit-user-drag:none;user-select:none;pointer-events:none}' +
    'dialog.kwz img.kwz-img.ready{opacity:1}' +
    '.kwz-load{position:absolute;inset:0;display:grid;place-items:center;font-size:13px;color:rgba(255,255,255,.7)}' +
    '.kwz-foot{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 12px 14px}' +
    '.kwz-cap{margin:0;color:#fff;text-align:center;font-size:14px;max-width:900px}' +
    '.kwz-cap:empty{display:none}' +
    '.kwz-bar{display:inline-flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(18,22,30,.9);border:1px solid rgba(255,255,255,.14);font:500 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.kwz-bar button,.kwz-bar a{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:5px;height:30px;min-width:30px;padding:0 10px;border-radius:999px;color:#fff;cursor:pointer;white-space:nowrap;font:inherit}' +
    '.kwz-bar button:hover,.kwz-bar a:hover{background:rgba(255,255,255,.12)}' +
    '.kwz-bar button:focus-visible,.kwz-bar a:focus-visible,.kwz-x:focus-visible{outline:2px solid #4FD1AE;outline-offset:2px}' +
    '.kwz-bar button[disabled]{opacity:.35;cursor:default;background:none}' +
    '.kwz-bar .kwz-in,.kwz-bar .kwz-out{font-size:18px;padding:0}' +
    '.kwz-bar .kwz-pct{min-width:58px;font-variant-numeric:tabular-nums}' +
    '.kwz-bar .kwz-sep{width:1px;height:18px;background:rgba(255,255,255,.18);margin:0 4px}' +
    '@media (max-width:560px){.kwz-stage{margin:56px 8px 0}.kwz-cap{font-size:13px}.kwz-bar .kwz-tab span{display:none}}' +
    'figure a[data-kwz],figure button[data-kwz]{cursor:zoom-in}'

  var style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  var d = document.createElement('dialog')
  d.className = 'kwz'
  d.setAttribute('aria-label', 'Screenshot viewer')
  d.innerHTML =
    '<button class="kwz-x" type="button" aria-label="Close">×</button>' +
    '<div class="kwz-stage"><img class="kwz-img" alt="" draggable="false"><div class="kwz-load">Loading full-size image…</div></div>' +
    '<div class="kwz-foot"><p class="kwz-cap"></p>' +
    '<div class="kwz-bar" role="toolbar" aria-label="Zoom">' +
    '<button class="kwz-out" type="button" aria-label="Zoom out" title="Zoom out (−)">−</button>' +
    '<button class="kwz-pct" type="button" aria-label="Actual size (100%)" title="Actual size (1)">100%</button>' +
    '<button class="kwz-in" type="button" aria-label="Zoom in" title="Zoom in (+)">+</button>' +
    '<button class="kwz-fit" type="button" title="Fit to screen (0)">Fit</button>' +
    '<span class="kwz-sep" aria-hidden="true"></span>' +
    '<a class="kwz-tab" target="_blank" rel="noopener" title="Open the original image in a new tab">↗<span>Open in new tab</span></a>' +
    '</div></div>'
  document.body.appendChild(d)

  var stage = d.querySelector('.kwz-stage')
  var img = d.querySelector('.kwz-img')
  var load = d.querySelector('.kwz-load')
  var cap = d.querySelector('.kwz-cap')
  var pct = d.querySelector('.kwz-pct')
  var bIn = d.querySelector('.kwz-in')
  var bOut = d.querySelector('.kwz-out')
  var tab = d.querySelector('.kwz-tab')

  var iw = 0, ih = 0, s = 1, tx = 0, ty = 0, fitMode = true, blobUrl = null, token = 0

  function box() { return { w: stage.clientWidth, h: stage.clientHeight } }
  function fitScale() {
    var b = box()
    return iw ? Math.min(b.w / iw, b.h / ih, 1) : 1
  }
  function minScale() { return Math.min(fitScale(), 1) }

  function clamp() {
    var b = box(), w = iw * s, h = ih * s
    tx = w <= b.w ? (b.w - w) / 2 : Math.min(0, Math.max(b.w - w, tx))
    ty = h <= b.h ? (b.h - h) / 2 : Math.min(0, Math.max(b.h - h, ty))
  }
  function render() {
    clamp()
    img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')'
    pct.textContent = Math.round(s * 100) + '%'
    bIn.disabled = s >= MAX - 1e-6
    bOut.disabled = s <= minScale() + 1e-6
    var b = box()
    stage.classList.toggle('can-pan', iw * s > b.w + 1 || ih * s > b.h + 1)
  }
  /* Zoom to `ns`, keeping the image point under (px, py) fixed. */
  function zoomTo(ns, px, py) {
    ns = Math.max(minScale(), Math.min(MAX, ns))
    var b = box()
    if (px == null) { px = b.w / 2; py = b.h / 2 }
    tx = px - (px - tx) * (ns / s)
    ty = py - (py - ty) * (ns / s)
    s = ns
    fitMode = false
    render()
  }
  function fit() {
    s = fitScale()
    fitMode = true
    render()
  }
  function step(dir) {
    var next = null, i
    if (dir > 0) { for (i = 0; i < STEPS.length; i++) if (STEPS[i] > s * 1.01) { next = STEPS[i]; break } }
    else { for (i = STEPS.length - 1; i >= 0; i--) if (STEPS[i] < s * 0.99) { next = STEPS[i]; break } }
    if (next == null) next = dir > 0 ? MAX : minScale()
    if (dir < 0 && next <= fitScale() + 1e-6) return fit()
    zoomTo(next)
  }
  function closeUp() { return Math.max(1, fitScale() * 2.5) }
  function toggle(px, py) {
    if (fitMode || s <= fitScale() * 1.05) zoomTo(closeUp(), px, py)
    else fit()
  }

  function open(src, alt, caption) {
    var my = ++token
    iw = ih = 0
    img.classList.remove('ready')
    load.style.display = ''
    load.textContent = 'Loading full-size image…'
    img.alt = alt || ''
    cap.textContent = caption || ''
    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null }
    tab.href = src
    // Browsers block opening data: URLs in a tab, so hand it a blob instead.
    if (/^data:/.test(src) && window.fetch) {
      fetch(src).then(function (r) { return r.blob() }).then(function (bl) {
        if (my !== token) return
        blobUrl = URL.createObjectURL(bl)
        tab.href = blobUrl
      })
    }
    img.onload = function () {
      if (my !== token) return
      iw = img.naturalWidth
      ih = img.naturalHeight
      load.style.display = 'none'
      fit()
      img.classList.add('ready')
    }
    img.onerror = function () { if (my === token) load.textContent = 'Could not load the image.' }
    img.removeAttribute('src')
    img.src = src
    document.documentElement.style.overflow = 'hidden'
    if (d.showModal) d.showModal()
    else window.open(src, '_blank')
    render()
  }
  function close() { if (d.open) d.close() }
  d.addEventListener('close', function () {
    token++
    document.documentElement.style.overflow = ''
    img.removeAttribute('src')
    img.classList.remove('ready')
  })

  d.querySelector('.kwz-x').addEventListener('click', close)
  bIn.addEventListener('click', function () { step(1) })
  bOut.addEventListener('click', function () { step(-1) })
  pct.addEventListener('click', function () { zoomTo(1) })
  d.querySelector('.kwz-fit').addEventListener('click', fit)
  d.addEventListener('click', function (e) { if (e.target === d || e.target.classList.contains('kwz-foot')) close() })
  d.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === '+' || e.key === '=') { step(1); e.preventDefault() }
    else if (e.key === '-' || e.key === '_') { step(-1); e.preventDefault() }
    else if (e.key === '0') { fit(); e.preventDefault() }
    else if (e.key === '1') { zoomTo(1); e.preventDefault() }
  })
  window.addEventListener('resize', function () {
    if (!d.open || !iw) return
    if (fitMode) fit()
    else render()
  })

  function local(e) {
    var r = stage.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function onImage(p) {
    return iw && p.x >= tx && p.y >= ty && p.x <= tx + iw * s && p.y <= ty + ih * s
  }

  // Wheel (and trackpad pinch, which arrives as ctrl+wheel) zooms the image.
  // The page behind the viewer is locked, so this never fights page scroll.
  d.addEventListener('wheel', function (e) {
    e.preventDefault()
    if (!iw || !stage.contains(e.target)) return
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
    var k = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015))
    var p = local(e)
    zoomTo(s * k, p.x, p.y)
  }, { passive: false })

  // Pointers: one = pan, two = pinch. A short tap on the image toggles zoom
  // when repeated; a tap on the empty area closes, like the old backdrop.
  var pts = {}, pinch = null, drag = null, lastTap = 0, lastTapAt = null
  function count() { return Object.keys(pts).length }
  function pinchState() {
    var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
  }
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || !iw) return
    stage.setPointerCapture(e.pointerId)
    pts[e.pointerId] = local(e)
    if (count() === 1) {
      var p = pts[e.pointerId]
      drag = { x: p.x, y: p.y, tx: tx, ty: ty, moved: 0, onImg: onImage(p) }
      pinch = null
    } else if (count() === 2) {
      var ps = pinchState()
      pinch = { dist: ps.dist, mx: ps.mx, my: ps.my, s: s, tx: tx, ty: ty }
      drag = null
    }
  })
  stage.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId]) return
    pts[e.pointerId] = local(e)
    if (pinch && count() >= 2) {
      var ps = pinchState()
      var ns = Math.max(minScale(), Math.min(MAX, pinch.s * ps.dist / pinch.dist))
      // keep the image point that started under the fingers' midpoint under it
      tx = ps.mx - (pinch.mx - pinch.tx) * (ns / pinch.s)
      ty = ps.my - (pinch.my - pinch.ty) * (ns / pinch.s)
      s = ns
      fitMode = false
      render()
    } else if (drag) {
      var p = pts[e.pointerId]
      drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.x, p.y - drag.y))
      if (stage.classList.contains('can-pan')) {
        stage.classList.add('panning')
        tx = drag.tx + (p.x - drag.x)
        ty = drag.ty + (p.y - drag.y)
        fitMode = false
        render()
      }
    }
  })
  function up(e) {
    if (!pts[e.pointerId]) return
    var wasDrag = drag, p = pts[e.pointerId]
    delete pts[e.pointerId]
    stage.classList.remove('panning')
    if (count() < 2) pinch = null
    if (count() === 1) {
      // one finger left after a pinch: continue as a pan from here
      var k = Object.keys(pts)[0]
      drag = { x: pts[k].x, y: pts[k].y, tx: tx, ty: ty, moved: 99, onImg: true }
      return
    }
    drag = null
    if (!wasDrag || wasDrag.moved > 6 || e.type === 'pointercancel') return
    if (!wasDrag.onImg) { lastTap = 0; close(); return }
    var now = Date.now()
    if (now - lastTap < 320 && lastTapAt && Math.hypot(p.x - lastTapAt.x, p.y - lastTapAt.y) < 30) {
      lastTap = 0
      toggle(p.x, p.y)
    } else {
      lastTap = now
      lastTapAt = p
    }
  }
  stage.addEventListener('pointerup', up)
  stage.addEventListener('pointercancel', up)

  // Hook up every screenshot that already opened full size on click.
  function hook(el, src) {
    var thumb = el.querySelector('img')
    if (!thumb || !src) return
    el.setAttribute('data-kwz', '')
    el.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return // let "open in new tab" clicks through
      e.preventDefault()
      var fc = el.closest('figure') && el.closest('figure').querySelector('figcaption')
      open(src, thumb.alt, fc ? fc.textContent.trim() : '')
    })
  }
  function init() {
    document.querySelectorAll('figure button[data-full]').forEach(function (b) {
      hook(b, b.getAttribute('data-full'))
    })
    document.querySelectorAll('figure a[href]').forEach(function (a) {
      if (/\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(a.getAttribute('href'))) hook(a, a.getAttribute('href'))
    })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
