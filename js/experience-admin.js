// ==================== EXPERIENCE ADMIN ====================
// 体验管理模块 — 供 admin/index.html 调用
// 依赖：js/common.js（esc, showToast, ghFetch, friendlyError, deleteFileFromGitHub 等）

// ==================== RENDER ====================
function renderExp() {
  var h = '';
  expData.forEach(function(e, i) {
    var title = e.title || e.titleEn || '';
    var imgPreview = e.img
      ? '<img src="../' + e.img + '?t=' + Date.now() + '" style="max-width:120px;max-height:80px;object-fit:cover;border-radius:4px;display:block" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<span style=color:#aaa;font-size:11px>图片未上传</span>\'">'
      : '<span style="color:#aaa;font-size:11px">未上传</span>';
    var descShort = (e.descEn || '').length > 30 ? (e.descEn || '').substring(0, 30) + '...' : (e.descEn || '—');
    var validImages = (e.images || []).filter(function(x) { return x; });
    var detailIcon = (validImages.length > 1) || (e.infoEn && e.infoEn.length) || (e.tipsEn && e.tipsEn.length) ? ' 🖼️' : '';
    h += '<tr><td>' + esc(e.id) + '</td><td>' + esc(title) + detailIcon + '</td><td title="' + esc(e.descEn || '') + '">' + esc(descShort) + '</td><td style="text-align:center">' + imgPreview + '</td><td class="table-actions"><button class="btn btn-outline btn-sm" onclick="openExpModal(' + i + ')">Edit</button><button class="btn btn-outline btn-sm" style="background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7" onclick="replaceExpImage(' + i + ')">🔄 Replace</button><button class="btn btn-danger btn-sm" onclick="deleteExp(' + i + ')">Delete</button></td></tr>';
  });
  document.getElementById('expTableBody').innerHTML = h || '<tr><td colspan="5" style="text-align:center;color:#999">暂无数据</td></tr>';
}

// ==================== IMG UPLOAD HELPERS ====================
// 为 openExpModal 生成"轮播图 2 / 3"的上传 HTML
function imgUploadHtml2(currentPath) {
  var old = modalImgId;
  modalImgId = 'fExpImg1';
  var html = imgUploadHtml(currentPath, '', true);
  modalImgId = old;
  return html;
}
function imgUploadHtml3(currentPath) {
  var old = modalImgId;
  modalImgId = 'fExpImg2';
  var html = imgUploadHtml(currentPath, '', true);
  modalImgId = old;
  return html;
}

// ==================== INFO CARDS (二级页面) ====================
function addInfoCard() {
  var container = document.getElementById('infoCardsEdit');
  if (!container) return;
  var count = container.querySelectorAll('.info-row').length;
  if (count >= 8) return;
  var idx = Date.now();
  var num = count + 1;
  var div = document.createElement('div');
  div.className = 'editor-card info-row';
  div.id = 'infoRow_' + idx;
  div.innerHTML =
    '<div class="editor-card-header">' +
    '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + num + '</span><span class="editor-card-title">Info Card</span></div>' +
    '<button class="editor-card-remove" onclick="this.parentElement.parentElement.remove(); updateInfoAddBtn()">Remove</button>' +
    '</div>' +
    '<div class="editor-row">' +
    '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="⏱️" id="fInfoIcon_' + idx + '"></div>' +
    '<div class="editor-field"><label>Label</label><input placeholder="e.g. Duration" id="fInfoLabel_' + idx + '"></div>' +
    '<div class="editor-field"><label>Value</label><input placeholder="e.g. 4-6 hours" id="fInfoValue_' + idx + '"></div>' +
    '</div>' +
    '</div>';
  container.appendChild(div);
  updateInfoAddBtn();
}
function removeInfoCard(id) {
  var el = document.getElementById('infoRow' + id);
  if (el) el.remove();
  updateInfoAddBtn();
}
function updateInfoAddBtn() {
  var container = document.getElementById('infoCardsEdit');
  if (!container) return;
  var count = container.querySelectorAll('.info-row').length;
  var btn = document.getElementById('addInfoBtn');
  if (btn) btn.disabled = (count >= 8);
}

