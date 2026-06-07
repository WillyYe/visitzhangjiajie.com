// ========== DATA ==========
var expData = [];
var currentExp = null;
var currentSlide = 0;
var heroInterval = null;

// ========== FETCH DATA ==========
function loadExperienceData() {
  fetch('data/experience.json?t=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      expData = data;
      var id = getExperienceId();
      currentExp = expData.find(function(e) { return e.id === id; }) || expData[0];
      renderAll();
      startHeroSlider();
    })
    .catch(function(err) {
      console.error('Failed to load experience data:', err);
      document.getElementById('experienceContent').innerHTML =
        '<p style="color:#c0392b;">Failed to load data. Please refresh the page.</p>';
    });
}

// ========== GET EXPERIENCE ID ==========
function getExperienceId() {
  return new URLSearchParams(window.location.search).get('id') || 'hiking';
}

// ========== RENDER ALL ==========
function renderAll() {
  if (!currentExp) {
    document.getElementById('experienceContent').innerHTML =
      '<p style="color:#c0392b;padding:40px;text-align:center;">Experience not found. Please go back and try again.</p>';
    return;
  }

  // Clear previous slides
  var slider = document.getElementById('heroSlider');
  slider.querySelectorAll('.hero-slide').forEach(function(s) { s.remove(); });
  // Clear previously rendered dynamic content (prevent bfcache duplication)
  var content = document.getElementById('experienceContent');
  if (content) {
    content.querySelectorAll('.info-grid, .section, .tip-box').forEach(function(el) { el.remove(); });
  }

  renderHeroSlider();
  renderInfoCards();
  renderDesc();
  renderTips();

  document.title = (currentExp.titleEn || 'Experience') + ' | Zhangjiajie Park';
  document.getElementById('pageTitle').textContent = (currentExp.titleEn || 'Experience') + ' | Zhangjiajie Park';
  document.getElementById('metaDesc').setAttribute('content',
    (currentExp.descEn || '').substring(0, 160));
}

// ========== RENDER HERO SLIDER ==========
function renderHeroSlider() {
  if (!currentExp) return;
  var slider = document.getElementById('heroSlider');
  var prevBtn = document.getElementById('prevBtn');
  var indicator = document.getElementById('sliderIndicator');
  var slidesHtml = '';
  var dotsHtml = '';

  var images = currentExp.images || [currentExp.img || ''];
  images.forEach(function(img, idx) {
    slidesHtml += '<div class="hero-slide' + (idx === 0 ? ' active' : '') + '">';
    slidesHtml += '<div class="hero-bg" style="background-image:url(\'' + img + '?t=' + Date.now() + '\')"></div>';
    slidesHtml += '<div class="hero-overlay"></div>';
    slidesHtml += '<div class="hero-content">';
    slidesHtml += '<div class="hero-badge">Experience</div>';
    slidesHtml += '<h1 class="hero-title">' + escHtml(currentExp.titleEn || '') + '</h1>';
    slidesHtml += '<p class="hero-subtitle">' + escHtml(currentExp.descEn || '') + '</p>';
    slidesHtml += '<p class="hero-desc">' + escHtml((currentExp.descEn || '').substring(0, 150)) + '...</p>';
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

  var idx = expData.indexOf(currentExp);
  document.getElementById('expPrevBtn').classList.toggle('disabled', idx === 0);
  document.getElementById('expNextBtn').classList.toggle('disabled', idx === expData.length - 1);
}

// ========== EXPERIENCE NAVIGATION ==========
function prevExperience() {
  if (!expData || !currentExp) return;
  var idx = expData.indexOf(currentExp);
  if (idx > 0 && expData[idx - 1] && expData[idx - 1].id) {
    window.location.href = 'experience-detail.html?id=' + expData[idx - 1].id;
  }
}
function nextExperience() {
  if (!expData || !currentExp) return;
  var idx = expData.indexOf(currentExp);
  if (idx < expData.length - 1 && expData[idx + 1] && expData[idx + 1].id) {
    window.location.href = 'experience-detail.html?id=' + expData[idx + 1].id;
  }
}

// ========== AUTO-PLAY ==========
function startHeroSlider() {
  if (heroInterval) clearInterval(heroInterval);
  if (!currentExp) return;
  var images = currentExp.images || [];
  if (images.length <= 1) return;
  heroInterval = setInterval(function() {
    goToSlide((currentSlide + 1) % images.length);
  }, 5000);
}

// ========== RENDER INFO CARDS ==========
function renderInfoCards() {
  if (!currentExp) return;
  var container = document.getElementById('experienceContent');
  var html = '<div class="info-grid">';
  (currentExp.infoEn || currentExp.info || []).forEach(function(item) {
    html += '<div class="info-card">';
    html += '<div class="info-icon">' + escHtml(item.icon || '') + '</div>';
    html += '<div class="info-label">' + escHtml(item.label) + '</div>';
    html += '<div class="info-value">' + escHtml(item.value) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  container.insertAdjacentHTML('afterbegin', html);
}

// ========== RENDER DESC ==========
function renderDesc() {
  if (!currentExp) return;
  var container = document.getElementById('experienceContent');
  var html = '<div class="section">';
  html += '<h2 class="section-title">About ' + escHtml(currentExp.titleEn || '') + '</h2>';
  html += '<p>' + escHtml(currentExp.descEn || '') + '</p>';
  html += '</div>';
  var infoGrid = container.querySelector('.info-grid');
  if (infoGrid) infoGrid.insertAdjacentHTML('afterend', html);
}

// ========== RENDER TIPS ==========
function renderTips() {
  if (!currentExp) return;
  var container = document.getElementById('experienceContent');
  var html = '<div class="tip-box">';
  html += '<h4>💡 Travel Tips</h4><ul>';
  (currentExp.tipsEn || currentExp.tips || []).forEach(function(tip) {
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
    loadExperienceData();
  }
});

// ========== INIT ==========
loadExperienceData();
