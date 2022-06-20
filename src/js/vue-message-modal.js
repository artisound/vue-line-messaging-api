const date = new Date();
Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
  },
  props: ['dialog', 'config', 'kintoneEvent'],
  data() {
    return {
      loading: {},
      hostname: window.location.hostname,
      radio: '今すぐ配信',
      contentsRadio: '',
      targets : [],
      messages: [],
      embed   : [],
      stickers: stickers(),
      sticker_tab: Object.keys( stickers() )[0],
      objContents: [
        { value: 'TEXT',        label: 'テキスト',  icon: 'fa-regular fa-comment' },
        { value: 'STICKER',     label: 'スタンプ',  icon: 'fa-regular fa-face-smile' },
        { value: 'IMAGE',       label: '画像',      icon: 'fa-regular fa-image' },
        { value: 'FILE',        label: 'ファイル',  icon: 'fa-regular fa-file' },
        { value: 'RICHTEXT',    label: 'リッチ',    icon: 'fa-solid fa-inbox' },
        { value: 'INFORMATION', label: 'お知らせ',  icon: 'fa-solid fa-circle-info' },
      ],
    }
  },
  watch: {
    dialog(aft) {
      if(!aft) {
        this.messages = [];
        this.messages.push(this.objMsgType('TEXT'));
      }
    },
  },
  computed: {
    toggleDialog: {
      get() {
        return this.dialog;
      },
      set(newValue) {
        this.$emit('change', newValue);
      },
    },
    msgCount() {
      return this.message.length;
    }
  },
  mounted: async function() {
    console.group('画面読込');
    this.targets = await this.get_targets();
    this.config['file_upload_accept'] = [
      { label:'Office PowerPoint',  value:'.ppt,.pptx' },
      { label:'Office Word',        value:'.doc,.docx' },
      { label:'Office Excel',       value:'.xls,.xlsx' },
      { label:'CSV',                value:'text/csv' },
      { label:'テキスト',           value:'text/plain' },
      { label:'PDF',                value:'application/pdf' },
      { label:'音声',               value:'audio/*' },
      { label:'動画',               value:'video/*' },
      { label:'ZIP',                value:'application/zip' },
    ];

    console.log(this.kintoneEvent);
    const config = this.config;
    if(config.msg_sect.length) {
      const primary_sect = config.msg_sect[0];
      this.messages.push(this.objMsgType(primary_sect));
    }

    console.log(this.targets)

    // const ts = date.getTime();
    // console.log(dayjs(ts).format('YYYY-MM-DD HH:mm:ss'));
    console.groupEnd('画面読込');
  },
  methods: {
    handleClose() {
      return;
    },

    /** ******************************************************************************************************
     * 数値のみ格納された配列から最大値または最小値を出力
     * @param {Array} array       - 数値のみ格納された配列
     * @param {String} max_or_min - 取得したい値 ('max' | 'min')
     *                            - default: 'max'
     ****************************************************************************************************** */
    get_max_min_byArray(array, max_or_min = 'max') {
      const aryMax = (a, b) => { return Math.max(Number(a), Number(b)); };
      const aryMin = (a, b) => { return Math.min(Number(a), Number(b)); };
      return (max_or_min == 'max') ? array.reduce(aryMax) : array.reduce(aryMin);
    },

    /** ******************************************************************************************************
     * テキストメッセージと返信ボタン付きメッセージを切り替える
     ****************************************************************************************************** */
    change_replyToDisable() {
      if(this.messages.length > 1) {
        this.messages.forEach(msg => {
          console.log(msg)
          if (msg.sect == 'TEXT' && msg.reply) {
            this.$set(msg, 'reply', false);
            this.$set(msg, 'format', this.objMsgType(msg.sect));
          }
        });
      }
    },

    /** ******************************************************************************************************
     * 配列オブジェクトから指定のキーの値を出力
     * @param {Array} object  - 配列オブジェクト
     * @param {String} key    - パラメータ名
     * @param {String} join   - 結合文字列
     ****************************************************************************************************** */
    objectToArrayByKey(object, key, join = null) {
      const ret_arr = [];
      if(Array.isArray(object)) {
        object.forEach( (obj, i) => ret_arr.push(obj[key]) );
      }
      return join ? ret_arr.join(join) : ret_arr;
    },

    /** ******************************************************************************************************
     * 各メッセージフォーマット初期値出力
     * @param {String} sect - TEXT | STICKER | FILE | RICHTEXT | INFORMATION
     ****************************************************************************************************** */
    objMsgType(sect) {
      const obj = { sect: sect };
      switch(sect) {
        case 'TEXT':
          obj['format'] = { type: 'text', text: '' };
          obj['reply']  = false;
          break;
        case 'STICKER':
          obj['format'] = { type: 'sticker', packageId: '', stickerId: '' };
          break;
        case 'IMAGE':
          obj['format'] = { type: 'image', originalContentUrl: '', previewImageUrl: '' };
          obj['dialog'] = false;
          obj['path']   = '';
          obj['blob']   = '';
          obj['origin_name']  = '';
          break;
        case 'FILE':
          obj['format'] = {
            type: 'template',
            altText : '',    // ファイル名
            template: {
              type   : 'buttons',
              title  : '',    // ファイル名
              text   : '※ファイルURLは1週間有効です。\n(' + dayjs().add(1, 'week').format('YYYY/MM/DD') + ' 迄)',
              actions: [{ 'label': 'ダウンロード', 'type': 'uri', 'uri': '' }]
            }
          };
          obj['url']    = '';
          obj['name']   = '';
          obj['path']   = '';
          obj['blob']   = '';
          obj['origin_name']  = '';
          break;
        case 'RICHTEXT':
          obj['title']    = '';
          obj['contents'] = '';
          break;
        case 'INFORMATION':
          // obj['format'] = {};
          break;
      }
      return obj;
    },

    /** ******************************************************************************************************
     * メッセージ送信先の顧客レコードを取得
     ****************************************************************************************************** */
    async get_targets() {
      console.group('get_targets()');
      // kintone Rest API Client
      const client  = new KintoneRestAPIClient();
      const event   = this.kintoneEvent;

      const records = [];
      if (event.type.includes('index')) {
        /** ***************************************************
         * 一覧画面から取得
         *************************************************** */
        // クエリ文字列
        const query = kintone.app.getQueryCondition();

        // 複数レコード取得
        await client.record.getAllRecords({
          app: event.appId,
          condition: query,
        }).then(resp => {
          // 取得したレコードを格納
          resp.forEach(rec => records.push(rec));
        }).catch(console.error);
      } else if (event.type.includes('detail')) {
        /** ***************************************************
         * 詳細画面（顧客レコード）から取得
         *************************************************** */
        console.log('record', event.record);
        // 現在のレコード情報を格納
        records.push(event.record);
      }
      console.log('records', records.length + '件');
      console.groupEnd('get_targets()');
      return records;
    },

    /** ******************************************************************************************************
     * TCサーバへファイルを保存
     * @param {Object} data - ファイルデータ
     ****************************************************************************************************** */
    async upload_toTcServer(data) {
      const async_url = 'https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/';
      const fd        = new FormData();
      fd.append('files[0]', data.file);
      fd.append('period', '1w');  // 1週間後 削除
      console.log(data)

      /** *********************************
       * サーバへファイル送信
       ********************************* */
      const uploaded_file = await axios.post(async_url, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(resp => {
        return resp.status == 200 ? resp.data : resp;
      }).catch(console.error);

      let blob = null;
      if(uploaded_file.length) {
        console.log(uploaded_file)
        // ファイルをbase64文字列で取得
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(data.file);
          reader.onload  = () => { resolve(reader.result); };
          reader.onerror = () => { reject(reader.error); };
        });

        // base64をバイナリに変換
        const bin = atob(base64.replace(/^.*,/, ''));
        // 8ビット符号なし整数値の配列を生成
        const buffer = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);

        // バイナリをblobに変換
        blob = new Blob([buffer.buffer], { type: data.file.type })
      }
      uploaded_file[0].blob = blob;
      return uploaded_file;
    },

    /** ******************************************************************************************************
     * 配信ファイルログのレコード登録用オブジェクトを生成
     ****************************************************************************************************** */
    async create_fileLogRecord() {
      const client      = new KintoneRestAPIClient(); // kintone Rest API Client
      const timestamp   = date.getTime();     // 現在時刻タイムスタンプ
      const event       = this.kintoneEvent;
      const config      = this.config;
      const fileLogApp  = config.sync_fileLogApp;

      const fileKeys = [];
      // ファイルアップロード -> fileKey格納
      for (let msg of this.messages) {
        if (['IMAGE', 'FILE'].includes(msg.sect)) {
          await client.file.uploadFile({
            file: {
              name: msg.origin_name,
              data: msg.blob,
            }
          }).then(resp => {
            // fileKeys配列に格納
            console.log('レスポンス: ', resp);
            fileKeys.push(resp);
          }).catch(console.error);
        }
      }

      console.log('fileKeys', fileKeys);
      if(!fileKeys.length) return;


      // レコード登録用オブジェクト生成
      const log_record_params = {};
      if (fileLogApp.date)   log_record_params[fileLogApp.date]   = { value: dayjs(timestamp).format('YYYY-MM-DD') };
      if (fileLogApp.time)   log_record_params[fileLogApp.time]   = { value: dayjs(timestamp).format('HH:mm') };
      if (fileLogApp.file)   log_record_params[fileLogApp.file]   = { value: fileKeys };
      if (fileLogApp.target) log_record_params[fileLogApp.target] = { value: event.type.includes('index') ? '一括' : '個別' };

      console.log('ログレコードパラメータ: ', log_record_params);
      if (Object.keys(log_record_params).length) {
        // レコード作成
        return await client.record.addRecord({
          app   : config.sync_fileLogAppId,
          record: log_record_params,
        }).then(resp => {
          return resp;
        }).catch(err => {
          console.log(err);
          // レコード登録エラー -> エラーメッセージ
          this.$message({
            type: 'error',
            message: '配信ファイルログアプリへのレコードを作成できませんでした。'
          });
        })
      }
    },

    /** ******************************************************************************************************
     * LINE Messaging API用にメッセージフォーマットを整形
     ****************************************************************************************************** */
    create_messagesForLineAPI() {
      const messages = [];
      this.messages.forEach(msg => {
        switch(msg.sect) {
          case 'TEXT':
            if(msg.reply) {
              if(msg.format.contents.body.contents[0].text) messages.push(msg.format)
            } else {
              if(msg.format.text) messages.push(msg.format)
            }
            break;
          case 'STICKER':
            if(msg.format.packageId) messages.push(msg.format)
            break;
          case 'IMAGE':
            if(msg.format.originalContentUrl) messages.push(msg.format)
            break;
          case 'FILE':
            if(msg.format.altText) messages.push(msg.format)
            break;
        }
      });

      return messages;
    },

    /** ******************************************************************************************************
     * 対象のレコードからLINEユーザーIDのみの配列を出力
     * @param {Object} config - プラグイン設定情報
     * @param {Array} targetRecords - 対象の顧客レコード配列
     ****************************************************************************************************** */
    async create_targetsForLineAPI(config) {
      console.log(this.targets)
      const lineIds = [];

      // 対象者あり
      if (this.targets.length) {
        this.targets.forEach(tg => {
          if(config.sync_thisApp.lineId) {
            const lineId = tg[config.sync_thisApp.lineId].value;
            if(lineId) lineIds.push(lineId);
          }
        })
      }
      return lineIds;
    },

    /** ******************************************************************************************************
     * LINEメッセージ送信 & リッチメニュー切り替え (受信Boxメッセージ格納時)
     * @param {String} lineId   - リッチメニューを切り替える対象のLINEユーザーID
     * @param {Array} messages  - LINE Messaging API用に整形されたメッセージ配列
     * @param {Boolean} change  - リッチメニューを切り替えるか否か
     *                          - default: true
     ****************************************************************************************************** */
    async send_lineMessage_change_richmenu(lineId, messages, change = true) {
      const config    = this.config;
      const exec_url  = 'https://timeconcier.jp/forline/tccom/v2/tcLibLINE/';

      return await axios.post(exec_url, {
        accessToken: config.sync_line.channel_token,
        action: 'pushMessage',
        data: { to: lineId, messages: messages },
      }).then(async resp => {
        console.log(resp);
        if (resp.data && !Object.keys(resp.data).length) {

          /** ******************************
           * リッチメニュー切り替え
           * - RICHTEXT | INFORMATION
           ****************************** */
          const inboxMessage = this.messages.find(v => ['RICHTEXT', 'INFORMATION'].includes(v.sect));
          if(inboxMessage && change) {
            const change_richmenu = await axios.post(exec_url, {
              accessToken: config.sync_line.channel_token,
              action: 'linkRichmenuToUser',
              data: { lineUserId: lineId, richMenuId: config.sync_line.richmenuId_badged },
            })
            console.log(change_richmenu)
          }
          return true;
        }
      }).catch(err => {
        console.error(err);
      });
    },

    /** ******************************************************************************************************
     * ① 対象者へメッセージ送信 - send_lineMessage_change_richmenu()
     * ② 送受信管理へ追加するレコードオブジェクトを生成
     * @param {Object} params
     * @param {Object} params.target        - 対象ユーザーのレコード情報
     * @param {Array}  params.messages      - LINE Messaging API用メッセージデータ
     * @param {String} params.messageId     - メッセージID(このプログラムで生成するユニークの値)
     * @param {String} params.fileLog_recId - ファイルアップロード時のファイルログレコードID
     ****************************************************************************************************** */
    async create_recordObject_for_deliveryLog(params) {
      const event           = this.kintoneEvent;
      const config          = this.config;
      const thisApp         = config.sync_thisApp;
      const deliveryLogApp  = config.sync_deliveryLogApp;
      const msg0            = this.messages[0];

      // 返信付メッセージのボタンアクションuriを格納
      if (params.messages.length == 1 && msg0.reply) {
        params.messages[0].contents.footer.contents[0].action.uri = `https://liff.line.me/${config.sync_liff.reply}?dest=0&msgid=${params.messageId}&openExternalBrowser=1`;
      }

      console.log(params.messages)

      // ① 対象者へメッセージ送信
      const message_success = await this.send_lineMessage_change_richmenu(params.target[thisApp.lineId].value, params.messages);

      // ② 送受信管理へ追加するレコードオブジェクトを生成
      const rec_prm = {
        'メッセージ区分': { value: '送信' },
        '連絡手段'      : { value: 'LINE' },
        '送信対象'      : { value: event.type.includes('index') ? '一括' : '個別' },
        'メッセージID'  : { value: params.messageId },
        '添付有無'      : { value: this.messages.find(v => ['IMAGE', 'FILE'].includes(v.sect)) ? 'あり' : 'なし' },
        '返信受付'      : { value: msg0.reply ? 'あり' : 'なし' },
        '配信ファイルレコード番号': { value: params.fileLog_recId || '' },
      };


      // 顧客レコード番号
      if (thisApp.recId) rec_prm[deliveryLogApp.customer_recId] = { value: params.target[thisApp.recId].value };
      // if (thisApp.recId) rec_prm[deliveryLogApp.customer_recId] = { value: 12180 };
      // 顧客LINEユーザーID
      if (thisApp.lineId) rec_prm[deliveryLogApp.customer_lineId] = { value: params.target[thisApp.lineId].value };
      // 担当者レコード番号
      if (thisApp.manager_recId) rec_prm[deliveryLogApp.manager_recId] = { value: params.target[thisApp.manager_recId].value };
      // 配信成功 / 失敗
      if (deliveryLogApp.message_status) rec_prm[deliveryLogApp.message_status] = { value: message_success ? '成功' : '失敗' };

      // メッセージが1件のみの場合
      if (params.messages.length == 1) {
        if (msg0.sect == 'TEXT') {
          rec_prm[deliveryLogApp.message_content] = { value: msg0.reply ? params.messages[0].contents.body.contents[0].text : params.messages[0].text };
        } else {
          const sect_label = this.objContents.find(v => v.value == msg0.sect).label;
          rec_prm[deliveryLogApp.message_content] = { value: '(' + sect_label + '配信)' };
        }
      } else if (params.messages.length > 1) {
        let message_content = '';
        for (let msg of this.messages) {
          if (message_content) message_content += '\n\n';
          if (msg.sect == 'TEXT') {
            message_content += msg.format.text
          } else {
            const sect_label = this.objContents.find(v => v.value == msg.sect).label;
            message_content += '(' + sect_label + '配信)';
          }
        }
        rec_prm[deliveryLogApp.message_content] = { value: message_content }
      }

      return rec_prm;
    },

    /** ******************************************************************************************************
     * 送受信ログへレコード作成
     * @param {Object} log_record_params - ログレコード用オブジェクト
     ****************************************************************************************************** */
    async create_deliveryLog(log_record_params) {
      const client = new KintoneRestAPIClient(); // kintone Rest API Client
      const config = this.config;

      if(log_record_params.length > 100) {
        // 101件以上の登録(Cursor)
        return await client.record.addAllRecords({
          app    : config.sync_deliveryLogAppId,
          records: log_record_params,
        }).then(resp => { return resp.records; }).catch(console.error);
      } else {
        // 100件以下の登録
        return await client.record.addRecords({
          app    : config.sync_deliveryLogAppId,
          records: log_record_params,
        }).then(resp => { return resp.records; }).catch(console.error);
      }
    },

    /** ******************************************************************************************************
     * LINE メッセージ送信
     ****************************************************************************************************** */
    async send_lineMessage() {
      // console.clear();
      console.group('send_lineMessage()');
      this.loading   = this.$loading({
        lock: true,
        background: 'rgba(0, 0, 0, 0.3)',
        text: '処理中...'
      });

      const client    = new KintoneRestAPIClient(); // kintone Rest API Client
      const timestamp = date.getTime();     // 現在時刻タイムスタンプ
      const config    = this.config;        // 設定情報
      const event     = this.kintoneEvent;  // kintoneイベント情報

      let confirmHTML = `<div class="d-flex justify-content-between">`;
      confirmHTML += `<span>以下のお客様にメッセージを送信します。</span><span>(${this.targets.length} 件)</span>`;
      confirmHTML += `</div>`;
      confirmHTML += `<ul style="max-height:150px;overflow-y:auto;">`;
      for (let target of this.targets) {
        confirmHTML += `<li>`;
        confirmHTML += `<a href="https://${this.hostname}/k/${this.kintoneEvent.appId}/show#record=${target.$id.value}" target="_blank">${target['顧客名'].value}</a> 様`;
        confirmHTML += `</li>`;
      }
      confirmHTML += `</ul>`;
      confirmHTML += `送信後は取り消すことができません。よろしいですか？`;
      const confirm   = await this.$confirm(
        confirmHTML, // メッセージボディ
        '確認', // ヘッダータイトル
        {
          confirmButtonText: '送信',
          cancelButtonText: 'キャンセル',
          dangerouslyUseHTMLString: true,
          // type: 'warning'
        }).then(_ => { return true; }).catch(_ => {
          this.loading.close();
          return false;
        });
      // キャンセルボタン押下
      if(!confirm) return;

      /** ***************************************************
       * メッセージ配列作成
       *************************************************** */
      let messages = this.create_messagesForLineAPI();
      // メッセージなし -> エラーメッセージ & 処理終了
      if(!messages.length) {
        this.loading.close();
        this.$message({
          type: 'error',
          message: '送信するメッセージの内容が正しくありません。'
        });
        return;
      }

      /** ***************************************************
       * 送信対象者配列作成
       *************************************************** */
      const lineIds = await this.create_targetsForLineAPI(config);
      console.log(lineIds)
      // 対象者なし -> エラーメッセージ & 処理終了
      if(!lineIds.length) {
        this.loading.close();
        this.$message({
          type: 'error',
          message: '該当のお客様が存在しません。'
        });
        return;
      }

      /** ***************************************************
       * 送受信管理へ追加・メッセージ送信
       *************************************************** */
      if (config.sync_deliveryLogAppId) {
        const exec_url = 'https://timeconcier.jp/forline/tccom/v2/tcLibLINE/';
        const thisApp = config.sync_thisApp;
        const deliveryLogApp = config.sync_deliveryLogApp;
        const messageId = event.type.includes('index') ? `${timestamp}-bunch-${kintone.getLoginUser().id}` : `${timestamp}-unit-${lineIds[0]}`;
        const msg0 = this.messages[0];


        /** ***************************************************
         * ファイルログ
         *************************************************** */
        let fileLog_recId = '';
        if (config.sync_fileLogAppId) {
          const fileLogRecord = await this.create_fileLogRecord();
          console.log('fileLogRecord', fileLogRecord)
          if(fileLogRecord) {
            fileLog_recId = fileLogRecord.id;
          }
        }


        // 送受信管理のレコードオブジェクトを作成
        const log_record_params = [];
        for (let tg of this.targets) {
          const lineId = tg[thisApp.lineId].value;
          if (lineId && messages.length) {
            /** ********************************
             * 埋め込み文字の処理
             ******************************** */
            if(this.embed.length) {
              for (let n = 0; n < messages.length; n++) {
                const msg = messages[n];
                msg = Object.create(msg);   // 参照渡し防止

                let text;
                switch(msg.type) {
                  case 'text':      // テキストメッセージ
                    text = msg.format.text;
                    break;
                  case 'template':  // ボタンテンプレートメッセージ
                    text = msg.format.contents.body.contents[0].text;
                    break;
                }
              }
            }
            /** ***************************** */


            /** ********************************
             * LINE メッセージ送信
             ******************************** */
            console.log('messages', messages);

            const rec_prm = await this.create_recordObject_for_deliveryLog({
              target       : tg,
              messages     : messages,
              messageId    : messageId,
              fileLog_recId: fileLog_recId,
            });
            log_record_params.push(rec_prm);
          }
        };

        console.log('logRecord', log_record_params);


        // ----------------------------
        // 一括追加
        // ----------------------------
        const addRecords = await this.create_deliveryLog(log_record_params);
        // レコード登録エラー -> エラーメッセージ & 処理終了
        if(!addRecords && !addRecords.length) {
          this.loading.close();
          this.$message({
            type: 'error',
            message: '送受信管理アプリへのレコードを作成できませんでした。'
          });
          console.groupEnd('send_lineMessage()');
          return;
        }
      }

      this.loading.close();
      this.$message({
        type: 'success',
        message: 'メッセージが送信されました。'
      });

      // ダイアログを閉じる
      this.$emit('change', false);
      console.groupEnd('send_lineMessage()');
    },

    /** ******************************************************************************************************
     * メッセージフォーマットリセット
     * @param {Objecy} sect - TEXT | STICKER | FILE | RICHTEXT | INFORMATION
     * @param {Number} i    - 配列番号
     ****************************************************************************************************** */
    async message_reset(sect, i) {
      const msgType = this.objMsgType(sect);
      this.$set(this.messages, i, msgType);
    }
  },
  template: `
  <el-dialog
    width="800px"
    :visible.sync="toggleDialog"
    :show-close="false"
    :before-close="handleClose"
  >
    <div
      slot="title"
      class="d-flex align-items-center"
    >
      <span class="m-0 text-white">LINEメッセージ配信</span>
      <div class="flex-grow-1"></div>
      <i
        class="el-icon-close text-white h3 m-0"
        style="cursor:pointer;font-size:25px;"
        @click="$emit('change', false)"
      ></i>
    </div>
    <div>
      <!-- タイミング指定 -->
      <div class="my-3">
        <div>タイミング</div>
        <el-radio v-model="radio" label="今すぐ配信">今すぐ配信</el-radio>
      </div>

      <el-card
        class="mb-2"
        v-for="(msg, i) in messages"
        :key="i"
      >
        <div class="d-flex justify-content-between" slot="header">
          <el-radio-group
            v-model="msg.sect"
            @change="message_reset(msg.sect, i)"
          >
            <template v-for="(obj, i) in objContents">
              <el-tooltip
                placement="top"
                :key="i"
                :content="obj.label"
              >
                <el-radio-button
                  v-if="config.msg_sect.includes(obj.value)"
                  :label="obj.value"
                >
                  <i :class="obj.icon"></i>
                </el-radio-button>
              </el-tooltip>
            </template>
          </el-radio-group>

          <el-button-group>
            <el-button
              :disabled="i == 0 ? true : false"
              @click="messages.splice(i - 1, 1, ...messages.splice(i, 1, messages[i - 1]))"
            ><i class="fa-solid fa-chevron-up"></i></el-button>
            <el-button
              :disabled="messages.length == 1 || i == messages.length - 1 ? true : false"
              @click="messages.splice(i, 1, ...messages.splice(i + 1, 1, messages[i]))"
            ><i class="fa-solid fa-chevron-down"></i></el-button>
            <el-button
              @click="$set(messages, i, objMsgType(msg.sect));"
            ><i class="fa-solid fa-eraser"></i></el-button>
            <el-button
              :disabled="messages.length == 1 ? true : false"
              @click="messages.splice(i, 1);change_replyToDisable();"
            ><i class="fa-solid fa-xmark"></i></el-button>
          </el-button-group>
        </div>

        <template v-if="msg.sect == 'TEXT'">
          <el-input
            v-if="msg.reply"
            show-word-limit
            type="textarea"
            v-model="msg.format.contents.body.contents[0].text"
            placeholder="テキストを入力"
            :rows="10"
          ></el-input>
          <el-input
            v-else
            show-word-limit
            type="textarea"
            v-model="msg.format.text"
            placeholder="テキストを入力"
            :maxlength="500"
            :rows="10"
          ></el-input>
          <div class="my-2 d-flex justify-content-end g-2">
            <div>
              <el-button v-if="config.msg_option.template">テンプレート</el-button>
              <el-button v-if="config.msg_option.embed_char">埋め込み文字</el-button>
              <el-checkbox
                v-if="kintoneEvent.type.includes('detail') && config.msg_reply"
                v-model="msg.reply"
                :disabled="messages.length > 1 ? true : false"
                @change="() => {
                  let format;
                  if(msg.reply) {
                    const liffId = config.syncliff ? config.sync_liff.reply : '';
                    format = {
                      type: 'flex',
                      altText: 'メッセージが届きました。',
                      contents: {
                        type: 'bubble',
                        body: {
                          type: 'box',
                          layout: 'vertical',
                          contents: [
                            {
                              type: 'text',
                              text: msg.format.text,
                              size: 'md',
                              align: 'start',
                              wrap: true,
                              contents: []
                            }
                          ]
                        },
                        footer: {
                          type: 'box',
                          layout: 'horizontal',
                          contents: [
                            {
                              type: 'button',
                              action: {
                              type: 'uri',
                              label: '返信',
                              uri: 'https://liff.line.me/'+liffId
                              },
                              height: 'sm',
                              style: 'secondary'
                            }
                          ]
                        }
                      }
                    };
                  } else {
                    format = { type: 'text', text: msg.format.contents.body.contents[0].text };
                  }
                  $set(messages[i], 'format', format);
                }"
              >返信を受け付けする</el-checkbox>
            </div>
          </div>
        </template>

        <template v-else-if="msg.sect == 'STICKER'">
          <el-tabs v-model="sticker_tab" type="border-card">
            <el-tab-pane
              v-for="(package, name) in stickers"
              :key="name"
              :label="name"
              :name="name"
              :style="{
                maxHeight: '300px',
                overflowY: 'auto',
              }"
            >
              <div
                :class="[
                  'row',
                  'd-flex',
                  'flex-wrap',
                  'align-items-stretch',
                  'g-2',
                ]"
              >
                <div
                  v-for="(stickerId, s) in package.stickerId"
                  :key="stickerId"
                  :class="[
                    'col-6',
                    'col-lg-1',
                    'col-md-2',
                    'col-sm-4',
                    'd-flex',
                  ]"
                  :style="{
                    cursor: 'pointer',
                  }"
                  @click="() => {
                    const msgType = objMsgType('STICKER');
                    msgType.format.packageId = package.packageId;
                    msgType.format.stickerId = stickerId;
                    $set(messages, i, msgType);
                  }"
                >
                  <el-card
                    class="d-flex align-items-center"
                    :body-style="{ padding: '0px' }"
                    :style="{
                      backgroundColor: msg.format.stickerId == stickerId ? '#a0cfff' : 'white',
                    }"
                  >
                    <img
                      class="d-blick image w-100"
                      :src="'https://stickershop.line-scdn.net/stickershop/v1/sticker/'+stickerId+'/android/sticker.png'"
                      :style="{
                        display: 'block',
                        width: '100%',
                      }"
                    >
                  </el-card>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>

        <template v-else-if="msg.sect == 'IMAGE'">
          <el-upload
            v-if="!msg.format.previewImageUrl"
            drag
            action="https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/"
            accept="image/jpeg,image/png"
            limit="1"
            :show-file-list="false"
            :on-preview="msg.format.previewImageUrl"
            :http-request="async data => {
              const uploaded_file = await upload_toTcServer(data);
              if(uploaded_file) {
                $set(msg.format,  'originalContentUrl', uploaded_file[0].url);
                $set(msg.format,  'previewImageUrl',    uploaded_file[0].url);

                $set(msg,         'blob',               uploaded_file[0].blob);
                $set(msg,         'path',               uploaded_file[0].path);
                $set(msg,         'origin_name',        data.file.name);
                console.log(msg);
              }
            }"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">ドラッグまたは<em>クリック</em>でアップロード</div>
            <div class="el-upload__tip d-flex flex-column" slot="tip">
              <small style="line-height:initial;">※タイムコンシェル社にアップロードしたファイルURLを送信します。</small>
              <small style="line-height:initial;">※ファイル保存期間は1週間です。</small>
            </div>
          </el-upload>
          <div
            v-else
            :class="[
              'd-flex',
              'justify-content-center',
              'mt-3',
            ]"
          >
            <div class="position-relative">
              <img
                :src="msg.format.previewImageUrl"
                :style="{
                  maxWidth: '200px',
                  display: 'block',
                }"
              >
              <el-button
                circle
                type="danger"
                icon="el-icon-close"
                :class="[
                  'position-absolute',
                  'top-0',
                  'start-100',
                  'translate-middle',
                ]"
                @click="message_reset(msg.sect, i)"
              ></el-button>
            </div>
          </div>
        </template>

        <template v-else-if="msg.sect == 'FILE'">
          <el-upload
            v-if="!msg.url"
            drag
            action="https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/"
            :accept="objectToArrayByKey(config.file_upload_accept, 'value', ',')"
            :limit="1"
            :show-file-list="false"
            :http-request="async data => {
              const uploaded_file = await upload_toTcServer(data);
              if(uploaded_file) {
                $set(msg.format,                      'altText',  data.file.name);
                $set(msg.format.template,             'title',    data.file.name);
                $set(msg.format.template.actions[0],  'uri',      uploaded_file[0].url + '?openExternalBrowser=1');

                $set(msg, 'origin_name',  data.file.name);
                $set(msg, 'url',          uploaded_file[0].url);
                $set(msg, 'blob',         uploaded_file[0].blob);
                $set(msg, 'name',         uploaded_file[0].name);
                $set(msg, 'path',         uploaded_file[0].path);
              }
              console.log(msg)
            }"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">ドラッグまたは<em>クリック</em>でアップロード</div>
            <div class="el-upload__tip d-flex flex-column" slot="tip">
              <small>送信可能なファイル：{{objectToArrayByKey(config.file_upload_accept, 'label', '/')}}</small>
              <small>※タイムコンシェル社にアップロードしたファイルURLを送信します。</small>
              <small>※ファイル保存期間は1週間です。</small>
            </div>
          </el-upload>
          <div
            v-else
            :class="[
              'd-flex',
              'justify-content-center',
              'mt-3',
            ]"
          >
            <div class="position-relative d-flex flex-column">
              <i class="text-center fa-regular fa-file fa-5x" style="color:#333;"></i>
              <el-button
                circle
                type="danger"
                icon="el-icon-close"
                :class="[
                  'position-absolute',
                  'top-0',
                  'start-100',
                  'translate-middle',
                ]"
                @click="message_reset(msg.sect, i)"
              ></el-button>
              <span>{{msg.origin_name}}</span>
            </div>
          </div>
        </template>

        <template v-else-if="msg.sect == 'RICHTEXT'">
          <el-input
            class="mb-2"
            placeholder="タイトル"
            v-model="msg.title"
          ></el-input>
          <quill-editor
            v-model="msg.contents"
            ref="quillEditor"
            :options="{
              theme: 'snow',
              modules: {
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  ['blockquote', 'code-block'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  [{ header: [1, 2, 3, 4, 5, 6, false] }],
                  [{ color: [] }, { background: [] }],
                  ['clean'],
                ],
              }
            }"
          ></vue-quill-editor>
        </template>

      </el-card>

      <div
        v-if="config.msg_max >= 2"
        class="mt-3 d-flex justify-content-end"
      >
        <el-button
          type="primary"
          :disabled="messages.length < config.msg_max && !messages[0].reply ? false : true"
          @click="messages.push( objMsgType('TEXT') );change_replyToDisable();"
        >
          <i class="fa-solid fa-plus me-1"></i>
          メッセージを追加
        </el-button>
      </div>

    </div>

    <div
      slot="footer"
      class="divided dialog-footer d-flex justify-content-end"
    >
      <el-button @click="$emit('change', false)">キャンセル</el-button>
      <el-button
        type="primary"
        @click="send_lineMessage"
      >送信</el-button>
    </div>
  </el-dialog>
  `
})