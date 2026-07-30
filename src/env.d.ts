/// <reference types='@dcloudio/types' />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 微信小程序全局对象声明
declare const wx: any
declare const getCurrentPages: any
declare const getApp: any
declare const Page: any
declare const Component: any
declare const App: any
declare const Behavior: any
