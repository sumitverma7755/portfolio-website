let projectCatalog = [];
let activeFilter = "all";
let isFallbackCatalog = false;
const GITHUB_PORTFOLIO_USERNAME = "sumitverma7755";

function setMenuState(isOpen) {
    const menuButton = $("#menu");
    const navbar = $(".navbar");

    menuButton.toggleClass("fa-times", isOpen);
    navbar.toggleClass("nav-toggle", isOpen);
    menuButton.attr("aria-expanded", String(isOpen));
    menuButton.attr("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
}

function updateScrollTopButton() {
    const scrollTopButton = document.querySelector("#scroll-top");

    if (!scrollTopButton) {
        return;
    }

    scrollTopButton.classList.toggle("active", window.scrollY > 60);
}

function setProjectsStatus(message, isError = false) {
    const status = document.getElementById("projectsStatus");

    if (!status) {
        return;
    }

    status.textContent = message;
    status.classList.toggle("is-hidden", !message);
    status.classList.toggle("is-error", isError);
}

function setFilterState(filter) {
    activeFilter = filter;

    document.querySelectorAll("#filters .btn").forEach((button) => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function renderProjects(filter = "all") {
    const container = document.getElementById("projectsContainer");

    if (!container) {
        return;
    }

    const projects = window.PortfolioProjectCatalog
        ? window.PortfolioProjectCatalog.filterByCategory(projectCatalog, filter)
        : [];

    if (!projects.length) {
        container.innerHTML = '<p class="projects-empty">No projects match this filter yet.</p>';
        setProjectsStatus(
            isFallbackCatalog ? "Showing saved project list while GitHub sync is unavailable." : "",
            false
        );
        return;
    }

    window.PortfolioProjectCatalog.render(container, projects, {
        heroCard: false,
    });
    setProjectsStatus(
        isFallbackCatalog ? "Showing saved project list while GitHub sync is unavailable." : "",
        false
    );
    srtop.reveal(".work .box", { interval: 120 });
}

async function initProjectArchive() {
    const container = document.getElementById("projectsContainer");

    if (!container || !window.PortfolioProjectCatalog) {
        return;
    }

    try {
        try {
            projectCatalog = await window.PortfolioProjectCatalog.loadGitHubProjects(GITHUB_PORTFOLIO_USERNAME, {
                featuredCount: 4,
            });
            isFallbackCatalog = false;
        } catch (githubError) {
            console.warn("GitHub sync failed. Falling back to local project catalog.", githubError);
            projectCatalog = await window.PortfolioProjectCatalog.load("../assets/data/projects.json");
            isFallbackCatalog = true;
        }

        renderProjects(activeFilter);
    } catch (error) {
        console.error(error);
        container.innerHTML = "";
        setProjectsStatus("Project archive could not be loaded right now. Please refresh and try again.", true);
    }
}

function initChatWidget() {
    var Tawk_API = window.Tawk_API || {}, Tawk_LoadStart = new Date();
    window.Tawk_API = Tawk_API;

    (function () {
        var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
        s1.async = true;
        s1.src = "https://embed.tawk.to/60df10bf7f4b000ac03ab6a8/1f9jlirg6";
        s1.charset = "UTF-8";
        s1.setAttribute("crossorigin", "*");
        s0.parentNode.insertBefore(s1, s0);
    })();
}

$(document).ready(function () {
    $("#menu").on("click", function () {
        setMenuState(!$(this).hasClass("fa-times"));
    });

    $("#filters").on("click", ".btn", function () {
        const filter = $(this).data("filter");
        setFilterState(filter);
        renderProjects(filter);
    });

    $(window).on("scroll load", function () {
        if (!$("#menu").is(":focus")) {
            setMenuState(false);
        }

        updateScrollTopButton();
    });
});

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        document.title = "Projects | Sumit Kumar Verma";
        $("#favicon").attr("href", "../assets/images/favicon.png");
    } else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href", "../assets/images/favhand.png");
    }
});

setFilterState(activeFilter);
initProjectArchive();
initChatWidget();

const srtop = ScrollReveal({
    origin: "top",
    distance: "80px",
    duration: 1000,
    reset: true,
});

srtop.reveal(".work .section-head", { delay: 180 });
srtop.reveal(".work .button-group", { delay: 220 });
srtop.reveal(".work .backbtn", { delay: 260 });
