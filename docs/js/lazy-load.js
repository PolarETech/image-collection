(function lazyLoad () {
  const attrName = 'data-src';

  const loadImage = (entries, observer) => {
    entries.forEach(entry => {
      if (entry.intersectionRatio < 0.2) return;

      addLoadingIcon(entry.target);

      const src = entry.target.getAttribute(attrName);
      entry.target.src = src;
      entry.target.removeAttribute(attrName);

      observer.unobserve(entry.target);
    });
  };

  const addLoadingIcon = target => {
    target.addEventListener('load', removeLoadingIcon, { once: true });
    target.addEventListener('error', removeLoadingIcon, { once: true });
    target.classList.add('lazy-loading-icon');
  };

  const removeLoadingIcon = event => {
    event.currentTarget.classList.remove('lazy-loading-icon');

    switch (event.type) {
    case 'load':
      event.currentTarget.removeEventListener('error', removeLoadingIcon, { once: true });
      break;
    case 'error':
      event.currentTarget.removeEventListener('load', removeLoadingIcon, { once: true });
      break;
    }
  };

  const options = { threshold: 0.2 };
  const observer = new IntersectionObserver(loadImage, options);

  const targets = document.querySelectorAll('.image-area img');

  targets.forEach(target => {
    if (target.hasAttribute('src')) return;
    if (target.hasAttribute(attrName) === false) return;

    observer.observe(target);
  });
})();
