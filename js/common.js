// ==================== COMMON UTILITIES ====================
// 公共工具函数 — 供所有后台管理模块使用

// HTML 转义（防 XSS）
function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
var escHtml = esc; // 别名：scenic-detail.js 使用 escHtml()

// ==================== TOAST ====================
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '') + ' show';
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ==================== GITHUB API HELPER ====================
function getGhToken() {
  return localStorage.getItem('gh_token');
}

function ghFetch(path, method, body) {
  var token = getGhToken();
  if (!token) {
    return Promise.reject(new Error('GitHub Token 未配置，请在「设置」中配置'));
  }
  var url = 'https://api.github.com/repos/' + GH_REPO + '/contents/' + path;
  if (!method || method === 'GET') url += '?ref=' + GH_BRANCH;
  var opts = {
    method: method || 'GET',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    var payload = { message: body.message, content: body.content, branch: GH_BRANCH };
    if (body.sha) payload.sha = body.sha;
    opts.body = JSON.stringify(payload);
  }
  return fetch(url, opts);
}

// ==================== MODAL ====================
function showModal(title, bodyHtml) {
  document.getElementById('modalContent').innerHTML = '<h3>' + title + '</h3>' + bodyHtml;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ==================== IMAGE UPLOAD HTML ====================
// 生成 Modal 图片上传 HTML 片段
// modalImgId 由调用方在调用前设置，调用后恢复
// TODO: 重构为通过参数传入 modalImgId，消除隐式全局依赖
function imgUploadHtml(currentPath, previewStyle, noWrapper) {
  var ps = previewStyle || '';
  var previewSrc = currentPath ? ('../' + currentPath + '?t=' + Date.now()) : '';
  var previewImg = currentPath
    ? '<img src="' + previewSrc + '" alt="preview" style="max-width:200px;max-height:120px;object-fit:cover;border-radius:6px;border:1px solid var(--border)" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div style=color:#e53935;font-size:12px;padding:8px;background:#ffebee;border-radius:6px>⚠️ 图片加载失败，请检查路径或点击下方「上传图片」重新上传</div>\'">'
    : '<div style="color:#999;font-size:12px;padding:8px;background:#f5f5f5;border-radius:6px;text-align:center">暂无图片<br><span style="font-size:11px">点击下方「上传图片」按钮添加</span></div>';
  var inner = '<label>图片路径</label>' +
    '<div class="img-upload-wrap">' +
      '<input type="text" id="' + modalImgId + '" value="' + esc(currentPath) + '">' +
      '<button type="button" class="img-upload-btn" style="flex-shrink:0" onclick="triggerUpload(\'' + modalImgId + '\')">📁 上传图片</button>' +
      (currentPath
        ? '<button type="button" class="img-upload-btn" style="background:#ffebee;color:#ef5350;border-color:#ef5350;flex-shrink:0" onclick="document.getElementById(\'' + modalImgId + '\').value=\'\';document.getElementById(\'prev_' + modalImgId + '\').innerHTML=\'<div style=color:#999;font-size:12px;padding:8px;background:#f5f5f5;border-radius:6px;text-align:center>暂无图片<br><span style=font-size:11px>点击下方「上传图片」按钮添加</span></div>\'">✕ 清除</button>'
        : '') +
    '</div>' +
    '<div class="img-preview" id="prev_' + modalImgId + '">' + previewImg + '</div>';
  if (noWrapper) return inner;
  return '<div class="form-group">' + inner + '</div>';
}

// ==================== IMAGE COMPRESS ====================
function compressImage(file, maxW, quality, callback) {
  var img = new Image();
  var url = URL.createObjectURL(file);
  img.onload = function() {
    URL.revokeObjectURL(url);
    var w = img.width, h = img.height;
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob(function(blob) {
      var compressedSize = blob.size;
      var reader = new FileReader();
      reader.onload = function(e) {
        callback(e.target.result.split(',')[1], compressedSize);
      };
      reader.readAsDataURL(blob);
    }, 'image/jpeg', quality);
  };
  img.src = url;
}

// ==================== FRIENDLY ERROR ====================
function friendlyError(errMsg) {
  var msg = errMsg || '';
  if (msg.indexOf('Bad credentials') !== -1 || msg.indexOf('401') !== -1) return 'GitHub Token 已失效，请在「设置」中重新配置 Token';
  if (msg.indexOf('sha was supplied') !== -1 || msg.indexOf('does not match') !== -1) return '文件已被其他修改覆盖，请刷新页面后重试';
  if (msg.indexOf('Not Found') !== -1 || msg.indexOf('404') !== -1) return '文件路径不存在，请检查仓库配置是否正确';
  if (msg.indexOf('too large') !== -1 || msg.indexOf('too long') !== -1 || msg.indexOf('413') !== -1) return '图片体积过大（超过 100MB），请压缩后再上传';
  if (msg.indexOf('NetworkError') !== -1 || msg.indexOf('Failed to fetch') !== -1) return '网络连接失败，请检查网络后重试';
  if (msg.indexOf('timeout') !== -1) return '上传超时，请重试或检查网络速度';
  if (msg.indexOf('CORS') !== -1) return '跨域请求被拦截，请检查 Token 权限';
  if (msg.indexOf('403') !== -1) return 'Token 权限不足，请确保 Token 有 Contents 读写权限';
  return msg || '未知错误，请重试或联系管理员';
}

// ==================== DELETE FILE FROM GITHUB ====================
// 从 GitHub 仓库删除文件（最佳努力，失败不阻塞主流程）
function deleteFileFromGitHub(path, message) {
  return ghFetch(path, 'GET').then(function(r) {
    if (!r.ok) throw new Error('File not found');
    return r.json();
  }).then(function(fileInfo) {
    return ghFetch(path, 'DELETE', {
      message: message || 'Delete file: ' + path,
      sha: fileInfo.sha
    });
  });
}

// ==================== PROGRESS BAR ====================
function showProgressBar(inputId) {
  var previewDiv = document.getElementById('prev_' + inputId);
  if (!previewDiv) return;
  previewDiv.innerHTML =
    '<div class="upload-progress-bar-wrap active" id="pb_' + inputId + '">' +
      '<div class="pb-info">' +
        '<span class="pb-label">准备上传</span>' +
        '<span class="pb-pct">0%</span>' +
      '</div>' +
      '<div class="pb-track"><div class="pb-fill" id="pbfill_' + inputId + '"></div></div>' +
      '<div class="pb-stage">等待开始...</div>' +
    '</div>';
}

function updateProgressBar(inputId, pct, label, stage) {
  var wrap = document.getElementById('pb_' + inputId);
  var fill = document.getElementById('pbfill_' + inputId);
  if (!wrap || !fill) return;
  var labelEl = wrap.querySelector('.pb-label');
  var pctEl = wrap.querySelector('.pb-pct');
  var stageEl = wrap.querySelector('.pb-stage');
  fill.style.width = pct + '%';
  pctEl.textContent = Math.round(pct) + '%';
  if (label) labelEl.textContent = label;
  if (stage) stageEl.textContent = stage;
}

function markProgressError(inputId, label, stage) {
  var wrap = document.getElementById('pb_' + inputId);
  var fill = document.getElementById('pbfill_' + inputId);
  if (!wrap || !fill) return;
  wrap.classList.add('error');
  var labelEl = wrap.querySelector('.pb-label');
  var pctEl = wrap.querySelector('.pb-pct');
  var stageEl = wrap.querySelector('.pb-stage');
  labelEl.textContent = label || '上传失败';
  pctEl.textContent = '✕';
  fill.style.width = '100%';
  if (stage) stageEl.textContent = stage;
}

function animateProgress(inputId, from, to, duration, label, stage, callback) {
  updateProgressBar(inputId, from, label, stage);
  var start = Date.now();
  function tick() {
    var elapsed = Date.now() - start;
    var pct = from + (to - from) * Math.min(elapsed / duration, 1);
    updateProgressBar(inputId, pct, label, stage);
    if (elapsed < duration) {
      requestAnimationFrame(tick);
    } else {
      if (callback) callback();
    }
  }
  requestAnimationFrame(tick);
}

// ==================== IMAGE UPLOAD (GitHub) ====================
var pendingUploads = {};

// 静默上传（不操作进度条），用于缩略图上传
function ghUploadSilent(path, base64Content) {
  return ghFetch(path, 'GET').then(function(r) { return r.ok ? r.json() : null; })
  .then(function(fileInfo) {
    return ghFetch(path, 'PUT', {
      content: base64Content,
      message: 'Upload: ' + path,
      sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
    });
  });
}

function triggerUpload(inputId) {
  var fi = document.getElementById('fileInput');
  pendingUploads._targetInput = inputId;
  fi.onchange = function() {
    var file = fi.files[0];
    if (!file) return;
    var origSize = (file.size / 1024 / 1024).toFixed(1);
    var cleanName = file.name.replace(/[\\/*?:"<>|]/g, '_');
    var fullPath = 'assets/images/' + cleanName;
    var mdPath = 'assets/images/md/' + cleanName;
    var thumbPath = 'assets/images/thumb/' + cleanName;
    
    showProgressBar(inputId);
    
    // Stage 1: Full size (1920px) → upload to assets/images/
    animateProgress(inputId, 0, 20, 500, '压缩主图', '原始 ' + origSize + 'MB → 1920px', function() {
      compressImage(file, 1920, 0.85, function(fullB64, fullSize) {
        var fullMB = (fullSize / 1024 / 1024).toFixed(1);
        animateProgress(inputId, 20, 55, 500, '上传主图', '1920px (' + fullMB + 'MB) → ' + fullPath, function() {
          uploadToGitHub(fullPath, fullB64, file.name, inputId, function() {
            // Stage 2: MD (1200px) → upload to assets/images/md/
            updateProgressBar(inputId, 55, '压缩中图', '→ 1200px');
            compressImage(file, 1200, 0.85, function(mdB64, mdSize) {
              var mdKB = (mdSize / 1024).toFixed(0);
              updateProgressBar(inputId, 62, '上传中图', '1200px (' + mdKB + 'KB) → md/' + cleanName);
              ghUploadSilent(mdPath, mdB64).then(function() {
                // Stage 3: Thumb (400px) → upload to assets/images/thumb/
                updateProgressBar(inputId, 75, '压缩缩略图', '→ 400px');
                compressImage(file, 400, 0.80, function(thumbB64, thumbSize) {
                  var thumbKB = (thumbSize / 1024).toFixed(0);
                  updateProgressBar(inputId, 82, '上传缩略图', '400px (' + thumbKB + 'KB) → thumb/' + cleanName);
                  ghUploadSilent(thumbPath, thumbB64).then(function() {
                    // All done
                    updateProgressBar(inputId, 100, '上传完成', '1920/1200/400 三级响应式图片');
                    var previewDiv = document.getElementById('prev_' + inputId);
                    document.getElementById(inputId).value = fullPath;
                    previewDiv.innerHTML = '<img src="../' + fullPath + '?t=' + Date.now() + '" alt="preview">';
                    showToast('图片上传成功 ✅ (含响应式缩略图)', 'success');
                  }).catch(function(err) {
                    // Thumb upload failed - non-critical, still show success for main image
                    updateProgressBar(inputId, 95, '缩略图失败', '400px 上传失败(不影响使用)');
                    var previewDiv = document.getElementById('prev_' + inputId);
                    document.getElementById(inputId).value = fullPath;
                    previewDiv.innerHTML = '<img src="../' + fullPath + '?t=' + Date.now() + '" alt="preview">';
                    showToast('主图上传成功，缩略图生成失败(非关键)', 'warning');
                  });
                });
              }).catch(function(err) {
                // MD upload failed - still proceed with thumb
                updateProgressBar(inputId, 75, '中图失败', '1200px 上传失败');
                compressImage(file, 400, 0.80, function(thumbB64, thumbSize) {
                  ghUploadSilent(thumbPath, thumbB64).then(function() {
                    updateProgressBar(inputId, 95, '部分完成', '主图+缩略图已上传(中图缺失)');
                    var previewDiv = document.getElementById('prev_' + inputId);
                    document.getElementById(inputId).value = fullPath;
                    previewDiv.innerHTML = '<img src="../' + fullPath + '?t=' + Date.now() + '" alt="preview">';
                    showToast('主图上传成功，1200px中图失败(非关键)', 'warning');
                  }).catch(function() {
                    updateProgressBar(inputId, 90, '仅主图', '缩略图生成失败');
                    var previewDiv = document.getElementById('prev_' + inputId);
                    document.getElementById(inputId).value = fullPath;
                    previewDiv.innerHTML = '<img src="../' + fullPath + '?t=' + Date.now() + '" alt="preview">';
                    showToast('主图上传成功，缩略图生成失败', 'warning');
                  });
                });
              });
            });
          });
        });
      });
    });
  };
  fi.value = '';
  fi.click();
}

function uploadToGitHub(path, base64Content, fileName, inputId, onComplete) {
  var previewDiv = document.getElementById('prev_' + inputId);
  ghFetch(path, 'GET').then(function(r) { return r.ok ? r.json() : null; })
  .then(function(fileInfo) {
    return ghFetch(path, 'PUT', {
      content: base64Content,
      message: 'Upload image: ' + fileName,
      sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
    });
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(d) { throw new Error(d.message); });
    if (onComplete) { onComplete(); }
  }).catch(function(err) {
    var msg = friendlyError(err.message || '');
    markProgressError(inputId, '上传失败', msg);
    showToast('❌ 上传失败：' + msg, 'error');
  });
}

// ==================== FORMAT BYTES ====================
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

