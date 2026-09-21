/* CV dialog: verification, inline preview, print / download / maximize.

   Where the PDF comes from:
   - Deployed site: the GitHub Actions workflow copies the PDF in Curriculum/ to Curriculum/current.pdf.
   - Local preview (e.g. Live Server): current.pdf doesn't exist, so the folder listing is read instead
     and the PDF found in Curriculum/ is used. */
(function () {
    var STABLE_URL = 'Curriculum/current.pdf';
    var cvUrlPromise = null;

    function exists(url) {
        return fetch(url, { method: 'HEAD' })
            .then(function (res) { return res.ok; })
            .catch(function () { return false; });
    }

    // Servers that list folders (Live Server does) return names as JSON or as an HTML index
    function findInListing() {
        return fetch('Curriculum/', { headers: { Accept: 'application/json' } })
            .then(function (res) { return res.ok ? res.text() : ''; })
            .then(function (body) {
                var names = [];
                try {
                    names = JSON.parse(body).map(function (f) { return typeof f === 'string' ? f : f.name; });
                } catch (e) {
                    var re = /href="([^"]+?\.pdf)"/ig, m;
                    while ((m = re.exec(body))) names.push(decodeURIComponent(m[1].split('/').pop()));
                }
                var pdfs = names.filter(function (n) { return /\.pdf$/i.test(n) && n !== 'current.pdf'; }).sort();
                return pdfs.length ? 'Curriculum/' + encodeURIComponent(pdfs[pdfs.length - 1]) : null;
            })
            .catch(function () { return null; });
    }

    function getCvUrl() {
        if (!cvUrlPromise) {
            cvUrlPromise = exists(STABLE_URL).then(function (ok) {
                return ok ? STABLE_URL : findInListing();
            });
        }
        return cvUrlPromise;
    }

    function byId(id) { return document.getElementById(id); }

    function showPreview() {
        var frame = byId('cv-preview');
        var msg = byId('cv-preview-msg');
        if (frame.getAttribute('src')) return;
        getCvUrl().then(function (url) {
            if (url) {
                frame.src = url + '#view=FitH';
            } else {
                frame.style.display = 'none';
                msg.style.display = 'block';
            }
        });
    }

    window.openCV = function () {
        byId('cv-modal').style.display = 'flex';
        var name = byId('full-name');
        if (name && byId('verification-container').style.display !== 'none') name.focus();
    };

    window.closeCV = function () {
        byId('cv-modal').style.display = 'none';
    };

    window.checkVerification = function () {
        var nameInput = byId('full-name').value.trim();
        var checkbox = byId('demo-human').checked;

        if (nameInput && checkbox) {
            byId('verification-container').style.display = 'none';
            byId('cv-actions').style.display = 'block';
            byId('cv-box').classList.add('is-verified');
            showPreview();
        } else {
            alert('Please enter your full name and check the box to proceed.');
        }
    };

    window.printCV = function () {
        getCvUrl().then(function (url) {
            if (!url) return;
            var pdfWindow = window.open(url, '_blank');
            if (pdfWindow) pdfWindow.onload = function () { pdfWindow.print(); };
        });
    };

    window.downloadCV = function () {
        getCvUrl().then(function (url) {
            if (!url) return;
            var link = document.createElement('a');
            link.href = url;
            link.download = 'CTNG_CV.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    window.maximizeCV = function () {
        getCvUrl().then(function (url) {
            var frame = byId('cv-fullscreen-frame');
            if (url && !frame.getAttribute('src')) frame.src = url;
            byId('pdf-overlay').style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    };

    window.closeMaximize = function () {
        byId('pdf-overlay').style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (byId('pdf-overlay').style.display !== 'none') window.closeMaximize();
            else window.closeCV();
        } else if (e.key === 'Enter' && e.target && e.target.id === 'full-name') {
            window.checkVerification();
        }
    });
})();
