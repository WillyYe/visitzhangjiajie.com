// ==================== SCENIC ADMIN ====================
// 景区管理模块 — 供 admin/index.html 调用
// 依赖：js/common.js（esc, showToast, ghFetch, friendlyError, deleteFileFromGitHub 等）

// ==================== RENDER ====================
function renderScenic() {
  var h = '';
  scenicData.forEach(function(s, i) {
    var imgPreview = s.img
      ? '<img src="../' + s.img + '?t=' + Date.now() + '" style="max-width:120px;max-height:80px;object-fit:cover;border-radius:4px;display:block" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<span style=color:#aaa;font-size:11px>图片未上传</span>\'">'
      : '<span style="color:#aaa;font-size:11px">未上传</span>';
    var subTitleShort = (s.subTitle || '').length > 20 ? (s.subTitle || '').substring(0, 20) + '...' : (s.subTitle || '—');
    var descShort = (s.desc || '').length > 30 ? (s.desc || '').substring(0, 30) + '...' : (s.desc || '—');
    var validImages = (s.images || []).filter(function(x) { return x; });
    var detailIcon = (validImages.length > 1) || (s.info && s.info.length) || (s.attractions && s.attractions.length) ? ' 🖼️' : '';
    h += '<tr><td>' + esc(s.id) + '</td><td>' + esc(s.name) + detailIcon + '</td><td>' + esc(s.tag) + '</td><td style="text-align:center">' + imgPreview + '</td><td>' + (s.large ? '✅' : '—') + '</td><td class="table-actions"><button class="btn btn-outline btn-sm" onclick="openScenicModal(' + i + ')">编辑</button><button class="btn btn-outline btn-sm" style="background:#e8f5e9;color:#2e7d32;border-color:#a5d6a7" onclick="replaceScenicImage(' + i + ')">🔄 替换图片</button><button class="btn btn-danger btn-sm" onclick="deleteScenic(' + i + ')">删除</button></td></tr>';
  });
  document.getElementById('scenicTableBody').innerHTML = h || '<tr><td colspan="6" style="text-align:center;color:#999">暂无数据</td></tr>';
}

