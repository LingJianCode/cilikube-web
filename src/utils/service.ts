import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import { useUserStoreHook } from "@/store/modules/user"
import { ElMessage } from "element-plus"
import { get, merge } from "lodash-es"
import { getToken } from "./cache/cookies"

/** 退出登录并强制刷新页面（会重定向到登录页） */
function logout() {
  useUserStoreHook().logout()
  location.reload()
}

// ==================================================================================
// ======== 第一套：用于 Mock/旧版 API (期望返回带 code 的数据) 的请求实例 =========
// ==================================================================================

/** 创建用于 Mock API 的请求实例 */
function createMockService() {
  const service = axios.create()
  // 请求拦截
  service.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  )
  // 响应拦截（处理带 code 的返回数据）
  service.interceptors.response.use(
    (response) => {
      const apiData = response.data
      const responseType = response.request?.responseType
      if (responseType === "blob" || responseType === "arraybuffer") return apiData
      
      const code = apiData.code
      if (code === undefined) {
        ElMessage.error("非本系统的接口（缺少code字段）")
        return Promise.reject(new Error("非本系统的接口"))
      }
      switch (code) {
        case 0:
          return apiData
        case 401:
          return logout()
        default:
          ElMessage.error(apiData.message || "Error")
          return Promise.reject(new Error(apiData.message || "Error"))
      }
    },
    (error) => {
      const status = get(error, "response.status")
      switch (status) {
        case 400:
          error.message = "请求错误"
          break
        case 401:
          logout()
          break
        case 403:
          error.message = "拒绝访问"
          break
        case 404:
          error.message = "请求地址出错"
          break
        case 408:
          error.message = "请求超时"
          break
        case 500:
          error.message = "服务器内部错误"
          break
        case 501:
          error.message = "服务未实现"
          break
        case 502:
          error.message = "网关错误"
          break
        case 503:
          error.message = "服务不可用"
          break
        case 504:
          error.message = "网关超时"
          break
        case 505:
          error.message = "HTTP 版本不受支持"
          break
        default:
          break
      }
      ElMessage.error(error.message)
      return Promise.reject(error)
    }
  )
  return service
}

/** 创建用于 Mock API 的请求方法 */
function createMockRequest(service: AxiosInstance) {
  return function <T>(config: AxiosRequestConfig): Promise<T> {
    const token = getToken()
    const defaultConfig = {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json"
      },
      timeout: 5000,
      baseURL: import.meta.env.VITE_BASE_API, // 使用 VITE_BASE_API
      data: {}
    }
    const mergeConfig = merge(defaultConfig, config)
    return service(mergeConfig)
  }
}

/** 用于 Mock/旧版 API 的实例和方法 (导出给登录等旧功能使用) */
const mockService = createMockService()
export const request = createMockRequest(mockService)


// ======================================================================================
// ======== 第二套：用于 Go 后端新 API (直接返回 {data: ...}) 的专用请求实例 =========
// ======================================================================================

/** 创建用于 Go 后端 API 的请求实例 */
function createGoApiService() {
  const service = axios.create()
  // 请求拦截
  service.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  )
  // 响应拦截（直接返回数据，不检查 code）
  service.interceptors.response.use(
    (response) => {
      // 对于Go后端接口，我们约定它直接返回数据 { data: [...] }
      // 或者在HTTP层面报错（由下面的错误拦截器处理）。
      return response.data
    },
    (error) => {
      // 错误处理逻辑
      const status = get(error, "response.status")
      const errData = get(error, "response.data", {})
      let message = error.message

      // 尝试从后端返回的JSON中获取更具体的错误信息
      if(errData.error) {
        message = errData.error
      } else if (errData.message) {
        message = errData.message
      }
      
      switch (status) {
        case 400:
          message = message || "请求错误"
          break
        case 401:
          logout()
          break
        case 403:
          message = message || "拒绝访问"
          break
        case 404:
          message = message || "请求地址出错"
          break
        case 500:
          message = message || "服务器内部错误"
          break
        default:
          break
      }
      ElMessage.error(message)
      return Promise.reject(error)
    }
  )
  return service
}

/** 创建用于 Go 后端 API 的请求方法 */
function createGoApiRequest(service: AxiosInstance) {
  return function <T>(config: AxiosRequestConfig): Promise<T> {
    const token = getToken()
    const defaultConfig = {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json"
      },
      timeout: 10000, // 为真实后端设置更长的超时时间
      baseURL: import.meta.env.VITE_GO_API_BASE_URL, // 使用新的环境变量
      data: {}
    }
    const mergeConfig = merge(defaultConfig, config)
    return service(mergeConfig)
  }
}

/** 用于 Go 后端 API 的实例和方法 (导出给集群管理等新功能使用) */
const goApiService = createGoApiService()
export const requestGo = createGoApiRequest(goApiService)