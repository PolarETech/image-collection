// eslint-disable-next-line no-redeclare
const sourceViewer = (() => {
  const transitionDuration = 410;
  const viewerHeight = '36vh';
  const sourceViewerId = 'source-viewer';
  const downloadButtonId = 'download-source-button';
  const closeButtonId = 'close-source-viewer-button';
  const codeAreaId = 'code-area';
  const loadingIconId = 'source-loading-icon';

  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.timeout = 20000;

  return {
    showSVGSource: e => {
      if (e.target.classList.contains('selected')) return;
      if (e.target.classList.contains('loading')) return;

      fetchData(e.target);
    }
  };

  function fetchData (element) {
    xhr.onload = () => readData(xhr.response, element);

    xhr.onerror = () => toast.showToast('connectionError');
    xhr.ontimeout = () => toast.showToast('timeoutError');

    xhr.onloadstart = () => addLoadingIcon(element);
    xhr.onloadend = () => removeLoadingIcon();

    xhr.open('GET', element.src);
    xhr.send(null);
  }

  function readData (blob, element) {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result === '') {
        toast.showToast('serverError');
        return;
      }

      openViewer(element);
      setCodeContents(reader.result);
    };

    reader.onerror = () => toast.showToast('serverError');

    reader.readAsText(blob);
  }

  async function openViewer (element) {
    const viewer = document.getElementById(sourceViewerId);
    const downloadButton = document.getElementById(downloadButtonId);
    const closeButton = document.getElementById(closeButtonId);
    const codeArea = document.getElementById(codeAreaId);

    appearSelectedBorder(element);

    if (getComputedStyle(viewer).display === 'none') {
      viewer.style.display = 'block';

      // NOTE:
      // If sleep is not put in, the height transition will not work.
      await sleep(10);

      viewer.style.height = viewerHeight;
      downloadButton.style.display = 'block';
      closeButton.style.display = 'block';

      // Wait for height transition
      await sleep(transitionDuration);

      codeArea.style.overflowY = 'scroll';

      downloadButton.addEventListener('click', downloadSVGSource);
      closeButton.addEventListener('click', closeViewer, { once: true });
    }

    adjustScrollPosition(element);
  }

  async function closeViewer () {
    const viewer = document.getElementById(sourceViewerId);
    const downloadButton = document.getElementById(downloadButtonId);
    const closeButton = document.getElementById(closeButtonId);
    const codeArea = document.getElementById(codeAreaId);

    if (getComputedStyle(viewer).display === 'none') return;

    downloadButton.removeEventListener('click', downloadSVGSource);

    disappearSelectedBorder();
    clearCodeContents();

    downloadButton.style.display = '';
    closeButton.style.display = '';
    codeArea.style.overflowY = '';
    viewer.style.height = '';

    // Wait for height transition
    await sleep(transitionDuration);

    viewer.style.display = '';
  }

  function addLoadingIcon (element) {
    removeLoadingIcon();

    element.classList.add('loading');

    const loadingIcon = document.createElement('div');
    element.after(loadingIcon);
    loadingIcon.setAttribute('id', loadingIconId);

    adjustLoadingIconPosition();

    window.addEventListener('resize', adjustLoadingIconPosition);
  }

  function removeLoadingIcon () {
    const loadingIcon = document.getElementById(loadingIconId);
    const loadingElements = document.querySelectorAll('.image-area img.loading');

    if (loadingIcon !== null) {
      loadingIcon.remove();
    }

    loadingElements.forEach(loadingElement => {
      loadingElement.classList.remove('loading');
    });

    window.removeEventListener('resize', adjustLoadingIconPosition);
  }

  function adjustLoadingIconPosition () {
    const loadingIcon = document.getElementById(loadingIconId);
    const targetImage = document.querySelector('.image-area img.loading');

    if (loadingIcon === null || targetImage === null) {
      removeLoadingIcon();
      return;
    }

    // MEMO:
    // svg images width: 6rem; height: 6rem; padding: 1.4rem;
    // source-loading-icon width: 5rem; height: 0.25rem;
    const marginTop = Math.round(targetImage.clientHeight / 6 * 5.5);
    const marginLeft = Math.round(targetImage.clientWidth / 6 * 0.5);

    loadingIcon.style.top = `${targetImage.offsetTop + marginTop}px`;
    loadingIcon.style.left = `${targetImage.offsetLeft + marginLeft}px`;
  }

  function appearSelectedBorder (element) {
    disappearSelectedBorder();

    element.classList.add('selected');
  }

  function disappearSelectedBorder () {
    const selectedElements = document.querySelectorAll('.image-area img.selected');

    selectedElements.forEach(selectedElement => {
      selectedElement.classList.remove('selected');
    });
  }

  function adjustScrollPosition (element) {
    // NOTE:
    // Adjust the scroll position of the screen
    // to avoid hiding the selected image behind the viewer.
    // * Smooth scroll is not supported in Safari.

    const viewer = document.getElementById(sourceViewerId);
    const viewerRect = viewer.getBoundingClientRect();
    const imageRect = element.getBoundingClientRect();
    const distance = viewerRect.top - imageRect.bottom;

    if (distance < 10) {
      window.scrollBy({
        top: -distance + 10,
        behavior: 'smooth'
      });
    }
  }

  async function setCodeContents (contents) {
    const codeArea = document.getElementById(codeAreaId).getElementsByTagName('code')[0];

    if (codeArea.innerText !== '') {
      clearCodeContents();
      resetCodeAreaScrolling();

      // NOTE:
      // To make it easier for users to recognize that the contents have been changed,
      // display the empty viewer for a moment.
      await sleep(100);
    }

    codeArea.innerText = contents;
  }

  function clearCodeContents () {
    const codeArea = document.getElementById(codeAreaId).getElementsByTagName('code')[0];
    codeArea.innerText = '';
  }

  function resetCodeAreaScrolling () {
    const codeArea = document.getElementById(codeAreaId);
    codeArea.scrollTop = 0;
    codeArea.scrollLeft = 0;
  }

  async function downloadSVGSource () {
    const licenseText = `<!-- PT Image Collection | MIT License | https://github.com/PolarETech/image-collection/blob/main/LICENSE.txt -->\n\n`;
    const sourceCode = document.getElementById(codeAreaId).innerText;
    const blob = new Blob([ licenseText, sourceCode ], { type: 'image/svg+xml' });

    const selectedElement = document.getElementsByClassName('selected')[0];
    const fileName = 'PTIC_' + selectedElement.src.split('/').pop();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = url;
    a.download = fileName;
    a.click();

    // NOTE:
    // If sleep is not put in, iOS Safari will fail to download.
    await sleep(10);

    a.remove();
    URL.revokeObjectURL(url);
  }

  function sleep (msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }
})();

(function setEventListener () {
  function endImageLoading (event) {
    switch (event.type) {
    case 'load':
      event.currentTarget.removeEventListener('error', endImageLoading, { once: true });
      event.currentTarget.addEventListener('click', sourceViewer.showSVGSource);
      break;
    case 'error':
      event.currentTarget.removeEventListener('load', endImageLoading, { once: true });
      break;
    }
  }

  const images = document.querySelectorAll('.image-area img');

  images.forEach(image => {
    image.addEventListener('load', endImageLoading, { once: true });
    image.addEventListener('error', endImageLoading, { once: true });
  });
}());
