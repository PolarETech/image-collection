// eslint-disable-next-line no-redeclare
const licenseViewer = (() => {
  const licenseFileURL = './data/LICENSE.txt';
  const doneButtonColor = 'var(--ap-main-header-color)';
  const licenseButtonId = 'show-license';
  const licenseViewerId = 'license-viewer';
  const closeButtonId = 'close-source-viewer-button';

  const xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.timeout = 20000;

  return {
    showLicenseText: () => {
      if (xhr.readyState !== 0 && xhr.readyState !== 4) return;

      fetchData();
    }
  };

  function fetchData () {
    xhr.onload = () => readData(xhr.response);

    xhr.onerror = () => toast.showToast('connectionError');
    xhr.ontimeout = () => toast.showToast('timeoutError');

    xhr.onloadstart = () => startBlinking();
    xhr.onloadend = () => stopBlinking();

    xhr.open('GET', licenseFileURL);
    xhr.send(null);
  }

  function readData (blob) {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result === '') {
        toast.showToast('serverError');
        return;
      }

      addLicenseContent(reader.result);
      changeLicenseButtonBehavior();
      closeSourceCodeViewer();
    };

    reader.onerror = () => toast.showToast('serverError');

    reader.readAsText(blob);
  }

  function addLicenseContent (content) {
    let viewer = document.createElement('p');
    viewer = document.getElementById(licenseViewerId).appendChild(viewer);
    viewer.innerText = content;

    adjustScrollPosition();
  }

  function adjustScrollPosition () {
    // NOTE:
    // Adjust the scroll position of the screen
    // since users may not notice the license appears if it is displayed off-screen.
    // * Smooth scroll is not supported in Safari.

    const viewer = document.getElementById(licenseViewerId);
    const rect = viewer.getBoundingClientRect();
    const distance = window.innerHeight - rect.bottom;

    if (distance < 20) {
      window.scrollBy({
        top: Math.min(-distance + 20, rect.top - 70),
        behavior: 'smooth'
      });
    }
  }

  function changeLicenseButtonBehavior () {
    const button = document.getElementById(licenseButtonId);

    button.style.backgroundColor = doneButtonColor;
    button.style.cursor = 'default';

    button.removeEventListener('click', licenseViewer.showLicenseText);
  }

  function closeSourceCodeViewer () {
    const clickEvent = new Event('click');
    const closeSourceViewerButton = document.getElementById(closeButtonId);

    closeSourceViewerButton.dispatchEvent(clickEvent);
  }

  function startBlinking () {
    const button = document.getElementById(licenseButtonId);
    button.classList.add('blinking');
  }

  function stopBlinking () {
    const button = document.getElementById(licenseButtonId);
    button.classList.remove('blinking');
  }
})();

(function setEventListener () {
  const button = document.getElementById('show-license');
  button.addEventListener('click', licenseViewer.showLicenseText);
}());
