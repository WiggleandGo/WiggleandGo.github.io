// Keep media dormant until it is near the viewport, and play only visible clips.
document.addEventListener('DOMContentLoaded', () => {
  bulmaCarousel.attach('.carousel', {
    slidesToScroll: 1, slidesToShow: 3, loop: true, infinite: true,
    autoplay: false, autoplaySpeed: 3000
  });
  const videos = new Set();
  const visible = new Set();
  function load(video) {
    let changed = false;
    video.querySelectorAll('source[data-src]').forEach(source => {
      source.src = source.dataset.src;
      delete source.dataset.src;
      changed = true;
    });
    if (changed) video.load();
  }
  function play(video) {
    if (document.hidden || !visible.has(video)) return;
    load(video);
    video.playbackRate = Number(video.dataset.playbackRate || 1);
    video.play().catch(() => {});
  }
  const nearby = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => { if (isIntersecting) load(target); });
  }, {rootMargin: '300px 0px'});
  const onscreen = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting, intersectionRatio}) => {
      if (isIntersecting && intersectionRatio > .05) { visible.add(target); play(target); }
      else { visible.delete(target); target.pause(); }
    });
  }, {threshold: [0, .05]});
  function observe(video) {
    if (videos.has(video)) return;
    videos.add(video);
    video.addEventListener('loadedmetadata', () => {
      video.playbackRate = Number(video.dataset.playbackRate || 1);
    });
    nearby.observe(video); onscreen.observe(video);
  }
  document.querySelectorAll('video').forEach(observe);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches('video')) observe(node);
      node.querySelectorAll('video').forEach(observe);
    }));
    videos.forEach(video => {
      if (!video.isConnected) {
        video.pause(); nearby.unobserve(video); onscreen.unobserve(video);
        visible.delete(video); videos.delete(video);
      }
    });
  }).observe(document.body, {childList: true, subtree: true});
  document.addEventListener('visibilitychange', () => {
    videos.forEach(video => { if (document.hidden) video.pause(); else play(video); });
  });

  const taskSlider = document.getElementById('task-completion-slider');
  if (taskSlider) {
    const files = ['daruma_block_1', '20260206_175555_trimmed', '20260206_181539_trimmed'];
    const video = document.getElementById('task-completion-video');
    const source = document.getElementById('task-completion-source');
    const slide = document.getElementById('task-completion-slide');
    let index = 0;
    function step(delta) {
      index = (index + delta + files.length) % files.length;
      video.pause();
      video.poster = `./static/videos/optimized/${files[index]}.webp`;
      source.src = `./static/videos/${files[index]}.mp4`;
      delete source.dataset.src;
      video.load();
      slide.classList.remove('slide-in-next', 'slide-in-prev');
      slide.classList.add(delta > 0 ? 'slide-in-next' : 'slide-in-prev');
      play(video);
    }
    taskSlider.querySelector('.task-slider-prev').addEventListener('click', () => step(-1));
    taskSlider.querySelector('.task-slider-next').addEventListener('click', () => step(1));
  }

  const youtube = document.querySelector('.youtube-facade');
  if (youtube) youtube.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = youtube.dataset.embed + '&autoplay=1';
    iframe.title = 'Wiggle and Go paper video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    youtube.replaceWith(iframe);
    iframe.focus();
  }, {once: true});
});
