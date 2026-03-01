/**
 * marketing.js
 * Isolated marketing module — vanilla JS, namespaced under window.MKT
 * Injects content ONLY into <div id="marketing-root"></div>
 * All errors are caught silently — never breaks the main page
 *
 * OPTIMIZED VERSION:
 *  - requestIdleCallback for non-blocking init
 *  - IntersectionObserver for scroll-reveal animations on promos
 *  - GPU-accelerated ticker with will-change + translate3d
 *  - Image blur-up effect (placeholder → loaded)
 *  - Backdrop-blur glassmorphism popup
 *  - Smoother spring animations
 */

(function () {
    'use strict';

    // ============================================================
    // NAMESPACE — all marketing logic under window.MKT
    // ============================================================
    window.MKT = window.MKT || {};

    const MKT = window.MKT;
    const API_BASE = '/api/marketing';
    let rootEl = null;

    // ============================================================
    // INIT — uses requestIdleCallback for non-blocking load
    // ============================================================
    MKT.init = function () {
        try {
            rootEl = document.getElementById('marketing-root');
            if (!rootEl) return;

            MKT.fetchAndRender();
        } catch (e) {
            console.warn('[MKT] init error:', e);
        }
    };

    // ============================================================
    // FETCH active marketing data from API
    // ============================================================
    MKT.fetchAndRender = async function () {
        try {
            const res = await fetch(API_BASE + '/active');
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success || !json.data || !json.data.enabled) return;

            const { popups, promos, banners } = json.data;

            // Render each feature
            if (banners && banners.length > 0) MKT.renderBanners(banners);
            if (promos && promos.length > 0) MKT.renderPromos(promos);
            if (popups && popups.length > 0) MKT.renderPopups(popups);
        } catch (e) {
            console.warn('[MKT] fetch error:', e);
        }
    };

    // ============================================================
    // POP-UP BANNERS — with glassmorphism effect
    // ============================================================
    MKT.renderPopups = function (popups) {
        try {
            for (const popup of popups) {
                if (MKT.shouldShowPopup(popup)) {
                    MKT.showPopup(popup);
                    break;
                }
            }
        } catch (e) {
            console.warn('[MKT] popup error:', e);
        }
    };

    MKT.shouldShowPopup = function (popup) {
        try {
            const key = 'mkt_popup_' + popup._id;

            if (popup.displayFrequency === 'always') return true;

            if (popup.displayFrequency === 'session') {
                return !sessionStorage.getItem(key);
            }

            if (popup.displayFrequency === 'daily') {
                const lastShown = localStorage.getItem(key);
                if (!lastShown) return true;
                var today = new Date().toDateString();
                return lastShown !== today;
            }

            return true;
        } catch (e) {
            return true;
        }
    };

    MKT.markPopupShown = function (popup) {
        try {
            const key = 'mkt_popup_' + popup._id;

            if (popup.displayFrequency === 'session') {
                sessionStorage.setItem(key, '1');
            } else if (popup.displayFrequency === 'daily') {
                localStorage.setItem(key, new Date().toDateString());
            }
        } catch (e) { /* silent */ }
    };

    MKT.showPopup = function (popup) {
        try {
            var delay = (popup.delaySeconds || 0) * 1000;

            setTimeout(function () {
                try {
                    var overlay = document.createElement('div');
                    overlay.className = 'mkt-popup-overlay';
                    overlay.onclick = function (e) {
                        if (e.target === overlay) MKT.closePopup(overlay, popup);
                    };

                    var html = '<div class="mkt-popup-card">';
                    html += '<button class="mkt-popup-close" data-mkt-close>&times;</button>';

                    if (popup.imageUrl) {
                        // Blur-up image loading
                        html += '<div class="mkt-popup-img-wrap">';
                        html += '<img class="mkt-popup-img mkt-img-loading" src="' + MKT.escHtml(popup.imageUrl) + '" alt="" loading="eager" onload="this.classList.remove(\'mkt-img-loading\')">';
                        html += '</div>';
                    }

                    html += '<div class="mkt-popup-body">';

                    if (popup.title) {
                        html += '<h3 class="mkt-popup-title">' + MKT.escHtml(popup.title) + '</h3>';
                    }

                    if (popup.content) {
                        html += '<p class="mkt-popup-text">' + MKT.escHtml(popup.content) + '</p>';
                    }

                    if (popup.ctaLabel && popup.ctaUrl) {
                        html += '<a class="mkt-popup-cta" href="' + MKT.escHtml(popup.ctaUrl) + '">' + MKT.escHtml(popup.ctaLabel) + '</a>';
                    }

                    html += '</div></div>';
                    overlay.innerHTML = html;

                    var closeBtn = overlay.querySelector('[data-mkt-close]');
                    if (closeBtn) {
                        closeBtn.onclick = function () { MKT.closePopup(overlay, popup); };
                    }

                    rootEl.appendChild(overlay);
                    MKT.markPopupShown(popup);
                } catch (e) {
                    console.warn('[MKT] showPopup inner error:', e);
                }
            }, delay);
        } catch (e) {
            console.warn('[MKT] showPopup error:', e);
        }
    };

    MKT.closePopup = function (overlay, popup) {
        try {
            overlay.classList.add('mkt-popup-closing');
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 300);
        } catch (e) { /* silent */ }
    };

    // ============================================================
    // PROMO SECTIONS — with IntersectionObserver scroll reveal
    // ============================================================
    MKT.renderPromos = function (promos) {
        try {
            var container = document.createElement('div');
            container.className = 'mkt-promo-container';

            promos.forEach(function (promo) {
                var section = document.createElement('div');
                section.className = 'mkt-promo-section mkt-reveal';
                section.style.background = promo.bgColor || '#ffffff';

                var textColor = MKT.isLight(promo.bgColor) ? '#1e293b' : '#ffffff';
                var subColor = MKT.isLight(promo.bgColor) ? '#6366f1' : '#c4b5fd';
                var bodyColor = MKT.isLight(promo.bgColor) ? '#475569' : 'rgba(255,255,255,0.8)';

                var html = '<div class="mkt-promo-text">';

                if (promo.heading) {
                    html += '<h2 class="mkt-promo-heading" style="color:' + textColor + '">' + MKT.escHtml(promo.heading) + '</h2>';
                }
                if (promo.subheading) {
                    html += '<p class="mkt-promo-subheading" style="color:' + subColor + '">' + MKT.escHtml(promo.subheading) + '</p>';
                }
                if (promo.body) {
                    html += '<p class="mkt-promo-body" style="color:' + bodyColor + '">' + MKT.escHtml(promo.body) + '</p>';
                }
                if (promo.ctaLabel && promo.ctaUrl) {
                    html += '<a class="mkt-promo-cta" href="' + MKT.escHtml(promo.ctaUrl) + '">' + MKT.escHtml(promo.ctaLabel) + '</a>';
                }

                html += '</div>';

                if (promo.imageUrl) {
                    html += '<div class="mkt-promo-img-wrap"><img class="mkt-promo-img mkt-img-loading" src="' + MKT.escHtml(promo.imageUrl) + '" alt="" loading="lazy" onload="this.classList.remove(\'mkt-img-loading\')"></div>';
                }

                section.innerHTML = html;
                container.appendChild(section);
            });

            rootEl.appendChild(container);

            // Set up IntersectionObserver for scroll reveal
            MKT.observeReveal();
        } catch (e) {
            console.warn('[MKT] promo error:', e);
        }
    };

    // ============================================================
    // INTERSECTION OBSERVER — scroll reveal for promo sections
    // ============================================================
    MKT.observeReveal = function () {
        try {
            if (!('IntersectionObserver' in window)) {
                // Fallback: show all immediately
                var elements = document.querySelectorAll('.mkt-reveal');
                for (var i = 0; i < elements.length; i++) {
                    elements[i].classList.add('mkt-revealed');
                }
                return;
            }

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('mkt-revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.15,
                rootMargin: '0px 0px -40px 0px'
            });

            var elements = document.querySelectorAll('.mkt-reveal');
            for (var i = 0; i < elements.length; i++) {
                observer.observe(elements[i]);
            }
        } catch (e) {
            // Fallback: just show everything
            var elements = document.querySelectorAll('.mkt-reveal');
            for (var i = 0; i < elements.length; i++) {
                elements[i].classList.add('mkt-revealed');
            }
        }
    };

    // ============================================================
    // OFFER / DISCOUNT BANNERS — GPU accelerated
    // ============================================================
    MKT.renderBanners = function (banners) {
        try {
            banners.forEach(function (banner) {
                if (banner.bannerType === 'ticker') {
                    MKT.renderTicker(banner);
                } else {
                    MKT.renderStickyBar(banner);
                }
            });
        } catch (e) {
            console.warn('[MKT] banner error:', e);
        }
    };

    MKT.renderTicker = function (banner) {
        try {
            var wrap = document.createElement('div');
            wrap.className = 'mkt-ticker-wrap';
            wrap.style.background = banner.bgColor || '#ff6b35';
            wrap.style.color = banner.textColor || '#ffffff';

            var text = MKT.escHtml(banner.text);
            if (banner.linkUrl) {
                text = '<a href="' + MKT.escHtml(banner.linkUrl) + '">' + text + '</a>';
            }

            var itemHtml = '<span class="mkt-ticker-item">🎉 ' + text + '</span>';
            var repeated = itemHtml.repeat(8);

            wrap.innerHTML = '<div class="mkt-ticker-track">' + repeated + '</div>';
            rootEl.appendChild(wrap);
        } catch (e) {
            console.warn('[MKT] ticker error:', e);
        }
    };

    MKT.renderStickyBar = function (banner) {
        try {
            var bar = document.createElement('div');
            bar.className = 'mkt-sticky-bar';
            if (banner.bannerType === 'sticky_top') {
                bar.classList.add('mkt-sticky-top');
            } else {
                bar.classList.add('mkt-sticky-bottom');
            }
            bar.style.background = banner.bgColor || '#ff6b35';
            bar.style.color = banner.textColor || '#ffffff';

            var text = MKT.escHtml(banner.text);
            if (banner.linkUrl) {
                text += ' <a href="' + MKT.escHtml(banner.linkUrl) + '">Learn More →</a>';
            }

            bar.innerHTML = '<span>🎁 ' + text + '</span><button class="mkt-sticky-close" data-mkt-sticky-close>&times;</button>';

            var closeBtn = bar.querySelector('[data-mkt-sticky-close]');
            if (closeBtn) {
                closeBtn.onclick = function () {
                    bar.classList.add('mkt-sticky-closing');
                    setTimeout(function () {
                        if (bar.parentNode) bar.parentNode.removeChild(bar);
                    }, 400);
                };
            }

            document.body.appendChild(bar);
        } catch (e) {
            console.warn('[MKT] stickyBar error:', e);
        }
    };

    // ============================================================
    // UTILITIES
    // ============================================================

    /** Escape HTML to prevent XSS */
    MKT.escHtml = function (str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };

    /** Check if a hex color is light or dark */
    MKT.isLight = function (hex) {
        try {
            if (!hex) return true;
            hex = hex.replace('#', '');
            if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            var r = parseInt(hex.substr(0, 2), 16);
            var g = parseInt(hex.substr(2, 2), 16);
            var b = parseInt(hex.substr(4, 2), 16);
            var brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128;
        } catch (e) {
            return true;
        }
    };

    // ============================================================
    // BOOT — uses requestIdleCallback for non-blocking init
    // Falls back to setTimeout(1000) for older browsers
    // ============================================================
    function boot() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(MKT.init, { timeout: 1500 });
        } else {
            setTimeout(MKT.init, 1000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
