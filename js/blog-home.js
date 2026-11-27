const pixelCat = document.querySelector('.pixel-cat');
const catTail = pixelCat.querySelector('.pixel-cat-tail');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

pixelCat.addEventListener('click', () => {
    if (!reducedMotion.matches) pixelCat.classList.add('is-petted');
});
catTail.addEventListener('animationend', () => pixelCat.classList.remove('is-petted'));
reducedMotion.addEventListener('change', () => pixelCat.classList.remove('is-petted'));

const refreshUrl = document.querySelector('.blog-home').dataset.refreshUrl;
if (['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
    let refreshTimer;
    let refreshing = false;
    async function refreshHomeData() {
        if (document.hidden || refreshing) return;
        refreshing = true;
        try {
            const response = await fetch(refreshUrl);
            if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) return;
            const { 'skill-radar': markup } = await response.json();
            const section = document.querySelector('.skill-radar');
            if (!section || section.contains(document.activeElement) || typeof markup !== 'string') return;
            if (section.dataset.refreshedMarkup === markup) return;

            const template = document.createElement('template');
            template.innerHTML = markup.trim();
            const next = template.content.firstElementChild;
            if (!next?.matches('.skill-radar')) return;
            next.dataset.refreshedMarkup = markup;
            section.replaceWith(next);
        } catch {
            // Keep the rendered snapshot available while the network is down.
        } finally {
            refreshing = false;
            refreshTimer = setTimeout(refreshHomeData, 5 * 60 * 1000);
        }
    }

    refreshTimer = setTimeout(refreshHomeData, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            clearTimeout(refreshTimer);
            refreshHomeData();
        }
    });
}
