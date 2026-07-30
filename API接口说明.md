# 小程序端 API 接口说明

> 基于 uni-app 跨端工程，后端为 FastAPI（默认 `http://localhost:8080`）。
> 所有接口前缀：`/api/v1/miniapp`，统一响应格式 `{ code, message, data }`。
> 鉴权方式：HTTP 请求头 `Authorization: Bearer <miniapp_token>`；WebSocket 通过 query 参数 `?token=<miniapp_token>` 传递。

---

## 一、认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 手机号+验证码登录（H5 端） |
| POST | `/auth/send-code` | 发送短信验证码 |
| GET | `/auth/profile` | 获取当前登录用户信息 |
| POST | `/auth/wx-login` | 微信小程序登录（wx.login code 换 session） |
| POST | `/auth/bind-phone` | 微信小程序绑定手机号（授权回调） |

### 1.1 手机号验证码登录
```
POST /api/v1/miniapp/auth/login
Body: { "phone": "13800000001", "code": "1234", "referrer_id?": 3, "enterprise_id?": 1 }
返回: { "code": 0, "data": { "access_token": "xxx", "token_type": "bearer", "user": {...} } }
```

### 1.2 发送短信验证码
```
POST /api/v1/miniapp/auth/send-code
Body: { "phone": "13800000001" }
返回: { "code": 0, "message": "验证码已发送" }
```

### 1.3 微信小程序登录
```
POST /api/v1/miniapp/auth/wx-login
Body: { "code": "wx_login_code", "enterprise_id?": 1, "referrer_id?": 3 }
返回: { "code": 0, "data": { "access_token": "xxx", "user": {...} } }
```

### 1.4 微信小程序绑定手机号
```
POST /api/v1/miniapp/auth/bind-phone
Body: { "code?": "xxx", "encrypted_data?": "xxx", "iv?": "xxx" }
返回: { "code": 0, "data": { "phone": "138xxxx0001" } }
```

---

## 二、智能体模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agents` | 获取智能体列表（支持筛选参数） |
| GET | `/agents/categories` | 获取智能体分类列表 |
| GET | `/agents/{id}` | 获取智能体详情 |
| GET | `/agents/{id}/greeting` | 获取智能体欢迎语 |
| POST | `/agents/{id}/favorite` | 收藏智能体 |
| DELETE | `/agents/{id}/favorite` | 取消收藏 |
| POST | `/agents/{id}/chat` | 同步对话（一次性返回完整回复） |
| **WS** | `/agents/{id}/chat/ws` | **流式对话（WebSocket，逐字推送）** |

### 2.1 流式对话（WebSocket）
```
连接: ws(s)://host/api/v1/miniapp/agents/{id}/chat/ws?token=<miniapp_token>
发送: { "message": "你好" }
推送: { "content": "你" }          ← 逐字/逐段推送
      { "content": "好" }
      { "done": true }             ← 完成
      { "error": "错误信息" }       ← 异常
```

---

## 三、套餐与订单模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/packages` | 获取套餐列表 |
| POST | `/orders` | 创建套餐订单 |
| POST | `/orders/{id}/simulate-pay` | 模拟支付（H5 开发用） |
| GET | `/orders` | 获取我的套餐订单列表 |

---

## 四、商城模块（实物商品）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/mall/products` | 商品列表（支持筛选参数） |
| GET | `/mall/products/{id}` | 商品详情 |
| POST | `/mall/orders` | 创建商品订单 |
| POST | `/mall/orders/{id}/simulate-pay` | 模拟支付 |
| GET | `/mall/orders` | 我的商品订单列表（支持 status 筛选） |
| GET | `/mall/orders/{id}` | 商品订单详情 |
| POST | `/mall/orders/{id}/confirm-receive` | 确认收货 |
| GET | `/mall/orders/{id}/logistics-track` | 物流轨迹 |
| GET | `/mall/logistics-companies` | 物流公司列表 |

