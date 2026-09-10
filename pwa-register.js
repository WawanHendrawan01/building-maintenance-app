if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => registration.update())
            .catch(error => console.error('PWA service worker registration failed:', error));
    });
}
