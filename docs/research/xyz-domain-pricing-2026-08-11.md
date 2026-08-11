# `.xyz` 域名注册商价格对比（2026-08-11）

> 面向中国大陆个人用户。价格会随促销、币种、税区和域名是否为 premium 而变化；下表只比较**普通、非溢价的标准 `.xyz`**，不是 6–9 位纯数字的 1.111B Class。下单前应以购物车最终价格为准。

## 先说结论

- **想省心、用人民币付款、以后可能备案：腾讯云更合适。** 当前普通 `.xyz` 首年 `¥15`、续费 `¥88/年`，续费价也是本次能公开核实的方案中最低的一档；但需要中国大陆账号和域名实名认证。
- **只看海外注册商的首年页面价：Spaceship 最低，为 `$1.86`。** 但其公开价格页未让本次调研确认 ICANN fee 是否另计；Porkbun `$2.04` 明确包含 ICANN 等费用，价格更透明。
- **海外注册商里更看重长期成本和支付便利：** Porkbun 续费 `$12.98`，Dynadot 官方美元 API 为 `$13.17`；Dynadot 支持支付宝、银联和人民币。
- **Namecheap 不适合只为了便宜买 `.xyz`：** 首年 `$2.00` 很低，但另加 `$0.20` ICANN fee，续费页面价 `$19.48`，长期明显更贵。
- **Cloudflare Registrar 不是“公开价最低”的可比项。** 它承诺只收 registry 与 ICANN 成本、零加价，但公开页不显示 `.xyz` 的精确金额，必须登录 Dashboard 才能看到；同时域名必须使用 Cloudflare nameservers。

按 `1 USD ≈ ¥7.2` 粗略估算，两年持有成本（不含税、汇率差和未确认费用）：腾讯云约 `¥103`；Spaceship 约 `$14.38 ≈ ¥104`；Porkbun `$15.02 ≈ ¥108`；Dynadot `$15.16 ≈ ¥109`；阿里云 `¥123`；Namecheap 至少 `$21.88 ≈ ¥158`。

## 标准 `.xyz` 对比

