# LINEメッセージ配信プラグイン for TC

## セットアップ
```bash
$ yarn install
```

### kintoneアカウント設定
`.env.sample`を、`.env`というファイル名に**複製**してください。  
適宜環境に合わせて書き換えてください。
```
KINTONE_BASE_URL=https://<kintoneサブドメイン>.cybozu.com
KINTONE_USERNAME=<ユーザー名>
KINTONE_PASSWORD=<パスワード>
```

## デプロイ
```bash
$ yarn deploy
```