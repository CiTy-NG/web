/* Typewriter effect used on index.html:
   - "RESEARCH & ACADEMIA" types itself out once, automatically, as soon as the page loads.
   - "WHO I AM" stays hidden entirely until that finishes, then appears; clicking its heading
     (or Enter/Space, since it's reachable by keyboard) types its own text out, and each click
     retypes it.

   Both sections keep the real text in their <p> tags in the HTML, so the content still
   reads fine with JS disabled (see the noscript rules next to them). */
(function () {
    var RESEARCH_CHAR_DELAY_MS = 6;
    var RESEARCH_PARAGRAPH_PAUSE_MS = 120;
    var WHO_CHAR_DELAY_MS = 18;
    var WHO_PARAGRAPH_PAUSE_MS = 250;
    var CARET = '▌';

    function typeParagraphs(body, paragraphs, charDelay, paragraphPause, onComplete) {
        var pi = 0, ci = 0;

        function step() {
            if (pi >= paragraphs.length) {
                if (onComplete) onComplete();
                return;
            }
            var p = paragraphs[pi];
            var full = p.dataset.fullText;

            if (ci <= full.length) {
                var typed = full.slice(0, ci);
                p.textContent = ci < full.length ? typed + CARET : typed;
                ci++;
                body._typeTimer = setTimeout(step, charDelay);
            } else {
                pi++;
                ci = 0;
                body._typeTimer = setTimeout(step, paragraphPause);
            }
        }

        step();
    }

    function typeBody(body, charDelay, paragraphPause, onComplete) {
        if (!body) return;
        var paragraphs = Array.prototype.slice.call(body.querySelectorAll('p'));
        paragraphs.forEach(function (p) {
            if (!p.dataset.fullText) p.dataset.fullText = p.textContent;
        });

        clearTimeout(body._typeTimer);
        body.classList.add('is-visible');
        paragraphs.forEach(function (p) { p.textContent = ''; });
        typeParagraphs(body, paragraphs, charDelay, paragraphPause, onComplete);
    }

    window.typeWhoIAm = function () {
        var toggle = document.getElementById('who-i-am-toggle');
        var body = document.getElementById('who-i-am-body');
        if (!toggle || !body) return;
        toggle.setAttribute('aria-expanded', 'true');
        toggle.classList.add('is-revealed');
        typeBody(body, WHO_CHAR_DELAY_MS, WHO_PARAGRAPH_PAUSE_MS);
    };

    document.addEventListener('DOMContentLoaded', function () {
        var researchBody = document.getElementById('research-academia-body');
        var whoSection = document.getElementById('who-i-am-section');

        typeBody(researchBody, RESEARCH_CHAR_DELAY_MS, RESEARCH_PARAGRAPH_PAUSE_MS, function () {
            if (whoSection) whoSection.classList.add('is-ready');
        });
    });
})();
