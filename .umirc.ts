export default {
  base: '/',
  publicPath: '/',
  exportStatic: {}, // 将所有路由输出为 HTML 目录结构，以免刷新页面时 404
  // 其他配置
  dynamicImport: {},
  scripts: [
    ';window._Z_GA_ID="G-7FHN9TL66S"',
    '!function(e){function a(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],a("js",new Date),a("config",e);var t=document.createElement("script");t.async=!0,t.src="https://www.googletagmanager.com/gtag/js?id="+e;var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n)}(window._Z_GA_ID);',
  ],
};
