// eslint-disable-next-line no-redeclare, no-unused-vars
const toast = (() => {
  const openDuration = 6000;
  const transitionDuration = 410;
  const toastId = 'toast';

  let timer = null;

  return {
    showToast: messageType => {
      if (timer !== null) {
        clearTimeout(timer);
        clearToastMessage();
      }

      openToast(messageType);
      timer = setTimeout(closeToast, openDuration);
    }
  };

  async function openToast (messageType) {
    const toast = document.getElementById(toastId);
    const message = retrieveToastMessage(messageType);

    toast.style.display = 'block';

    // NOTE:
    // If sleep is not put in, the width transition will not work.
    await sleep(10);

    toast.style.height = retrieveToastHeight(messageType);
    toast.style.width = '18rem';
    toast.style.maxWidth = '80vw';
    toast.style.padding = '1.2rem';

    // Wait for width transition
    await sleep(transitionDuration);

    toast.innerHTML = `<p>${message}</p>`;
  }

  async function closeToast () {
    const toast = document.getElementById(toastId);

    toast.innerHTML = '';
    toast.style.padding = '';
    toast.style.width = '';
    toast.style.maxWidth = '';

    // Wait for width transition
    await sleep(transitionDuration);

    toast.style.display = '';

    timer = null;
  }

  function clearToastMessage () {
    const toast = document.getElementById(toastId);
    toast.innerHTML = '';
  }

  function retrieveToastMessage (messageType) {
    switch (messageType) {
    case 'connectionError':
      return 'Network Connection Error';
    case 'serverError':
      return 'Internal Server Error';
    case 'timeoutError':
      return 'Connection Timeout Error';
    default:
      return 'Unknown Error';
    }
  }

  function retrieveToastHeight (messageType) {
    // MEMO:
    // padding: 1.2rem; line-height: 1.2rem;
    switch (messageType) {
    case 'connectionError':
    case 'serverError':
    case 'timeoutError':
    default:
      return '3.6rem';
    }
  }

  function sleep (msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }
})();
