# 张家界国家森林公园官方网站 - 项目文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 张家界国家森林公园官方网站 |
| 文档版本 | v2.0 |
| 更新日期 | 2026-05-11 |
| GitHub | https://github.com/WillyYe/zhangjiajie-park-website |
| 在线预览 | https://willyye.github.io/zhangjiajie-park-website/ |

---

## 一、项目概述

### 1.1 项目简介

本项目是为张家界国家森林公园开发的中英文双语官方网站，参考慕田峪长城官网设计风格，采用现代化前端技术实现。

### 1.2 技术栈

| 技术 | 说明 |
|------|------|
| HTML | HTML5 语义化标签 |
| CSS | CSS3 (Grid、Flexbox、Variables、Animations) |
| JavaScript | ES6+ 原生实现（无框架依赖） |
| 字体 | Google Fonts (Inter、Noto Sans SC、Noto Serif SC) |
| 托管 | GitHub Pages |

### 1.3 项目规模

- **代码规模**: 约 1700 行（含 CSS/HTML/JS）
- **图片资源**: 22 张优化图片
- **文件数量**: 6 个 HTML + 22 张图片 + 文档
- **多语言**: 中英文双语支持

### 1.4 项目结构

```
zhangjiajie-park-website/
├── index.html              # 主页面
├── exp-detail.html         # 体验活动详情页
├── assets/
│   ├── images/            # 图片资源（已优化压缩）
│   └── videos/            # 视频资源
├── docs/
│   └── README.md          # 项目文档（本文件）
├── .gitignore             # Git忽略配置
└── backup/               # 原始图片备份
```

---

## 二、需求说明

### 2.1 产品定位

面向全球游客的综合性旅游信息服务网站，提供景区介绍、新闻资讯、交通指南、图片展示等功能，支持中英文双语切换。

### 2.2 目标用户

| 用户类型 | 使用场景 |
|---------|---------|
| 国内游客 | 查看景区信息、规划行程 |
| 国际游客 | 获取英文景区介绍、实用信息 |
| 旅游从业者 | 获取官方信息、图片素材 |

### 2.3 功能需求

#### 核心功能 (P0)

| 模块 | 功能 | 状态 |
|------|------|------|
| 多语言 | 中英文一键切换，默认英文 | ✅ 已完成 |
| 轮播 | 自动轮播 + 手动切换 | ✅ 已完成 |
| 核心景观 | 袁家界/金鞭溪/天子山卡片展示 | ✅ 已完成 |
| 页脚 | 品牌信息、快速链接、版权 | ✅ 已完成 |

#### 重要功能 (P1)

| 模块 | 功能 | 状态 |
|------|------|------|
| 新闻资讯 | 3列网格新闻卡片 | ✅ 已完成 |
| 体验活动 | 4列网格体验卡片 + 详情页 | ✅ 已完成 |
| 精选图库 | 瀑布流 + 筛选 + 灯箱 | ✅ 已完成 |
| 交通指南 | 交通方式卡片展示 | ✅ 已完成 |
| 导航 | 固定导航 + 滚动效果 | ✅ 已完成 |

#### 待实现功能 (P2/P3)

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 地图功能 | P1 | 当前为占位符，待集成高德/百度地图 |
| 视频功能 | P2 | 当前为提示弹窗 |
| 移动菜单 | P1 | 汉堡菜单展开/收起 |
| CMS | P3 | 内容管理系统 |

### 2.4 非功能需求

#### 性能指标

| 指标 | 目标值 |
|------|--------|
| FCP (首次内容绘制) | < 1.5 秒 |
| LCP (最大内容绘制) | < 2.5 秒 |
| 页面总大小 | < 1MB（优化后） |

#### 浏览器兼容性

| 浏览器 | 最低版本 | 支持程度 |
|--------|---------|---------|
| Chrome | 58+ | ✅ 完全支持 |
| Firefox | 54+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| IE | - | ❌ 不支持 |

#### 响应式断点

| 设备 | 屏幕宽度 | 布局 |
|------|---------|------|
| 桌面端 | > 1024px | 3-4列网格 |
| 平板端 | 768px - 1024px | 2列网格 |
| 手机端 | < 768px | 单列布局 |

---

## 三、代码说明

### 3.1 CSS 架构

#### 变量系统

```css
:root {
  --green-dark: #0d2b1e;      /* 深绿色 - 主色调 */
  --green-mid: #1a4a30;       /* 中绿色 */
  --green-light: #2d6a4f;     /* 浅绿色 */
  --green-accent: #52b788;    /* 强调色 */
  --gold: #b5882a;            /* 金色 - 点缀 */
  --cream: #f7f3ee;           /* 奶油色 - 背景 */
  --text-dark: #1a1a1a;
  --text-mid: #4a4a4a;
  --border: #e0dbd4;
  --nav-height: 64px;
}
```

#### 样式模块

| 模块 | 说明 | 行数约 |
|------|------|--------|
| RESET & BASE | 样式重置与基础 | 15 |
| HEADER | 顶部导航栏 | 100 |
| HERO | 首屏轮播区 | 145 |
| INFO BAR | 信息条 | 40 |
| NEWS | 新闻资讯 | 70 |
| SCENIC | 核心景观 | 75 |
| EXPERIENCE | 体验活动 | 45 |
| GALLERY | 图片画廊 | 65 |
| TRANSPORT | 交通指南 | 75 |
| FOOTER | 页脚 | 90 |
| LIGHTBOX | 图片灯箱 | 60 |
| RESPONSIVE | 响应式 | 20 |

### 3.2 JavaScript 功能

#### 应用状态管理

