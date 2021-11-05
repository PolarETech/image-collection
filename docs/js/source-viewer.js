// eslint-disable-next-line no-redeclare
const sourceViewer = (() => {
  const transitionDuration = 410;
  const viewerHeight = '36vh';
  const sourceViewerId = 'source-viewer';
  const closeButtonId = 'close-source-viewer-button';
  const codeAreaId = 'code-area';

  return {
    showSVGSource: e => {
      if (e.target.classList.contains('selected')) return;

      const element = e.target;

      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        const blob = xhr.response;

        const reader = new FileReader();
        reader.readAsText(blob);

        reader.onload = () => {
          openViewer(element);
          setCodeContents(reader.result);
        };
      };

      xhr.open('GET', element.src);
      xhr.responseType = 'blob';
      xhr.send(null);
    }
  };

  async function openViewer (element) {
    const viewer = document.getElementById(sourceViewerId);
    const closeButton = document.getElementById(closeButtonId);
    const codeArea = document.getElementById(codeAreaId);

    appearSelectedBorder(element);

    if (getComputedStyle(viewer).display === 'none') {
      viewer.style.display = 'block';

      // NOTE:
      // If sleep is not put in, the height transition will not work.
      await sleep(10);

      viewer.style.height = viewerHeight;
      closeButton.style.display = 'block';

      // Wait for height transition
      await sleep(transitionDuration);

      codeArea.style.overflowY = 'scroll';

      closeButton.addEventListener('click', closeViewer, { once: true });
    }

    adjustScrollPosition(element);
  }

  async function closeViewer () {
    const viewer = document.getElementById(sourceViewerId);
    const closeButton = document.getElementById(closeButtonId);
    const codeArea = document.getElementById(codeAreaId);

    if (getComputedStyle(viewer).display === 'none') return;

    disappearSelectedBorder();
    clearCodeContents();

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
