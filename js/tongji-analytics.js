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
// 使用 Implicit Grant + redirect_uri=oob 避免 referer_mismatch
// 弹窗→用户授权→百度在页面上直接显示 access_token → 用户复制粘贴
function tongjiOpenAuth() {
  var apiKey = document.getElementById('tongjiApiKey').value.trim() || TONGJI.apiKey;
  // response_type=token + redirect_uri=oob：百度在页面上显示 token，不跳转，无 referer 检查
  var url = 'https://openapi.baidu.com/oauth/2.0/authorize?response_type=token&client_id=' +
    encodeURIComponent(apiKey) + '&redirect_uri=oob&scope=basic&display=popup';
  document.getElementById('tongjiGuide').style.display = 'block';
  document.getElementById('tongjiAuthCodeWrap').style.display = 'block';
  var authWin = window.open(url, 'baiduAuth', 'width=600,height=700');
  showToast('请在弹窗中授权，授权成功后复制页面上显示的 access_token 值粘贴到下方', '');
}

// 手动应用 Token（备用：用户从 OOB 页面手动复制）
function tongjiApplyToken() {
  var token = document.getElementById('tongjiAuthCode').value.trim();
  if (!token) { showToast('请先粘贴 Access Token', 'error'); return; }
  applyToken(token, 2592000);
}

