(function(PLUGIN_ID) {
  'use strict';
  // クライアントの作成
  const client    = new KintoneRestAPIClient();
  const thisAppId = kintone.app.getId();

  new Vue({
    el: '#vue-app',
    data() {
      return {
        config: {
          // ● ボタン設定
          btn_views  : '',                // 一覧設定
          btn_name   : 'LINEメッセージ',  // ボタン名
          btn_spaceId: '',                // ボタン名

          // ● LINEメッセージ送信機能
          msg_sect: ['TEXT'],   // 送信メッセージ種別
          msg_max : 1,    // 一度のメッセージ数上限
          msg_option: {   // 使用するテキストオプション
            template  : false,
            emoji     : false,
            embed_char: false,
          },
          msg_reply: false, // 返信を受付

          // ● 連携情報
          sync_thisApp: { // 顧客管理系アプリ(このアプリ)
            recId        : '',  // レコード番号
            customer_name: '',  // 顧客名
            lineId       : '',  // LINEユーザーID
            manager_recId: '',  // 担当者レコード番号
          },
          sync_deliveryLogAppId: '',  // 送受信管理系アプリ - アプリ番号
          sync_deliveryLogApp: {
            customer_recId  : '',     // 顧客レコード番号
            message_content : '',     // メッセージ内容
            info_title      : '',     // お知らせタイトル
            info_content    : '',     // お知らせ本文
            info_category   : '',     // お知らせカテゴリ
            confirm_status  : '',     // 確認状態
            customer_lineId : '',     // LINEユーザーID(顧客)
            reception_date  : '',     // 受付日付
            reception_time  : '',     // 受付時刻
            delivery_class  : '',     // 送信区分
            manager_recId   : '',     // 担当者レコード番号
            line_notification: false, // 受信時LINE通知
          },
          sync_fileLogAppId: '',  // 配信ファイルログ系アプリ - アプリ番号
          sync_fileLogApp: {
            date: '',   // 日付
            time: '',   // 時刻
            file: '',   // 添付ファイル
            target: '', // 送信対象 (個別 | 一括)
          },
          sync_line: {    // LINE公式アカウント
            channel_secret: '',   // チャネルシークレット
            channel_token: '',   // チャネルアクセストークン
            bot_id: '',   // ボットのベーシックID
            richmenuId_normal: '',  // 受信BOXリッチメニューID(バッジ無し)
            richmenuId_badged: '',  // 受信BOXリッチメニューID(バッジ有り)
          },
          sync_liff: {
            init: '',
            reply: '',
          }
        },
        views : [],
        fields: [],
        spaces: [],
        fields_fileLogApp: [],
        fields_deliveryLogApp: [],
        msg_classes: [
          { value: 'TEXT',        label: 'テキスト',  icon: 'fa-regular fa-comment' },
          { value: 'STICKER',     label: 'スタンプ',  icon: 'fa-regular fa-face-smile' },
          { value: 'IMAGE',       label: '写真',      icon: 'fa-regular fa-image' },
          { value: 'FILE',        label: 'ファイル',  icon: 'fa-regular fa-file' },
          { value: 'RICHTEXT',    label: 'リッチ',    icon: 'fa-solid fa-inbox' },
          { value: 'INFORMATION', label: 'お知らせ',  icon: 'fa-solid fa-circle-info' },
        ],
        msg_options: [
          { label: 'テンプレート',  property: 'template' },
          { label: '絵文字',        property: 'emoji' },
          { label: '埋め込み文字',  property: 'embed_char' }
        ],
      }
    },
    mounted: async function() {
      const config = kintone.plugin.app.getConfig(PLUGIN_ID);
      if(config.data) {
        const json = this.parse(config.data);
        if (Object.keys(json).length) {
          for (let key in json) {
            this.config[key] = json[key];
          }
        }
      }


      // 【API】自アプリの一覧情報取得
      await client.app.getViews({ app: thisAppId }).then(rsp_view => {
        this.views = [];
        for ( let view in rsp_view.views) {
          this.views.push(rsp_view.views[view]);
        }
      });
      console.log(this.views)

      // 【API】自アプリのフォーム要素取得
      this.fields = await this.get_formFields(thisAppId);
      console.log(this.fields)

      // 【API】自アプリのレイアウト要素取得
      //  - 空白要素取得の為
      this.spaces = await this.get_formSpaceElementIds(thisAppId);
      console.log(this.spaces)
    },
    methods: {
      // ================================================================================================================================
      // ボタンアクション
      // ================================================================================================================================
      /** ********************************************************************
       * 設定保存
       ******************************************************************** */
      save_config() {
        const config = JSON.stringify(this.config);
        kintone.plugin.app.setConfig({ data: config });
      },

      // ================================================================================================================================
      // データ取得
      // ================================================================================================================================
      /** ********************************************************************
       * アプリのフィールド情報を取得
       * @param {Number} appId - 取得するフィールドのアプリID
       * @param {String} targetProp - 出力先のプロパティ
       * @returns {Array}
       ******************************************************************** */
      async get_formFields(appId, targetProp = null) {
        const fields = await client.app.getFormFields({ app: appId }).then(rsp_field => {
          const fields = [];
          for (let field in rsp_field.properties) {
            fields.push(rsp_field.properties[field])
          }
          return fields;
        }).catch(err => {
          console.error(err);
          return [];
        });

        if (targetProp) {
          this[targetProp] = fields
        } else {
          return fields
        }
      },

      /** ********************************************************************
       * アプリのスペース要素のIDを取得
       * @param {Number} appId - 取得するフィールドのアプリID
       * @param {String} targetProp - 出力先のプロパティ
       * @returns {Array}
       ******************************************************************** */
      async get_formSpaceElementIds(appId, targetProp = null) {
        const spaces = await client.app.getFormLayout({ app: appId }).then(rsp_layout => {
          const spaces = [];
          if (!rsp_layout.layout) return spaces;

          for (let row of rsp_layout.layout) {
            switch (row.type) {
              // GROUPの場合
              case 'GROUP':
                //  - row['layout']['fields'][{要素},{要素}]
                for (let group of row.layout) {
                  for (let el of group.fields) {
                    if (el.type == "SPACER" && el.elementId) spaces.push(el.elementId);
                  }
                }
                break;

              // ROWの場合
              case 'ROW':
                //  - row['fields'][{要素},{要素}]
                for (let el of row.fields) {
                  if (el.type == "SPACER" && el.elementId) spaces.push(el.elementId);
                }
                break;
            }
          }
          return spaces;
        }).catch(err => {
          console.error(err);
          return [];
        });

        if (targetProp) {
          this[targetProp] = spaces
        } else {
          return spaces
        }
      },


      // ================================================================================================================================
      // その他の関数
      // ================================================================================================================================
      parse(json) {
        try {
          return JSON.parse(json);
        } catch {
          console.log('catch');
          return {};
        }
      },
    },

  })
})(kintone.$PLUGIN_ID);
