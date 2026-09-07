const DIALECT_REGIONS = [
    { name: "الشمال", page: "north.html" },
    { name: "الجبل", page: "mountain.html" },
    { name: "بيروت", page: "beirut.html" },
    { name: "البقاع", page: "bikaa.html" },
    { name: "البقاع الغربي", page: "west_bikaa.html" },
    { name: "الجنوب", page: "south.html" }
];

function isSafePage(page) {
    return typeof page === "string" && /^[a-z0-9_]+\.html$/.test(page);
}

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
}

function initDialectsMenu() {
    const navList = document.querySelector("#navbarNav .navbar-nav");
    if (!navList || navList.querySelector(".dialects-menu")) return;

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const isDialectPage = DIALECT_REGIONS.some((region) => region.page === currentPage);
    const mapItem = navList.querySelector('a[href="map.html"]')?.closest(".nav-item");

    const menuItem = createEl("li", "nav-item dropdown dialects-menu");

    const toggle = createEl(
        "a",
        "nav-link dropdown-toggle" + (isDialectPage ? " active" : "")
    );
    toggle.appendChild(document.createTextNode("اللهجات"));
    const arrow = createEl("i", "fas fa-chevron-down dialects-arrow");
    arrow.setAttribute("aria-hidden", "true");
    toggle.appendChild(arrow);
    toggle.href = "#";
    toggle.setAttribute("role", "button");
    toggle.setAttribute("data-bs-toggle", "dropdown");
    toggle.setAttribute("data-bs-display", "static");
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", (event) => {
        event.preventDefault();
    });

    const dropdown = createEl("ul", "dropdown-menu dropdown-menu-start dialects-dropdown");

    DIALECT_REGIONS.forEach((region) => {
        if (!isSafePage(region.page)) return;
        const item = document.createElement("li");
        const link = createEl(
            "a",
            "dropdown-item" + (region.page === currentPage ? " active" : ""),
            region.name
        );
        link.href = region.page;
        item.appendChild(link);
        dropdown.appendChild(item);
    });

    menuItem.appendChild(toggle);
    menuItem.appendChild(dropdown);

    if (mapItem) {
        navList.insertBefore(menuItem, mapItem);
    } else {
        navList.appendChild(menuItem);
    }

    if (window.bootstrap && bootstrap.Dropdown) {
        bootstrap.Dropdown.getOrCreateInstance(toggle);
    }
}

function initGuessNavLink() {
    const navList = document.querySelector("#navbarNav .navbar-nav");
    if (!navList || navList.querySelector(".guess-nav-item")) return;

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const item = createEl("li", "nav-item guess-nav-item");
    const link = createEl(
        "a",
        "nav-link" + (currentPage === "guess.html" ? " active" : ""),
        "احزر اللهجة"
    );
    link.href = "guess.html";
    if (currentPage === "guess.html") {
        link.setAttribute("aria-current", "page");
    }
    item.appendChild(link);
    navList.appendChild(item);
}

function initMobileNavClose() {
    const collapseEl = document.getElementById("navbarNav");
    if (!collapseEl || !window.bootstrap || !bootstrap.Collapse) return;

    const collapse = bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });

    collapseEl.addEventListener("click", (event) => {
        const link = event.target.closest(".nav-link:not(.dropdown-toggle), .dropdown-item");
        if (!link) return;
        if (!window.matchMedia("(max-width: 991.98px)").matches) return;
        if (!collapseEl.classList.contains("show")) return;
        collapse.hide();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initDialectsMenu();
    initGuessNavLink();
    initMobileNavClose();
});