// ==================== TIPS (二级页面) ====================
function addTip() {
  var container = document.getElementById('tipsEdit');
  if (!container) return;
  var count = container.querySelectorAll('.tip-row').length;
  if (count >= 6) return;
  var idx = Date.now();
  var num = count + 1;
  var div = document.createElement('div');
  div.className = 'editor-card tip-row';
  div.id = 'tipRow_' + idx;
  div.innerHTML =
    '<div class="editor-card-header">' +
    '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + num + '</span><span class="editor-card-title">Travel Tip</span></div>' +
    '<button class="editor-card-remove" onclick="this.parentElement.parentElement.remove(); updateTipAddBtn()">Remove</button>' +
    '</div>' +
    '<div class="editor-field"><label>Content</label><textarea placeholder="Enter travel tip..." id="fTip_' + idx + '"></textarea></div>' +
    '</div>';
  container.appendChild(div);
  updateTipAddBtn();
}
function removeTip(id) {
  var el = document.getElementById('tipRow' + id);
  if (el) el.remove();
  updateTipAddBtn();
}
function updateTipAddBtn() {
  var container = document.getElementById('tipsEdit');
  if (!container) return;
  var count = container.querySelectorAll('.tip-row').length;
  var btn = document.getElementById('addTipBtn');
  if (btn) btn.disabled = (count >= 6);
}

// ==================== READ DOM ====================
function readInfoCards() {
  var container = document.getElementById('infoCardsEdit');
  if (!container) return [];
  var arr = [];
  container.querySelectorAll('.info-row').forEach(function(row) {
    var icon = (row.querySelector('[id^="fInfoIcon"]') || {}).value || '';
    var label = (row.querySelector('[id^="fInfoLabel"]') || {}).value || '';
    var value = (row.querySelector('[id^="fInfoValue"]') || {}).value || '';
    if (icon || label || value) arr.push({ icon: icon.trim(), label: label.trim(), value: value.trim() });
  });
  while (arr.length < 4) arr.push({ icon: '⏱️', label: '', value: '' });
  return arr.slice(0, 8);
}
function readTips() {
  var container = document.getElementById('tipsEdit');
  if (!container) return [];
  var arr = [];
  container.querySelectorAll('.tip-row').forEach(function(row) {
    var val = (row.querySelector('[id^="fTip"]') || {}).value || '';
    if (val) arr.push(val.trim());
  });
  while (arr.length < 3) arr.push('');
  return arr.slice(0, 6);
}

