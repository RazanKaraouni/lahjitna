const ACCENTS = [
    { id: "zahle", name: "زحلة", src: "assets/audios/zahleVoice.ogg", region: "bikaa.html" },
    { id: "labaya", name: "لبايا", src: "assets/audios/labayaVoice.ogg", region: "west_bikaa.html" },
    { id: "trablos", name: "طرابلس", src: "assets/audios/trablosVoice.ogg", region: "north.html" },
    { id: "aljabal", name: "الجبل", src: "assets/audios/aljabal.ogg", region: "mountain.html" },
    { id: "aljanoub", name: "الجنوب", src: "assets/audios/aljanoubVoice.ogg", region: "south.html" },
    { id: "baalbeck", name: "بعلبك", src: "assets/audios/baalbeckVoice.ogg", region: "bikaa.html" }
];

const CHOICES = [
    { id: "beirut", name: "بيروت" },
    { id: "ashrafieh", name: "الأشرفية" },
    { id: "tareek", name: "طريق الجديدة" },
    { id: "trablos", name: "طرابلس" },
    { id: "saida", name: "صيدا" },
    { id: "yatar", name: "ياطر" },
    { id: "baalbeck", name: "بعلبك" },
    { id: "hermel", name: "الهرمل" },
    { id: "kaserwen", name: "كسروان" },
    { id: "rashia", name: "راشيا" },
    { id: "labaya", name: "لبايا" },
    { id: "zahle", name: "زحلة" },
    { id: "baisour", name: "بيصور" },
    { id: "aljabal", name: "الجبل" },
    { id: "aljanoub", name: "الجنوب" },
    { id: "akkar", name: "عكار" },
    { id: "chouf", name: "الشوف" },
    { id: "aley", name: "عاليه" },
    { id: "maten", name: "المتن" },
    { id: "jeb_jannine", name: "جب جنين" }
];

function isAllowedMediaSrc(src) {
    if (typeof src !== "string") return false;
    const trimmed = src.trim();
    if (!trimmed || trimmed.includes("\\") || trimmed.includes("..")) return false;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return false;
    if (trimmed.startsWith("//") || trimmed.startsWith("/")) return false;
    return /^assets\/audios\/[A-Za-z0-9._-]+\.ogg$/.test(trimmed);
}

function isSafePage(page) {
    return typeof page === "string" && /^[a-z0-9_]+\.html$/.test(page);
}

function shuffle(list) {
    const items = list.slice();
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = items[i];
        items[i] = items[j];
        items[j] = temp;
    }
    return items;
}

function resultCopy(score, total) {
    if (total === 0) {
        return { title: "ما في أسئلة", message: "ما لقينا تسجيلات جاهزة للعب." };
    }
    const ratio = score / total;
    if (ratio === 1) {
        return { title: "لهججي أصيل!", message: "عرفت كل اللكنات. أذنك ذهب." };
    }
    if (ratio >= 0.7) {
        return { title: "ممتاز!", message: "واضح إنك متعوّد تسمع لهجات لبنان." };
    }
    if (ratio >= 0.4) {
        return { title: "مش بطّال", message: "قرّب، جرّب مرة تانية بعد ما تشوف شوي من الخريطة." };
    }
    return { title: "كمّل سماع", message: "استكشف الخريطة وشوف اللكنات، بعدين ارجع احزر." };
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function celebrate(bigWin) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".guess-confetti").forEach((node) => node.remove());
    const layer = el("div", "guess-confetti" + (bigWin ? " is-jackpot" : ""));
    layer.setAttribute("aria-hidden", "true");
    const banner = el("p", "guess-confetti-banner", bigWin ? "لهججي أصيل!" : "صح!");
    layer.appendChild(banner);
    const colors = ["#ED1C24", "#07663a", "#f4c430", "#ffffff", "#0a8a4e", "#ff7a7a", "#ffd166"];
    const count = bigWin ? 160 : 110;
    for (let i = 0; i < count; i += 1) {
        const piece = el("span", "guess-confetti-piece");
        const size = 12 + Math.random() * 18;
        piece.style.setProperty("--w", size.toFixed(0) + "px");
        piece.style.setProperty("--h", (size * 1.45).toFixed(0) + "px");
        piece.style.setProperty("--drift", (Math.random() * 220 - 110).toFixed(0) + "px");
        piece.style.setProperty("--spin", (400 + Math.random() * 800).toFixed(0) + "deg");
        piece.style.setProperty("--delay", (Math.random() * 0.2).toFixed(2) + "s");
        piece.style.setProperty("--dur", (1.8 + Math.random() * 1.4).toFixed(2) + "s");
        piece.style.background = colors[i % colors.length];
        piece.style.left = (Math.random() * 100) + "%";
        piece.style.top = (-12 - Math.random() * 25) + "vh";
        layer.appendChild(piece);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), bigWin ? 3200 : 2400);
}

