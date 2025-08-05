interface HotSearchItem {
  id: string
  title: string
  url: string
  mobileUrl: string
}

export default defineSource(async () => {
  const url = "https://s.weibo.com/top/summary?cate=realtimehot"
  // 设置请求头，包含必要的Cookie
  const res = await myFetch(url, {
    headers: {
      Cookie: "SUB=114514;",
    },
  })

  // 修复：根据myFetch实际返回类型调整获取文本的方式
  const html = typeof res === "string"
    ? res // 如果直接返回字符串
    : res.data || res.body || "" // 如果返回对象，尝试data或body属性

  const results: HotSearchItem[] = []

  // 匹配所有的热搜行
  const rowRegex = /<tr class="">([\s\S]*?)<\/tr>/g
  let rowMatch

  // 修复：将赋值操作移出while条件判断，避免ESLint错误
  rowMatch = rowRegex.exec(html)
  while (rowMatch !== null) {
    const rowHtml = rowMatch[1]

    // 提取标题和链接
    const linkRegex = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/
    const linkMatch = rowHtml.match(linkRegex)

    if (!linkMatch) {
      // 继续下一次匹配
      rowMatch = rowRegex.exec(html)
      continue
    }

    const path = linkMatch[1]
    const title = linkMatch[2].trim()
    const fullUrl = path.startsWith("http") ? path : `https://s.weibo.com${path}`

    // 构建结果项
    const item: HotSearchItem = {
      id: title,
      title,
      url: fullUrl,
      mobileUrl: fullUrl.replace("s.weibo.com", "m.weibo.cn"),
    }

    results.push(item)

    // 获取下一个匹配项
    rowMatch = rowRegex.exec(html)
  }

  return results
})
