import process from "node:process"
import type { NewsItem } from "@shared/types"

export default defineSource(async () => {
  const apiToken = process.env.PRODUCTHUNT_API_TOKEN
  const token = `Bearer ${apiToken}`
  if (!apiToken) {
    throw new Error("PRODUCTHUNT_API_TOKEN is not set")
  }
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  const query = `
    query {
      posts(first: 30, order: VOTES, where: {featured: true, launchedAt: {gte: "${weekAgoStr}"}}) {
        edges {
          node {
            id
            name
            tagline
            votesCount
            url
            slug
            screenshots(first: 1) {
              edges {
                node {
                  normal {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  `
  const response: any = await myFetch("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ query }),
  })
  const news: NewsItem[] = []
  const posts = response?.data?.posts?.edges || []
  for (const edge of posts) {
    const post = edge.node
    if (post.id && post.name) {
      const thumbnailUrl = post.screenshots?.edges?.[0]?.node?.normal?.url
      news.push({
        id: post.slug,
        title: post.name,
        url: post.url || `https://www.producthunt.com/posts/${post.slug}`,
        extra: {
          info: ` △︎ ${post.votesCount || 0}`,
          hover: post.tagline,
          icon: thumbnailUrl ? proxyPicture(thumbnailUrl) : undefined,
        },
      })
    }
  }
  return news
})
