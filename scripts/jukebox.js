function chooseSetting() {
    const unlisted = document.querySelector('.js-setup-privacy[data-privacy="unlisted"]');
    unlisted.click();
}

window.addEventListener('load', chooseSetting);
