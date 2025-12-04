// LA Data Justice Hub Widget - Main Application Logic

// DOM Elements
const widgetContainer = document.getElementById('widgetContainer');
const maximizeBtn = document.getElementById('maximizeBtn');
const tocPanel = document.getElementById('tocPanel');
const tocToggle = document.getElementById('tocToggle');
const tocContent = document.getElementById('tocContent');
const contentArea = document.getElementById('contentArea');
const tocLinks = document.querySelectorAll('.toc-link, .toc-sublink');
const contentSections = document.querySelectorAll('.content-section');
const landingOverlay = document.getElementById('landingOverlay');

// State
let isFullscreen = false;
let isTocExpanded = true;
let scrollTimeout = null;
let activeSectionId = null;

// Initialize
function init() {
    setupLandingOverlay();
    setupFullscreen();
    setupTocToggle();
    setupSmoothScrolling();
    setupScrollSpy();
    updateTocState();
}

// Landing Overlay
function setupLandingOverlay() {
    if (landingOverlay) {
        landingOverlay.addEventListener('click', () => {
            landingOverlay.classList.add('hidden');
            // Show About section by default
            showOnlySection('about');
            activeSectionId = 'about';
            // Scroll to top
            contentArea.scrollTop = 0;
        });
    } else {
        // If no landing overlay, show About section by default
        showOnlySection('about');
        activeSectionId = 'about';
    }
}

// Fullscreen API
function setupFullscreen() {
    maximizeBtn.addEventListener('click', toggleFullscreen);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
}

function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    const element = widgetContainer;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function handleFullscreenChange() {
    isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
    
    // Update maximize button icon if needed
    updateMaximizeIcon();
}

function updateMaximizeIcon() {
    // Icon will be the same for both states, but you could swap it here
    // The visual feedback comes from the fullscreen state itself
}

// TOC Toggle
function setupTocToggle() {
    tocToggle.addEventListener('click', () => {
        isTocExpanded = !isTocExpanded;
        updateTocState();
    });
}

function updateTocState() {
    if (isTocExpanded) {
        tocPanel.classList.remove('collapsed');
        tocPanel.classList.add('expanded');
    } else {
        tocPanel.classList.remove('expanded');
        tocPanel.classList.add('collapsed');
    }
}

// Smooth Scrolling
function setupSmoothScrolling() {
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Check if it's a parent link (content-section) or sublink (subsection)
                const isParentLink = link.classList.contains('toc-link') && !link.classList.contains('toc-sublink');
                
                if (isParentLink) {
                    // Show only this parent section
                    showOnlySection(targetId);
                    activeSectionId = targetId;
                } else {
                    // It's a subsection - show its parent section
                    const parentSection = targetElement.closest('.content-section');
                    if (parentSection) {
                        showOnlySection(parentSection.id);
                        activeSectionId = parentSection.id;
                    }
                }
                
                // Temporarily disable scroll spy to avoid conflicts
                contentArea.removeEventListener('scroll', handleScroll);
                
                // Wait a moment for display changes to take effect, then scroll
                setTimeout(() => {
                    // If showing a parent section, scroll to top of that section
                    if (isParentLink) {
                        const sectionElement = document.getElementById(targetId);
                        if (sectionElement) {
                            contentArea.scrollTop = 0;
                        }
                    }
                    
                    // Scroll to target element
                    setTimeout(() => {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // Re-enable scroll spy after scroll completes
                        setTimeout(() => {
                            contentArea.addEventListener('scroll', handleScroll);
                            updateActiveSection();
                        }, 1000);
                    }, 100);
                }, 100);
            }
        });
    });
}

// Show only the specified section, hide all others
function showOnlySection(sectionId) {
    contentSections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

// Show all sections
function showAllSections() {
    contentSections.forEach(section => {
        section.style.display = 'block';
    });
    activeSectionId = null;
}

// Scroll Spy
function setupScrollSpy() {
    contentArea.addEventListener('scroll', handleScroll);
    // Initial update on load
    updateActiveSection();
}

function handleScroll() {
    // Throttle scroll events
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    
    scrollTimeout = setTimeout(() => {
        updateActiveSection();
    }, 100);
}

function updateActiveSection() {
    // Only update if we're not in filtered mode, or only check visible sections
    const visibleSections = Array.from(contentSections).filter(s => s.style.display !== 'none');
    const sections = Array.from(document.querySelectorAll('.content-section, .subsection'))
        .filter(s => {
            const parentSection = s.classList.contains('subsection') 
                ? s.closest('.content-section') 
                : s;
            return parentSection && visibleSections.includes(parentSection);
        });
    
    const scrollPosition = contentArea.scrollTop;
    const offset = 200; // Offset from top of viewport
    
    let currentSection = null;
    let currentSubsection = null;
    let minDistance = Infinity;
    
    // Find the section closest to the top of the viewport
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const distance = Math.abs(scrollPosition + offset - sectionTop);
        
        if (distance < minDistance && scrollPosition + offset >= sectionTop - 50) {
            minDistance = distance;
            
            if (section.classList.contains('subsection')) {
                currentSubsection = section;
                // Also set parent section
                const parentSection = section.closest('.content-section');
                if (parentSection) {
                    currentSection = parentSection;
                }
            } else {
                currentSection = section;
            }
        }
    });
    
    // Update active states
    tocLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    if (currentSubsection) {
        const subsectionId = currentSubsection.id;
        const subsectionLink = document.querySelector(`.toc-sublink[href="#${subsectionId}"]`);
        if (subsectionLink) {
            subsectionLink.classList.add('active');
            // Also highlight parent if it's a subsection
            const parentSection = currentSubsection.closest('.content-section');
            if (parentSection) {
                const parentId = parentSection.id;
                const parentLink = document.querySelector(`.toc-link[href="#${parentId}"]`);
                if (parentLink) {
                    parentLink.classList.add('active');
                }
            }
        }
    } else if (currentSection) {
        const sectionId = currentSection.id;
        const sectionLink = document.querySelector(`.toc-link[href="#${sectionId}"]`);
        if (sectionLink) {
            sectionLink.classList.add('active');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
