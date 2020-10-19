# Bots

Some Bots or Schedules

## Weekly Report Check

通过 IMAP 检查是否收到周报，如有人未发送，发送钉钉通知 @未发送人。

```bash
cp weeklyReportCheck/config.example.yml weeklyReportCheck/config.yml
cp .env.example .env
```

修改 `config.yml` 和 `.env` 中配置信息