// ==================== MODAL ====================
function openExpModal(idx) {
  editingIndex = (idx !== undefined) ? idx : -1;
  var e = editingIndex >= 0 ? expData[editingIndex] : {
    id: '', img: '',
    title: '', titleEn: '', desc: '', descEn: '',
    images: ['', '', ''],
    infoEn: [
      { icon: '⏱️', label: 'Duration', value: '' },
      { icon: '📊', label: 'Difficulty', value: '' },
      { icon: '🌦️', label: 'Best Season', value: '' },
      { icon: '👟', label: 'Gear', value: '' }
    ],
    tipsEn: ['', '', '']
  };

  // 确保数组存在并补全到所需长度（不丢失已有数据）
  if (!e.images || !Array.isArray(e.images)) e.images = [];
  while (e.images.length < 3) e.images.push('');
  // 统一使用 infoEn / tipsEn 作为唯一数据源（前台只显示英文）
  if (!e.infoEn || !Array.isArray(e.infoEn)) e.infoEn = [
    { icon: '⏱️', label: 'Duration', value: '' },
    { icon: '📊', label: 'Difficulty', value: '' },
    { icon: '🌦️', label: 'Best Season', value: '' },
    { icon: '👟', label: 'Gear', value: '' }
  ];
  if (!e.tipsEn || !Array.isArray(e.tipsEn)) e.tipsEn = ['', '', ''];
  // 构建 Info Cards HTML（纯英文）
  var infoHtml = '<div class="editor-section-title">📊 Info Cards <span class="editor-section-hint">4–8 items</span></div><div id="infoCardsEdit">';
  e.infoEn.forEach(function(item, i) {
    if (i >= 8) return;
    infoHtml += '<div class="editor-card info-row" id="infoRow' + i + '">' +
      '<div class="editor-card-header">' +
      '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + (i + 1) + '</span><span class="editor-card-title">Info Card</span></div>' +
      (i >= 4 ? '<button class="editor-card-remove" onclick="removeInfoCard(' + i + ')">Remove</button>' : '') +
      '</div>' +
      '<div class="editor-row">' +
      '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="⏱️" value="' + esc(item.icon || '') + '" id="fInfoIcon' + i + '"></div>' +
      '<div class="editor-field"><label>Label</label><input placeholder="e.g. Duration" value="' + esc(item.label || '') + '" id="fInfoLabel' + i + '"></div>' +
      '<div class="editor-field"><label>Value</label><input placeholder="e.g. 4-6 hours" value="' + esc(item.value || '') + '" id="fInfoValue' + i + '"></div>' +
      '</div>' +
      '</div>';
  });
  infoHtml += '</div><button class="btn btn-outline btn-sm editor-add-btn" onclick="addInfoCard()" id="addInfoBtn"' + (e.infoEn.length >= 8 ? ' disabled' : '') + '>➕ Add Info Card</button>';

  // 构建 Tips HTML（纯英文）
  var tipsHtml = '<div class="editor-section-title">💡 Travel Tips <span class="editor-section-hint">3–6 items</span></div><div id="tipsEdit">';
  e.tipsEn.forEach(function(tip, i) {
    if (i >= 6) return;
    tipsHtml += '<div class="editor-card tip-row" id="tipRow' + i + '">' +
      '<div class="editor-card-header">' +
      '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + (i + 1) + '</span><span class="editor-card-title">Travel Tip</span></div>' +
      (i >= 3 ? '<button class="editor-card-remove" onclick="removeTip(' + i + ')">Remove</button>' : '') +
      '</div>' +
      '<div class="editor-field"><label>Content</label><textarea placeholder="Enter travel tip..." id="fTip' + i + '">' + esc(tip || '') + '</textarea></div>' +
      '</div>';
  });
  tipsHtml += '</div><button class="btn btn-outline btn-sm editor-add-btn" onclick="addTip()" id="addTipBtn"' + (e.tipsEn.length >= 6 ? ' disabled' : '') + '>➕ Add Travel Tip</button>';

  // 轮播图 2、3
  var img1 = (e.images && e.images[1]) || '';
  var img2 = (e.images && e.images[2]) || '';

  showModal(
    editingIndex >= 0 ? '编辑体验' : '新增体验',
    // 基本信息
    '<div class="form-section"><h4>📋 基本信息（首页卡片）</h4>' +
    '<div class="form-group"><label>ID（唯一标识）</label><input id="fExpId" value="' + esc(e.id) + '"></div>' +
    '<div class="form-group"><label>中文标题</label><input id="fExpTitle" value="' + esc(e.title || '') + '"></div>' +
    '<div class="form-group"><label>英文标题</label><input id="fExpTitleEn" value="' + esc(e.titleEn || '') + '"></div>' +
    '<div class="form-group"><label>中文描述</label><textarea id="fExpDesc">' + esc(e.desc || '') + '</textarea></div>' +
    '<div class="form-group"><label>英文描述</label><textarea id="fExpDescEn">' + esc(e.descEn || '') + '</textarea></div>' +
    imgUploadHtml(e.img) +
    '</div>' +
    // 轮播图
    '<div class="form-section"><h4>🖼️ 轮播图（二级页面）</h4>' +
    '<div class="form-group"><label>轮播图 2（可选）</label>' + imgUploadHtml2(img1) + '</div>' +
    '<div class="form-group"><label>轮播图 3（可选）</label>' + imgUploadHtml3(img2) + '</div></div>' +
    // 详情字段
    infoHtml + tipsHtml +
    '<div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveExp()">💾 保存并同步到 GitHub</button></div>'
  );
}

