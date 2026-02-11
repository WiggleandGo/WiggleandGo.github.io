window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
  for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
    var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
    interp_images[i] = new Image();
    interp_images[i].src = path;
  }
}

function setInterpolationImage(i) {
  var image = interp_images[i];
  image.ondragstart = function() { return false; };
  image.oncontextmenu = function() { return false; };
  $('#interpolation-image-wrapper').empty().append(image);
}


$(document).ready(function() {
    // Red tracking video: 6.25x playback speed
    var redTrackingVideo = document.getElementById('red-tracking-video');
    if (redTrackingVideo) {
      redTrackingVideo.playbackRate = 6.25;
      redTrackingVideo.addEventListener('loadedmetadata', function() {
        redTrackingVideo.playbackRate = 6.25;
      });
    }

    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function() {
      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      $(".navbar-burger").toggleClass("is-active");
      $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
			slidesToScroll: 1,
			slidesToShow: 3,
			loop: true,
			infinite: true,
			autoplay: false,
			autoplaySpeed: 3000,
    }

		// Initialize standard carousels (3-up)
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for(var i = 0; i < carousels.length; i++) {
    	// Add listener to  event
    	carousels[i].on('before:show', state => {
    		console.log(state);
    	});
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
    	// bulmaCarousel instance is available as element.bulmaCarousel
    	element.bulmaCarousel.on('before-show', function(state) {
    		console.log(state);
    	});
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function(event) {
      setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

    // Task completion custom single-video slider
    var taskSlider = document.getElementById('task-completion-slider');
    if (taskSlider) {
      var taskVideoFiles = [
        './static/videos/daruma_block_1.mp4',
        './static/videos/20260206_175555_trimmed.mp4',
        './static/videos/20260206_181539_trimmed.mp4'
      ];
      var slide = document.getElementById('task-completion-slide');
      var video = document.getElementById('task-completion-video');
      var source = document.getElementById('task-completion-source');
      var prevBtn = taskSlider.querySelector('.task-slider-prev');
      var nextBtn = taskSlider.querySelector('.task-slider-next');
      var currentIndex = 0;

      function showTaskSlide(index, direction) {
        if (!slide || !video || !source) return;
        slide.classList.remove('slide-in-next', 'slide-in-prev');
        if (direction === 'next') {
          slide.classList.add('slide-in-next');
        } else if (direction === 'prev') {
          slide.classList.add('slide-in-prev');
        }
        source.src = taskVideoFiles[index];
        video.load();
        video.loop = true;
        video.muted = true;
        video.play().catch(function() {});
      }

      function stepTaskSlide(delta) {
        currentIndex = (currentIndex + delta + taskVideoFiles.length) % taskVideoFiles.length;
        showTaskSlide(currentIndex, delta > 0 ? 'next' : 'prev');
      }

      showTaskSlide(currentIndex);
      if (prevBtn) {
        prevBtn.addEventListener('click', function() { stepTaskSlide(-1); });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', function() { stepTaskSlide(1); });
      }
    }

})