```javascript
var AppState = {
  currentLang: 'en',        // 当前语言 ('en' | 'zh')
  heroSlider: null,         // 轮播定时器
  currentSlide: 0,          // 当前幻灯片
  scenicPage: 1             // 景观分页
};
```

#### 国际化 (i18n)

```javascript
// HTML 属性方式
<a data-i18n="nav_news">Park News</a>

// JS 切换
function switchLang(lang) {
  AppState.currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    el.textContent = i18n[lang][key];
  });
}
```

#### 数据驱动渲染

| 函数 | 功能 | 数据源 |
|------|------|--------|
| `renderNews()` | 新闻卡片 | `newsData[]` |
| `renderExperience()` | 体验活动 | `expData[]` |
| `renderGallery()` | 图片画廊 | `galleryData[]` |
| `renderScenic()` | 景观卡片 | `scenicData[]` |

#### 核心函数

| 函数 | 功能 |
|------|------|
| `switchLang(lang)` | 切换中英文 |
| `startHeroSlider()` | 启动轮播 |
| `openLightbox(index)` | 打开灯箱 |
| `filterGallery(cat)` | 筛选图库 |
| `initFadeAnimation()` | 滚动动画 |

### 3.3 性能优化

#### 已实施的优化

1. **图片压缩**: 所有 JPG 压缩到 75% 质量，减少 60-70%
2. **资源预加载**: Hero 图片 `<link rel="preload">`
3. **懒加载**: 非首屏图片 `loading="lazy"`
4. **字体优化**: `preconnect` 预连接 Google Fonts
5. **动画优化**: `IntersectionObserver` + GPU 加速

---

## 四、测试说明

### 4.1 功能测试用例

#### 语言切换 (5用例)

| ID | 测试场景 | 验收标准 |
|----|---------|---------|
| TC-001 | 点击"中文"按钮 | 页面所有文本切换为中文 |
| TC-002 | 点击"EN"按钮 | 页面所有文本切换为英文 |
| TC-003 | 重复切换5次 | 每次切换正确，无错乱 |
| TC-004 | 默认英文模式 | 首次加载默认英文 |

#### 轮播功能 (5用例)

| ID | 测试场景 | 验收标准 |
|----|---------|---------|
| TC-006 | 等待5秒 | 幻灯片自动切换 |
| TC-007 | 循环播放 | 第3张后回到第1张 |
| TC-008 | 点击圆点 | 立即切换，重置计时 |

#### 图库灯箱 (12用例)

| ID | 测试场景 | 验收标准 |
|----|---------|---------|
| TC-025 | 点击"风景"筛选 | 只显示风景类图片 |
| TC-029 | 点击图片 | 灯箱全屏显示 |
| TC-033 | 按ESC键 | 灯箱关闭 |

### 4.2 兼容性测试

| 浏览器 | 操作系统 | 测试内容 |
|--------|---------|---------|
| Chrome 120+ | Windows/Mac | 全部功能 |
| Firefox 115+ | Windows/Mac | 全部功能 |
| Safari 16+ | macOS/iOS | 全部功能 |
| Edge 120+ | Windows | 全部功能 |

### 4.3 测试工具

| 工具 | 用途 |
|------|------|
| Chrome DevTools | 调试、性能分析 |
| Google Lighthouse | 性能/无障碍评分 |
| WebPageTest | 加载性能分析 |

---

## 五、维护指南

### 5.1 添加新闻

编辑 `index.html` 中的 `newsData` 数组：

```javascript
var newsData = [
  {
    date: { day: '15', month: 'MAY' },
    tag: 'announce',
    title: '新标题',
    titleEn: 'New Title',
    desc: '中文描述',
    descEn: 'English description',
    img: 'assets/images/news-new.jpg'
  }
];
```

### 5.2 添加图片到画廊

```javascript
var galleryData = [
  {
    img: 'assets/images/gal-new.jpg',
    title: '图片标题',
    titleEn: 'Image Title',
    cat: 'scenic'  // scenic | culture | season
  }
];
```

### 5.3 添加翻译

```javascript
var i18n = {
  en: { new_key: 'English Text' },
  zh: { new_key: '中文文本' }
};
```

然后在 HTML 中添加 `data-i18n="new_key"` 属性。

### 5.4 修改颜色主题

编辑 CSS `:root` 中的变量值，全局样式自动更新。

---

## 六、Git 提交历史

| 提交 | 说明 |
|------|------|
| `b857806` | perf: 优化网页加载速度 |
| `424577f` | fix: 修复JavaScript语法错误 |
| `5fc0bde` | feat: Experiences详情页面 |
| `dc30d18` | fix: 核心景观分页 |
| `ba8132e` | feat: 默认英文模式 |
| `ec753d7` | docs: 测试文档 |
| `a7a35d0` | refactor: 重构网站代码 |

---

## 七、设计规范

### 色彩规范

| 名称 | 色值 | 用途 |
|------|------|------|
| 深绿 | `#0d2b1e` | 导航、页脚 |
| 中绿 | `#1a4a30` | 信息条 |
| 金色 | `#b5882a` | 按钮 |
| 奶油色 | `#f7f3ee` | 区块背景 |

### 字体规范

| 用途 | 字体 | 大小 |
|------|------|------|
| 中文标题 | Noto Serif SC | 24-56px |
| 英文标题 | Inter | 12-16px |
| 正文 | Inter/Noto Sans SC | 13-15px |

---

## 八、参考资料

- 慕田峪长城官网: https://en.mutianyugreatwall.com/
- 张家界官方网站: http://www.hnzjj.com/
- Google Fonts: https://fonts.google.com/

---

**文档状态**: 正式版  
**最后更新**: 2026-05-11