// ==================== SAVE ====================
function saveExp() {
  var id = (document.getElementById('fExpId') || {}).value || '';
  id = id.trim();
  var title = (document.getElementById('fExpTitle') || {}).value || '';
  title = title.trim();
  var img = (document.getElementById(modalImgId) || {}).value || '';
  img = img.trim();
  var img1 = (document.getElementById('fExpImg1') || {}).value || '';
  img1 = img1.trim();
  var img2 = (document.getElementById('fExpImg2') || {}).value || '';
  img2 = img2.trim();

  if (!id) { showToast('❌ ID cannot be empty', 'error'); return; }
  if (!title) { showToast('❌ Chinese title cannot be empty', 'error'); return; }
  var titleEn = ((document.getElementById('fExpTitleEn') || {}).value || '').trim();
  if (!titleEn) { showToast('❌ English title cannot be empty', 'error'); return; }
  if (!img) { showToast('❌ Please upload a cover image', 'error'); return; }

  // ID 重复检查
  var duplicateIdx = -1;
  for (var i = 0; i < expData.length; i++) {
    if (expData[i].id === id) { duplicateIdx = i; break; }
  }
  if (editingIndex < 0 && duplicateIdx >= 0) {
    showToast('❌ ID "' + id + '" 已存在，请使用其他 ID', 'error'); return;
  }
  if (editingIndex >= 0 && duplicateIdx >= 0 && duplicateIdx !== editingIndex) {
    showToast('❌ ID "' + id + '" 已被其他体验使用，请使用其他 ID', 'error'); return;
  }

  var images = [img, img1 || '', img2 || ''];
  // 去除末尾空字符串（保留非末尾的空占位，维持顺序）
  while (images.length > 1 && !images[images.length - 1]) images.pop();

  var obj = {
    id: id,
    img: img,
    title: title,
    titleEn: titleEn,
    desc: ((document.getElementById('fExpDesc') || {}).value || '').trim(),
    descEn: ((document.getElementById('fExpDescEn') || {}).value || '').trim(),
    images: images,
    infoEn: readInfoCards(),
    tipsEn: readTips()
  };
  // 保留已有的 info 和 tips 字段（如果存在），避免丢失历史数据
  if (editingIndex >= 0 && expData[editingIndex]) {
    if (expData[editingIndex].info) obj.info = expData[editingIndex].info;
    if (expData[editingIndex].tips) obj.tips = expData[editingIndex].tips;
  }

  if (editingIndex >= 0) {
    expData[editingIndex] = obj;
  } else {
    expData.push(obj);
  }

  closeModal();
  renderExp();
  renderDashboard();
  showToast('✅ Experience saved, syncing to GitHub...', 'success');
  saveExpToGitHub();
}

// ==================== DELETE ====================
function deleteExp(i) {
  if (expData.length <= 2) { showToast('At least 2 experiences required', 'error'); return; }
  if (!confirm('Delete "' + (expData[i].titleEn || expData[i].title || '') + '"?')) return;

  // 删除关联的图片文件（最佳努力，失败不阻塞主流程）
  var e = expData[i];
  if (e.img) deleteFileFromGitHub(e.img, 'Delete: ' + e.img).catch(function() {});
  if (e.images) {
    var seen = {};
    e.images.forEach(function(img) {
      if (img && img !== e.img && !seen[img]) {
        seen[img] = true;
        deleteFileFromGitHub(img, 'Delete: ' + img).catch(function() {});
      }
    });
  }

  expData.splice(i, 1);
  renderExp();
  renderDashboard();
  showToast('✅ Deleted, syncing to GitHub...', 'success');
  saveExpToGitHub();
}

