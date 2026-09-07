document.addEventListener("DOMContentLoaded", function () {
    var video = document.getElementById("introVideo");
    var scrollBtn = document.getElementById("aboutScrollBtn");
    var videoWrap = document.getElementById("aboutVideoWrap");
    var videoSection = document.getElementById("aboutVideo");

    if (scrollBtn && videoWrap && videoSection) {
        scrollBtn.addEventListener("click", function (event) {
            event.preventDefault();
            videoWrap.hidden = false;
            document.body.classList.add("is-showing-video");
            videoSection.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    if (!video) return;

    function fitFrameToVideo() {
        if (!video.videoWidth || !video.videoHeight) return;
        video.style.aspectRatio = video.videoWidth + " / " + video.videoHeight;
    }

    video.addEventListener("loadedmetadata", fitFrameToVideo);
    if (video.readyState >= 1) fitFrameToVideo();
});