// ==================== IMG UPLOAD HELPERS ====================
// 为 openScenicModal 生成"轮播图 2 / 3"的上传 HTML
function imgUploadHtml2(currentPath) {
  var old = modalImgId;
  modalImgId = 'fImg1';
  var html = imgUploadHtml(currentPath, '', true);
  modalImgId = old;
  return html;
}
function imgUploadHtml3(currentPath) {
  var old = modalImgId;
  modalImgId = 'fImg2';
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
    '<button class="editor-card-remove" onclick="this.parentElement.parentElement.remove(); updateInfoAddBtn()">删除</button>' +
    '</div>' +
    '<div class="editor-row">' +
    '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="🏔️" id="fInfoIcon_' + idx + '"></div>' +
    '<div class="editor-field"><label>Label</label><input placeholder="例如：Elevation" id="fInfoLabel_' + idx + '"></div>' +
    '<div class="editor-field"><label>Value</label><input placeholder="例如：1,074m" id="fInfoValue_' + idx + '"></div>' +
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

// ==================== ATTRACTIONS (二级页面) ====================
function addAttraction() {
  var container = document.getElementById('attrEdit');
  if (!container) return;
  var count = container.querySelectorAll('.attr-row').length;
  if (count >= 6) return;
  var idx = Date.now();
  var num = count + 1;
  var div = document.createElement('div');
  div.className = 'editor-card attr-row';
  div.id = 'attrRow_' + idx;
  div.innerHTML =
    '<div class="editor-card-header">' +
    '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + num + '</span><span class="editor-card-title">Attraction</span></div>' +
    '<button class="editor-card-remove" onclick="this.parentElement.parentElement.remove(); updateAttrAddBtn()">删除</button>' +
    '</div>' +
    '<div class="editor-row">' +
    '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="🗿" id="fAttrIcon_' + idx + '"></div>' +
    '<div class="editor-field"><label>Name</label><input placeholder="景点名称" id="fAttrName_' + idx + '"></div>' +
    '</div>' +
    '<div class="editor-field"><label>Description</label><textarea placeholder="景点描述..." id="fAttrDesc_' + idx + '"></textarea></div>';
  container.appendChild(div);
  updateAttrAddBtn();
}
function removeAttraction(id) {
  var el = document.getElementById('attrRow' + id);
  if (el) el.remove();
  updateAttrAddBtn();
}
function updateAttrAddBtn() {
  var container = document.getElementById('attrEdit');
  if (!container) return;
  var count = container.querySelectorAll('.attr-row').length;
  var btn = document.getElementById('addAttrBtn');
  if (btn) btn.disabled = (count >= 6);
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
    '<button class="editor-card-remove" onclick="this.parentElement.parentElement.remove(); updateTipAddBtn()">删除</button>' +
    '</div>' +
    '<div class="editor-field"><label>Content</label><textarea placeholder="输入旅行贴士..." id="fTip_' + idx + '"></textarea></div>';
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
    if (label) arr.push({ icon: icon.trim(), label: label.trim(), value: value.trim() });
  });
  while (arr.length < 4) arr.push({ icon: '🏔️', label: '', value: '' });
  return arr.slice(0, 8);
}
function readAttractions() {
  var container = document.getElementById('attrEdit');
  if (!container) return [];
  var arr = [];
  container.querySelectorAll('.attr-row').forEach(function(row) {
    var icon = (row.querySelector('[id^="fAttrIcon"]') || {}).value || '';
    var name = (row.querySelector('[id^="fAttrName"]') || {}).value || '';
    var desc = (row.querySelector('[id^="fAttrDesc"]') || {}).value || '';
    if (name) arr.push({ icon: icon.trim(), name: name.trim(), desc: desc.trim() });
  });
  while (arr.length < 3) arr.push({ icon: '🗿', name: '', desc: '' });
  return arr.slice(0, 6);
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
function openScenicModal(idx) {
  editingIndex = (idx !== undefined) ? idx : -1;
  var s = editingIndex >= 0 ? scenicData[editingIndex] : {
    id: '', img: '', large: false,
    tag: '', name: '', subTitle: '', desc: '',
    images: ['', '', ''],
    info: [
      { icon: '🏔️', label: 'Elevation', value: '' },
      { icon: '📏', label: 'Area', value: '' },
      { icon: '⏱️', label: 'Best Time', value: '' },
      { icon: '🎫', label: 'Ticket', value: '' }
    ],
    attractions: [
      { icon: '🗿', name: '', desc: '' },
      { icon: '🌉', name: '', desc: '' },
      { icon: '⛩️', name: '', desc: '' }
    ],
    tips: ['', '', '']
  };

  // 确保数组存在并补全到所需长度（不丢失已有数据）
  if (!s.images || !Array.isArray(s.images)) s.images = [];
  while (s.images.length < 3) s.images.push('');
  if (!s.info || !Array.isArray(s.info)) s.info = [
    { icon: '🏔️', label: 'Elevation', value: '' },
    { icon: '📏', label: 'Area', value: '' },
    { icon: '⏱️', label: 'Best Time', value: '' },
    { icon: '🎫', label: 'Ticket', value: '' }
  ];
  if (!s.attractions || !Array.isArray(s.attractions)) s.attractions = [
    { icon: '🗿', name: '', desc: '' },
    { icon: '🌉', name: '', desc: '' },
    { icon: '⛩️', name: '', desc: '' }
  ];
  if (!s.tips || !Array.isArray(s.tips)) s.tips = ['', '', ''];

  // 构建 Info Cards HTML
  var infoHtml = '<div class="editor-section-title">📊 Info Cards <span class="editor-section-hint">4–8 个</span></div><div id="infoCardsEdit">';
  s.info.forEach(function(item, i) {
    if (i >= 8) return;
    infoHtml += '<div class="editor-card info-row" id="infoRow' + i + '">' +
      '<div class="editor-card-header">' +
      '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + (i + 1) + '</span><span class="editor-card-title">Info Card</span></div>' +
      (i >= 4 ? '<button class="editor-card-remove" onclick="removeInfoCard(' + i + ')">删除</button>' : '') +
      '</div>' +
      '<div class="editor-row">' +
      '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="🏔️" value="' + esc(item.icon || '') + '" id="fInfoIcon' + i + '"></div>' +
      '<div class="editor-field"><label>Label</label><input placeholder="例如：Elevation" value="' + esc(item.label || '') + '" id="fInfoLabel' + i + '"></div>' +
      '<div class="editor-field"><label>Value</label><input placeholder="例如：1,074m" value="' + esc(item.value || '') + '" id="fInfoValue' + i + '"></div>' +
      '</div>' +
      '</div>';
  });
  infoHtml += '</div><button class="btn btn-outline btn-sm editor-add-btn" onclick="addInfoCard()" id="addInfoBtn"' + (s.info.length >= 8 ? ' disabled' : '') + '>➕ 添加 Info Card</button>';

  // 构建 Attractions HTML
  var attrHtml = '<div class="editor-section-title">🗿 Key Attractions <span class="editor-section-hint">3–6 个</span></div><div id="attrEdit">';
  s.attractions.forEach(function(item, i) {
    if (i >= 6) return;
    attrHtml += '<div class="editor-card attr-row" id="attrRow' + i + '">' +
      '<div class="editor-card-header">' +
      '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + (i + 1) + '</span><span class="editor-card-title">Attraction</span></div>' +
      (i >= 3 ? '<button class="editor-card-remove" onclick="removeAttraction(' + i + ')">删除</button>' : '') +
      '</div>' +
      '<div class="editor-row">' +
      '<div class="editor-field icon-field"><label>Icon</label><input class="icon-input" placeholder="🗿" value="' + esc(item.icon || '') + '" id="fAttrIcon' + i + '"></div>' +
      '<div class="editor-field"><label>Name</label><input placeholder="景点名称" value="' + esc(item.name || '') + '" id="fAttrName' + i + '"></div>' +
      '</div>' +
      '<div class="editor-field"><label>Description</label><textarea placeholder="景点描述..." id="fAttrDesc' + i + '">' + esc(item.desc || '') + '</textarea></div>' +
      '</div>';
  });
  attrHtml += '</div><button class="btn btn-outline btn-sm editor-add-btn" onclick="addAttraction()" id="addAttrBtn"' + (s.attractions.length >= 6 ? ' disabled' : '') + '>➕ 添加 Attraction</button>';

  // 构建 Tips HTML
  var tipsHtml = '<div class="editor-section-title">💡 Travel Tips <span class="editor-section-hint">3–6 条</span></div><div id="tipsEdit">';
  s.tips.forEach(function(tip, i) {
    if (i >= 6) return;
    tipsHtml += '<div class="editor-card tip-row" id="tipRow' + i + '">' +
      '<div class="editor-card-header">' +
      '<div style="display:flex;align-items:center;"><span class="editor-card-num">' + (i + 1) + '</span><span class="editor-card-title">Travel Tip</span></div>' +
      (i >= 3 ? '<button class="editor-card-remove" onclick="removeTip(' + i + ')">删除</button>' : '') +
      '</div>' +
      '<div class="editor-field"><label>Content</label><textarea placeholder="输入旅行贴士..." id="fTip' + i + '">' + esc(tip || '') + '</textarea></div>' +
      '</div>';
  });
  tipsHtml += '</div><button class="btn btn-outline btn-sm editor-add-btn" onclick="addTip()" id="addTipBtn"' + (s.tips.length >= 6 ? ' disabled' : '') + '>➕ 添加 Travel Tip</button>';

  // 轮播图 2、3
  var img1 = (s.images && s.images[1]) || '';
  var img2 = (s.images && s.images[2]) || '';

  showModal(
    editingIndex >= 0 ? '编辑景区' : '新增景区',
    // 基本信息
    '<div class="form-section"><h4>📋 基本信息（首页卡片）</h4>' +
    '<div class="form-group"><label>ID</label><input id="fId" value="' + esc(s.id) + '"></div>' +
    '<div class="form-group"><label>名称 (Name)</label><input id="fName" value="' + esc(s.name || '') + '"></div>' +
    '<div class="form-group"><label>标签 (Tag)</label><input id="fTag" value="' + esc(s.tag || '') + '"></div>' +
    '<div class="form-group"><label>副标题 (Subtitle)</label><input id="fSub" value="' + esc(s.subTitle || '') + '"></div>' +
    '<div class="form-group"><label>描述 (Description)</label><textarea id="fDesc">' + esc(s.desc || '') + '</textarea></div>' +
    imgUploadHtml(s.img) +
    '<div class="form-group"><label><input type="checkbox" id="fLarge" ' + (s.large ? 'checked' : '') + '> 大图显示</label></div></div>' +
    // 轮播图
    '<div class="form-section"><h4>🖼️ 轮播图（二级页面）</h4>' +
    '<div class="form-group"><label>轮播图 2（可选）</label>' + imgUploadHtml2(img1) + '</div>' +
    '<div class="form-group"><label>轮播图 3（可选）</label>' + imgUploadHtml3(img2) + '</div></div>' +
    // 详情字段
    infoHtml + attrHtml + tipsHtml +
    '<div class="form-actions"><button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveScenic()">💾 保存并同步到 GitHub</button></div>'
  );
}

// ==================== SAVE ====================
function saveScenic() {
  var id = (document.getElementById('fId') || {}).value || '';
  id = id.trim();
  var name = (document.getElementById('fName') || {}).value || '';
  name = name.trim();
  var img = (document.getElementById(modalImgId) || {}).value || '';
  img = img.trim();
  var img1 = (document.getElementById('fImg1') || {}).value || '';
  img1 = img1.trim();
  var img2 = (document.getElementById('fImg2') || {}).value || '';
  img2 = img2.trim();

  if (!id) { showToast('❌ ID 不能为空', 'error'); return; }
  if (!name) { showToast('❌ 名称不能为空', 'error'); return; }
  if (!img) { showToast('❌ 请上传封面图片', 'error'); return; }

  // ID 重复检查
  var duplicateIdx = -1;
  for (var i = 0; i < scenicData.length; i++) {
    if (scenicData[i].id === id) { duplicateIdx = i; break; }
  }
  if (editingIndex < 0 && duplicateIdx >= 0) {
    showToast('❌ ID "' + id + '" 已存在，请使用其他 ID', 'error'); return;
  }
  if (editingIndex >= 0 && duplicateIdx >= 0 && duplicateIdx !== editingIndex) {
    showToast('❌ ID "' + id + '" 已被其他景区使用，请使用其他 ID', 'error'); return;
  }

  var images = [img, img1 || '', img2 || ''];
  // 去除末尾空字符串（保留非末尾的空占位，维持顺序）
  while (images.length > 1 && !images[images.length - 1]) images.pop();

  var obj = {
    id: id,
    img: img,
    large: !!(document.getElementById('fLarge') || {}).checked,
    tag: ((document.getElementById('fTag') || {}).value || '').trim(),
    name: name,
    subTitle: ((document.getElementById('fSub') || {}).value || '').trim(),
    desc: ((document.getElementById('fDesc') || {}).value || '').trim(),
    images: images,
    info: readInfoCards(),
    attractions: readAttractions(),
    tips: readTips()
  };

  if (editingIndex >= 0) {
    scenicData[editingIndex] = obj;
  } else {
    scenicData.push(obj);
  }

  closeModal();
  renderScenic();
  renderDashboard();
  showToast('✅ 景区已保存，正在同步到 GitHub...', 'success');
  saveScenicToGitHub();
}

// ==================== DELETE ====================
function deleteScenic(i) {
  if (scenicData.length <= 3) { showToast('至少保留 3 个景区，不可删除', 'error'); return; }
  if (!confirm('确定删除 "' + (scenicData[i].name || '') + '" 吗？')) return;

  // 删除关联的图片文件（最佳努力，失败不阻塞）
  var s = scenicData[i];
  if (s.img) deleteFileFromGitHub(s.img, 'Delete: ' + s.img).catch(function() {});
  if (s.images) {
    var seen = {};
    s.images.forEach(function(img) {
      if (img && img !== s.img && !seen[img]) {
        seen[img] = true;
        deleteFileFromGitHub(img, 'Delete: ' + img).catch(function() {});
      }
    });
  }

  scenicData.splice(i, 1);
  renderScenic();
  renderDashboard();
  showToast('✅ 已删除，正在同步到 GitHub...', 'success');
  saveScenicToGitHub();
}

// ==================== REPLACE IMAGE ====================
// 快速替换 Scenic 封面图片（表格行内操作，一步完成上传+保存+同步）
// 快速替换 Scenic 图片（表格行内操作，一步完成上传+保存+同步）
// 自动生成三级响应式图片：1920px(全尺寸)、1200px(md)、400px(thumb)
function replaceScenicImage(i) {
  var fi = document.getElementById('fileInput');
  fi.onchange = function() {
    var file = fi.files[0];
    if (!file) return;
    var oldImg = scenicData[i].img;
    var btns = (document.querySelectorAll('#scenicTableBody tr') || [])[i];
    btns = btns ? btns.querySelectorAll('button') : [];
    var btn = btns[1] || null;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 压缩中...'; }
    compressImage(file, 1920, 0.85, function(base64, compressedSize) {
      var cleanName = file.name.replace(/[\\/*?:"<>|]/g, '_');
      var path = 'assets/images/' + cleanName;
      var mdPath = 'assets/images/md/' + cleanName;
      var thumbPath = 'assets/images/thumb/' + cleanName;
      if (btn) { btn.textContent = '⏳ 上传主图...'; }
      ghFetch(path, 'GET').then(function(r) { return r.ok ? r.json() : null; })
      .then(function(fileInfo) {
        return ghFetch(path, 'PUT', {
          content: base64,
          message: 'Replace scenic image: ' + file.name,
          sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
        });
      }).then(function(r) {
        if (!r.ok) return r.json().then(function(d) { throw new Error(d.message); });
        if (btn) { btn.textContent = '⏳ 生成中图...'; }
        // Stage 2: Generate and upload 1200px medium image
        return new Promise(function(resolve, reject) {
          compressImage(file, 1200, 0.85, function(mdB64) {
            ghUploadSilent(mdPath, mdB64).then(function() {
              if (btn) { btn.textContent = '⏳ 生成缩略图...'; }
              // Stage 3: Generate and upload 400px thumbnail
              compressImage(file, 400, 0.80, function(thumbB64) {
                ghUploadSilent(thumbPath, thumbB64).then(function() {
                  resolve();
                }).catch(function() {
                  resolve();
                });
              });
            }).catch(function() {
              // MD failure is non-critical, continue with thumb
              compressImage(file, 400, 0.80, function(thumbB64) {
                ghUploadSilent(thumbPath, thumbB64).then(function() {
                  resolve();
                }).catch(function() {
                  resolve();
                });
              });
            });
          });
        });
      }).then(function() {
        if (oldImg && oldImg !== path) {
          deleteFileFromGitHub(oldImg, 'Delete old image: ' + oldImg).catch(function() {});
        }
        scenicData[i].img = path;
        // 同步更新 images[0]（轮播图第一张），避免再次编辑时显示旧图
        if (!scenicData[i].images) scenicData[i].images = [];
        if (scenicData[i].images.length < 1) scenicData[i].images.push(path);
        else scenicData[i].images[0] = path;
        renderScenic();
        showToast('✅ 图片已替换(含响应式尺寸)，正在同步景区数据...', 'success');
        saveScenicToGitHub();
      }).catch(function(err) {
        var msg = friendlyError(err.message || '');
        showToast('❌ 替换失败：' + msg, 'error');
      }).finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = '🔄 替换图片'; }
      });
    });
  };
  fi.value = '';
  fi.click();
}

// ==================== SYNC STATUS ====================
var scenicSyncLock = false;

function updateScenicSyncStatus(state, message) {
  var el = document.getElementById('scenicSyncStatus');
  if (!el) return;
  var dot = el.querySelector('.sync-dot');
  var text = el.querySelector('.sync-text');
  var states = {
    idle:    { color: '#aaa', label: '未同步' },
    saving:  { color: '#f9a825', label: '同步中...' },
    success: { color: '#43a047', label: '已同步 ✓' },
    error:   { color: '#e53935', label: '同步失败 ✕' }
  };
  var s = states[state] || states.idle;
  if (dot) dot.style.background = s.color;
  if (text) text.textContent = message || s.label;
}

// ==================== SAVE TO GITHUB ====================
function saveScenicToGitHub() {
  if (scenicSyncLock) {
    showToast('⏳ 正在同步中，请稍候...', '');
    return;
  }
  scenicSyncLock = true;
  updateScenicSyncStatus('saving');

  showToast('⏳ 第 1 步：正在同步 scenic.json 到 GitHub...', '');
  var content = JSON.stringify(scenicData, null, 2);
  var path = 'data/scenic.json';
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
        message: 'Admin: Update scenic.json',
        sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
      });
    }).then(function(r) {
      if (r.ok) {
        scenicSyncLock = false;
        updateScenicSyncStatus('success');
        showToast('✅ 第 2 步：景区已同步到 GitHub！前台约 1-2 分钟后更新 🎉', 'success');
        return;
      }
      return r.json().then(function(d) {
        var msg = d.message || '';
        if ((msg.indexOf('sha was supplied') !== -1 || msg.indexOf('does not match') !== -1) && retryCount === 0) {
          retryCount++;
          showToast('🔄 检测到文件冲突，正在自动重试...', '');
          updateScenicSyncStatus('saving', '冲突重试中...');
          return doSync();
        }
        throw new Error(msg);
      });
    }).catch(function(err) {
      scenicSyncLock = false;
      var msg = friendlyError(err.message || '');
      updateScenicSyncStatus('error', msg.slice(0, 30));
      showToast('❌ 同步失败：' + msg, 'error');
    });
  }

  doSync();
}
