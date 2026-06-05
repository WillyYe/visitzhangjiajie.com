#!/bin/bash
# Test script for Zhangjiajie Park Website

echo "=========================================="
echo "张家界国家森林公园网站 - 自动化测试"
echo "=========================================="
echo ""

BASE_DIR="/Users/Zhuanz/WorkBuddy/2026-05-11-task-3/zhangjiajie-park-website"
cd "$BASE_DIR"

PASS=0
FAIL=0

# Test 1: Check all HTML files exist
echo "测试 1: 检查 HTML 文件..."
for file in index.html yuanjiajie.html jinbianxi.html tianzishan.html; do
  if [ -f "$file" ]; then
    echo "  ✓ $file 存在"
    PASS=$((PASS+1))
  else
    echo "  ✗ $file 缺失"
    FAIL=$((FAIL+1))
  fi
done

# Test 2: Check image assets
echo ""
echo "测试 2: 检查图片资源..."
REQUIRED_IMAGES=(
  "assets/images/hero-pillars.jpg"
  "assets/images/hero-clouds.jpg"
  "assets/images/hero-stream.jpg"
  "assets/images/yuanjiajie.jpg"
  "assets/images/jinbianxi.jpg"
  "assets/images/tianzishan.jpg"
  "assets/images/exp-hiking.jpg"
  "assets/images/exp-photo.jpg"
  "assets/images/exp-eco.jpg"
  "assets/images/exp-stargaze.jpg"
  "assets/images/gal-yuanjiajie.jpg"
  "assets/images/gal-clouds.jpg"
  "assets/images/gal-autumn.jpg"
  "assets/images/gal-culture.jpg"
  "assets/images/gal-sunrise.jpg"
  "assets/images/gal-winter.jpg"
  "assets/images/gal-stream.jpg"
  "assets/images/gal-village.jpg"
  "assets/images/gal-spring.jpg"
  "assets/images/news-park.jpg"
  "assets/images/news-festival.jpg"
  "assets/images/news-cableway.jpg"
)

for img in "${REQUIRED_IMAGES[@]}"; do
  if [ -f "$img" ]; then
    size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    if [ "$size" -gt 5000 ]; then
      echo "  ✓ $img (${size} bytes)"
      PASS=$((PASS+1))
    else
      echo "  ✗ $img 文件太小 ($size bytes)"
      FAIL=$((FAIL+1))
    fi
  else
    echo "  ✗ $img 缺失"
    FAIL=$((FAIL+1))
  fi
done

# Test 3: Check CSS image references in index.html
echo ""
echo "测试 3: 检查 index.html 中的图片引用..."
INDEX_REF_COUNT=$(grep -c "url('assets/images" index.html)
if [ "$INDEX_REF_COUNT" -ge 10 ]; then
  echo "  ✓ index.html 包含 $INDEX_REF_COUNT 个图片引用"
  PASS=$((PASS+1))
else
  echo "  ✗ index.html 图片引用不足 ($INDEX_REF_COUNT < 10)"
  FAIL=$((FAIL+1))
fi

# Test 4: Check detail page CSS
echo ""
echo "测试 4: 检查详情页面背景图片..."
for page in yuanjiajie jinbianxi tianzishan; do
  if grep -q "background:url('.*\.jpg')" "${page}.html"; then
    echo "  ✓ ${page}.html 有背景图片"
    PASS=$((PASS+1))
  else
    echo "  ✗ ${page}.html 缺少背景图片"
    FAIL=$((FAIL+1))
  fi
done

# Test 5: Check HTML validity (basic)
echo ""
echo "测试 5: 检查 HTML 基本结构..."
for file in *.html; do
  if grep -q "<!DOCTYPE html>" "$file" && grep -q "</html>" "$file"; then
    echo "  ✓ $file 基本结构正确"
    PASS=$((PASS+1))
  else
    echo "  ✗ $file 结构有问题"
    FAIL=$((FAIL+1))
  fi
done

# Test 6: Check video placeholder
echo ""
echo "测试 6: 检查视频模态框..."
if grep -q "video-modal" index.html; then
  echo "  ✓ 视频模态框已配置"
  PASS=$((PASS+1))
else
  echo "  ✗ 视频模态框缺失"
  FAIL=$((FAIL+1))
fi

# Test 7: Check video README
echo ""
echo "测试 7: 检查视频说明文档..."
if [ -f "assets/videos/README.md" ]; then
  echo "  ✓ 视频说明文档已创建"
  PASS=$((PASS+1))
else
  echo "  ✗ 视频说明文档缺失"
  FAIL=$((FAIL+1))
fi

# Summary
echo ""
echo "=========================================="
echo "测试结果汇总"
echo "=========================================="
echo "通过: $PASS"
echo "失败: $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "✓ 所有测试通过！网站已正确配置图片和视频资源。"
  exit 0
else
  echo "✗ 存在 $FAIL 个测试失败，请检查。"
  exit 1
fi
