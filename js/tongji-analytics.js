// ==================== 百度统计数据分析 ====================
// tongji-analytics.js v1.0
// 依赖：调用方需已引入 Chart.js（UMD）及 admin/index.html 中已有的 esc/getGhToken/showToast 等函数

var TONGJI = {
  apiKey: localStorage.getItem('tongji_api_key') || 'QhCUTm5cHNdXzXXS4p17IaaRarzqT9HO',
  secretKey: localStorage.getItem('tongji_secret_key') || '',
  accessToken: localStorage.getItem('tongji_access_token') || '',
  siteId: localStorage.getItem('tongji_site_id') || '',
  refreshToken: localStorage.getItem('tongji_refresh_token') || '',
  tokenExpire: parseInt(localStorage.getItem('tongji_token_expire') || '0'),
  proxyUrl: localStorage.getItem('tongji_proxy_url') || 'https://bd-oauth-proxy.mydeng1995.workers.dev/baidu-oauth',
};

// ==================== 配置保存 / 加载 ====================
function saveTongjiConfig() {
  var apiKey = document.getElementById('tongjiApiKey').value.trim();
  var secretKey = document.getElementById('tongjiSecretKey').value.trim();
  var accessToken = document.getElementById('tongjiAccessToken').value.trim();
  var siteId = document.getElementById('tongjiSiteId').value.trim();

  if (!apiKey) { showToast('请输入 API Key', 'error'); return; }
  if (!secretKey) { showToast('请输入 Secret Key', 'error'); return; }

  TONGJI.apiKey = apiKey;
  TONGJI.secretKey = secretKey;
  TONGJI.accessToken = accessToken;
  TONGJI.siteId = siteId;

  localStorage.setItem('tongji_api_key', apiKey);
  localStorage.setItem('tongji_secret_key', secretKey);
  localStorage.setItem('tongji_access_token', accessToken);
  localStorage.setItem('tongji_site_id', siteId);

  showToast('百度统计配置已保存 ✅', 'success');
  renderTongjiStatus();
}

function loadTongjiConfig() {
  var ak = document.getElementById('tongjiApiKey');
  var sk = document.getElementById('tongjiSecretKey');
  var at = document.getElementById('tongjiAccessToken');
  var si = document.getElementById('tongjiSiteId');
  if (ak) ak.value = TONGJI.apiKey;
  if (sk) sk.value = TONGJI.secretKey;
  if (at) at.value = TONGJI.accessToken;
  if (si) si.value = TONGJI.siteId;
  renderTongjiStatus();
}

function renderTongjiStatus() {
  var el = document.getElementById('tongjiTokenStatus');
  if (!el) return;
  if (TONGJI.accessToken && TONGJI.siteId) {
    var expired = TONGJI.tokenExpire > 0 && Date.now() > TONGJI.tokenExpire;
    if (expired) {
      el.className = 'tongji-status err';
      el.innerHTML = '<span>⚠️</span><span>Access Token 已过期，请重新授权</span>';
      el.style.display = 'inline-flex';
    } else {
      el.className = 'tongji-status ok';
      el.innerHTML = '<span>✅</span><span>已配置，站点 ID: ' + esc(TONGJI.siteId) + '</span>';
      el.style.display = 'inline-flex';
    }
  } else if (TONGJI.accessToken) {
    el.className = 'tongji-status pending';
    el.innerHTML = '<span>⏳</span><span>已获取 Token，请输入站点 ID</span>';
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
  }
}

// ==================== OAuth 授权流程 ====================
// 使用 Implicit Grant 模式：response_type=token，浏览器本地完成，无需服务器端交换，无 CORS 问题
function tongjiOpenAuth() {
  var apiKey = document.getElementById('tongjiApiKey').value.trim() || TONGJI.apiKey;
  var url = 'https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&client_id=' +
    encodeURIComponent(apiKey) + '&redirect_uri=oob&scope=basic&display=popup';
  document.getElementById('tongjiGuide').style.display = 'block';
  window.open(url, 'baiduAuth', 'width=600,height=700');
  document.getElementById('tongjiAuthCodeWrap').style.display = 'block';
  showToast('请在弹窗中完成百度登录和授权，然后粘贴 access_token', '');
}

