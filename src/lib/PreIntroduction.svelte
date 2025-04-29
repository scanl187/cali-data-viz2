<script>
    import { onMount } from "svelte";

    let scrollY = 0;
    let windowHeight = 0;
    let titleElement;

    // Update scroll position
    function handleScroll() {
        scrollY = window.scrollY;
        updateTitleStyle();
    }

    // Update title style based on scroll position
    function updateTitleStyle() {
        if (!titleElement || !windowHeight) return;

        // Calculate how far down the user has scrolled (as a percentage)
        // Using windowHeight as the maximum scroll distance for full effect
        const scrollProgress = Math.min(1, scrollY / windowHeight);

        // Scale down from 1 to 0.3 based on scroll
        const scale = Math.max(0.3, 1 - scrollProgress * 0.7);

        // Move from center (50%) to top (0%)
        const topPosition = Math.max(0, 50 - scrollProgress * 50);

        // Fade out as it reaches the top (fully transparent at top)
        const opacity = Math.max(0, 1 - scrollProgress);

        // Apply styles
        titleElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        titleElement.style.top = `${topPosition}%`;
        titleElement.style.opacity = opacity;
    }

    onMount(() => {
        windowHeight = window.innerHeight;
        titleElement = document.querySelector(".centered-title");

        // Set up scroll listener
        window.addEventListener("scroll", handleScroll);

        // Initial setup
        updateTitleStyle();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    });
</script>

<div class="pre-intro-container">
    <div class="centered-title">
        <h1>The California Story</h1>
    </div>
</div>

<style>
    .pre-intro-container {
        height: 100vh;
        width: 100%;
        background: linear-gradient(
            0deg,
            rgba(254, 249, 246, 1) 0%,
            rgba(254, 249, 246, 0.9) 85%,
            rgba(204, 92, 60, 0.1) 100%
        );
        position: relative;
        overflow: hidden;
    }

    .centered-title {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(1);
        width: 100%;
        text-align: center;
        z-index: 100;
        transition:
            transform 0.2s ease-out,
            top 0.2s ease-out,
            opacity 0.2s ease-out;
    }

    .centered-title h1 {
        font-size: 5rem;
        font-weight: 700;
        color: #cc5c3c;
        margin: 0;
        background: linear-gradient(45deg, #cc5c3c, #ffc107);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 768px) {
        .centered-title h1 {
            font-size: 3rem;
        }
    }
</style>