### 4.1 创建商品订单
```
POST /api/v1/miniapp/mall/orders
Body: {
  "product_id": 1,
  "sku_id": 2,
  "qty": 1,
  "receiver_name": "张三",
  "receiver_phone": "13800000001",
  "receiver_address": "北京市朝阳区xxx",
  "use_balance": false
}
```

---

## 五、信息（资讯）模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/info/categories` | 资讯分类列表 |
| GET | `/info` | 资讯列表（支持分类筛选） |
| GET | `/info/{id}` | 资讯详情 |

---

## 六、代理工作台模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agent-workbench` | 代理工作台概览数据 |
| GET | `/agent-revenue` | 代理收益详情 |
| PUT | `/agent-revenue/ratio` | 设置团队长-成员分润比例 |
| GET | `/agent-referrals` | 我的推荐成员列表（支持分页） |
| GET | `/member-detail/{memberUserId}` | 成员详情 |

---

## 七、用户功能模块

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/user/profile` | 用户个人资料 |
| GET | `/user/cards` | 用户卡密列表（旧） |
| POST | `/user/activate` | 激活卡密（旧） |
| GET | `/user/balance` | 资金余额记录 |
| GET | `/user/compute` | 算力积分记录（支持分页） |
| GET | `/user/payments` | 支付记录 |
| GET | `/user/contacts` | 联系方式/客服 |
| GET | `/user/withdraw-records` | 提现记录 |
| POST | `/user/withdraw` | 发起提现 |
| POST | `/user/transfer-authorization` | 微信免确认收款授权（首次提现前调用） |
| GET | `/user/addresses` | 收货地址列表 |
| GET | `/user/addresses/default` | 默认收货地址 |
| POST | `/user/addresses` | 新增收货地址 |
| PUT | `/user/addresses/{id}` | 修改收货地址 |
| DELETE | `/user/addresses/{id}` | 删除收货地址 |
| POST | `/user/addresses/{id}/default` | 设置默认地址 |

---

## 八、卡密模块（cardkey）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/cardkey/my-cards` | 我的卡密列表（支持 status 筛选） |
| POST | `/cardkey/recognize` | 识别卡密（激活前预览权益信息） |
| POST | `/cardkey/activate` | 确认激活卡密（权益发放） |

---

## 九、配置下发

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/config` | 小程序端全局配置（教程开关、默认推荐人等） |

---

## 十、激励视频

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/reward-video/report` | 上报激励视频观看（scene_code 场景码） |
| GET | `/reward-video/status` | 获取激励视频状态 |

---

## 十一、推广员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/promoter/toggle` | 切换推广员身份（member_user_id + is_promoter） |

---

## 十二、权益级别管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/identity/set` | 设置权益身份（member_user_id + benefit_level） |

---

## 十三、分享参数

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/share-params` | 获取分享所需参数（推荐人ID、企业ID等） |

---

## 十四、提取链接 / 文案提取

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/extract/link` | 提取链接内容 |
| POST | `/extract/text` | 文案提取 |

---

## 十五、视频号带货机构（MCN）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/mcn/status` | MCN 授权状态 |
| GET | `/mcn/tutorials` | MCN 开通教程列表 |
| POST | `/mcn/bind` | 绑定 MCN |
| GET | `/mcn/authorization` | MCN 授权详情 |

---

## 十六、教程文章

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tutorial-article/{id}` | 教程文章详情 |

---

## 附录：统一响应格式与错误码

### 响应体结构
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 常见错误码
| code / HTTP 状态码 | 说明 |
|---------------------|------|
| 0 / 200 | 成功 |
| 401 | 登录已过期，需重新登录 |
| 403 | 无权限访问 |
| 422 | 参数校验失败 |
| 500 | 服务器内部错误 |

### Token 管理机制
- 存储 key：`miniapp_token`
- 请求自动注入：拦截器检测 URL 包含 `/miniapp` 时自动添加 `Authorization: Bearer <token>`
- 401 自动处理：清除 token 并跳转首页重新登录