// 应用 Access Token（直接从 OOB 页面粘贴，无需交换）
function tongjiApplyToken() {
  var token = document.getElementById('tongjiAuthCode').value.trim();
  if (!token) { showToast('请先粘贴 Access Token', 'error'); return; }

  // 保存 token
  TONGJI.accessToken = token;
  // 默认 30 天有效期
  TONGJI.tokenExpire = Date.now() + 2592000 * 1000;
  localStorage.setItem('tongji_access_token', TONGJI.accessToken);
  localStorage.setItem('tongji_token_expire', String(TONGJI.tokenExpire));

  document.getElementById('tongjiAccessToken').value = token;
  document.getElementById('tongjiAuthCodeWrap').style.display = 'none';
  renderTongjiStatus();
  showToast('✅ Access Token 已保存！有效期至 ' + new Date(TONGJI.tokenExpire).toLocaleDateString(), 'success');

  // 自动尝试获取站点列表
  tongjiAutoFillSiteId();
}

function tongjiAutoFillSiteId() {
  tongjiApiCall('config/getSiteList', {}).then(function(d) {
    var list = d.list || d.data || d.sites || (Array.isArray(d) ? d : []);
    if (Array.isArray(list) && list.length > 0) {
      var sid = list[0].site_id || list[0].id || '';
      if (sid) {
        TONGJI.siteId = String(sid);
        localStorage.setItem('tongji_site_id', TONGJI.siteId);
        var el = document.getElementById('tongjiSiteId');
        if (el) el.value = TONGJI.siteId;
        renderTongjiStatus();
        showToast('✅ 自动获取站点 ID: ' + sid, 'success');
      }
    }
  }).catch(function() {});
}

// ==================== API 请求封装 ====================
// Baidu Tongji RPC 格式：
//   GET https://openapi.baidu.com/rest/2.0/tongji/{method}?access_token=xxx&param={json}
//   param 是 JSON 字符串，包含 site_id、start_date、end_date、metrics 等
function tongjiApiCall(method, params) {
  return new Promise(function(resolve, reject) {
    if (!TONGJI.accessToken) {
      reject(new Error('Access Token 未配置，请先在设置中完成授权'));
      return;
    }

    // 构造 param JSON - getSiteList 不需要 site_id
    var param = {};
    for (var k in params) { param[k] = params[k]; }
    if (TONGJI.siteId) { param.site_id = TONGJI.siteId; }

    var url = 'https://openapi.baidu.com/rest/2.0/tongji/' + method.trim() +
      '?access_token=' + encodeURIComponent(TONGJI.accessToken) +
      '&param=' + encodeURIComponent(JSON.stringify(param));

    // 优先 JSONP 绕过 CORS
    var useJSONP = true;

    if (useJSONP) {
      var cbName = '_bd_cb_' + Math.random().toString(36).slice(2, 10);
      window[cbName] = function(resp) {
        // Baidu 返回格式：{ header: { status: 0 }, body: {...} }
        var body = resp && resp.body ? resp.body : resp;
        resolve(body);
        delete window[cbName];
      };
      var s = document.createElement('script');
      s.src = url + '&callback=' + encodeURIComponent(cbName);
      s.onerror = function() { reject(new Error('JSONP 请求失败')); delete window[cbName]; };
      document.head.appendChild(s);
      // 15 秒超时
      setTimeout(function() {
        if (window[cbName]) { reject(new Error('请求超时')); delete window[cbName]; }
      }, 15000);
    } else {
      fetch(url, { mode: 'cors' }).then(function(r) { return r.json(); }).then(function(d) {
        var body = d && d.body ? d.body : d;
        resolve(body);
      }).catch(reject);
    }
  });
}