// ==================== REPLACE IMAGE ====================
// 快速替换 Experience 封面图片（表格行内操作，一步完成上传+保存+同步）
function replaceExpImage(i) {
  var fi = document.getElementById('fileInput');
  fi.onchange = function() {
    var file = fi.files[0];
    if (!file) return;
    var oldImg = expData[i].img;
    var btns = (document.querySelectorAll('#expTableBody tr') || [])[i];
    btns = btns ? btns.querySelectorAll('button') : [];
    var btn = btns[1] || null;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 压缩中...'; }
    compressImage(file, 1920, 0.85, function(base64, compressedSize) {
      var cleanName = file.name.replace(/[\\/*?:"<>|]/g, '_');
      var path = 'assets/images/' + cleanName;
      if (btn) { btn.textContent = '⏳ 上传中...'; }
      ghFetch(path, 'GET').then(function(r) { return r.ok ? r.json() : null; })
      .then(function(fileInfo) {
        return ghFetch(path, 'PUT', {
          content: base64,
          message: 'Replace experience image: ' + file.name,
          sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
        });
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(d) { throw new Error(d.message); });
        if (oldImg && oldImg !== path) {
          deleteFileFromGitHub(oldImg, 'Delete old image: ' + oldImg).catch(function() {});
        }
        expData[i].img = path;
        // 同步更新 images[0]（轮播图第一张），避免再次编辑时显示旧图
        if (!expData[i].images) expData[i].images = [];
        if (expData[i].images.length < 1) expData[i].images.push(path);
        else expData[i].images[0] = path;
        renderExp();
        showToast('✅ Image replaced, syncing experience data...', 'success');
        saveExpToGitHub();
      }).catch(function(err) {
        var msg = friendlyError(err.message || '');
        showToast('❌ Replace failed: ' + msg, 'error');
      }).finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = '🔄 Replace'; }
      });
    });
  };
  fi.value = '';
  fi.click();
}

// ==================== SYNC STATUS ====================
var expSyncLock = false;

function updateExpSyncStatus(state, message) {
  var el = document.getElementById('expSyncStatus');
  if (!el) return;
  var dot = el.querySelector('.sync-dot');
  var text = el.querySelector('.sync-text');
  var states = {
    idle:    { color: '#aaa', label: 'Not synced' },
    saving:  { color: '#f9a825', label: 'Syncing...' },
    success: { color: '#43a047', label: 'Synced ✓' },
    error:   { color: '#e53935', label: 'Sync failed ✕' }
  };
  var s = states[state] || states.idle;
  if (dot) dot.style.background = s.color;
  if (text) text.textContent = message || s.label;
}

// ==================== SAVE TO GITHUB ====================
function saveExpToGitHub() {
  if (expSyncLock) {
    showToast('⏳ 正在同步中，请稍候...', '');
    return;
  }
  expSyncLock = true;
  updateExpSyncStatus('saving');

  showToast('⏳ Step 1: Syncing experience.json to GitHub...', '');
  var content = JSON.stringify(expData, null, 2);
  var path = 'data/experience.json';
  var retryCount = 0;

  function doSync() {
    ghFetch(path, 'GET').then(function(r) { return r.ok ? r.json() : null; }).then(function(fileInfo) {
      // UTF-8 safe base64 encode
      function utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
      }
      var base64Content = utf8ToBase64(content);
      return ghFetch(path, 'PUT', {
        content: base64Content,
        message: 'Admin: Update experience.json',
        sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
      });
    }).then(function(r) {
      if (r.ok) {
        expSyncLock = false;
        updateExpSyncStatus('success');
        showToast('✅ Step 2: Experience synced to GitHub! Frontend will update in 1-2 minutes 🎉', 'success');
        return;
      }
      return r.json().then(function(d) {
        var msg = d.message || '';
        if ((msg.indexOf('sha was supplied') !== -1 || msg.indexOf('does not match') !== -1) && retryCount === 0) {
          retryCount++;
          showToast('🔄 Conflict detected, retrying...', '');
          updateExpSyncStatus('saving', 'Retrying...');
          return doSync();
        }
        throw new Error(msg);
      });
    }).catch(function(err) {
      expSyncLock = false;
      var msg = friendlyError(err.message || '');
      updateExpSyncStatus('error', msg.slice(0, 30));
      showToast('❌ Sync failed: ' + msg, 'error');
    });
  }

  doSync();
}
