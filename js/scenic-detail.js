// ========== DATA ==========
var scenicData = [];
var currentScenic = null;
var currentSlide = 0;
var heroInterval = null;

// ========== FETCH DATA ==========
function loadScenicData() {
  fetch('data/scenic.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      scenicData = data;
      var id = getScenicId();
      currentScenic = scenicData.find(function(s) { return s.id === id; }) || scenicData[0];
      renderAll();
      startHeroSlider();
    })
    .catch(function(err) {
      console.error('Failed to load scenic data:', err);
      document.getElementById('scenicContent').innerHTML =
        '<p style="color:#c0392b;">Failed to load data. Please refresh the page.</p>';
    });
}

// ========== GET SCENIC ID ==========
function getScenicId() {
  return new URLSearchParams(window.location.search).get('id') || 'yuanjiajie';
}

// ========== RENDER ALL ==========
function renderAll() {
  if (!currentScenic) {
    document.getElementById('scenicContent').innerHTML =
      '<p style="color:#c0392b;padding:40px;text-align:center;">Scenic spot not found. Please go back and try again.</p>';
    return;
  }

  // Clear previous slides
  var slider = document.getElementById('heroSlider');
  slider.querySelectorAll('.hero-slide').forEach(function(s) { s.remove(); });
  // Clear previously rendered dynamic content (prevent bfcache duplication)
  var content = document.getElementById('scenicContent');
  if (content) {
    content.querySelectorAll('.info-grid, .section, .tip-box').forEach(function(el) { el.remove(); });
  }

  renderHeroSlider();
  renderInfoCards();
  renderDesc();
  renderAttractions();
  renderTips();
  updateNavButtons();

  document.title = currentScenic.name + ' | Zhangjiajie Park';
  document.getElementById('pageTitle').textContent = currentScenic.name + ' | Zhangjiajie Park';
  document.getElementById('metaDesc').setAttribute('content',
    (currentScenic.desc || '').substring(0, 160));
}

// ========== RENDER HERO SLIDER ==========
function renderHeroSlider() {
  if (!currentScenic) return;
  var slider = document.getElementById('heroSlider');
  var prevBtn = document.getElementById('prevBtn');
  var indicator = document.getElementById('sliderIndicator');
  var slidesHtml = '';
  var dotsHtml = '';

  var images = currentScenic.images || [currentScenic.img || ''];
  images.forEach(function(img, idx) {
    slidesHtml += '<div class="hero-slide' + (idx === 0 ? ' active' : '') + '">';
    slidesHtml += '<div class="hero-bg" style="background-image:url(\'' + img + '\')"></div>';
    slidesHtml += '<div class="hero-overlay"></div>';
    slidesHtml += '<div class="hero-content">';
    slidesHtml += '<div class="hero-badge">' + escHtml(currentScenic.tag) + '</div>';
    slidesHtml += '<h1 class="hero-title">' + escHtml(currentScenic.name) + '</h1>';
    slidesHtml += '<p class="hero-subtitle">' + escHtml(currentScenic.subTitle) + '</p>';
    slidesHtml += '<p class="hero-desc">' + escHtml((currentScenic.desc || '').substring(0, 150)) + '...</p>';
    slidesHtml += '</div></div>';

    dotsHtml += '<button class="indicator-dot' + (idx === 0 ? ' active' : '') + '" onclick="goToSlide(' + idx + ')"></button>';
  });

  prevBtn.insertAdjacentHTML('beforebegin', slidesHtml);
  indicator.innerHTML = dotsHtml;
  currentSlide = 0;
}