| 注册商 | 首年注册 | 续费/年 | WHOIS 隐私 | ICANN / 税费口径 | 中国用户注意事项 |
| --- | ---: | ---: | --- | --- | --- |
| [Spaceship](https://www.spaceship.com/domains/) | `$1.86` | `$12.52` | 免费隐私保护 | 公开页未能确认显示价是否含 ICANN fee；适用税以结账为准 | 美元结算，通常需国际卡或其支持的跨境支付方式；下单前看购物车总额 |
| [Porkbun](https://porkbun.com/tld/xyz) | `$2.04` | `$12.98` | 免费 WHOIS Privacy | [总价表](https://porkbun.com/products/domains)明确写明包含 ICANN 和其他费用；适用税仍以结账为准 | 美元结算；对中国地址无已知注册限制，需可用的跨境付款方式 |
| [Namecheap](https://www.namecheap.com/domains/registration/gtld/xyz/) | `$2.00` | `$19.48` | 符合条件的 TLD 免费 Domain Privacy | [ICANN fee 说明](https://www.namecheap.com/support/knowledgebase/article.aspx/10521/35/what-is-the-icann-fee/)显示注册、续费、转入另加 `$0.20/年`；税另计 | 实际首年约 `$2.20`、续费约 `$19.68`（税前）；美元结算，通常需国际支付方式 |
| [Dynadot](https://www.dynadot.com/domain/xyz) | `$1.99` | `$13.17` | 免费隐私可用 | [官方美元价格 API](https://www.dynadot.com/dynadot-vue-api/dynadot-service/domain-search?command=get_current_list)给出价格；页面结构数据注明 ICANN fee 已含；[价格页](https://www.dynadot.com/domain/prices)说明适用税按所在地结账添加 | [支持支付宝、银联和 CNY](https://www.dynadot.com/payment-options)；官网可能按访问地区显示 GBP 等本地币种，汇率会变 |
| [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) | 未公开固定数字 | 未公开固定数字 | 免费 WHOIS redaction | 只收 registry + ICANN 成本、无加价；税以账单地区为准；精确 `.xyz` 价格须登录 Dashboard | [注册流程](https://developers.cloudflare.com/registrar/get-started/register-domain/)要求使用 Cloudflare nameservers；需要 Cloudflare 账号和可用付款方式 |
| [阿里云中国站](https://wanwang.aliyun.com/) | `¥14` | `¥109` | 无单独售卖的 WHOIS 隐私包；域名需实名，公开目录是否脱敏由注册局/规则决定 | [官方实时价格接口](https://netcn.console.aliyun.com/core/product/infostatic?data=%5B%7B%22action%22%3A%22activate%22%2C%22productID%22%3A%2212257%22%2C%22period%22%3A12%7D%2C%7B%22action%22%3A%22renew%22%2C%22productID%22%3A%2212257%22%2C%22period%22%3A12%7D%5D)显示人民币成交价；未单列 ICANN fee | 大陆账号、支付宝/人民币支付方便；需先准备审核通过的实名信息模板 |
| [腾讯云](https://buy.cloud.tencent.com/domain/price?type=overview) | `¥15` | `¥88` | 无单独售卖的 WHOIS 隐私包；域名需实名，公开目录是否脱敏由注册局/规则决定 | 官方价格列表接口返回普通 `.xyz` 原价 `¥450`、首年成交价 `¥15`，续费 `¥88`；未单列 ICANN fee | 人民币付款方便，适合后续备案；[官方说明](https://cloud.tencent.com/product/domain)要求注册前使用审核通过的实名信息模板 |

### 官方接口复核值

阿里云中国站的产品 ID `12257` 返回：注册 `14.0` 元、续费 `109.0` 元；接口同时标记首年为“xyz域名官方补贴”。阿里云国际站的[官方价格接口](https://cart-intl.aliyun.com/orderApi/allProductPrice.jsonp?suffixs=xyz)则为首年 `$1.88`、续费 `$16.99`，它是国际站账号和美元计价，不应与中国站混为一谈。

腾讯云公开页面调用的官方 `DescribeDomainPriceList` 接口在 2026-08-11 返回：`.xyz` 注册一年 `RealPrice: 15` 元、续费一年 `RealPrice: 88` 元。由于该接口需要 POST 参数，表格链接使用腾讯云官方可直接浏览的[域名价格列表](https://buy.cloud.tencent.com/domain/price?type=overview)作为长期可访问来源。

## 不要把 1.111B 数字域名当成普通 `.xyz`

`.xyz` 注册局的 [1.111B Class 官方页面](https://gen.xyz/1111b)定义非常明确：只包括 `000000.xyz` 到 `999999999.xyz` 之间的 **6、7、8、9 位纯数字域名**，共 11.11 亿种组合，建议零售价为注册和续费都 `¢99/年`。

这不是所有 `.xyz` 的续费价，也不是任意短数字域名的价格。品牌名、英文名、少于 6 位的数字名，以及 registry premium 名称都走普通或溢价定价。注册局直营的[官方价格页](https://gen.xyz/pricing)目前列出：

- 标准 `.xyz`：注册、续费、转入均 `$15/年`，含 ICANN fee。
- 1.111B Class：注册、续费、转入均 `$0.99/年`，含 ICANN fee。

不同零售注册商可以在首年做促销，因此普通 `.xyz` 会出现 `$1–2` 的首年价格，但第二年通常恢复到 `$12–20`；1.111B Class 的关键则是**每年**低价，而不是首年优惠。

## 购买建议

1. 先在 2–3 家注册商搜索同一个完整域名，确认它不是 premium，并进入购物车查看最终税前/税后金额。
2. 优先比较续费价，不要只看首年。个人作品集通常会持有多年，第二年开始的成本更重要。
3. 中国大陆用户若看重人民币付款、中文客服和未来备案，当前优先腾讯云；若不备案且接受海外服务，Porkbun 的费用口径最清晰，Dynadot 的支付宝/银联更方便。
4. 域名注册和网站托管是两件事。买完域名后可以指向 GitHub Pages、Cloudflare Pages、Netlify、Vercel 或自己的服务器，**不必使用 Vercel**。

## 证据与限制

- 数据核对时间：2026-08-11（Asia/Shanghai）。
- 价格均为官方页面或注册商公开接口的当日结果；促销随时可能结束。
- Spaceship 的两项数字来自其官方域名价格页，但本次未从公开可访问文本中确认 ICANN fee 是否已含，因此不能把 `$1.86` 直接视为保证的结账总价。
- Cloudflare 官方没有公开展示 `.xyz` 的即时数字价格，本文没有使用第三方价格聚合站替它补值。
- premium 域名、赎回费、转入费、汇率转换费及付款机构手续费不在本表范围内。
