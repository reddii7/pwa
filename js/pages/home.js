export async function render() {
    const content = `
        <div class="title-container">
            <h1 class="title-text title-wags">WAGS</h1>
            <h1 class="title-text title-mobile">MOBILE</h1>
        </div>
    `;

    // Use a timeout to ensure the elements are in the DOM before animating
    setTimeout(() => {
        gsap.from(".title-text", {
            duration: 1.5,
            y: 50,
            opacity: 0,
            stagger: 0.3,
            ease: "power3.out",
            delay: 0.5
        });
    }, 0);

    return content;
}