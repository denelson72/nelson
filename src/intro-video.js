const INTRO_VIDEO_URL = "/intro-media";
const INTRO_SESSION_KEY = "introVideoDismissedUntil";
const INTRO_SESSION_MS = 30 * 60 * 1000;

function shouldShowIntro() {
  const until = Number(sessionStorage.getItem(INTRO_SESSION_KEY) || 0);
  return Date.now() >= until;
}

function setIntroDismissed() {
  sessionStorage.setItem(
    INTRO_SESSION_KEY,
    String(Date.now() + INTRO_SESSION_MS)
  );
}

function initIntroVideo() {
  const overlay = document.getElementById("intro-overlay");
  const video = document.getElementById("intro-video");
  const closeBtn = document.getElementById("intro-close-btn");
  const playBtn = document.getElementById("intro-play-btn");
  const unmuteBtn = document.getElementById("intro-unmute-btn");
  const loadingEl = document.getElementById("intro-loading");
  const playHint = document.getElementById("intro-play-hint");

  if (!overlay || !video || !closeBtn) return;

  let loadTimeoutId = null;
  let playbackStarted = false;

  video.controls = true;
  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.controlsList = "nodownload noremoteplayback";
  video.disablePictureInPicture = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.src = INTRO_VIDEO_URL;

  const setLoading = (visible) => {
    loadingEl?.classList.toggle("hidden", !visible);
  };

  const setPlayButton = (visible) => {
    playBtn?.classList.toggle("hidden", !visible);
  };

  const setUnmuteButton = (visible) => {
    unmuteBtn?.classList.toggle("hidden", !visible);
  };

  const setPlayHint = (visible) => {
    playHint?.classList.toggle("is-visible", visible);
  };

  const clearLoadTimeout = () => {
    if (loadTimeoutId !== null) {
      window.clearTimeout(loadTimeoutId);
      loadTimeoutId = null;
    }
  };

  const onPlaybackStarted = () => {
    if (playbackStarted) return;
    playbackStarted = true;
    clearLoadTimeout();
    setLoading(false);
    setPlayButton(false);
    setUnmuteButton(true);
    setPlayHint(true);
  };

  const onPlaybackBlocked = () => {
    clearLoadTimeout();
    setLoading(false);
    setPlayButton(true);
    setPlayHint(true);
  };

  const tryPlay = async () => {
    video.muted = true;
    try {
      await video.play();
      onPlaybackStarted();
    } catch {
      onPlaybackBlocked();
    }
  };

  const hideIntro = () => {
    clearLoadTimeout();
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("intro-open");
    setLoading(false);
    setPlayButton(false);
    setUnmuteButton(false);
    setPlayHint(false);
    video.pause();
    video.currentTime = 0;
  };

  const dismissIntro = () => {
    setIntroDismissed();
    hideIntro();
  };

  const enableSound = async () => {
    video.muted = false;
    setUnmuteButton(false);
    try {
      await video.play();
    } catch {
      /* ignore */
    }
  };

  const startIntro = () => {
    setLoading(true);
    setPlayButton(false);
    setUnmuteButton(false);
    setPlayHint(false);

    clearLoadTimeout();
    loadTimeoutId = window.setTimeout(() => {
      setLoading(false);
      setPlayButton(true);
      setPlayHint(true);
    }, 15000);

    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      tryPlay();
      return;
    }

    video.addEventListener(
      "loadedmetadata",
      () => {
        tryPlay();
      },
      { once: true }
    );
  };

  const showIntro = () => {
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("intro-open");
    startIntro();
  };

  playBtn?.addEventListener("click", () => {
    setPlayButton(false);
    setLoading(true);
    tryPlay();
  });

  unmuteBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    enableSound();
  });

  video.addEventListener("playing", () => {
    onPlaybackStarted();
  });
  video.addEventListener("error", () => {
    clearLoadTimeout();
    setLoading(false);
    setPlayButton(true);
    if (playHint) {
      playHint.textContent =
        "Video failed to load. Check your connection, disable IDM for this site, or tap Play video.";
      playHint.classList.add("is-visible");
    }
  });

  closeBtn.addEventListener("click", dismissIntro);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) dismissIntro();
  });

  video.addEventListener("ended", dismissIntro);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
      dismissIntro();
    }
  });

  if (shouldShowIntro()) {
    showIntro();
  }
}

initIntroVideo();
