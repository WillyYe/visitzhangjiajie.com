// ========== EXPERIENCE MANAGEMENT ==========
// 后台体验管理模块 - 从 admin/index.html 提取并扩展

// ========== RENDER EXPERIENCE TABLE ==========
function renderExp() {
  var h = '';
  expData.forEach(function(e, i) {
    var title = e.title || e.titleEn || '';
    var descShort = (e.desc || e.descEn || '').substring(0, 30) + '...';
    var imgPreview = e.img
      ? '<img src="../' + esc(e.img) + '" style="width:60px;height:40px;object-fit:cover;border-radius:4px">'
      : '—';

    h += '<tr><td>' + esc(e.id) + '</td><td>' + esc(title) + '</td><td title="' + esc(e.desc || e.descEn || '') + '">' + esc(descShort) + '</td><td style="text-align:center">' + imgPreview + '</td><td class="table-actions"><button class="btn btn-outline btn-sm" onclick="openExpModal(' + i + ')">编辑</button><button class="btn btn-danger btn-sm" onclick="deleteExp(' + i + ')">删除</button></td></tr>';
  });
  document.getElementById('expTableBody').innerHTML = h || '<tr><td colspan="5" style="text-align:center;color:#999">暂无数据</td></tr>';
}

// ========== OPEN EXPERIENCE MODAL ==========
function openExpModal(idx) {
  editingIndex = idx !== undefined ? idx : -1;
  var e = editingIndex >= 0 ? expData[editingIndex] : {
    id: '',
    title: '',
    titleEn: '',
    desc: '',
    descEn: '',
    img: '',
    images: ['', '', ''],
    info: [
      {icon: '⏱️', label: '建议时长', value: ''},
      {icon: '📊', label: '难度', value: ''},
      {icon: '🌦️', label: '最佳季节', value: ''},
      {icon: '👟', label: '装备建议', value: ''}
    ],
    tips: ['', '', '']
  };

  // 确保数组存在
  if (!e.images || !Array.isArray(e.images)) e.images = ['', '', ''];
  while (e.images.length < 3) e.images.push('');

  if (!e.info || !Array.isArray(e.info)) e.info = [
    {icon: '⏱️', label: '建议时长', value: ''},
    {icon: '📊', label: '难度', value: ''},
    {icon: '🌦️', label: '最佳季节', value: ''},
    {icon: '👟', label: '装备建议', value: ''}
  ];

  if (!e.tips || !Array.isArray(e.tips)) e.tips = ['', '', ''];

  // 构建弹窗内容
  var html = '';

  // 基础信息卡片
  html += '<div class="editor-card">';
  html += '<div class="editor-card-header">';
  html += '<div class="editor-card-badge">1</div>';
  html += '<div class="editor-card-title">基础信息</div>';
  html += '</div>';
  html += '<div class="editor-card-body">';
  html += '<div class="form-group"><label>ID（唯一标识）</label><input id="fExpId" value="' + esc(e.id) + '"></div>';
  html += '<div class="form-group"><label>中文标题</label><input id="fExpTitle" value="' + esc(e.title || '') + '"></div>';
  html += '<div class="form-group"><label>英文标题</label><input id="fExpTitleEn" value="' + esc(e.titleEn || '') + '"></div>';
  html += '<div class="form-group"><label>中文描述</label><textarea id="fExpDesc" rows="3">' + esc(e.desc || '') + '</textarea></div>';
  html += '<div class="form-group"><label>英文描述</label><textarea id="fExpDescEn" rows="2">' + esc(e.descEn || '') + '</textarea></div>';
  html += '</div></div>';

  // 轮播图卡片
  html += '<div class="editor-card">';
  html += '<div class="editor-card-header">';
  html += '<div class="editor-card-badge">2</div>';
  html += '<div class="editor-card-title">轮播图（3张）</div>';
  html += '</div>';
  html += '<div class="editor-card-body">';
  html += imgUploadHtml(e.img, 'width:100%;height:120px;object-fit:cover;border-radius:8px');
  html += '<p style="font-size:12px;color:#888;margin:8px 0 4px;">轮播图 2：</p>';
  html += '<input id="fExpImg1" value="' + esc(e.images[1] || '') + '" placeholder="assets/images/xxx.jpg" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
  html += '<p style="font-size:12px;color:#888;margin:8px 0 4px;">轮播图 3：</p>';
  html += '<input id="fExpImg2" value="' + esc(e.images[2] || '') + '" placeholder="assets/images/xxx.jpg" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
  html += '</div></div>';

  // 信息卡片
  html += '<div class="editor-card">';
  html += '<div class="editor-card-header">';
  html += '<div class="editor-card-badge">3</div>';
  html += '<div class="editor-card-title">信息卡片</div>';
  html += '<button type="button" style="margin-left:auto;padding:4px 10px;font-size:12px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:4px;cursor:pointer" onclick="addInfoCard()">+ 添加</button>';
  html += '</div>';
  html += '<div class="editor-card-body" id="infoCardsContainer">';

  (e.info || []).forEach(function(item, i) {
    html += '<div class="editor-card info-row" style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px">';
    html += '<div style="display:flex;gap:8px;margin-bottom:8px">';
    html += '<input value="' + esc(item.icon || '') + '" placeholder="图标" style="width:50px;padding:8px;text-align:center;border:1px solid #ddd;border-radius:6px;font-size:18px">';
    html += '<input value="' + esc(item.label || '') + '" placeholder="标签" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
    html += '<input value="' + esc(item.value || '') + '" placeholder="值" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
    html += '<button type="button" onclick="removeInfoCard(this)" style="padding:4px 8px;background:#ffebee;color:#c62828;border:1px solid #ef9a9e;border-radius:4px;cursor:pointer">🗑️</button>';
    html += '</div>';
    html += '</div>';
  });

  html += '</div></div>';

  // 旅行贴士卡片
  html += '<div class="editor-card">';
  html += '<div class="editor-card-header">';
  html += '<div class="editor-card-badge">4</div>';
  html += '<div class="editor-card-title">旅行贴士</div>';
  html += '<button type="button" style="margin-left:auto;padding:4px 10px;font-size:12px;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;border-radius:4px;cursor:pointer" onclick="addTip()">+ 添加</button>';
  html += '</div>';
  html += '<div class="editor-card-body" id="tipsContainer">';

  (e.tips || []).forEach(function(tip, i) {
    html += '<div class="tip-row" style="display:flex;gap:8px;margin-bottom:8px">';
    html += '<input value="' + esc(tip || '') + '" placeholder="贴士内容" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
    html += '<button type="button" onclick="removeTip(this)" style="padding:4px 8px;background:#ffebee;color:#c62828;border:1px solid #ef9a9e;border-radius:4px;cursor:pointer">🗑️</button>';
    html += '</div>';
  });

  html += '</div></div>';

  // 操作按钮
  html += '<div class="form-actions">';
  html += '<button class="btn btn-outline" onclick="closeModal()">取消</button>';
  html += '<button class="btn btn-primary" onclick="saveExp()">保存</button>';
  html += '</div>';

  showModal(editingIndex >= 0 ? '编辑体验' : '新增体验', html);
}

