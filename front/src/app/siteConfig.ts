export const siteConfig = {
  name: "B2B Starter",
  url: "http://localhost:3000",
  description: "B2B starter with auth and user management.",
  baseLinks: {
    admin: {
      root: "/admin",
      users: "/admin/users",
    },
  },
}

export type siteConfig = typeof siteConfig
