// eslint-disable-next-line no-redeclare
const sourceViewer = (() => {
  const transitionDuration = 410;
  const viewerHeight = '36vh';
  const sourceViewerId = 'source-viewer';
  const downloadButtonId = 'download-source-button';
  const closeButtonId = 'close-source-viewer-button';
  const codeAreaId = 'code-area';

  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.timeout = 20000;

  return {
    showSVGSource: e => {
      if (e.target.classList.contains('selected')) return;

      fetchData(e.target);
    }
  };

  function fetchData (element) {
    xhr.onload = () => readData(xhr.response, element);

    xhr.onerror = () => toast.showToast('connectionError');
    xhr.ontimeout = () => toast.showToast('timeoutError');

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
  const images = document.querySelectorAll('.image-area img');

  images.forEach(image => {
    image.addEventListener('click', sourceViewer.showSVGSource);
  });
}());