// ========== SAVE EXPERIENCE ==========
function saveExp() {
  var obj = {
    id: document.getElementById('fExpId').value,
    title: document.getElementById('fExpTitle').value,
    titleEn: document.getElementById('fExpTitleEn').value,
    desc: document.getElementById('fExpDesc').value,
    descEn: document.getElementById('fExpDescEn').value,
    img: document.getElementById(modalImgId).value,
    images: [
      document.getElementById('fExpImg1').value,
      document.getElementById('fExpImg2').value
    ],
    info: readInfoCards(),
    tips: readTips()
  };

  // 确保 images[0] = img
  obj.images.unshift(obj.img);
  // 去除末尾空值
  while (obj.images.length > 1 && !obj.images[obj.images.length - 1]) obj.images.pop();

  if (editingIndex >= 0) {
    expData[editingIndex] = obj;
  } else {
    expData.push(obj);
  }

  closeModal();
  renderExp();
  renderDashboard();
  showToast('体验已保存 ✅', 'success');

  // 自动同步到 GitHub
  saveExpToGitHub();
}

// ========== DELETE EXPERIENCE ==========
function deleteExp(i) {
  if (confirm('确定删除 "' + expData[i].title + '" 吗？')) {
    var e = expData[i];
    // 删除关联的图片
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
    showToast('已删除', 'success');
  }
}

