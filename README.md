# gta-invest — GTA投资实验室

北美雄吉出品的中文 GTA 房产投资工具站：亏本成交榜、分租回报计算器、翻新转手计算器、美股 CDR 换算器，外加资料包订阅占位。

- 线上地址：推送后见 GitHub Pages（见下方部署步骤）
- 语言：简体中文，面向多伦多华人投资者
- 技术：纯静态站，`index.html` + `styles.css` + `app.js`，无外部依赖，可离线打开

## 站内内容

| 板块 | 内容 | 数据来源 |
|---|---|---|
| 亏本成交榜 | 7 套近期亏本成交，可点击表头排序，合计 −$1,530,000 | HouseSigma，截至 2026-10 |
| 分租回报计算器 | 房价 / 首付 / 利率 / 年限 / 整租 / 分租 / 地税 / 保险 → 月供、持有成本、整租与分租现金流 | 预填 Scarborough 案例；另有 Burlington、Markham 预设 |
| 翻新转手计算器 | 买入价 / 装修费 / 持有中介税费 / 卖出价 → 毛差、净利润、净回报率 | 预填 Burlington $540,000 → $766,000 |
| 美股 CDR 换算器 | 美股价格 USD × 因子 → 约算加元 CDR 价 | GOOG ~0.1593、NVDA ~0.223、ISRG ~0.0517、SPCX ~0.1662（SPCX 无 CDR，仅参考） |
| 资料包订阅 | 邮箱占位表单（无后端） | 正式上线前需接入邮件服务 |

## 统一测算假设

分租 / 翻新相关月供统一按 **20% 首付、示例利率 4.79%、25 年摊还** 测算，**不是银行报价**。保险按 Scarborough $150、Burlington $120、Markham $200/月估算。

亏损仅为买卖价差，未计中介费、土地转让税、律师费和持有期利息，真实亏损只会更大。

## 如何更新数据

所有案例的权威结构化数据在 `data.json`（`loss_cases` 7 套、`split_rental_cases` 3 套、`flip_case`、`cdr_factors`）。

1. 在 `data.json` 里改 / 加案例（保持字段名和单位：加元、月份、百分比为数字）。
2. 同步改 `index.html` 里的亏本成交表和三个案例卡片——表格是静态写死的，改完请核对数字与 `data.json` 一致。
3. 计算器预设在 `app.js` 的 `SPLIT_PRESETS` 里，改预设值即可。
4. 本地验证：`node --check app.js`，再跑 `node test-calc.js`（见下）核对 Scarborough / Burlington 的算账结果。

## 本地预览

```bash
# 任选其一，在仓库根目录运行
python3 -m http.server 8000
# 然后打开 http://localhost:8000
```

直接双击 `index.html` 也能打开（无后端、无外部依赖）。

## 部署到 GitHub Pages

仓库已含 `.github/workflows/pages.yml`，推送到 `main` 分支即自动部署：

1. 把本目录内容推送到 `https://github.com/VectorMotionX1/gta-invest` 的 `main` 分支。
2. 在 GitHub 仓库 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. 等 Actions 跑完，访问 `https://vectormotionx1.github.io/gta-invest/`（以 Pages 设置页显示的地址为准，不要凭空猜其他地址）。

## 推送（需要授权）

本机目前没有 GitHub token，无法推送。请用以下任一方式：

```bash
git init
git add .
git commit -m "Build GTA投资实验室 static site"
git branch -M main
git remote add origin https://github.com/VectorMotionX1/gta-invest.git
git push -u origin main
```

推送时 GitHub 会要求登录 / token，请用你自己的账号完成。不要把 token 写进代码或聊天记录。

## 免责

本站仅供参考，不是投资建议、法律或税务意见。买卖房产与证券前请咨询持牌专业人士。
