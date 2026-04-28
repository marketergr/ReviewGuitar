document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    const isMobile = () => window.innerWidth <= 768;

    document.querySelectorAll('.dropdown').forEach(dropdown => {
        let closeTimer = null;

        dropdown.addEventListener('mouseenter', () => {
            if (isMobile()) return;
            clearTimeout(closeTimer);
            dropdown.classList.add('is-open');
        });

        dropdown.addEventListener('mouseleave', () => {
            if (isMobile()) return;
            closeTimer = setTimeout(() => {
                dropdown.classList.remove('is-open');
            }, 150);
        });

        const trigger = dropdown.querySelector('a');
        trigger.addEventListener('click', (e) => {
            if (!isMobile()) return;
            e.preventDefault();
            const isOpen = dropdown.classList.contains('is-open');
            document.querySelectorAll('.dropdown.is-open').forEach(d => d.classList.remove('is-open'));
            if (!isOpen) dropdown.classList.add('is-open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.is-open').forEach(d => d.classList.remove('is-open'));
        }
    });
});
