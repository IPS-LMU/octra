/*! modernizr 3.12.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-bloburls-canvas-canvastext-cookies-filereader-indexeddb-promises-webaudio-webworkers-setclasses !*/
!(function (e, n, t, r) {
  function o(e, n) {
    return typeof e === n;
  }
  function i(e) {
    var n = b.className,
      t = Modernizr._config.classPrefix || '';
    if ((S && (n = n.baseVal), Modernizr._config.enableJSClass)) {
      var r = new RegExp('(^|\\s)' + t + 'no-js(\\s|$)');
      n = n.replace(r, '$1' + t + 'js$2');
    }
    Modernizr._config.enableClasses &&
      (e.length > 0 && (n += ' ' + t + e.join(' ' + t)),
      S ? (b.className.baseVal = n) : (b.className = n));
  }
  function s() {
    return 'function' != typeof t.createElement
      ? t.createElement(arguments[0])
      : S
        ? t.createElementNS.call(t, 'http://www.w3.org/2000/svg', arguments[0])
        : t.createElement.apply(t, arguments);
  }
  function a(e, n) {
    return !!~('' + e).indexOf(n);
  }
  function l() {
    var e = t.body;
    return e || ((e = s(S ? 'svg' : 'body')), (e.fake = !0)), e;
  }
  function u(e, n, r, o) {
    var i,
      a,
      u,
      f,
      d = 'modernizr',
      c = s('div'),
      p = l();
    if (parseInt(r, 10))
      for (; r--; )
        (u = s('div')), (u.id = o ? o[r] : d + (r + 1)), c.appendChild(u);
    return (
      (i = s('style')),
      (i.type = 'text/css'),
      (i.id = 's' + d),
      (p.fake ? p : c).appendChild(i),
      p.appendChild(c),
      i.styleSheet
        ? (i.styleSheet.cssText = e)
        : i.appendChild(t.createTextNode(e)),
      (c.id = d),
      p.fake &&
        ((p.style.background = ''),
        (p.style.overflow = 'hidden'),
        (f = b.style.overflow),
        (b.style.overflow = 'hidden'),
        b.appendChild(p)),
      (a = n(c, e)),
      p.fake && p.parentNode
        ? (p.parentNode.removeChild(p), (b.style.overflow = f), b.offsetHeight)
        : c.parentNode.removeChild(c),
      !!a
    );
  }
  function f(e) {
    return e
      .replace(/([A-Z])/g, function (e, n) {
        return '-' + n.toLowerCase();
      })
      .replace(/^ms-/, '-ms-');
  }
  function d(e, t, r) {
    var o;
    if ('getComputedStyle' in n) {
      o = getComputedStyle.call(n, e, t);
      var i = n.console;
      if (null !== o) r && (o = o.getPropertyValue(r));
      else if (i) {
        var s = i.error ? 'error' : 'log';
        i[s].call(
          i,
          'getComputedStyle returning null, its possible modernizr test results are inaccurate',
        );
      }
    } else o = !t && e.currentStyle && e.currentStyle[r];
    return o;
  }
  function c(e, t) {
    var o = e.length;
    if ('CSS' in n && 'supports' in n.CSS) {
      for (; o--; ) if (n.CSS.supports(f(e[o]), t)) return !0;
      return !1;
    }
    if ('CSSSupportsRule' in n) {
      for (var i = []; o--; ) i.push('(' + f(e[o]) + ':' + t + ')');
      return (
        (i = i.join(' or ')),
        u(
          '@supports (' + i + ') { #modernizr { position: absolute; } }',
          function (e) {
            return 'absolute' === d(e, null, 'position');
          },
        )
      );
    }
    return r;
  }
  function p(e) {
    return e
      .replace(/([a-z])-([a-z])/g, function (e, n, t) {
        return n + t.toUpperCase();
      })
      .replace(/^-/, '');
  }
  function v(e, n, t, i) {
    function l() {
      f && (delete E.style, delete E.modElem);
    }
    if (((i = !o(i, 'undefined') && i), !o(t, 'undefined'))) {
      var u = c(e, t);
      if (!o(u, 'undefined')) return u;
    }
    for (
      var f, d, v, m, h, y = ['modernizr', 'tspan', 'samp'];
      !E.style && y.length;

    )
      (f = !0), (E.modElem = s(y.shift())), (E.style = E.modElem.style);
    for (v = e.length, d = 0; d < v; d++)
      if (
        ((m = e[d]),
        (h = E.style[m]),
        a(m, '-') && (m = p(m)),
        E.style[m] !== r)
      ) {
        if (i || o(t, 'undefined')) return l(), 'pfx' !== n || m;
        try {
          E.style[m] = t;
        } catch (e) {}
        if (E.style[m] !== h) return l(), 'pfx' !== n || m;
      }
    return l(), !1;
  }
  function m(e, n) {
    return function () {
      return e.apply(n, arguments);
    };
  }
  function h(e, n, t) {
    var r;
    for (var i in e)
      if (e[i] in n)
        return !1 === t
          ? e[i]
          : ((r = n[e[i]]), o(r, 'function') ? m(r, t || n) : r);
    return !1;
  }
  function y(e, n, t, r, i) {
    var s = e.charAt(0).toUpperCase() + e.slice(1),
      a = (e + ' ' + P.join(s + ' ') + s).split(' ');
    return o(n, 'string') || o(n, 'undefined')
      ? v(a, n, r, i)
      : ((a = (e + ' ' + j.join(s + ' ') + s).split(' ')), h(a, n, t));
  }
  function g(e, n) {
    if ('object' == typeof e) for (var t in e) z(e, t) && g(t, e[t]);
    else {
      e = e.toLowerCase();
      var r = e.split('.'),
        o = Modernizr[r[0]];
      if ((2 === r.length && (o = o[r[1]]), void 0 !== o)) return Modernizr;
      (n = 'function' == typeof n ? n() : n),
        1 === r.length
          ? (Modernizr[r[0]] = n)
          : (!Modernizr[r[0]] ||
              Modernizr[r[0]] instanceof Boolean ||
              (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])),
            (Modernizr[r[0]][r[1]] = n)),
        i([(n && !1 !== n ? '' : 'no-') + r.join('-')]),
        Modernizr._trigger(e, n);
    }
    return Modernizr;
  }
  function x(e, n) {
    var t = e.deleteDatabase(n);
    (t.onsuccess = function () {
      g('indexeddb.deletedatabase', !0);
    }),
      (t.onerror = function () {
        g('indexeddb.deletedatabase', !1);
      });
  }
  var C = [],
    _ = {
      _version: '3.12.0',
      _config: {
        classPrefix: '',
        enableClasses: !0,
        enableJSClass: !0,
        usePrefixes: !0,
      },
      _q: [],
      on: function (e, n) {
        var t = this;
        setTimeout(function () {
          n(t[e]);
        }, 0);
      },
      addTest: function (e, n, t) {
        C.push({ name: e, fn: n, options: t });
      },
      addAsyncTest: function (e) {
        C.push({ name: null, fn: e });
      },
    },
    Modernizr = function () {};
  (Modernizr.prototype = _), (Modernizr = new Modernizr());
  var w = [],
    b = t.documentElement,
    S = 'svg' === b.nodeName.toLowerCase();
  Modernizr.addTest('canvas', function () {
    var e = s('canvas');
    return !(!e.getContext || !e.getContext('2d'));
  }),
    Modernizr.addTest('canvastext', function () {
      return (
        !1 !== Modernizr.canvas &&
        'function' == typeof s('canvas').getContext('2d').fillText
      );
    }),
    Modernizr.addTest('cookies', function () {
      try {
        t.cookie = 'cookietest=1';
        var e = -1 !== t.cookie.indexOf('cookietest=');
        return (
          (t.cookie = 'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT'), e
        );
      } catch (e) {
        return !1;
      }
    }),
    Modernizr.addTest('webaudio', function () {
      var e = 'webkitAudioContext' in n,
        t = 'AudioContext' in n;
      return Modernizr._config.usePrefixes ? e || t : t;
    }),
    Modernizr.addTest('promises', function () {
      return (
        'Promise' in n &&
        'resolve' in n.Promise &&
        'reject' in n.Promise &&
        'all' in n.Promise &&
        'race' in n.Promise &&
        (function () {
          var e;
          return (
            new n.Promise(function (n) {
              e = n;
            }),
            'function' == typeof e
          );
        })()
      );
    });
  var T = 'Moz O ms Webkit',
    P = _._config.usePrefixes ? T.split(' ') : [];
  _._cssomPrefixes = P;
  var k = { elem: s('modernizr') };
  Modernizr._q.push(function () {
    delete k.elem;
  });
  var E = { style: k.elem.style };
  Modernizr._q.unshift(function () {
    delete E.style;
  });
  var j = _._config.usePrefixes ? T.toLowerCase().split(' ') : [];
  (_._domPrefixes = j), (_.testAllProps = y);
  var L = function (e) {
    var t,
      o = prefixes.length,
      i = n.CSSRule;
    if (void 0 === i) return r;
    if (!e) return !1;
    if (
      ((e = e.replace(/^@/, '')),
      (t = e.replace(/-/g, '_').toUpperCase() + '_RULE') in i)
    )
      return '@' + e;
    for (var s = 0; s < o; s++) {
      var a = prefixes[s];
      if (a.toUpperCase() + '_' + t in i)
        return '@-' + a.toLowerCase() + '-' + e;
    }
    return !1;
  };
  _.atRule = L;
  var z,
    O = (_.prefixed = function (e, n, t) {
      return 0 === e.indexOf('@')
        ? L(e)
        : (-1 !== e.indexOf('-') && (e = p(e)), n ? y(e, n, t) : y(e, 'pfx'));
    });
  !(function () {
    var e = {}.hasOwnProperty;
    z =
      o(e, 'undefined') || o(e.call, 'undefined')
        ? function (e, n) {
            return n in e && o(e.constructor.prototype[n], 'undefined');
          }
        : function (n, t) {
            return e.call(n, t);
          };
  })(),
    (_._l = {}),
    (_.on = function (e, n) {
      this._l[e] || (this._l[e] = []),
        this._l[e].push(n),
        Modernizr.hasOwnProperty(e) &&
          setTimeout(function () {
            Modernizr._trigger(e, Modernizr[e]);
          }, 0);
    }),
    (_._trigger = function (e, n) {
      if (this._l[e]) {
        var t = this._l[e];
        setTimeout(function () {
          var e;
          for (e = 0; e < t.length; e++) (0, t[e])(n);
        }, 0),
          delete this._l[e];
      }
    }),
    Modernizr._q.push(function () {
      _.addTest = g;
    }),
    Modernizr.addAsyncTest(function () {
      var e;
      try {
        e = O('indexedDB', n);
      } catch (e) {}
      if (e) {
        var t,
          r = 'modernizr-' + Math.random();
        try {
          t = e.open(r);
        } catch (e) {
          return void g('indexeddb', !1);
        }
        (t.onerror = function (n) {
          !t.error ||
          ('InvalidStateError' !== t.error.name &&
            'UnknownError' !== t.error.name)
            ? (g('indexeddb', !0), x(e, r))
            : (g('indexeddb', !1), n.preventDefault());
        }),
          (t.onsuccess = function () {
            g('indexeddb', !0), x(e, r);
          });
      } else g('indexeddb', !1);
    }),
    Modernizr.addTest('filereader', !!(n.File && n.FileList && n.FileReader));
  var N = O('URL', n, !1);
  (N = N && n[N]),
    Modernizr.addTest(
      'bloburls',
      N && 'revokeObjectURL' in N && 'createObjectURL' in N,
    ),
    Modernizr.addTest('webworkers', 'Worker' in n),
    (function () {
      var e, n, t, r, i, s, a;
      for (var l in C)
        if (C.hasOwnProperty(l)) {
          if (
            ((e = []),
            (n = C[l]),
            n.name &&
              (e.push(n.name.toLowerCase()),
              n.options && n.options.aliases && n.options.aliases.length))
          )
            for (t = 0; t < n.options.aliases.length; t++)
              e.push(n.options.aliases[t].toLowerCase());
          for (
            r = o(n.fn, 'function') ? n.fn() : n.fn, i = 0;
            i < e.length;
            i++
          )
            (s = e[i]),
              (a = s.split('.')),
              1 === a.length
                ? (Modernizr[a[0]] = r)
                : ((Modernizr[a[0]] &&
                    (!Modernizr[a[0]] || Modernizr[a[0]] instanceof Boolean)) ||
                    (Modernizr[a[0]] = new Boolean(Modernizr[a[0]])),
                  (Modernizr[a[0]][a[1]] = r)),
              w.push((r ? '' : 'no-') + a.join('-'));
        }
    })(),
    i(w),
    delete _.addTest,
    delete _.addAsyncTest;
  for (var R = 0; R < Modernizr._q.length; R++) Modernizr._q[R]();
  e.Modernizr = Modernizr;
})(window, window, document);