// ==================== 测试连接 ====================
function testTongjiConnection() {
  if (!TONGJI.accessToken) { showToast('请先完成授权获取 Access Token', 'error'); return; }
  showToast('正在测试连接...', '');
  tongjiApiCall('config/getSiteList', {}).then(function(d) {
    var list = d.list || d.data || d.sites || (Array.isArray(d) ? d : []);
    if (list.length > 0) {
      var info = list[0];
      showToast('✅ 连接成功！站点: ' + esc(info.domain || info.site_name || ''), 'success');
      if (!TONGJI.siteId && (info.site_id || info.id)) {
        TONGJI.siteId = String(info.site_id || info.id);
        localStorage.setItem('tongji_site_id', TONGJI.siteId);
        var el = document.getElementById('tongjiSiteId');
        if (el) el.value = TONGJI.siteId;
        renderTongjiStatus();
      }
    } else {
      showToast('⚠️ 连接成功但未获取到站点，请检查站点 ID', '');
    }
  }).catch(function(err) {
    showToast('❌ 连接失败：' + err.message, 'error');
  });
}

// ==================== 数据分析展示 ====================
var trendChart = null, sourceChart = null;

function loadAnalytics() {
  if (!TONGJI.accessToken || !TONGJI.siteId) {
    var nc = document.getElementById('analyticsNotConfig');
    var ac = document.getElementById('analyticsContent');
    if (nc) nc.style.display = 'block';
    if (ac) ac.style.display = 'none';
    return;
  }
  var nc = document.getElementById('analyticsNotConfig');
  var ac = document.getElementById('analyticsContent');
  if (nc) nc.style.display = 'none';
  if (ac) ac.style.display = 'block';

  var days = parseInt(document.getElementById('analyticsRange').value) || 30;
  var endDate = formatDate(new Date());
  var startDate = formatDate(new Date(Date.now() - days * 86400000));
  var rangeEl = document.getElementById('summaryRange');
  if (rangeEl) rangeEl.textContent = '（' + startDate + ' ~ ' + endDate + '）';

  // 并行请求
  Promise.all([
    tongjiApiCall('report/getTimeTrendRpt', { start_date: startDate, end_date: endDate, metrics: 'pv_count,visitor_count,avg_visit_time' }),
    tongjiApiCall('report/getSourceEngine', { start_date: startDate, end_date: endDate, metrics: 'pv_count' }),
    tongjiApiCall('report/getVisitPage', { start_date: startDate, end_date: endDate, metrics: 'pv_count,visitor_count', max_results: 10 }),
    tongjiApiCall('report/getKeyWord', { start_date: startDate, end_date: endDate, metrics: 'pv_count', max_results: 10 }),
    tongjiApiCall('report/getRealTimeVisitor', {}),
  ]).then(function(results) {
    renderSummary(results[0]);
    renderTrendChart(results[0], startDate, endDate);
    renderSourceChart(results[1]);
    renderTopPages(results[2]);
    renderTopWords(results[3]);
    renderRealTime(results[4]);
  }).catch(function(err) {
    var ac = document.getElementById('analyticsContent');
    if (ac) ac.innerHTML =
      '<div class="analytics-error">数据加载失败：' + esc(err.message) + '<br><br>' +
      '可能原因：1. Access Token 已过期；2. 站点 ID 错误；3. API 权限不足。<br>' +
      '请前往「设置」重新配置。</div>' +
      ac.innerHTML;
  });
}

// Baidu Tongji API 日期格式：YYYYMMDD
function formatDate(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '' + m + '' + day;
}

