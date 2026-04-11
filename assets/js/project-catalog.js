window.PortfolioProjectCatalog = (function () {
    const githubRepoCache = new Map();
    const githubUserProjectsCache = new Map();
    let cardRevealObserver = null;

    const CATEGORY_LABELS = {
        fullstack: "Full Stack",
        frontend: "Frontend",
        mobile: "Mobile App",
    };

    const MOBILE_KEYWORDS = [
        "android",
        "kotlin",
        "swift",
        "mobile",
        "react-native",
        "react native",
        "flutter",
        "expo",
        "ios",
    ];

    const FULLSTACK_KEYWORDS = [
        "fullstack",
        "full stack",
        "mern",
        "mean",
        "backend",
        "server",
        "api",
        "node",
        "express",
        "mongodb",
        "mysql",
        "postgres",
        "django",
        "flask",
        "spring",
        "laravel",
        "php",
    ];

    const FRONTEND_KEYWORDS = [
        "frontend",
        "front end",
        "front-end",
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "next",
        "nextjs",
        "vue",
        "nuxt",
        "angular",
        "tailwind",
        "ui",
        "website",
        "portfolio",
    ];

    const BASIC_REPO_KEYWORDS = [
        "portfolio",
        "template",
        "dummy",
        "tutorial",
        "practice",
        "sample",
        "clone",
        "basic",
        "test",
        "sandbox",
    ];

    const STRONG_SIGNAL_KEYWORDS = [
        "ai",
        "ml",
        "machine learning",
        "deepfake",
        "detector",
        "prediction",
        "analytics",
        "ecommerce",
        "shop",
        "auth",
        "database",
        "api",
        "realtime",
        "automation",
        "dashboard",
    ];

    const STACK_ICON_RULES = [
        { label: "JavaScript", iconClass: "fab fa-js-square", keywords: ["javascript", " js ", "js "] },
        { label: "TypeScript", iconClass: "fas fa-code", keywords: ["typescript", " ts ", "ts "] },
        { label: "React", iconClass: "fab fa-react", keywords: ["react"] },
        { label: "Node.js", iconClass: "fab fa-node-js", keywords: ["node", "express"] },
        { label: "Python", iconClass: "fab fa-python", keywords: ["python", "jupyter"] },
        { label: "Java", iconClass: "fab fa-java", keywords: ["java"] },
        { label: "HTML5", iconClass: "fab fa-html5", keywords: ["html"] },
        { label: "CSS3", iconClass: "fab fa-css3-alt", keywords: ["css", "sass", "tailwind", "bootstrap"] },
        { label: "Database", iconClass: "fas fa-database", keywords: ["mongodb", "mysql", "postgres", "sqlite", "firebase", "database"] },
        { label: "API", iconClass: "fas fa-plug", keywords: ["api", "rest"] },
        { label: "Mobile", iconClass: "fas fa-mobile-alt", keywords: ["android", "kotlin", "ios", "mobile", "flutter", "react native", "expo"] },
        { label: "AI / ML", iconClass: "fas fa-brain", keywords: ["ai", "ml", "machine learning", "deepfake", "prediction"] },
        { label: "Cloud", iconClass: "fas fa-cloud", keywords: ["cloud", "docker", "vercel", "netlify", "aws"] },
    ];

    function escapeHtml(value = "") {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function normalizeLink(url = "") {
        const value = String(url || "").trim();

        if (!value || value === "#") {
            return "";
        }

        return value;
    }

    function normalizeExternalLink(url = "") {
        const value = String(url || "").trim();

        if (!value || value === "#") {
            return "";
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (/^[a-z]+:/i.test(value)) {
            return "";
        }

        return `https://${value.replace(/^\/+/, "")}`;
    }

    function parseGitHubRepo(url = "") {
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();

            if (host !== "github.com" && host !== "www.github.com") {
                return null;
            }

            const [owner, rawRepo] = parsed.pathname.split("/").filter(Boolean);

            if (!owner || !rawRepo) {
                return null;
            }

            const repo = rawRepo.replace(/\.git$/i, "");
            return {
                key: `${owner}/${repo}`,
            };
        } catch (error) {
            return null;
        }
    }

    function formatStarCount(value = 0) {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
        }

        return String(value);
    }

    function formatUpdatedDate(value) {
        if (!value) {
            return "N/A";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "N/A";
        }

        return new Intl.DateTimeFormat("en", {
            month: "short",
            year: "numeric",
        }).format(date);
    }

    function includesKeyword(text, keywords) {
        return keywords.some((keyword) => text.includes(keyword));
    }

    function inferCategory(repo) {
        const haystack = `${repo?.name || ""} ${repo?.description || ""} ${(repo?.topics || []).join(" ")} ${repo?.language || ""}`.toLowerCase();

        if (includesKeyword(haystack, MOBILE_KEYWORDS)) {
            return "mobile";
        }

        if (includesKeyword(haystack, FULLSTACK_KEYWORDS)) {
            return "fullstack";
        }

        if (includesKeyword(haystack, FRONTEND_KEYWORDS)) {
            return "frontend";
        }

        const language = String(repo?.language || "").toLowerCase();

        if (language === "html" || language === "css") {
            return "frontend";
        }

        return "fullstack";
    }

    function getRepoSearchText(repo) {
        return `${repo?.name || ""} ${repo?.description || ""} ${(repo?.topics || []).join(" ")} ${repo?.language || ""}`
            .toLowerCase();
    }

    function isBasicRepo(repo) {
        return includesKeyword(getRepoSearchText(repo), BASIC_REPO_KEYWORDS);
    }

    function calculateProjectStrength(repo) {
        const category = inferCategory(repo);
        const description = String(repo?.description || "").trim();
        const text = getRepoSearchText(repo);
        let score = 0;

        if (category === "fullstack") {
            score += 4;
        } else if (category === "mobile") {
            score += 3;
        } else if (category === "frontend") {
            score += 1;
        }

        if (description.length >= 80) {
            score += 4;
        } else if (description.length >= 40) {
            score += 2;
        } else if (description.length >= 15) {
            score += 1;
        }

        if (repo?.language) {
            score += 1;
        }

        if (Array.isArray(repo?.topics)) {
            score += Math.min(repo.topics.length, 4);
        }

        if (normalizeExternalLink(repo?.homepage || "")) {
            score += 2;
        } else if (repo?.has_pages) {
            score += 1;
        }

        if (includesKeyword(text, STRONG_SIGNAL_KEYWORDS)) {
            score += 3;
        }

        if (isBasicRepo(repo)) {
            score -= 6;
        }

        return score;
    }

    function toTitleCase(value = "") {
        return String(value)
            .replace(/[-_]+/g, " ")
            .trim()
            .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    }

    function buildProjectTags(repo, category) {
        const topicTags = Array.isArray(repo?.topics)
            ? repo.topics.map((topic) => toTitleCase(topic)).filter(Boolean)
            : [];
        const languageTag = repo?.language ? [repo.language] : [];
        const fallbackTag = CATEGORY_LABELS[category] ? [CATEGORY_LABELS[category]] : [];

        return Array.from(new Set([...topicTags, ...languageTag, ...fallbackTag])).slice(0, 4);
    }

    function getStackMatchText(project) {
        return ` ${project?.category || ""} ${project?.label || ""} ${(project?.tags || []).join(" ")} `
            .toLowerCase()
            .replace(/[-_]+/g, " ");
    }

    function buildStackIcons(project, maxIcons = 5) {
        const matchText = getStackMatchText(project);
        const icons = [];

        STACK_ICON_RULES.forEach((rule) => {
            const matchesRule = rule.keywords.some((keyword) => matchText.includes(String(keyword).toLowerCase()));

            if (matchesRule && !icons.some((icon) => icon.label === rule.label)) {
                icons.push({
                    label: rule.label,
                    iconClass: rule.iconClass,
                });
            }
        });

        if (!icons.length) {
            icons.push({
                label: project?.label || "Project Stack",
                iconClass: "fas fa-layer-group",
            });
        }

        return icons.slice(0, maxIcons);
    }

    function renderStackIcons(project) {
        const icons = buildStackIcons(project, 5);

        return icons.map((item) => `
            <span class="project-card__stack-icon" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}">
                <i class="${escapeHtml(item.iconClass)}" aria-hidden="true"></i>
            </span>
        `).join("");
    }

    function getRepoDemoLink(repo) {
        const homepage = normalizeExternalLink(repo?.homepage || "");

        if (homepage) {
            return homepage;
        }

        if (repo?.has_pages && repo?.owner?.login && repo?.name) {
            return `https://${repo.owner.login}.github.io/${repo.name}/`;
        }

        return "";
    }

    function normalizeRepoToProject(repo, featuredRepoIds) {
        const category = inferCategory(repo);
        const displayName = toTitleCase(repo?.name || "Untitled Repository");
        const summary = repo?.description
            ? repo.description
            : `Source code and implementation details for ${displayName}.`;

        return {
            id: String(repo?.id || repo?.name || Math.random()),
            name: displayName,
            featured: featuredRepoIds.has(repo.id),
            category,
            label: CATEGORY_LABELS[category] || "Project",
            summary,
            description: summary,
            image: repo?.full_name
                ? `https://opengraph.githubassets.com/1/${repo.full_name}`
                : "",
            imageAlt: `${displayName} repository preview.`,
            tags: buildProjectTags(repo, category),
            owner: repo?.owner?.login || "sumitverma7755",
            stars: Number(repo?.stargazers_count || 0),
            updatedAt: repo?.pushed_at || repo?.updated_at || "",
            repoKey: repo?.full_name || "",
            links: {
                code: normalizeLink(repo?.html_url || ""),
                demo: getRepoDemoLink(repo),
            },
        };
    }

    async function fetchGitHubUserRepos(username) {
        const repos = [];

        for (let page = 1; page <= 5; page += 1) {
            const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=updated&page=${page}`, {
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            });

            if (!response.ok) {
                throw new Error(`Unable to load GitHub repositories: ${response.status}`);
            }

            const payload = await response.json();

            if (!Array.isArray(payload) || !payload.length) {
                break;
            }

            repos.push(...payload);

            if (payload.length < 100) {
                break;
            }
        }

        return repos;
    }

    async function loadGitHubProjects(username = "sumitverma7755", options = {}) {
        const normalizedUsername = String(username || "").trim();

        if (!normalizedUsername) {
            return [];
        }

        const cacheKey = normalizedUsername.toLowerCase();

        if (githubUserProjectsCache.has(cacheKey)) {
            return githubUserProjectsCache.get(cacheKey);
        }

        const projectsPromise = (async () => {
            const repos = await fetchGitHubUserRepos(normalizedUsername);
            const excludedRepoNames = new Set([
                normalizedUsername.toLowerCase(),
                "shopnest",
                "kumar-electricals",
                "portfolio-website",
            ]);
            const ownRepos = repos.filter((repo) => {
                if (!repo || repo.fork) {
                    return false;
                }

                const repoName = String(repo.name || "").toLowerCase();
                return !excludedRepoNames.has(repoName);
            });
            const featuredCount = Number.isInteger(options.featuredCount) && options.featuredCount > 0
                ? options.featuredCount
                : 6;
            const nonBasicRepos = ownRepos.filter((repo) => !isBasicRepo(repo));
            const featuredPool = nonBasicRepos.length ? nonBasicRepos : ownRepos;
            const featuredRepoIds = new Set(
                [...featuredPool]
                    .sort((first, second) => {
                        const strengthDiff = calculateProjectStrength(second) - calculateProjectStrength(first);

                        if (strengthDiff !== 0) {
                            return strengthDiff;
                        }

                        const starsDiff = Number(second?.stargazers_count || 0) - Number(first?.stargazers_count || 0);

                        if (starsDiff !== 0) {
                            return starsDiff;
                        }

                        return new Date(second?.pushed_at || second?.updated_at || 0).getTime()
                            - new Date(first?.pushed_at || first?.updated_at || 0).getTime();
                    })
                    .slice(0, featuredCount)
                    .map((repo) => repo.id)
            );

            return ownRepos
                .sort((first, second) => {
                    const basicDiff = Number(isBasicRepo(first)) - Number(isBasicRepo(second));

                    if (basicDiff !== 0) {
                        return basicDiff;
                    }

                    const strengthDiff = calculateProjectStrength(second) - calculateProjectStrength(first);

                    if (strengthDiff !== 0) {
                        return strengthDiff;
                    }

                    return new Date(second?.pushed_at || second?.updated_at || 0).getTime()
                        - new Date(first?.pushed_at || first?.updated_at || 0).getTime();
                })
                .map((repo) => normalizeRepoToProject(repo, featuredRepoIds));
        })().catch((error) => {
            githubUserProjectsCache.delete(cacheKey);
            throw error;
        });

        githubUserProjectsCache.set(cacheKey, projectsPromise);
        return projectsPromise;
    }

    async function loadGitHubRepoStats(repoKey) {
        if (!repoKey) {
            return null;
        }

        if (githubRepoCache.has(repoKey)) {
            return githubRepoCache.get(repoKey);
        }

        const statsPromise = fetch(`https://api.github.com/repos/${repoKey}`, {
            headers: {
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                return response.json();
            })
            .then((payload) => ({
                stars: payload.stargazers_count || 0,
                updatedAt: payload.pushed_at || "",
            }))
            .catch(() => null);

        githubRepoCache.set(repoKey, statsPromise);
        return statsPromise;
    }

    function hydrateGitHubMetadata(container) {
        const metadataNodes = Array.from(container.querySelectorAll("[data-repo-key]"));

        metadataNodes.forEach(async (node) => {
            const inlineStars = Number(node.dataset.stars);
            const hasInlineStars = !Number.isNaN(inlineStars);
            const inlineUpdatedAt = node.dataset.updatedAt || "";

            if (hasInlineStars || inlineUpdatedAt) {
                node.textContent = `* ${formatStarCount(hasInlineStars ? inlineStars : 0)} | Updated ${formatUpdatedDate(inlineUpdatedAt)}`;
                return;
            }

            const stats = await loadGitHubRepoStats(node.dataset.repoKey);

            if (!stats) {
                node.textContent = "GitHub stats unavailable";
                return;
            }

            node.textContent = `* ${formatStarCount(stats.stars)} | Updated ${formatUpdatedDate(stats.updatedAt)}`;
        });
    }

    async function load(path) {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(`Unable to load project catalog: ${response.status}`);
        }

        return response.json();
    }

    function getFeatured(projects, limit = 6) {
        return projects.filter((project) => project.featured).slice(0, limit);
    }

    function filterByCategory(projects, filter = "all") {
        if (filter === "all") {
            return projects;
        }

        if (filter === "featured") {
            return projects.filter((project) => project.featured);
        }

        return projects.filter((project) => project.category === filter);
    }

    function getPrimaryAction(project) {
        const demoHref = normalizeLink(project?.links?.demo);
        const codeHref = normalizeLink(project?.links?.code);

        if (demoHref) {
            return {
                href: demoHref,
                label: "Live Demo",
            };
        }

        if (codeHref) {
            return {
                href: codeHref,
                label: "Open Repo",
            };
        }

        return null;
    }

    function renderCard(project, options = {}) {
        const primaryAction = getPrimaryAction(project);
        const codeHref = normalizeLink(project?.links?.code);
        const ownerName = project.owner || "Sumit Kumar Verma";
        const repoInfo = project?.repoKey ? { key: project.repoKey } : parseGitHubRepo(codeHref);
        const hasInlineStars = Number.isFinite(Number(project?.stars));
        const updatedAt = project?.updatedAt || "";
        const stackMarkup = renderStackIcons(project);
        const cardClasses = [
            "box",
            "project-card",
            project.featured ? "project-card--featured" : "",
            options.isHero ? "project-card--hero" : "",
        ].filter(Boolean).join(" ");
        const badgeMarkup = project.featured
            ? '<span class="project-card__badge">Featured</span>'
            : "";
        const githubMetaMarkup = repoInfo
            ? `<p class="project-card__meta" data-repo-key="${escapeHtml(repoInfo.key)}"${hasInlineStars ? ` data-stars="${escapeHtml(String(Number(project.stars || 0)))}"` : ""}${updatedAt ? ` data-updated-at="${escapeHtml(updatedAt)}"` : ""}>GitHub stats loading...</p>`
            : '<p class="project-card__meta">GitHub stats unavailable</p>';
        const codeActionMarkup = codeHref
            ? `<a href="${escapeHtml(codeHref)}" class="project-card__link project-card__link--secondary" target="_blank" rel="noreferrer">
                <i class="fab fa-github" aria-hidden="true"></i>
                <span>Code</span>
              </a>`
            : `<span class="project-card__link project-card__link--muted" aria-disabled="true">
                <i class="fab fa-github" aria-hidden="true"></i>
                <span>Code Unavailable</span>
              </span>`;
        const primaryActionMarkup = primaryAction
            ? `<a href="${escapeHtml(primaryAction.href)}" class="project-card__link project-card__link--primary" target="_blank" rel="noreferrer">
                <span>${escapeHtml(primaryAction.label)}</span>
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
              </a>`
            : `<span class="project-card__link project-card__link--muted project-card__link--primary" aria-disabled="true">
                <span>Preview Unavailable</span>
                <i class="fas fa-external-link-alt" aria-hidden="true"></i>
              </span>`;
        const imageSrc = normalizeLink(project?.image || "");
        const mediaMarkup = imageSrc
            ? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(project.imageAlt || project.name)}" loading="lazy" />`
            : "";

        return `
        <article class="${cardClasses}" data-category="${escapeHtml(project.category || "fullstack")}" data-featured="${project.featured ? "true" : "false"}">
          <div class="project-card__media">
            ${badgeMarkup}
            ${mediaMarkup}
            <div class="project-card__media-overlay" aria-hidden="true">
              <span class="project-card__overlay-chip">${escapeHtml(project.label || "Project")}</span>
              <span class="project-card__overlay-text">Built for production</span>
            </div>
          </div>
          <div class="project-card__body">
            <span class="project-card__label">${escapeHtml(project.label || "Project")}</span>
            <h3 class="project-card__title">${escapeHtml(project.name || "Untitled Project")}</h3>
            <p class="project-card__owner">Built by ${escapeHtml(ownerName)}</p>
            ${githubMetaMarkup}
            <p class="project-card__desc">${escapeHtml(project.summary || project.description || "")}</p>
            <div class="project-card__stack" aria-label="Tech stack">
              ${stackMarkup}
            </div>
            <div class="project-card__actions">
              ${codeActionMarkup}
              ${primaryActionMarkup}
            </div>
          </div>
        </article>`;
    }

    function animateCardsOnScroll(container) {
        const cards = Array.from(container.querySelectorAll(".project-card"));

        if (!cards.length) {
            return;
        }

        const prefersReducedMotion = typeof window !== "undefined"
            && typeof window.matchMedia === "function"
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        cards.forEach((card, index) => {
            card.style.setProperty("--project-reveal-delay", `${Math.min(index * 70, 280)}ms`);
            card.classList.add("is-reveal-ready");
        });

        if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
            cards.forEach((card) => card.classList.add("is-visible"));
            return;
        }

        if (cardRevealObserver) {
            cardRevealObserver.disconnect();
        }

        cardRevealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px -40px 0px",
            threshold: 0.2,
        });

        cards.forEach((card) => {
            card.classList.remove("is-visible");
            cardRevealObserver.observe(card);
        });
    }

    function render(container, projects, options = {}) {
        const enableHeroCard = options.heroCard === true;
        const heroIndex = enableHeroCard
            ? projects.findIndex((project) => project && project.featured)
            : -1;

        container.innerHTML = projects.map((project, index) => renderCard(project, {
            isHero: heroIndex !== -1 && heroIndex === index && projects.length > 2,
        })).join("");
        hydrateGitHubMetadata(container);
        animateCardsOnScroll(container);
    }

    return {
        load,
        loadGitHubProjects,
        getFeatured,
        filterByCategory,
        render,
    };
})();
