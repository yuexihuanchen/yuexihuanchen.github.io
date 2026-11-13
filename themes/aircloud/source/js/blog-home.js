const pixelCat = document.querySelector('.pixel-cat');
const catTail = pixelCat.querySelector('.pixel-cat-tail');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

pixelCat.addEventListener('click', () => {
    if (!reducedMotion.matches) pixelCat.classList.add('is-petted');
});
catTail.addEventListener('animationend', () => pixelCat.classList.remove('is-petted'));
reducedMotion.addEventListener('change', () => pixelCat.classList.remove('is-petted'));

function activateContributionCalendar() {
    const contributionGrid = document.querySelector('.contributions-grid');
    if (!contributionGrid) return;
    const days = Array.from(contributionGrid.querySelectorAll('.contribution-day'));
    const detail = document.querySelector('.contributions-detail');
    const updated = detail.textContent;
    let currentDay = days.at(-1);
    let selectedDay = null;

    const scrollRegion = contributionGrid.closest('.contributions-scroll');
    scrollRegion.scrollLeft = scrollRegion.scrollWidth;

    for (const day of days) {
        day.tabIndex = day === currentDay ? 0 : -1;
        day.setAttribute('aria-pressed', 'false');
    }

    function showContribution(day) {
        detail.textContent = day ? day.dataset.contribution : updated;
    }

    contributionGrid.addEventListener('pointerover', event => {
        if (event.target.matches('.contribution-day')) showContribution(event.target);
    });
    contributionGrid.addEventListener('pointerleave', () => {
        showContribution(selectedDay || (days.includes(document.activeElement) ? document.activeElement : null));
    });
    contributionGrid.addEventListener('focusin', event => {
        currentDay.tabIndex = -1;
        currentDay = event.target;
        currentDay.tabIndex = 0;
        showContribution(currentDay);
    });
    contributionGrid.addEventListener('focusout', event => {
        if (!contributionGrid.contains(event.relatedTarget)) showContribution(selectedDay);
    });
    contributionGrid.addEventListener('click', event => {
        if (!event.target.matches('.contribution-day')) return;
        selectedDay?.setAttribute('aria-pressed', 'false');
        selectedDay = selectedDay === event.target ? null : event.target;
        selectedDay?.setAttribute('aria-pressed', 'true');
        showContribution(selectedDay || event.target);
    });
    contributionGrid.addEventListener('keydown', event => {
        const dayOffset = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key];
        if (!dayOffset) return;
        event.preventDefault();
        const nextIndex = Math.max(0, Math.min(days.length - 1, days.indexOf(currentDay) + dayOffset));
        days[nextIndex].focus();
    });
}

activateContributionCalendar();

const refreshUrl = document.querySelector('.blog-home').dataset.refreshUrl;
if (['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
    const refreshSections = {
        'github-contributions': '.contributions',
        'skill-radar': '.skill-radar'
    };
    let refreshTimer;
    let refreshing = false;
    async function refreshHomeData() {
        if (document.hidden || refreshing) return;
        refreshing = true;
        try {
            const response = await fetch(refreshUrl);
            if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) return;
            const sections = await response.json();
            for (const [key, selector] of Object.entries(refreshSections)) {
                const section = document.querySelector(selector);
                if (!section || section.contains(document.activeElement) || typeof sections[key] !== 'string') continue;
                const template = document.createElement('template');
                template.innerHTML = sections[key].trim();
                const next = template.content.firstElementChild;
                if (!next?.matches(selector)) continue;
                if (section.dataset.refreshedMarkup === sections[key]) continue;
                next.dataset.refreshedMarkup = sections[key];
                section.replaceWith(next);
                if (key === 'github-contributions') activateContributionCalendar();
            }
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
