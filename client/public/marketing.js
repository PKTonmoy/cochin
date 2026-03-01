/**
 * marketing.js
 * Isolated marketing module — vanilla JS, namespaced under window.MKT
 * Injects content ONLY into <div id="marketing-root"></div>
 * All errors are caught silently — never breaks the main page
 *
 * Features:
 *  - Pop-up banners (with frequency: always/session/daily)
 *  - Promo sections on homepage
 *  - Offer/discount banners (ticker or sticky bar)
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
    // INIT — called after DOM ready (with delay for lazy loading)
    // ============================================================
    MKT.init = function () {
        try {
            rootEl = document.getElementById('marketing-root');
            if (!rootEl) return; // no root div — silently bail

            MKT.fetchAndRender();
        } catch (e) {
            // Silent fail — never break the main page
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
    // POP-UP BANNERS
    // ============================================================
    MKT.renderPopups = function (popups) {
        try {
            // Show only the first active popup that passes frequency check
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
                const today = new Date().toDateString();
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
            const delay = (popup.delaySeconds || 0) * 1000;

            setTimeout(function () {
                try {
                    // Build popup HTML
                    const overlay = document.createElement('div');
                    overlay.className = 'mkt-popup-overlay';
                    overlay.onclick = function (e) {
                        if (e.target === overlay) MKT.closePopup(overlay, popup);
                    };

                    let html = '<div class="mkt-popup-card">';
                    html += '<button class="mkt-popup-close" data-mkt-close>&times;</button>';

                    if (popup.imageUrl) {
                        html += '<img class="mkt-popup-img" src="' + MKT.escHtml(popup.imageUrl) + '" alt="" loading="lazy">';
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

                    // Close button handler
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
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s';
            setTimeout(function () {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 200);
        } catch (e) { /* silent */ }
    };

    // ============================================================
    // PROMO SECTIONS
    // ============================================================
    MKT.renderPromos = function (promos) {
        try {
            var container = document.createElement('div');
            container.className = 'mkt-promo-container';

            promos.forEach(function (promo) {
                var section = document.createElement('div');
                section.className = 'mkt-promo-section';
                section.style.background = promo.bgColor || '#ffffff';

                // Determine text color based on bg darkness
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
                    html += '<div class="mkt-promo-img-wrap"><img class="mkt-promo-img" src="' + MKT.escHtml(promo.imageUrl) + '" alt="" loading="lazy"></div>';
                }

                section.innerHTML = html;
                container.appendChild(section);
            });

            rootEl.appendChild(container);
        } catch (e) {
            console.warn('[MKT] promo error:', e);
        }
    };

    // ============================================================
    // OFFER / DISCOUNT BANNERS
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

            // Duplicate the text for seamless scroll
            var text = MKT.escHtml(banner.text);
            if (banner.linkUrl) {
                text = '<a href="' + MKT.escHtml(banner.linkUrl) + '">' + text + '</a>';
            }

            var itemHtml = '<span class="mkt-ticker-item">🎉 ' + text + '</span>';
            // Repeat enough times for seamless loop
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
                    bar.style.transform = banner.bannerType === 'sticky_top' ? 'translateY(-100%)' : 'translateY(100%)';
                    bar.style.transition = 'transform 0.3s ease';
                    setTimeout(function () {
                        if (bar.parentNode) bar.parentNode.removeChild(bar);
                    }, 300);
                };
            }

            // Append to body directly (sticky needs to be body-level)
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
    // BOOT — lazy load after main content is ready
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(MKT.init, 500); // 500ms delay for lazy loading
        });
    } else {
        setTimeout(MKT.init, 500);
    }

})();