// ========== SLIDE NAVIGATION ==========
function goToSlide(idx) {
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.indicator-dot');
  if (idx < 0 || idx >= slides.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = idx;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  updateNavButtons();
}

function prevSlide() { goToSlide(currentSlide - 1); }
function nextSlide() { goToSlide(currentSlide + 1); }

function updateNavButtons() {
  var slides = document.querySelectorAll('.hero-slide');
  document.getElementById('prevBtn').classList.toggle('disabled', currentSlide === 0);
  document.getElementById('nextBtn').classList.toggle('disabled', currentSlide === slides.length - 1);

  var idx = scenicData.indexOf(currentScenic);
  document.getElementById('scenicPrevBtn').classList.toggle('disabled', idx === 0);
  document.getElementById('scenicNextBtn').classList.toggle('disabled', idx === scenicData.length - 1);
}

// ========== SCENIC NAVIGATION ==========
function prevScenic() {
  if (!scenicData || !currentScenic) return;
  var idx = scenicData.indexOf(currentScenic);
  if (idx > 0 && scenicData[idx - 1] && scenicData[idx - 1].id) {
    window.location.href = 'scenic-detail.html?id=' + scenicData[idx - 1].id;
  }
}
function nextScenic() {
  if (!scenicData || !currentScenic) return;
  var idx = scenicData.indexOf(currentScenic);
  if (idx < scenicData.length - 1 && scenicData[idx + 1] && scenicData[idx + 1].id) {
    window.location.href = 'scenic-detail.html?id=' + scenicData[idx + 1].id;
  }
}

// ========== AUTO-PLAY ==========
function startHeroSlider() {
  if (heroInterval) clearInterval(heroInterval);
  if (!currentScenic) return;
  var images = currentScenic.images || [];
  if (images.length <= 1) return;
  heroInterval = setInterval(function() {
    goToSlide((currentSlide + 1) % images.length);
  }, 5000);
}

// ========== RENDER INFO CARDS ==========
function renderInfoCards() {
  if (!currentScenic) return;
  var container = document.getElementById('scenicContent');
  var html = '<div class="info-grid">';
  (currentScenic.info || []).forEach(function(item) {
    html += '<div class="info-card">';
    html += '<div class="info-icon">' + item.icon + '</div>';
    html += '<div class="info-label">' + escHtml(item.label) + '</div>';
    html += '<div class="info-value">' + escHtml(item.value) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  container.insertAdjacentHTML('afterbegin', html);
}

// ========== RENDER DESC ==========
function renderDesc() {
  if (!currentScenic) return;
  var container = document.getElementById('scenicContent');
  var html = '<div class="section">';
  html += '<h2 class="section-title">About ' + escHtml(currentScenic.name || '') + '</h2>';
  html += '<p>' + escHtml(currentScenic.desc || '') + '</p>';
  html += '</div>';
  var infoGrid = container.querySelector('.info-grid');
  if (infoGrid) infoGrid.insertAdjacentHTML('afterend', html);
}

// ========== RENDER ATTRACTIONS ==========
function renderAttractions() {
  if (!currentScenic) return;
  var container = document.getElementById('scenicContent');
  var html = '<div class="section">';
  html += '<h2 class="section-title">Key Attractions</h2>';
  html += '<ul class="attraction-list">';
  (currentScenic.attractions || []).forEach(function(attr) {
    html += '<li>';
    html += '<div class="attraction-icon">' + attr.icon + '</div>';
    html += '<div class="attraction-info">';
    html += '<h4>' + escHtml(attr.name) + '</h4>';
    html += '<p>' + escHtml(attr.desc) + '</p>';
    html += '</div></li>';
  });
  html += '</ul></div>';
  var descSection = container.querySelector('.section');
  if (descSection) descSection.insertAdjacentHTML('afterend', html);
}

// ========== RENDER TIPS ==========
function renderTips() {
  if (!currentScenic) return;
  var container = document.getElementById('scenicContent');
  var html = '<div class="tip-box">';
  html += '<h4>💡 Travel Tips</h4><ul>';
  (currentScenic.tips || []).forEach(function(tip) {
    html += '<li>' + escHtml(tip) + '</li>';
  });
  html += '</ul></div>';
  container.insertAdjacentHTML('beforeend', html);
}

// ========== BFCACHE SUPPORT ==========
// pagehide: 页面卸载或进入 bfcache 时清理 interval
window.addEventListener('pagehide', function(e) {
  if (heroInterval) { clearInterval(heroInterval); heroInterval = null; }
});

// pageshow: 从 bfcache 恢复时重新加载数据并重启轮播
window.addEventListener('pageshow', function(e) {
  if (e.persisted) {
    loadScenicData();
  }
});

// ========== INIT ==========
loadScenicData();
