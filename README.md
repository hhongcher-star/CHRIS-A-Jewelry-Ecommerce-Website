# CHRISÉA Jewelry E-Commerce

CHRISÉA Jewelry 是一个面向马来西亚市场的全功能饰品电商网站。网站以 Burgundy（酒红色）与 Ivory（米白色）为主要配色，整体设计方向为现代、优雅、复古与高端。

## 项目状态

当前状态：需求已收集，品牌 Logo 与首批商品资料已收到；其余商家、库存、配送及付款资料仍待确认。

## 品牌 Logo

正式主 Logo：`assets/brand/chrisea-logo-primary.png`

- 品牌名称：CHRISÉA Jewelry
- Logo 标示创立年份：2026
- 主视觉：Burgundy 酒红色背景、Ivory / Gold 米白金色图案
- 使用要求：保持原始比例，不拉伸、不改变文字拼写及重音符号 `É`

## 项目文档

- `PROJECT_PLAN.md` — 开发阶段、上线条件与完成标准
- `API_DOCUMENTATION.md` — REST API 路由及订单状态规则
- `SECURITY.md` — 登录、付款凭证、上传与数据安全要求
- `database/schema.sql` — 初始 MySQL / MariaDB 数据库结构
- `database/seed-products.sql` — 首批商品与图片资料
- `PRODUCTS.md` — 商品目录、双语文案与图片分组
- `BRAND_ASSETS.md` — Logo 文件位置与品牌使用说明
- `.env.example` — 环境变量模板（不包含真实秘密）

## 技术架构

```text
React Frontend
      ↓ REST API
Node.js + Express Backend
      ↓
SQL Database
```

- Frontend：React，响应式支持 Desktop、Tablet 与 Mobile
- Backend：Node.js + Express REST API
- Database：SQL（可使用 MySQL / MariaDB）
- Deployment：Hostinger
- Communication：WhatsApp Business

## 网站页面

主要页面：

1. Home — 首页
2. Shop — 商品商城
3. About Us — 关于我们
4. Contact Us — 联系我们
5. FAQ — 常见问题
6. Promotion — 优惠活动
7. Customer Reviews — 顾客评价
8. Blog — 最新资讯
9. Shipping & Delivery — 配送说明
10. Return & Refund — 退换货说明
11. Terms & Conditions — 条款与细则

电商流程还包括商品详情、购物车、结账、会员账户、订单详情与订单追踪页面。

## 商品分类

- Necklaces — 项链
- Bracelets — 手链
- Rings — 戒指
- Earrings — 耳环

## 核心功能

### 顾客功能

- 注册与登录
- 商品搜索及价格、分类筛选
- 购物车与结账
- 收藏商品
- 商品评价
- 优惠码
- 订单记录与状态追踪
- 上传付款凭证
- WhatsApp 联系商家

### 后台功能

- 商品及分类管理
- 商品规格与库存管理
- 订单管理
- 付款凭证审核
- 优惠活动及折扣管理
- 顾客评价管理

## 付款流程

由于商家暂时没有 SSM 注册资料，本项目现阶段不接入 FPX、银行卡或电子钱包 Payment Gateway，而采用人工付款审核：

1. 顾客在网站完成结账并建立订单。
2. 网站显示商家的 Touch 'n Go QR 或银行转账资料。
3. 顾客完成付款并上传付款凭证。
4. 订单状态更新为 `Pending Verification`，不可直接标记为已付款。
5. 顾客通过预设 WhatsApp 信息把订单编号发送给商家。
6. 商家核对实际到账记录后，在后台确认或拒绝付款。
7. 确认后订单进入备货、发货及完成流程。

建议订单状态：

```text
Pending Payment
Pending Verification
Payment Confirmed
Processing
Shipped
Completed
Cancelled
Payment Rejected
```

> 付款截图只作为审核资料，不能作为实际到账证明。商家必须通过银行或 TNG 账户核对款项。

## 建议目录结构

```text
CHRISEA-Jewelry/
├── frontend/              # React application
├── backend/               # Express REST API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── uploads/           # Local development uploads only
├── database/              # Schema and migration files
├── .env.example
├── .gitignore
├── .htaccess
└── README.md
```

实际目录可在前后端初始化后调整。

## 本地开发

项目代码建立后，可分别启动前端与后端：

```bash
cd frontend
npm install
npm run dev
```

```bash
cd backend
npm install
npm run dev
```

环境变量应记录在本机的 `.env` 文件中，并在 `.env.example` 提供不含秘密值的字段示例。不要提交数据库密码、JWT Secret、WhatsApp 凭证或其他敏感资料。

## Hostinger 部署说明

### React 前端

1. 执行 `npm run build`。
2. 将生成目录（通常为 `dist/`）内的文件上传至网站根目录，例如 `public_html/`。
3. 将本项目的 `.htaccess` 放在同一个网站根目录。
4. 确认 Apache 已启用 `mod_rewrite`。

`.htaccess` 会把不存在的前端路径交由 `index.html` 处理，因此刷新 `/shop`、`/account/orders` 等 React Router 页面时不会返回 404。

### API 与数据库

- Express API 应部署至 Hostinger 支持的 Node.js 环境或独立子域名，例如 `api.example.com`。
- 生产环境通过 HTTPS 请求 API，并设置正确的 CORS 来源。
- 数据库使用独立账号及最小必要权限。
- 付款凭证属于敏感文件，不建议直接公开存放在 `public_html`。
- 若 API 与前端共用域名并使用 `/api`，需在 Hostinger 中另行配置反向代理或 Node.js 路由；当前 `.htaccess` 会保留 `/api` 请求，不会把它改写为 `index.html`。

## 上线前安全检查

- 所有密码必须使用强哈希储存。
- 登录、结账、上传与后台接口必须进行服务器端验证。
- 限制付款凭证的文件类型、大小与访问权限。
- 后台账户启用强密码，并建议加入双重验证。
- 不在前端代码或 Git 仓库中保存秘密值。
- 启用 HTTPS、速率限制、安全响应头及数据库备份。
- 完成隐私政策、退换货政策、配送条款及服务条款。

## 待客户提供资料

- SSM Registration Details / 商业注册资料
- Social Media Links / 社交媒体链接
- WhatsApp Business Number / 商业联系电话
- Product Photos / 商品照片
- Product Names, Descriptions & Prices / 商品名称、介绍及售价
- Product Variations & Stock Quantities / 商品规格及库存数量
- Shipping Fees & Delivery Coverage / 运费及配送范围
- Return & Refund Policy / 退换货政策
- Touch 'n Go QR 与 Bank-in 资料
- Brand Story / 品牌介绍
- Domain Name / 网站域名
- Reference Websites / 参考网站（如有）

## License

Private project. All rights reserved by CHRISÉA Jewelry.
