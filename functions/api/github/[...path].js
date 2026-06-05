/**
 * Cloudflare Pages Function — 代理 GitHub API 请求
 * 路由：/api/github/[...path]
 * Token 存储在 Cloudflare Pages 环境变量 GH_TOKEN 中
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 从环境变量读取 Token（在 Cloudflare Pages 设置中配置）
  const token = env.GH_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ message: 'GH_TOKEN 未配置，请在 Cloudflare Pages 设置中配置环境变量 GH_TOKEN' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 解析路径：/api/github/repos/xxx/contents/xxx
  const prefix = '/api/github/';
  const path = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length)
    : url.pathname;

  // 转发 query string
  const query = url.search;
  const ghUrl = 'https://api.github.com/' + path + query;

  // 读取请求体（PUT/POST 有 body）
  let body = null;
  if (request.method === 'PUT' || request.method === 'POST' || request.method === 'PATCH') {
    body = await request.text();
  }

  const ghResp = await fetch(ghUrl, {
    method: request.method,
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'visitzhangjiajie-cms',
    },
    body: body,
  });

  // 将 GitHub 的响应原样返回
  const respBody = await ghResp.arrayBuffer();
  return new Response(respBody, {
    status: ghResp.status,
    headers: {
      'Content-Type': ghResp.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
