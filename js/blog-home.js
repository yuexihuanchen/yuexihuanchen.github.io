const pixelCat = document.querySelector('.pixel-cat');
const catTail = pixelCat.querySelector('.pixel-cat-tail');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

pixelCat.addEventListener('click', () => {
    if (!reducedMotion.matches) pixelCat.classList.add('is-petted');
});
catTail.addEventListener('animationend', () => pixelCat.classList.remove('is-petted'));
reducedMotion.addEventListener('change', () => pixelCat.classList.remove('is-petted'));