document.addEventListener("DOMContentLoaded", () => {
    const roundsEl = document.getElementById("rounds");
    const scoreText = document.getElementById("scoreText");
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");
    const resultModal = document.getElementById("guessResultModal");
    const resultTitle = document.getElementById("resultTitle");
    const resultScore = document.getElementById("resultScore");
    const resultMessage = document.getElementById("resultMessage");
    const resultBadge = document.getElementById("resultBadge");
    const resultCloseBtn = document.getElementById("resultCloseBtn");
    const replayBtn = document.getElementById("replayBtn");

    const clips = [];
    let answers = [];

    function pauseOthers(exceptClip) {
        clips.forEach((clip) => {
            if (clip !== exceptClip) clip.pause();
        });
    }

    function setPageFeedback(correct) {
        document.body.classList.remove("guess-bg-correct", "guess-bg-wrong");
        if (!correct) {
            document.body.classList.add("guess-bg-wrong");
        }
    }

    function resetPageFeedback() {
        document.body.classList.remove("guess-bg-correct", "guess-bg-wrong");
    }

    function showResultModal() {
        if (!resultModal) return;
        resultModal.hidden = false;
        resultModal.classList.remove("is-open");
        void resultModal.offsetWidth;
        requestAnimationFrame(() => {
            resultModal.classList.add("is-open");
        });
    }

    function hideResultModal() {
        if (!resultModal) return;
        resultModal.classList.remove("is-open");
        resultModal.hidden = true;
    }

    function updateScore() {
        const answered = answers.filter((item) => item != null).length;
        const score = answers.filter((item) => item === true).length;
        const total = answers.length;
        scoreText.textContent = "النقاط: " + score + " / " + total;
        progressText.textContent = answered === total
            ? "خلصت كل الأسئلة"
            : "جاوبت " + answered + " من " + total;
        progressBar.style.width = total ? ((answered / total) * 100) + "%" : "0%";

        if (answered === total && total > 0) {
            const copy = resultCopy(score, total);
            resultTitle.textContent = copy.title;
            resultScore.textContent = score + " / " + total;
            resultMessage.textContent = copy.message;
            if (resultBadge) {
                resultBadge.textContent = score === total ? "نتيجة كاملة" : "النتيجة";
            }
            showResultModal();
            if (score === total) celebrate(true);
        } else {
            hideResultModal();
        }
    }

    function createRound(accent, roundIndex) {
        const round = el("article", "guess-card guess-round");
        round.dataset.roundIndex = String(roundIndex);

        const heading = el("p", "guess-prompt", "التسجيل " + (roundIndex + 1));
        const player = el("div", "guess-player is-audio");
        const clip = document.createElement("audio");
        clip.controls = true;
        clip.preload = "metadata";
        clip.setAttribute("aria-label", "تسجيل اللكنة " + (roundIndex + 1));
        if (isAllowedMediaSrc(accent.src)) clip.src = accent.src;
        clip.addEventListener("play", () => pauseOthers(clip));
        player.appendChild(clip);

        const choicesEl = el("div", "guess-choices");
        choicesEl.setAttribute("role", "group");
        choicesEl.setAttribute("aria-label", "خيارات اللكنة");
        const feedback = el("p", "guess-feedback");
        feedback.setAttribute("role", "status");
        const regionLink = document.createElement("a");
        regionLink.className = "guess-btn guess-btn-ghost guess-region-link";
        regionLink.hidden = true;
        regionLink.textContent = "صفحة لهجة " + accent.name;
        const pool = CHOICES.filter((item) => item.id !== accent.id);
        const options = shuffle([accent].concat(shuffle(pool).slice(0, 3)));
        options.forEach((option) => {
            const btn = el("button", "guess-choice", option.name);
            btn.type = "button";
            btn.dataset.optionId = option.id;
            btn.addEventListener("click", () => {
                if (answers[roundIndex] != null) return;
                clip.pause();
                const correct = option.id === accent.id;
                answers[roundIndex] = correct;
                Array.from(choicesEl.children).forEach((choiceBtn) => {
                    choiceBtn.disabled = true;
                    if (choiceBtn.dataset.optionId === accent.id) {
                        choiceBtn.classList.add("is-correct");
                    }
                });
                setPageFeedback(correct);
                if (!correct) {
                    btn.classList.add("is-wrong");
                    if (isSafePage(accent.region)) {
                        regionLink.href = accent.region;
                        regionLink.hidden = false;
                    }
                } else {
                    btn.classList.add("is-pop");
                    celebrate(false);
                }
                feedback.textContent = correct
                    ? "صحيح! هيدي لكنة " + accent.name
                    : "غلط… الصح " + accent.name;
                feedback.className = "guess-feedback " + (correct ? "is-correct" : "is-wrong");
                updateScore();
            });
            choicesEl.appendChild(btn);
        });

        round.append(heading, player, choicesEl, feedback, regionLink);
        clips.push(clip);
        return round;
    }

    function renderGame() {
        clips.length = 0;
        answers = ACCENTS.map(() => null);
        roundsEl.replaceChildren();
        resetPageFeedback();
        hideResultModal();
        ACCENTS.forEach((accent, index) => {
            roundsEl.appendChild(createRound(accent, index));
        });
        updateScore();
    }

    replayBtn.addEventListener("click", () => {
        pauseOthers(null);
        renderGame();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (resultCloseBtn) {
        resultCloseBtn.addEventListener("click", hideResultModal);
    }
    if (resultModal) {
        resultModal.addEventListener("click", (event) => {
            if (event.target === resultModal) hideResultModal();
        });
    }

    renderGame();
});
