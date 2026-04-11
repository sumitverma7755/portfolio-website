function setMenuState(isOpen) {
    const menuButton = $("#menu");
    const navbar = $(".navbar");

    menuButton.toggleClass("fa-times", isOpen);
    navbar.toggleClass("nav-toggle", isOpen);
}

const GITHUB_PORTFOLIO_USERNAME = "sumitverma7755";

function updateScrollTopButton() {
    const scrollTopButton = document.querySelector("#scroll-top");

    if (!scrollTopButton) {
        return;
    }

    scrollTopButton.classList.toggle("active", window.scrollY > 60);
}

function updateScrollSpy() {
    $("section[id]").each(function () {
        const height = $(this).outerHeight();
        const offset = $(this).offset().top - 200;
        const top = $(window).scrollTop();
        const id = $(this).attr("id");

        if (top >= offset && top < offset + height) {
            $(".navbar ul li a").removeClass("active");
            $(`.navbar a[href="#${id}"]`).addClass("active");
        }
    });
}

function renderSkills(skills) {
    const skillsContainer = document.getElementById("skillsContainer");

    if (!skillsContainer) {
        return;
    }

    const html = skills.map((skill) => `
        <div class="bar">
          <div class="info">
            <img src="${skill.icon}" alt="${skill.name} logo" />
            <span>${skill.name}</span>
          </div>
        </div>
    `).join("");

    skillsContainer.innerHTML = html;
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

async function loadSkills() {
    const response = await fetch("./skills.json");

    if (!response.ok) {
        throw new Error(`Unable to load skills: ${response.status}`);
    }

    const data = await response.json();
    renderSkills(data);
}

async function loadFeaturedProjects() {
    const projectsContainer = document.getElementById("projectsContainer");

    if (!projectsContainer || !window.PortfolioProjectCatalog) {
        return;
    }

    try {
        let projects = [];
        let usedFallbackCatalog = false;

        try {
            projects = await window.PortfolioProjectCatalog.loadGitHubProjects(GITHUB_PORTFOLIO_USERNAME, {
                featuredCount: 4,
            });
        } catch (githubError) {
            console.warn("GitHub sync failed. Falling back to local project catalog.", githubError);
            projects = await window.PortfolioProjectCatalog.load("./assets/data/projects.json");
            usedFallbackCatalog = true;
        }

        const featuredProjects = window.PortfolioProjectCatalog.getFeatured(projects, 4);

        if (!featuredProjects.length) {
            setProjectsStatus("Featured projects will be published here soon.", false);
            projectsContainer.innerHTML = "";
            return;
        }

        window.PortfolioProjectCatalog.render(projectsContainer, featuredProjects);
        setProjectsStatus(
            usedFallbackCatalog ? "Showing saved project list while GitHub sync is unavailable." : "",
            false
        );
        srtop.reveal(".work .box", { interval: 120 });
    } catch (error) {
        console.error(error);
        projectsContainer.innerHTML = "";
        setProjectsStatus("Projects could not be loaded right now. Please try again shortly.", true);
    }
}

function initContactForm() {
    const form = document.getElementById("contact-form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!window.emailjs) {
            alert("Contact form service is unavailable right now. Please try again later.");
            return;
        }

        emailjs.init("user_TTDmetQLYgWCLzHTDgqxm");

        emailjs.sendForm("contact_service", "template_contact", "#contact-form")
            .then(function () {
                form.reset();
                alert("Form Submitted Successfully");
            })
            .catch(function () {
                alert("Form Submission Failed! Try Again");
            });
    });
}

function initTypingEffect() {
    if (!document.querySelector(".typing-text")) {
        return;
    }

    new Typed(".typing-text", {
        strings: ["frontend development", "backend development", "web designing", "android development", "web development"],
        loop: true,
        typeSpeed: 50,
        backSpeed: 25,
        backDelay: 500,
    });
}

function initTilt() {
    if (!window.VanillaTilt) {
        return;
    }

    VanillaTilt.init(document.querySelectorAll(".tilt"), {
        max: 15,
    });
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

    $(".navbar a[href^='#']").on("click", function () {
        setMenuState(false);
    });

    $(window).on("scroll load", function () {
        if (!$("#menu").is(":focus")) {
            setMenuState(false);
        }

        updateScrollTopButton();
        updateScrollSpy();
    });

    $("a[href^='#']").on("click", function (event) {
        const targetSelector = $(this).attr("href");
        const targetElement = targetSelector ? document.querySelector(targetSelector) : null;

        if (!targetElement) {
            return;
        }

        event.preventDefault();
        $("html, body").animate({
            scrollTop: $(targetElement).offset().top,
        }, 500, "linear");
    });

    initContactForm();
});

document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
        document.title = "Portfolio | Sumit Kumar Verma";
        $("#favicon").attr("href", "assets/images/favicon.png");
    } else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href", "assets/images/favhand.png");
    }
});

loadSkills().catch((error) => console.error(error));
loadFeaturedProjects();
initTypingEffect();
initTilt();
initChatWidget();

const srtop = ScrollReveal({
    origin: "top",
    distance: "80px",
    duration: 1000,
    reset: true,
});

srtop.reveal(".home .content h2", { delay: 200 });
srtop.reveal(".home .content p", { delay: 220 });
srtop.reveal(".home .content .btn", { delay: 240 });
srtop.reveal(".home .image", { delay: 320 });
srtop.reveal(".home .social-icons li", { interval: 140 });
srtop.reveal(".about .content h3", { delay: 200 });
srtop.reveal(".about .content .tag", { delay: 220 });
srtop.reveal(".about .content p", { delay: 240 });
srtop.reveal(".about .content .box-container", { delay: 260 });
srtop.reveal(".about .content .resumebtn", { delay: 280 });
srtop.reveal(".skills .container", { delay: 180 });
srtop.reveal(".skills .container .bar", { interval: 100 });
srtop.reveal(".education .box", { interval: 160 });
srtop.reveal(".work .section-head", { delay: 180 });
srtop.reveal(".work .work-actions", { delay: 220 });
srtop.reveal(".contact .container", { delay: 240 });
