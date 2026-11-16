# gta-invest — GTA投资实验室

北美雄吉出品的中文 GTA 房产投资工具站：亏本成交榜、分租回报计算器、翻新转手计算器、美股 CDR 换算器，外加可打印清单和邮件订阅。

- 线上地址：https://vectormotionx1.github.io/gta-invest/
- 语言：简体中文，面向多伦多华人投资者
- 技术：纯静态站，`index.html` + `styles.css` + `app.js`，无外部依赖，可离线打开（订阅表单除外，需联网提交到统一订阅接口，见 `docs/leads.md`）
- 部署：GitHub Pages，推送到 `main` 即自动部署，部署前先跑测试（见 `.github/workflows/pages.yml`）

## 站内内容

| 板块 | 内容 | 数据来源 |
|---|---|---|
| 亏本成交榜 | 7 套近期亏本成交，可点击表头排序，合计 −$1,530,000（逐项相加 −$1,529,999，标题为四舍五入约数） | HouseSigma，截至 2026-10 |
| 分租回报计算器 | 房价 / 首付 / 利率 / 年限 / 整租 / 分租 / 地税 / 保险 / 管理费 / 空置 / 维修 → 月供、持有成本、毛账与净账现金流 | 预填 Scarborough 案例；另有 Burlington、Markham 预设 |
| 翻新转手计算器 | 买入价 / 装修费 / 持有税费 / 中介费 / 持有月数 / 卖出价 → 毛差、中介费、净利润、净回报率、年化回报率 | 预填 Burlington $540,000 → $766,000 |
| 美股 CDR 换算器 | 美股价格 USD × 因子 → 约算加元 CDR 价 | GOOG ~0.1593、NVDA ~0.223、ISRG ~0.0517（2026 年 10 月案例期间约算值，每日浮动，以 CIBC 官网为准；SPCX 无 CDR，不在列表中） |
| 资料包与订阅 | 三份可打印清单（`pack/`）+ 邮件订阅 | 订阅经统一接口写入 Supabase 名单，邮件由 MailerLite 发送（组与发送设置待 Andy 建好，见 `TASKS.md`） |

## 统一测算假设

月供统一按 **20% 首付、示例利率 4.79%、25 年摊还、加拿大半年复利** 测算，**不是银行报价**。保险按 Scarborough $150、Burlington $120、Markham $200/月估算。持有成本含月供、地税、保险和管理费；净账再扣空置和维修预留。首付低于 20% 时房贷保险未计入，页面会显示提醒。

亏损仅为买卖价差，未计中介费、土地转让税、律师费和持有期利息，真实亏损只会更大。

## 如何更新数据

所有案例的权威结构化数据在 `data.json`（`loss_cases` 7 套、`split_rental_cases` 3 套、`flip_case`、`cdr_factors`）。**不发布未经核实的成交数字**：新案例必须有可核实的来源才能加入，加入前 `data_as_of` 保持为 2026-10。

1. 在 `data.json` 里改 / 加案例（保持字段名和单位：加元、月份、百分比为数字）。
2. 同步改 `index.html` 里的亏本成交表和三个案例卡片——表格是静态写死的，改完必须与 `data.json` 一致。
3. 计算器预设在 `app.js` 的 `SPLIT_PRESETS` 里，CDR 因子在 `CDR_FACTORS` 里，改预设值即可。
4. 本地验证：`npm test`（语法检查 + 计算器测试 + 数据一致性校验）。`validate-data.js` 会比对 `data.json`、`app.js` 和 `index.html` 三处数字，漂移就报错，部署也会停下。
5. 改了测算公式时，同步改 `test-calc.js` 的期望值、`index.html` 里的预填结果文案，并在 `DECISIONS.md` 记一笔。

## 本地预览

```bash
# 在仓库根目录运行
python3 -m http.server 8000
# 然后打开 http://localhost:8000
```

直接双击 `index.html` 也能打开（无后端、无外部依赖；订阅表单需联网）。

## 部署

仓库已含 `.github/workflows/pages.yml` 和 `.github/workflows/ci.yml`。推送到 `main` 分支时先跑 `npm test`，通过后才部署到 GitHub Pages。GitHub 仓库 → Settings → Pages → Build and deployment → Source 应选 **GitHub Actions**。

## 漏斗与邮件

- 本站是免费工具入口，付费工具包在另一个仓库和站点：https://property-playbooks.vercel.app/（买房工具包，预售登记中，结账链接尚未上线）。本站只链接过去，不声称结账已上线。
- 本站订阅走统一获客：表单 → property-playbooks 的 `/api/signup` → 同一 Supabase `leads` 表（`product=gta-invest`），邮件由 MailerLite 发送，合同见 `docs/leads.md`。Buttondown（xiong）已于 2026-11-15 退场，旧名单有无订阅者待 Andy 查 Buttondown 后台确认，迁移步骤见 `docs/leads.md`。MailerLite 账号与 gta-invest 分组尚未建好，在建好之前新订阅只会记进名单、不会收到邮件；不要把 gta-invest 订阅者导进 `buyer-toolkit-waitlist` 组。
- 本站没有装访问统计。Plausible 或 GA 需要 Andy 提供 ID 后才能接，见 `TASKS.md`，不要凭空编一个 ID。
- YouTube 频道链接尚未核实到准确地址，页面上只写频道名和 handle，不放猜测的链接。Andy 提供准确链接后接上，见 `TASKS.md`。

## 多 agent 协作

按 `AGENTS.md` 来：冷启动先读 `AGENTS.md`、`TASKS.md`、`HANDOFF.md`、`DECISIONS.md`，任务板只认 `TASKS.md`，提交作者必须是 `VectorMotionX1 <VectorMotionX1@users.noreply.github.com>`，绝不把 token、密码、客户邮箱写进仓库。

## 免责

本站仅供参考，不是投资建议、法律或税务意见。买卖房产与证券前请咨询持牌专业人士。
