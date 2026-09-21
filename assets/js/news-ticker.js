/* News ticker: builds the items from news_updates.csv.
   Columns used: Year, Title, Description (Type is ignored). Rows are shown in file order.
   One item is shown at a time (text wraps), it advances on its own, and the arrows at each end step through them.
   If the CSV can't be loaded (e.g. page opened from disk), the items already in the HTML are left alone. */
(function () {
    var CSV_URL = 'news_updates.csv';
    var AUTO_ADVANCE_MS = 15000;

    function parseCSV(text) {
        var rows = [], row = [], field = '', inQuotes = false;
        text = text.replace(/^﻿/, '');
        for (var i = 0; i < text.length; i++) {
            var c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else { inQuotes = false; }
                } else {
                    field += c;
                }
            } else if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                row.push(field); field = '';
            } else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(field); field = '';
                rows.push(row); row = [];
            } else {
                field += c;
            }
        }
        if (field !== '' || row.length) { row.push(field); rows.push(row); }
        return rows.filter(function (r) {
            return r.some(function (cell) { return cell.trim() !== ''; });
        });
    }

    function toItems(rows) {
        var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
        var col = function (name) { return header.indexOf(name); };
        var year = col('year'), title = col('title'), desc = col('description');
        return rows.slice(1).map(function (r) {
            var y = year >= 0 ? (r[year] || '').trim() : '';
            var t = title >= 0 ? (r[title] || '').trim() : '';
            var d = desc >= 0 ? (r[desc] || '').trim() : '';
            if (!t) return null;
            return (y ? '[' + y + '] ' : '') + t + (d ? ': ' + d : '');
        }).filter(Boolean);
    }

    function makeArrow(className, label, iconClass) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'news-arrow ' + className;
        btn.setAttribute('aria-label', label);
        var icon = document.createElement('i');
        icon.className = iconClass;
        btn.appendChild(icon);
        return btn;
    }

    // The page layout leaves room for the bar; it is taller now and depends on the longest item.
    function trackHeight(ticker) {
        var root = document.documentElement;
        function update() { root.style.setProperty('--ticker-h', ticker.offsetHeight + 'px'); }
        update();
        window.addEventListener('resize', update);
        if (window.ResizeObserver) new ResizeObserver(update).observe(ticker);
    }

    function render(ticker, scroll, items) {
        var n = items.length;
        var current = 0;
        var timer = null;
        var paused = false;

        ticker.classList.add('news-js');
        scroll.textContent = '';
        var els = items.map(function (text, i) {
            var el = document.createElement('span');
            el.className = 'news-item ' + (i === 0 ? 'is-active' : 'is-next');
            el.textContent = text;
            scroll.appendChild(el);
            return el;
        });

        function setState(el, state, instant) {
            if (instant) el.style.transition = 'none';
            el.className = 'news-item ' + state;
            if (instant) {
                void el.offsetWidth; // apply the position before re-enabling the transition
                el.style.transition = '';
            }
        }

        function schedule() {
            clearTimeout(timer);
            if (!paused && n > 1) timer = setTimeout(function () { go(current + 1, 1); }, AUTO_ADVANCE_MS);
        }

        // dir > 0: new item enters from the right; dir < 0: from the left
        function go(target, dir) {
            target = (target + n) % n;
            if (target !== current) {
                setState(els[target], dir > 0 ? 'is-next' : 'is-prev', true);
                setState(els[current], dir > 0 ? 'is-prev' : 'is-next');
                setState(els[target], 'is-active');
                current = target;
            }
            schedule();
        }

        if (n > 1) {
            var prev = makeArrow('news-prev', 'Previous update', 'fas fa-chevron-left');
            var next = makeArrow('news-next', 'Next update', 'fas fa-chevron-right');
            prev.addEventListener('click', function () { go(current - 1, -1); });
            next.addEventListener('click', function () { go(current + 1, 1); });
            ticker.insertBefore(prev, ticker.firstChild);
            ticker.appendChild(next);
        }

        // Stay on the current item while it is being read: mouse hover or keyboard focus
        // (touch taps and mouse clicks on the arrows shouldn't leave it stuck)
        var hovering = false, focused = false;
        function update() { paused = hovering || focused; schedule(); }
        ticker.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; update(); } });
        ticker.addEventListener('pointerleave', function () { hovering = false; update(); });
        ticker.addEventListener('focusin', function (e) { focused = e.target.matches(':focus-visible'); update(); });
        ticker.addEventListener('focusout', function () { focused = false; update(); });

        trackHeight(ticker);
        schedule();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var ticker = document.getElementById('news-ticker');
        var scroll = ticker && ticker.querySelector('.news-scroll');
        if (!scroll) return;

        fetch(CSV_URL, { cache: 'no-cache' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(function (text) {
                var rows = parseCSV(text);
                var items = rows.length > 1 ? toItems(rows) : [];
                if (items.length) render(ticker, scroll, items);
            })
            .catch(function () { /* keep the fallback items in the HTML */ });
    });
})();
