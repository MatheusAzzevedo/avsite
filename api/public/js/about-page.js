/**
 * about-page.js - Scripts da página Sobre Nós
 * Carrossel de imagens e overlay fullscreen dos parceiros.
 * Externalizado para compatibilidade com CSP (Content Security Policy).
 */
(function() {
  'use strict';

  /* --- Partners Fullscreen Overlay --- */
  var showcase = document.getElementById('partners-showcase');
  var overlay = document.getElementById('partners-fullscreen-overlay');
  if (showcase && overlay) {
    function openFullscreen() {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeFullscreen() {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    showcase.addEventListener('click', openFullscreen);
    overlay.addEventListener('click', closeFullscreen);

    showcase.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFullscreen();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeFullscreen();
      }
    });
  }

  /* --- Gallery Carousel --- */
  var track = document.querySelector('.gallery-carousel-track');
  var slides = document.querySelectorAll('.gallery-slide');
  var prevBtn = document.querySelector('.gallery-arrow-prev');
  var nextBtn = document.querySelector('.gallery-arrow-next');
  if (!track || !slides.length || !prevBtn || !nextBtn) return;

  var currentIndex = 0;
  var autoPlayInterval = null;

  function getSlidesPerView() {
    var w = window.innerWidth;
    if (w <= 480) return 1;
    if (w <= 767) return 2;
    if (w <= 991) return 3;
    return 4;
  }

  function getGap() {
    var w = window.innerWidth;
    if (w <= 480) return 10;
    if (w <= 767) return 12;
    return 16;
  }

  function getMaxIndex() {
    return Math.max(0, slides.length - getSlidesPerView());
  }

  function updatePosition() {
    var perView = getSlidesPerView();
    var gap = getGap();
    var container = track.parentElement;
    var containerWidth = container.offsetWidth;
    var slideWidth = (containerWidth - (perView - 1) * gap) / perView;
    var offset = currentIndex * (slideWidth + gap);
    var trackWidth = slides.length * slideWidth + (slides.length - 1) * gap;
    track.style.width = trackWidth + 'px';
    track.style.minWidth = trackWidth + 'px';
    for (var i = 0; i < slides.length; i++) {
      slides[i].style.flex = '0 0 ' + slideWidth + 'px';
      slides[i].style.minWidth = slideWidth + 'px';
    }
    track.style.transform = 'translateX(-' + offset + 'px)';

    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= getMaxIndex();
  }

  function goNext() {
    if (currentIndex < getMaxIndex()) {
      currentIndex++;
      updatePosition();
    } else {
      currentIndex = 0;
      updatePosition();
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      updatePosition();
    }
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(goNext, 4000);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  nextBtn.addEventListener('click', function() { stopAutoPlay(); goNext(); startAutoPlay(); });
  prevBtn.addEventListener('click', function() { stopAutoPlay(); goPrev(); startAutoPlay(); });

  var touchStartX = 0;
  var touchEndX = 0;

  track.addEventListener('touchstart', function(e) {
    touchStartX = e.touches && e.touches[0] ? e.touches[0].screenX : 0;
    stopAutoPlay();
  }, { passive: true });

  track.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    var diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    startAutoPlay();
  }, { passive: true });

  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      updatePosition();
    }, 150);
  });

  updatePosition();
  startAutoPlay();

  /* --- Gallery Fullscreen Lightbox --- */
  var galleryOverlay = document.getElementById('gallery-fullscreen-overlay');
  var galleryImg = document.getElementById('gallery-lightbox-img');
  var galleryCloseBtn = galleryOverlay && galleryOverlay.querySelector('.gallery-lightbox-close');
  var galleryPrevBtn = galleryOverlay && galleryOverlay.querySelector('.gallery-lightbox-prev');
  var galleryNextBtn = galleryOverlay && galleryOverlay.querySelector('.gallery-lightbox-next');

  if (galleryOverlay && galleryImg && slides.length) {
    var galleryImages = [];
    for (var i = 0; i < slides.length; i++) {
      var img = slides[i].querySelector('img');
      if (img && img.src) galleryImages.push(img.src);
    }

    var lightboxIndex = 0;

    function openGalleryLightbox(index) {
      if (index < 0 || index >= galleryImages.length) return;
      lightboxIndex = index;
      galleryImg.src = galleryImages[lightboxIndex];
      galleryOverlay.classList.add('is-open');
      galleryOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeGalleryLightbox() {
      galleryOverlay.classList.remove('is-open');
      galleryOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function showPrev() {
      var next = lightboxIndex - 1;
      if (next < 0) next = galleryImages.length - 1;
      openGalleryLightbox(next);
    }

    function showNext() {
      var next = lightboxIndex + 1;
      if (next >= galleryImages.length) next = 0;
      openGalleryLightbox(next);
    }

    for (var j = 0; j < slides.length; j++) {
      (function(idx) {
        slides[idx].addEventListener('click', function() {
          openGalleryLightbox(idx);
        });
      })(j);
    }

    if (galleryCloseBtn) galleryCloseBtn.addEventListener('click', closeGalleryLightbox);
    if (galleryPrevBtn) galleryPrevBtn.addEventListener('click', function(e) { e.stopPropagation(); showPrev(); });
    if (galleryNextBtn) galleryNextBtn.addEventListener('click', function(e) { e.stopPropagation(); showNext(); });

    galleryOverlay.addEventListener('click', function(e) {
      if (e.target === galleryOverlay || e.target.closest('.gallery-lightbox-content')) {
        closeGalleryLightbox();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (!galleryOverlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        closeGalleryLightbox();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      } else if (e.key === 'ArrowRight') {
        showNext();
      }
    });
  }
})();
