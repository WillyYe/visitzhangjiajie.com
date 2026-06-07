// ==================== GALLERY ADMIN MODULE ====================
// Modular gallery management for admin backend
// Depends on (globals): ghFetch, ghUploadSilent, compressImage, showToast,
//   friendlyError, esc, deleteFileFromGitHub, getGhToken, updateProgressBar, showProgressBar
//
// Features:
//   - Drag & drop or click to add images (no forms, no titles to type)
//   - Each card: preview + replace button + delete button
//   - 3-tier responsive upload: 1920px / 1200px / 400px
//   - Auto-generate title from filename
//   - In-line progress bar on each card during upload
//   - Duplicate detection: skip files already in galleryData
//   - Limit: 1-9 images per upload batch

(function() {
  'use strict';

  // Note: do NOT cache window.galleryData in a closure — the variable is
  // declared later in the page, so it's undefined at module-load time.
  // Always read it dynamically via _galData().
  function _galData() { return window.galleryData || []; }
  var isUploading = false;

  // ========== RENDER ==========
  window.renderGalleryAdmin = function() {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    if (!isUploading && _galData().length === 0) {
      grid.innerHTML = '<div class="gal-empty">暂无图片<br><span>点击「新增图片」或拖放图片到此处</span></div>';
    } else {
      var h = '';
      _galData().forEach(function(item, i) {
        var imgPath = item.img || '';
        var title = item.titleEn || item.title || _autoTitle(imgPath);
        h += _renderCard(i, imgPath, title, false);
      });
      // "Add" card
      h += '<div class="gal-card gal-card-add" id="galAddCard" onclick="triggerGalleryAdd()">';
      h += '  <div class="gal-card-add-inner">';
      h += '    <span class="gal-add-icon">+</span>';
      h += '    <span class="gal-add-text">新增图片</span>';
      h += '    <span class="gal-add-hint">点击或拖放</span>';
      h += '  </div>';
      h += '</div>';
      grid.innerHTML = h;
    }

    // Update count
    var countEl = document.getElementById('galleryCount');
    if (countEl) countEl.textContent = _galData().length + ' 张';
  };

  // ========== ADD IMAGES ==========
  // Triggered by click on the "+" card
  window.triggerGalleryAdd = function() {
    if (isUploading) { showToast('⏳ 正在上传中，请稍候', ''); return; }
    var fi = document.getElementById('fileInput');
    fi.multiple = true;
    fi.onchange = function() {
      if (fi.files && fi.files.length > 0) {
        _handleGalleryFiles(fi.files);
      }
      fi.value = '';
      fi.multiple = false;
    };
    fi.click();
  };

  // ========== REPLACE IMAGE ==========
  window.replaceGalleryImage = function(index) {
    if (isUploading) { showToast('⏳ 正在上传中，请稍候', ''); return; }
    var fi = document.getElementById('fileInput');
    fi.multiple = false;
    fi.onchange = function() {
      var file = fi.files[0];
      if (!file) { fi.value = ''; return; }

      // Check duplicate for replace too
      if (_isDuplicate(file.name)) {
        showToast('⚠️ 图片「' + file.name + '」已存在，无需重复上传', 'warning');
        fi.value = '';
        return;
      }

      _setCardProgress(index, 5, '压缩中...');
      _uploadGalleryFile(file, function(pct, label) {
        _setCardProgress(index, pct, label);
      }, function(err, newPath) {
        if (err) {
          _hideCardProgress(index);
          showToast('❌ 替换失败：' + friendlyError(err), 'error');
          fi.value = '';
          return;
        }
        var oldPath = _galData()[index] && _galData()[index].img;
        // Update data
        _galData()[index] = _makeGalleryItem(newPath, file.name);
        _hideCardProgress(index);
        renderGalleryAdmin();
        _updateGallerySyncStatus('unsaved');
        showToast('✅ 图片已替换', 'success');
        // Clean up old image files (best effort)
        if (oldPath && oldPath !== newPath) {
          _deleteGalleryImageFiles(oldPath);
        }
        fi.value = '';
      });
    };
    fi.value = '';
    fi.click();
  };

  // ========== DELETE IMAGE ==========
  window.deleteGalleryImage = function(index) {
    if (isUploading) { showToast('⏳ 正在上传中，请稍候', ''); return; }
    var item = _galData()[index];
    if (!item) return;
    if (!confirm('确定删除「' + (item.titleEn || '此图片') + '」吗？')) return;

    var imgPath = item.img;
    _galData().splice(index, 1);
    renderGalleryAdmin();
    _updateGallerySyncStatus('unsaved');
    showToast('已删除', 'success');

    // Clean up image files (best effort)
    if (imgPath) _deleteGalleryImageFiles(imgPath);
  };

  // ========== SAVE TO GITHUB ==========
  window.saveGalleryToGitHub = function() {
    return new Promise(function(resolve, reject) {
      if (!getGhToken()) { reject(new Error('未配置 GitHub Token')); return; }
      _updateGallerySyncStatus('saving');

      var content = btoa(Array.from(
        new TextEncoder().encode(JSON.stringify(_galData(), null, 2)),
        function(b) { return String.fromCharCode(b); }
      ).join(''));

      ghFetch('data/gallery.json', 'GET')
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(fileInfo) {
          return ghFetch('data/gallery.json', 'PUT', {
            content: content,
            message: 'Admin: Update gallery.json',
            sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
          });
        })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(d) { throw new Error(d.message); });
          _updateGallerySyncStatus('success');
          resolve(true);
        })
        .catch(function(err) {
          _updateGallerySyncStatus('error');
          reject(err);
        });
    });
  };

  // ========== DROP ZONE ==========
  window.initGalleryDropZone = function() {
    var grid = document.getElementById('galleryGrid');
    if (!grid) return;

    grid.addEventListener('dragover', function(e) {
      e.preventDefault();
      grid.classList.add('gal-dragover');
    });
    grid.addEventListener('dragleave', function(e) {
      e.preventDefault();
      grid.classList.remove('gal-dragover');
    });
    grid.addEventListener('drop', function(e) {
      e.preventDefault();
      grid.classList.remove('gal-dragover');
      if (isUploading) { showToast('⏳ 正在上传中，请稍候', ''); return; }
      var files = e.dataTransfer.files;
      if (files && files.length > 0) {
        _handleGalleryFiles(files);
      }
    });
  };

  // ========== INTERNAL HELPERS ==========

  // Check if a file (by filename) is already in galleryData
  function _isDuplicate(filename) {
    var cleanName = filename.replace(/[\\/*?:"<>|]/g, '_');
    if (!/\.(jpe?g|png|webp|gif)$/i.test(cleanName)) {
      cleanName += '.jpg';
    }
    var fullPath = 'assets/images/' + cleanName;
    return _galData().some(function(item) {
      return item.img === fullPath;
    });
  }

  function _handleGalleryFiles(files) {
    if (isUploading) return;

    var fileArr = Array.from(files);

    // Limit to 9 files max
    if (fileArr.length > 9) {
      showToast('⚠️ 一次最多上传 9 张图片，已自动选取前 9 张', 'warning');
      fileArr = fileArr.slice(0, 9);
    }

    // Filter out duplicates
    var duplicates = [];
    var toUpload = [];
    fileArr.forEach(function(file) {
      if (_isDuplicate(file.name)) {
        duplicates.push(file.name);
      } else {
        toUpload.push(file);
      }
    });

    if (duplicates.length > 0) {
      showToast('⚠️ ' + duplicates.length + ' 张图片已存在，已跳过：' + duplicates.slice(0, 3).join('、') + (duplicates.length > 3 ? ' 等' : ''), 'warning');
    }

    if (toUpload.length === 0) {
      showToast('⚠️ 所有图片均已存在，无需上传', 'warning');
      return;
    }

    isUploading = true;
    var total = toUpload.length;
    var completed = 0;
    var failed = 0;
    var startLen = _galData().length;

    // ===== Render temporary upload cards first =====
    var grid = document.getElementById('galleryGrid');
    var h = '';
    // Existing items (re-render so indices match)
    _galData().forEach(function(item, i) {
      var imgPath = item.img || '';
      var title = item.titleEn || item.title || _autoTitle(imgPath);
      h += _renderCard(i, imgPath, title, false);
    });
    // Temp upload cards
    toUpload.forEach(function(file, i) {
      var tempIdx = startLen + i;
      h += _renderCard(tempIdx, '', _autoTitle(file.name), true);
    });
    // Add button
    h += '<div class="gal-card gal-card-add" id="galAddCard" onclick="triggerGalleryAdd()">';
    h += '  <div class="gal-card-add-inner">';
    h += '    <span class="gal-add-icon">+</span>';
    h += '    <span class="gal-add-text">新增图片</span>';
    h += '    <span class="gal-add-hint">点击或拖放</span>';
    h += '  </div>';
    h += '</div>';
    if (grid) grid.innerHTML = h;

    // Show initial progress on all temp cards
    toUpload.forEach(function(file, i) {
      _setCardProgress(startLen + i, 2, '等待上传...');
    });

    showToast('📤 开始上传 ' + total + ' 张图片...', '');

    // Process files sequentially to avoid overwhelming GitHub API
    function processNext(idx) {
      if (idx >= toUpload.length) {
        isUploading = false;
        if (failed > 0) {
          showToast('⚠️ 上传完成：' + completed + ' 成功，' + failed + ' 失败', 'warning');
        } else {
          showToast('✅ 全部 ' + completed + ' 张图片上传成功', 'success');
        }
        // Refresh render with real cards
        renderGalleryAdmin();
        _updateGallerySyncStatus('unsaved');
        return;
      }

      var file = toUpload[idx];
      var tempIdx = startLen + idx;

      _setCardProgress(tempIdx, 5, '正在压缩主图...');

      _uploadGalleryFile(file, function(pct, label) {
        _setCardProgress(tempIdx, pct, label);
      }, function(err, newPath) {
        if (err) {
          failed++;
          _setCardProgress(tempIdx, 100, '上传失败');
          console.error('Gallery upload failed for', file.name, err);
          var bar = document.getElementById('galProgBar_' + tempIdx);
          if (bar) bar.style.background = '#e53935';
        } else {
          completed++;
          _setCardProgress(tempIdx, 100, '上传成功');
          _galData().push(_makeGalleryItem(newPath, file.name));
        }
        // Continue to next file
        processNext(idx + 1);
      });
    }

    processNext(0);
  }

  // Render a single gallery card (reused for real and temp cards)
  function _renderCard(idx, imgPath, title, progressVisible) {
    var h = '<div class="gal-card" data-idx="' + idx + '">';
    h += '  <div class="gal-card-img-wrap">';
    if (imgPath) {
      // Use thumbnail for admin preview (fast load); fallback to full-size if thumb missing
      var thumbPath = imgPath.replace('assets/images/', 'assets/images/thumb/');
      h += '    <img src="../' + esc(thumbPath) + '?t=' + Date.now() + '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'../' + esc(imgPath) + '\';" style="display:block">';
    }
    h += '    <div class="gal-card-placeholder" style="display:' + (imgPath ? 'none' : 'flex') + '"><span>待上传</span></div>';
    if (progressVisible !== true) {
      h += '    <div class="gal-card-actions">';
      h += '      <button class="gal-btn" onclick="replaceGalleryImage(' + idx + ')" title="替换图片">🔄</button>';
      h += '      <button class="gal-btn gal-btn-danger" onclick="deleteGalleryImage(' + idx + ')" title="删除图片">🗑️</button>';
      h += '    </div>';
    }
    h += '    <div class="gal-progress" id="galProg_' + idx + '" style="display:' + (progressVisible ? 'block' : 'none') + '">';
    h += '      <div class="gal-progress-bar" id="galProgBar_' + idx + '"></div>';
    h += '      <span class="gal-progress-text" id="galProgText_' + idx + '">0%</span>';
    h += '    </div>';
    h += '  </div>';
    h += '  <div class="gal-card-title">' + esc(title) + '</div>';
    h += '</div>';
    return h;
  }

  // Upload a single file through the 3-tier pipeline
  function _uploadGalleryFile(file, onProgress, onDone) {
    var cleanName = file.name.replace(/[\\/*?:"<>|]/g, '_');
    // Ensure .jpg extension for consistency
    if (!/\.(jpe?g|png|webp|gif)$/i.test(cleanName)) {
      cleanName += '.jpg';
    }
    var fullPath = 'assets/images/' + cleanName;
    var mdPath = 'assets/images/md/' + cleanName;
    var thumbPath = 'assets/images/thumb/' + cleanName;

    onProgress(10, '压缩主图...');

    compressImage(file, 1920, 0.92, function(fullB64, fullSize) {
      onProgress(30, '上传主图...');

      ghFetch(fullPath, 'GET')
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(fileInfo) {
          return ghFetch(fullPath, 'PUT', {
            content: fullB64,
            message: 'Upload gallery image: ' + cleanName,
            sha: fileInfo && fileInfo.sha ? fileInfo.sha : null
          });
        })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(d) { throw new Error(d.message); });
          onProgress(55, '压缩中图...');

          // Stage 2: MD (1200px)
          compressImage(file, 1200, 0.88, function(mdB64) {
            onProgress(70, '上传中图...');
            ghUploadSilent(mdPath, mdB64).then(function() {
              onProgress(82, '压缩缩略图...');

              // Stage 3: Thumb (400px)
              compressImage(file, 400, 0.82, function(thumbB64) {
                onProgress(92, '上传缩略图...');
                ghUploadSilent(thumbPath, thumbB64).then(function() {
                  onProgress(100, '完成');
                  onDone(null, fullPath);
                }).catch(function() {
                  onProgress(100, '完成(无缩略图)');
                  onDone(null, fullPath);
                });
              });
            }).catch(function() {
              // MD failed, try thumb anyway
              compressImage(file, 400, 0.82, function(thumbB64) {
                ghUploadSilent(thumbPath, thumbB64).then(function() {
                  onProgress(100, '完成(无中图)');
                  onDone(null, fullPath);
                }).catch(function() {
                  onProgress(100, '完成(仅主图)');
                  onDone(null, fullPath);
                });
              });
            });
          });
        })
        .catch(function(err) {
          onDone(err.message || '上传失败', null);
        });
    });
  }

  // Create a gallery data item from uploaded file
  function _makeGalleryItem(path, fileName) {
    return {
      img: path,
      titleEn: _autoTitle(path),
      title: _autoTitle(path),
      cat: 'scenic'
    };
  }

  // Auto-generate a nice title from filename
  function _autoTitle(path) {
    if (!path) return 'Untitled';
    var name = path.split('/').pop() || '';
    name = name.replace(/\.[^.]+$/, ''); // remove extension
    name = name.replace(/[_-]+/g, ' ');  // replace dashes/underscores with spaces
    name = name.replace(/\d+$/, '');      // remove trailing numbers
    name = name.trim();
    if (!name) return 'Untitled';
    // Capitalize each word
    return name.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }

  // Delete all 3 sizes of an image file (best effort)
  function _deleteGalleryImageFiles(imgPath) {
    if (!imgPath) return;
    var mdPath = imgPath.replace('assets/images/', 'assets/images/md/');
    var thumbPath = imgPath.replace('assets/images/', 'assets/images/thumb/');
    deleteFileFromGitHub(imgPath, 'Delete gallery image: ' + imgPath).catch(function() {});
    deleteFileFromGitHub(mdPath, 'Delete gallery md: ' + mdPath).catch(function() {});
    deleteFileFromGitHub(thumbPath, 'Delete gallery thumb: ' + thumbPath).catch(function() {});
  }

  // Progress bar helpers (per-card)
  function _setCardProgress(idx, pct, label) {
    var bar = document.getElementById('galProgBar_' + idx);
    var wrap = document.getElementById('galProg_' + idx);
    var text = document.getElementById('galProgText_' + idx);
    if (bar) bar.style.width = pct + '%';
    if (wrap) wrap.style.display = 'block';
    if (text) text.textContent = label || (Math.round(pct) + '%');
  }

  function _hideCardProgress(idx) {
    var wrap = document.getElementById('galProg_' + idx);
    if (wrap) wrap.style.display = 'none';
  }

  // Expose sync status updater globally
  window.updateGallerySyncStatus = function(status) {
    _updateGallerySyncStatus(status);
  };

  // Sync status
  function _updateGallerySyncStatus(status) {
    var el = document.getElementById('gallerySyncStatus');
    if (!el) return;
    var dot = el.querySelector('.sync-dot');
    var text = el.querySelector('.sync-text');
    if (!dot || !text) return;

    if (status === 'success') {
      dot.style.background = '#43a047';
      text.textContent = '已同步';
    } else if (status === 'saving') {
      dot.style.background = '#ff9800';
      text.textContent = '同步中...';
    } else if (status === 'error') {
      dot.style.background = '#e53935';
      text.textContent = '同步失败';
    } else {
      dot.style.background = '#aaa';
      text.textContent = '未同步';
    }
  }

})();