// 核心：保存 token
function applyToken(token, expiresIn) {
  TONGJI.accessToken = token;
  TONGJI.tokenExpire = Date.now() + expiresIn * 1000;
  localStorage.setItem('tongji_access_token', TONGJI.accessToken);
  localStorage.setItem('tongji_token_expire', String(TONGJI.tokenExpire));

  document.getElementById('tongjiAccessToken').value = token;
  document.getElementById('tongjiAuthCodeWrap').style.display = 'none';
  renderTongjiStatus();
  showToast('✅ Access Token 已保存！有效期至 ' + new Date(TONGJI.tokenExpire).toLocaleDateString(), 'success');

  // 自动获取站点 ID
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
// Baidu Tongji Open API 格式：
//   GET https://openapi.baidu.com/rest/2.0/tongji/report/getData?access_token=xxx&site_id=xxx&method=xxx&metrics=xxx...
//   参数全部作为 URL 查询字符串，无 JSON 包裹
function tongjiApiCall(apiMethod, params) {
  return new Promise(function(resolve, reject) {
    if (!TONGJI.accessToken) {
      reject(new Error('Access Token 未配置，请先在设置中完成授权'));
      return;
    }

    // 构造查询字符串 — 所有参数平铺为 URL query params
    var qs = 'access_token=' + encodeURIComponent(TONGJI.accessToken);

    // 合并 site_id（如果未显式传入）
    if (TONGJI.siteId && !params.site_id) {
      qs += '&site_id=' + TONGJI.siteId;
    }

    for (var k in params) {
      qs += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }

    var url = 'https://openapi.baidu.com/rest/2.0/tongji/' + apiMethod.trim() + '?' + qs;

    // JSONP 绕过 CORS
    var cbName = '_bd_cb_' + Math.random().toString(36).slice(2, 10);
    window[cbName] = function(resp) {
      delete window[cbName];
      // 检查顶层 error_code（token 过期/无效等情况，不含 header）
      if (resp && resp.error_code) {
        reject(new Error(resp.error_msg || ('API 错误码 ' + resp.error_code)));
        return;
      }
      // 检查 header.status
      if (resp && resp.header && resp.header.status !== 0 && resp.header.status !== undefined && resp.header.desc) {
        reject(new Error(resp.header.desc || '接口返回错误'));
        return;
      }
      var body = resp && typeof resp.body !== 'undefined' ? resp.body : resp;
      resolve(body);
    };

    var s = document.createElement('script');
    s.src = url + '&callback=' + encodeURIComponent(cbName);
    s.onerror = function() { delete window[cbName]; reject(new Error('JSONP 请求失败')); };
    document.head.appendChild(s);

    // 15 秒超时
    setTimeout(function() {
      if (window[cbName]) {
        delete window[cbName];
        reject(new Error('API 请求超时（15秒）'));
      }
    }, 15000);
  });
}

// ==================== 测试连接 ====================
function testTongjiConnection() {
  if (!TONGJI.accessToken) { showToast('请先完成授权获取 Access Token', 'error'); return; }
  showToast('正在测试连接...', '');

  // 如果已有 siteId，直接用概览接口验证
  if (TONGJI.siteId) {
    var today = dStr(new Date());
    tongjiApiCall('report/getData', {
      site_id: TONGJI.siteId,
      method: 'overview/getTimeTrendRpt',
      start_date: today,
      end_date: today,
      metrics: 'pv_count'
    }).then(function() {
      showToast('✅ 连接成功！站点 ID: ' + TONGJI.siteId, 'success');
    }).catch(function(err) {
      showToast('❌ 连接失败：' + err.message, 'error');
    });
    return;
  }

  // 没有 siteId，尝试自动获取
  tongjiApiCall('config/getSiteList', {}).then(function(d) {
    var list = Array.isArray(d) ? d : (d.list || d.data || d.sites || d.items || []);
    if (list.length > 0) {
      var info = list[0];
      var sid = info.site_id || info.id || '';
      if (sid) {
        TONGJI.siteId = String(sid);
        localStorage.setItem('tongji_site_id', TONGJI.siteId);
        var el = document.getElementById('tongjiSiteId');
        if (el) el.value = TONGJI.siteId;
        renderTongjiStatus();
      }
      showToast('✅ 连接成功！站点: ' + (info.domain || info.site_name || sid), 'success');
    } else {
      showToast('⚠️ 连接成功，请手动输入站点 ID', '');
    }
  }).catch(function(err) {
    showToast('❌ 连接失败：' + err.message, 'error');
  });
}

// 日期格式化辅助
function dStr(date) { return date.getFullYear() + ('0'+(date.getMonth()+1)).slice(-2) + ('0'+date.getDate()).slice(-2); }

// ==================== 数据分析展示 ====================
var trendChart = null, sourceChart = null;

// 从百度 API 响应 body 中提取 items 数组
// 百度响应结构: body.data[0].result.items 或 body.items
function extractItems(body) {
  if (!body) return [];
  if (Array.isArray(body.items) && body.items.length > 0) return body.items;
  if (Array.isArray(body.data) && body.data.length > 0) {
    var d = body.data[0];
    if (d && d.result && Array.isArray(d.result.items)) return d.result.items;
    if (d && Array.isArray(d.items)) return d.items;
  }
  return [];
}

// 提取总数
function extractTotal(body) {
  if (!body) return 0;
  if (typeof body.total === 'number') return body.total;
  if (Array.isArray(body.data) && body.data.length > 0) {
    var d = body.data[0];
    if (d && d.result && typeof d.result.total === 'number') return d.result.total;
    if (d && typeof d.total === 'number') return d.total;
  }
  return 0;
}

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

  // 显示加载状态
  var pvEl = document.getElementById('sumPv'), uvEl = document.getElementById('sumUv'), timeEl = document.getElementById('sumAvgTime');
  if (pvEl) pvEl.textContent = '...';
  if (uvEl) uvEl.textContent = '...';
  if (timeEl) timeEl.textContent = '...';

  // 并行请求 — 全部使用 report/getData 端点，method 参数指定具体报告
  Promise.all([
    tongjiApiCall('report/getData', { method: 'overview/getTimeTrendRpt', metrics: 'pv_count,visitor_count,avg_visit_time', start_date: startDate, end_date: endDate }),
    tongjiApiCall('report/getData', { method: 'source/all/a', metrics: 'pv_count', start_date: startDate, end_date: endDate }),
    tongjiApiCall('report/getData', { method: 'visit/toppage/a', metrics: 'pv_count,visitor_count', max_results: '10', start_date: startDate, end_date: endDate }),
    tongjiApiCall('report/getData', { method: 'visit/word/a', metrics: 'pv_count', max_results: '10', start_date: startDate, end_date: endDate }),
    tongjiApiCall('report/getData', { method: 'trend/latest/a', metrics: 'visitor_count' }),
  ]).then(function(results) {
    renderSummary(results[0]);
    renderTrendChart(results[0], startDate, endDate);
    renderSourceChart(results[1]);
    renderTopPages(results[2]);
    renderTopWords(results[3]);
    renderRealTime(results[4]);
  }).catch(function(err) {
    var msg = esc(err.message);
    var isTokenErr = msg.indexOf('110') !== -1 || msg.indexOf('token') !== -1 || msg.indexOf('Token') !== -1 || msg.indexOf('invalid') !== -1 || msg.indexOf('Access') !== -1;
    var ac = document.getElementById('analyticsContent');
    if (ac) ac.innerHTML =
      '<div class="analytics-error" style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:24px;margin:20px 0;text-align:center">' +
      '<div style="font-size:48px;margin-bottom:12px">🔑</div>' +
      '<h3 style="margin:0 0 8px;color:#856404">' + (isTokenErr ? 'Access Token 已失效' : '数据加载失败') + '</h3>' +
      '<p style="color:#856404;margin:0 0 16px;font-size:14px">' + msg + '</p>' +
      (isTokenErr
        ? '<button onclick="switchAdminSection(\'settings\');setTimeout(function(){var el=document.getElementById(\'tongjiApiKey\');if(el)el.scrollIntoView({behavior:\'smooth\'})},300)" style="background:#ff9800;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">🔗 前往设置重新授权</button>' +
          '<p style="color:#856404;font-size:12px;margin-top:12px">Token 已失效，需要重新授权百度统计</p>'
        : '<p style="color:#856404;font-size:13px">请前往「设置」检查 Token 和站点 ID 配置</p>') +
      '</div>';
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
  var items = extractItems(data);
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
  var items = extractItems(data);
  if (items.length < 3) return;

  var labels = items[0] || [];
  var pvData = items[1] || [];
  var uvData = items[2] || [];

  // 日期格式美化
  labels = labels.map(function(d) {
    var s = String(d);
    return s.length === 8 ? s.slice(4,6) + '/' + s.slice(6) : s;
  });

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: '浏览量 PV', data: pvData.map(Number), borderColor: '#e91e63', backgroundColor: 'rgba(233,30,99,0.08)', fill: true, tension: 0.35 },
        { label: '访客数 UV', data: uvData.map(Number), borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.08)', fill: true, tension: 0.35 },
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
  var items = extractItems(data);
  if (items.length < 2) return;

  var labels = items[0] || [];
  var values = items[1] || [];

  if (sourceChart) sourceChart.destroy();
  sourceChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values.map(Number), backgroundColor: ['#e91e63','#2196f3','#4caf50','#ff9800','#9c27b0','#00bcd4','#ff5722','#607d8b'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

function renderTopPages(data) {
  var wrap = document.getElementById('topPagesWrap');
  if (!wrap) return;
  var items = extractItems(data);
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
  var items = extractItems(data);
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
  else {
    var items = extractItems(data);
    if (items.length > 0 && items[0].length > 0) num = items[0][0];
  }
  el.textContent = num;
}

// ==================== 导航联动 ====================
function onAnalyticsSectionShow() {
  loadTongjiConfig();
  if (TONGJI.accessToken && TONGJI.siteId) {
    loadAnalytics();
  }
}