// ========== READ INFO CARDS ==========
function readInfoCards() {
  var container = document.getElementById('infoCardsContainer');
  if (!container) return [];
  var cards = [];
  container.querySelectorAll('.info-row').forEach(function(row) {
    var inputs = row.querySelectorAll('input');
    if (inputs.length >= 3) {
      cards.push({
        icon: inputs[0].value,
        label: inputs[1].value,
        value: inputs[2].value
      });
    }
  });
  return cards;
}

// ========== ADD/REMOVE INFO CARD ==========
function addInfoCard() {
  var container = document.getElementById('infoCardsContainer');
  if (!container) return;
  var html = '<div class="editor-card info-row" style="margin-bottom:12px;padding:12px;background:#f9f9f9;border-radius:8px">';
  html += '<div style="display:flex;gap:8px;margin-bottom:8px">';
  html += '<input value="⏱️" placeholder="图标" style="width:50px;padding:8px;text-align:center;border:1px solid #ddd;border-radius:6px;font-size:18px">';
  html += '<input value="" placeholder="标签" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
  html += '<input value="" placeholder="值" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
  html += '<button type="button" onclick="removeInfoCard(this)" style="padding:4px 8px;background:#ffebee;color:#c62828;border:1px solid #ef9a9e;border-radius:4px;cursor:pointer">🗑️</button>';
  html += '</div>';
  html += '</div>';
  container.insertAdjacentHTML('beforeend', html);
}

function removeInfoCard(btn) {
  var row = btn.closest('.info-row');
  if (row) row.remove();
}

// ========== READ TIPS ==========
function readTips() {
  var container = document.getElementById('tipsContainer');
  if (!container) return [];
  var tips = [];
  container.querySelectorAll('.tip-row').forEach(function(row) {
    var input = row.querySelector('input');
    if (input && input.value.trim()) {
      tips.push(input.value.trim());
    }
  });
  return tips;
}

// ========== ADD/REMOVE TIP ==========
function addTip() {
  var container = document.getElementById('tipsContainer');
  if (!container) return;
  var html = '<div class="tip-row" style="display:flex;gap:8px;margin-bottom:8px">';
  html += '<input value="" placeholder="贴士内容" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">';
  html += '<button type="button" onclick="removeTip(this)" style="padding:4px 8px;background:#ffebee;color:#c62828;border:1px solid #ef9a9e;border-radius:4px;cursor:pointer">🗑️</button>';
  html += '</div>';
  container.insertAdjacentHTML('beforeend', html);
}

function removeTip(btn) {
  var row = btn.closest('.tip-row');
  if (row) row.remove();
}

// ========== SAVE TO GITHUB ==========
function saveExpToGitHub() {
  showToast('正在同步到 GitHub...', 'info');

  var content = JSON.stringify(expData, null, 2);
  var path = 'data/experience.json';

  ghFetch(path)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var sha = data.sha;
      ghFetch(path, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Update: experience.json (auto sync)',
          content: utf8ToBase64(content),
          sha: sha,
          branch: 'main'
        })
      })
      .then(function() {
        showToast('✅ 已同步到 GitHub', 'success');
      })
      .catch(function(err) {
        console.error('GitHub 同步失败:', err);
        showToast('⚠️ 自动同步失败，请手动点击「同步到 GitHub」', 'error');
      });
    })
    .catch(function(err) {
      console.error('获取文件 SHA 失败:', err);
      showToast('⚠️ 同步失败，请检查 Token 权限', 'error');
    });
}
