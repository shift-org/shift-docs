import siteConfig from './siteConfig.js'

export function buildPage() {
  function disabled() {
    return {
      enabled: false
    }
  }
  return {
    page: {
      title: `Favorites - ${siteConfig.title}`,
      banner: siteConfig.defaultListBanner,
    },
    shortcuts: {
      prev: disabled,
      next: disabled,
      addevent: "/addevent/",
      info: "/pages/mission_statement/",
      donate: "/pages/donate",
    } 
  }; 
}
