document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('videoModal');
    const triggers = document.querySelectorAll('[data-video-modal]');

    function isAllowedVideoSrc(src) {
        if (typeof src !== 'string') return false;
        const trimmed = src.trim();
        if (!trimmed || trimmed.includes('\\') || trimmed.includes('..')) return false;
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false;
        if (trimmed.startsWith('//') || trimmed.startsWith('/')) return false;
        return /^assets\/[A-Za-z0-9._-]+\.mp4$/.test(trimmed);
    }

    if (modal) {
        const closeBtn = document.getElementById('closeModal');
        const video = document.getElementById('accentVideo');
        const modalTitle = document.getElementById('modalTitleText');

        function openModal(title, src) {
            if (modalTitle) modalTitle.textContent = title || '';
            if (video) {
                const source = video.querySelector('source');
                if (isAllowedVideoSrc(src)) {
                    if (source) source.src = src;
                    video.src = src;
                    video.load();
                    window.setTimeout(() => {
                        video.play().catch(() => {});
                    }, 350);
                } else {
                    if (source) source.removeAttribute('src');
                    video.removeAttribute('src');
                    video.load();
                }
            }
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
            closeBtn?.focus();
        }

        function closeModal() {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }

        triggers.forEach((trigger) => {
            trigger.addEventListener('click', () => {
                trigger.classList.add('is-pressed');
                window.setTimeout(() => trigger.classList.remove('is-pressed'), 200);
                openModal(
                    trigger.dataset.videoTitle || trigger.textContent.trim(),
                    trigger.dataset.videoSrc
                );
            });

            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModal(
                        trigger.dataset.videoTitle || trigger.textContent.trim(),
                        trigger.dataset.videoSrc
                    );
                }
            });
        });

        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
        });
    }
});
