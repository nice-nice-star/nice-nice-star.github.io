# 机房争霸杯

目标地址：j8cup.com

- `index.html`：依据工作区《细则.md》生成的完整比赛规则。
- `scoreboard/index.html`：排行榜，对应 `/scoreboard/`（访问 `/scoreboard` 时静态服务器通常会跳转）。
- `scoreboard/scores.json`：选手名单、每个比赛日的积分变化。
- `assets/style.css`：两页共用样式，支持窄屏与横向滚动表格。
## Sponsors
特别鸣谢:skyzhou

## 更新积分

在 `scores.json` 的 `dates` 数组中追加一个比赛日，例如：

```json
{"date": "2026-10-06", "changes": {"潘彦": 12.3, "周莫非": -12.3}}
```

以上仅为格式示例，不是实际比赛记录。同一天可以逐场追加多条记录，页面会按日期自动合并、汇总为一列；也可以只填写一条当日汇总，但不要同时录入明细和汇总，以免重复计分。仅填写有记录的选手，未填写者累计积分不变、当天显示「—」。数字最多保留一位小数。所有选手从 0 分累计，按总分降序排列，同分并列且沿用名单顺序。

10.5 按当前比赛年份记录为 2026-10-05。`reservedColumns` 控制表格末尾的待定日期列数，目前为 3。

页面每 30 秒检查一次已发布的 JSON，也支持手动刷新；数据读取失败时保留上次成功加载的榜单。静态页面没有后台录分功能，修改本地文件后需要重新发布，线上才会更新。GitHub Pages/CDN 传播可能产生额外延迟。

## 本地预览

在本目录运行 `python -m http.server 8080`，访问 http://localhost:8080/ 。请通过 HTTP 访问，直接双击 HTML 的 file:// 模式不能可靠加载排行榜 JSON。


首页：https://j8cup.com/
排行榜：https://j8cup.com/scoreboard/

当前交付为本地页面文件，未自动提交、推送或变更 GitHub Pages 配置。
