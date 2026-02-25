document.addEventListener('DOMContentLoaded', () => {
    console.log('Hub page loaded');

    // Add smooth landing animations for cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease ' + (index * 0.1) + 's';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });

    // Ripple effect on hover (optional but adds premium feel)
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Can add more micro-interactions here
        });
    });
});