function renderSummary(data) {
  var items = (data && data.items) || [];
  if (!Array.isArray(items) || items.length === 0) return;
  // Baidu 返回格式：items = [dates, metric1, metric2, ...]
  if (items.length < 3) return;
  var pvArr = items[1] || [];
  var uvArr = items[2] || [];
  var timeArr = items[3] || [];

  var totalPv = 0, totalUv = 0, totalTime = 0;
  pvArr.forEach(function(v) { totalPv += parseInt(v) || 0; });
  uvArr.forEach(function(v) { totalUv += parseInt(v) || 0; });
  timeArr.forEach(function(v) { totalTime += parseInt(v) || 0; });

  var pvEl = document.getElementById('sumPv');
  var uvEl = document.getElementById('sumUv');
  var timeEl = document.getElementById('sumAvgTime');
  if (pvEl) pvEl.textContent = totalPv >= 10000 ? (totalPv/10000).toFixed(1) + 'w' : totalPv;
  if (uvEl) uvEl.textContent = totalUv >= 10000 ? (totalUv/10000).toFixed(1) + 'w' : totalUv;
  if (timeEl) {
    var avgSec = timeArr.length > 0 ? Math.round(totalTime / timeArr.length) : 0;
    timeEl.textContent = avgSec >= 60 ? Math.floor(avgSec/60) + '分' + (avgSec%60) + '秒' : avgSec + '秒';
  }
}

function renderTrendChart(data, startDate, endDate) {
  var canvas = document.getElementById('trendChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var items = (data && data.items) || [];
  if (!Array.isArray(items) || items.length < 3) return;

  var labels = items[0] || [];
  var pvData = items[1] || [];
  var uvData = items[2] || [];

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: '浏览量 PV', data: pvData, borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.08)', fill: true, tension: 0.35 },
        { label: '访客数 UV', data: uvData, borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.08)', fill: true, tension: 0.35 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderSourceChart(data) {
  var canvas = document.getElementById('sourceChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var items = (data && data.items) || [];
  if (!Array.isArray(items) || items.length < 2) return;

  var labels = items[0] || [];
  var values = items[1] || [];

  if (sourceChart) sourceChart.destroy();
  sourceChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: ['#e91e63','#2196f3','#4caf50','#ff9800','#9c27b0','#00bcd4'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderTopPages(data) {
  var wrap = document.getElementById('topPagesWrap');
  if (!wrap) return;
  var items = (data && data.items) || [];
  if (!Array.isArray(items) || items.length < 2) { wrap.innerHTML = '<div class="analytics-empty">暂无数据</div>'; return; }

  var pages = items[0] || [];
  var pvs = items[1] || [];
  var uvs = items[2] || [];

  var h = '<table class="analytics-table"><thead><tr><th>页面</th><th>浏览量</th><th>访客数</th></tr></thead><tbody>';
  pages.forEach(function(p, i) {
    if (i >= 10) return;
    var pageStr = String(p).replace(/^https?:\/\/[^\/]+/, '');
    h += '<tr><td>' + esc(pageStr) + '</td><td>' + (pvs[i] || 0) + '</td><td>' + (uvs[i] || 0) + '</td></tr>';
  });
  h += '</tbody></table>';
  wrap.innerHTML = h;
}

function renderTopWords(data) {
  var wrap = document.getElementById('topWordsWrap');
  if (!wrap) return;
  var items = (data && data.items) || [];
  if (!Array.isArray(items) || items.length < 2) { wrap.innerHTML = '<div class="analytics-empty">暂无数据</div>'; return; }

  var words = items[0] || [];
  var pvs = items[1] || [];

  var h = '<table class="analytics-table"><thead><tr><th>搜索词</th><th>浏览量</th></tr></thead><tbody>';
  words.forEach(function(w, i) {
    if (i >= 10) return;
    h += '<tr><td>' + esc(String(w)) + '</td><td>' + (pvs[i] || 0) + '</td></tr>';
  });
  h += '</tbody></table>';
  wrap.innerHTML = h;
}

function renderRealTime(data) {
  var el = document.getElementById('rtVisitorNum');
  if (!el) return;
  var num = 0;
  if (typeof data === 'number') num = data;
  else if (data && data.count) num = data.count;
  else if (data && data.items && data.items[0]) num = data.items[0][0];
  el.textContent = num;
}

// ==================== 导航联动 ====================
function onAnalyticsSectionShow() {
  loadTongjiConfig();
  if (TONGJI.accessToken && TONGJI.siteId) {
    loadAnalytics();
  }
}
