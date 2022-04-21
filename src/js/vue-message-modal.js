Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
  },
  props: ['dialog', 'config', 'kintoneEvent'],
  data() {
    return {
      radio: '今すぐ配信',
      contentsRadio: '',
      messages: [],
      stickers: stickers(),
      sticker_tab: Object.keys( stickers() )[0],
      objContents: [
        { value: 'TEXT',        label: 'テキスト',  icon: 'fa-regular fa-comment' },
        { value: 'STICKER',     label: 'スタンプ',  icon: 'fa-regular fa-face-smile' },
        { value: 'IMAGE',       label: '写真',      icon: 'fa-regular fa-image' },
        { value: 'FILE',        label: 'ファイル',  icon: 'fa-regular fa-file' },
        { value: 'RICHTEXT',    label: 'リッチ',    icon: 'fa-solid fa-inbox' },
        { value: 'INFORMATION', label: 'お知らせ',  icon: 'fa-solid fa-circle-info' },
      ]
    }
  },
  watch: {
    dialog(aft) {
      if(!aft) {
        this.messages = [];
        this.messages.push(this.objMsgType('TEXT'));
      }
    }
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
    const config = this.config;

    await this.get_targets();

    if(config.msg_sect.length) {
      const primary_sect = config.msg_sect[0];
      this.messages.push(this.objMsgType(primary_sect));
    }
  },
  methods: {
    handleClose() {
      return;
    },

    objectToArrayByKey(object, key) {
      const ret_arr = [];
      if(Array.isArray(object)) {
        object.forEach( (obj, i) => ret_arr.push(obj[key]) );
      }
      return ret_arr;
    },

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
          break;
        case 'FILE':
          obj['format'] = {
            type: 'template',
            altText: '',    // ファイル名
            template: {
              type: 'buttons',
              title: '',    // ファイル名
              text: '※個のファイルは１週間後に削除されます。',
              actions: [{ 'label': 'ダウンロード', 'type': 'uri', 'uri': '' }]
            }
          };
          obj['url']          = '';
          obj['origin_name']  = '';
          obj['name']         = '';
          obj['path']         = '';
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
    changeTextMessageFormat(obj, i) {
      let format;
      if(obj.reply) {
        const liffId = this.config.liff ? this.config.liff.reply.id : '';
        const params = this.config.liff ? '?'+this.config.liff.reply.params : '';
        format = {
          type: 'template',
          altText: 'メッセージが届きました。',
          template: {
            type: 'buttons',
            text: obj.format.text,
            actions: [{ type: 'uri', label: '返信', uri: `https://liff.line.me/${liffId}${params}` }]
          }
        };
      } else {
        format = { type: 'text', text: obj.format.template.text };
      }
      this.$set(this.messages[i], 'format', format);
      console.log(this.messages[i]);
    },
    changeMsgType(sect, i) {
      const msgType = this.objMsgType(sect);
      this.$set(this.messages, i, msgType);
    },
    selectSticker(packageId, stickerId, msgNum) {
      const msgType = this.objMsgType('STICKER');
      msgType.format.packageId = packageId;
      msgType.format.stickerId = stickerId;
      this.$set(this.messages, msgNum, msgType);
    },

    async get_targets() {
      console.group('get_targets()');
      const client = new KintoneRestAPIClient();
      const event = this.kintoneEvent;
      console.log('kintoneEvent', event);

      if(event.type == 'app.record.index.show') {
        const query = kintone.app.getQueryCondition();
        const records = await client.record.getAllRecords({
          app: event.appId,
          condition: query,
        }).then(resp => { return resp; }).catch(console.error);
        console.log('records', records);
        if(records.length) return records;
      } else if ('app.record.detail.show') {
        console.log('record', event.record);
        return event.record;
      }
      console.groupEnd();
    },

    async send_lineMessage() {
      console.group('send_lineMessage()');
      const config = this.config;
      const confirm = await this.$confirm(
        '該当のお客様にメッセージを送信します。<br>送信後は取り消すことができません。<br>よろしいですか？', // メッセージボディ
        '確認', // ヘッダータイトル
        {
          confirmButtonText: '送信',
          cancelButtonText: 'キャンセル',
          dangerouslyUseHTMLString: true,
          type: 'warning'
        }).then(_ => { return true; }).catch(_ => { return false; });
      // キャンセルボタン押下
      if(!confirm) return;

      /** ***************************************************
       * メッセージ配列作成
       *************************************************** */
      const messages = [];
      this.messages.forEach(msg => {
        switch(msg.sect) {
          case 'TEXT':
            if(msg.reply) {
              if(msg.format.template.text) messages.push(msg.format)
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
      // メッセージなし
      if(!messages.length) {
        this.$message({
          type: 'error',
          message: '送信するメッセージの内容が正しくありません。'
        });
        return;
      }

      /** ***************************************************
       * 送信対象者配列作成
       *************************************************** */
      const targets = await this.get_targets();
      const lineIds = [];
      if(targets) {
        if(Array.isArray(targets) && targets.length) {
          // 一覧画面から取得
          targets.forEach(tg => {
            if(config.sync_thisApp.lineId) {
              const lineId = tg[config.sync_thisApp.lineId].value;
              if(lineId) lineIds.push(lineId);
            }
          })
        } else {
          // 詳細画面から取得
          if(config.sync_thisApp.lineId) {
            const lineId = targets[config.sync_thisApp.lineId].value;
            if(lineId) lineIds.push(lineId);
          }
        }
      }
      // 対象者なし
      if(!lineIds.length) {
        this.$message({
          type: 'error',
          message: '該当のお客様が存在しません。'
        });
        return;
      }

      /** ***************************************************
       * LINE メッセージ送信
       *************************************************** */
      const exec_url = 'https://timeconcier.jp/forline/tccom/v2/tcLibLINE/';
      const send_msg = await axios.post(exec_url, {
        accessToken: config.sync_line.channel_token,
        action: 'multicastMessage',
        data: {
          to      : lineIds,
          messages: messages,
        }
      }).then(resp => {
        console.log(resp);
        return (resp.data && !Object.keys(resp.data).length) ? true : false;
      }).catch(console.error)

      if(!send_msg) {
        this.$message({
          type: 'error',
          message: 'メッセージの送信に失敗しました。'
        });
      }

      // this.$message({
      //   type: 'success',
      //   message: 'メッセージが送信されました。'
      // });

      // // ダイアログを閉じる
      // this.$emit('change', false);
      console.groupEnd();
    },
    changeSelectFile(file) {
      console.log(file)
    },
    async delete_file(sect, i) {
      const msgType = this.objMsgType(sect);
      this.$set(this.messages, i, msgType);
    }
  },
  template: `
  <el-dialog
    title="LINEメッセージ配信"
    width="70%"
    :visible.sync="toggleDialog"
    :show-close="false"
    :before-close="handleClose"
  >
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
          @change="changeMsgType(msg.sect, i)"
        >
          <el-tooltip
            v-for="obj in objContents"
            placement="top"
            :content="obj.label"
          >
            <el-radio-button
              v-if="config.msg_sect.includes(obj.value)"
              :label="obj.value"
            >
              <i :class="obj.icon"></i>
            </el-radio-button>
          </el-tooltip>
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
            @click="messages.splice(i, 1);"
          ><i class="fa-solid fa-xmark"></i></el-button>
        </el-button-group>
      </div>

      <template v-if="msg.sect == 'TEXT'">
        <el-input
          v-if="msg.reply"
          show-word-limit
          type="textarea"
          v-model="msg.format.template.text"
          placeholder="テキストを入力"
          :maxlength="160"
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
              v-if="config.msg_reply"
              v-model="msg.reply"
              @change="changeTextMessageFormat(msg, i)"
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
                @click="selectSticker(package.packageId, stickerId, i)"
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
            const async_url = 'https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/';
            const fd        = new FormData();
            fd.append('files[0]', data.file);
            fd.append('period', '1w');  // 1週間後 削除

            const uploaded_file = await axios.post(async_url, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }).then(resp => {
              return resp.status == 200 ? resp.data : resp;
            }).catch(err => {
              console.error(err)
            });
            console.log(uploaded_file)
            if(uploaded_file.length) {
              $set(msg.format, 'originalContentUrl',  uploaded_file[0].url);
              $set(msg.format, 'previewImageUrl',     uploaded_file[0].url);
              $set(msg, 'path', uploaded_file[0].path);
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
              @click="delete_file(msg.sect, i)"
            ></el-button>
          </div>
        </div>
      </template>

      <template v-else-if="msg.sect == 'FILE'">
        <el-upload
          v-if="!msg.url"
          drag
          action="https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/"
          :accept="objectToArrayByKey(config.file_upload_accept, 'value').join(',')"
          :limit="1"
          :show-file-list="false"
          :http-request="async data => {
            const async_url = 'https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/';
            const fd        = new FormData();
            fd.append('files[0]', data.file);
            fd.append('period', '1w');  // 1週間後 削除

            const uploaded_file = await axios.post(async_url, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }).then(resp => {
              return resp.status == 200 ? resp.data : resp;
            }).catch(err => {
              console.error(err)
            });
            console.log(uploaded_file)
            if(uploaded_file.length) {
              // メッセージテンプレート
              $set(msg.format,                      'altText',  data.file.name);
              $set(msg.format.template,             'title',    data.file.name);
              $set(msg.format.template.actions[0],  'uri',      uploaded_file[0].url + '?openExternalBrowser=1');

              $set(msg, 'url',          uploaded_file[0].url);
              $set(msg, 'origin_name',  data.file.name);
              $set(msg, 'name',         uploaded_file[0].name);
              $set(msg, 'path',         uploaded_file[0].path);
            }
            console.log(msg)
          }"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">ドラッグまたは<em>クリック</em>でアップロード</div>
          <div class="el-upload__tip d-flex flex-column" slot="tip">
            <small>送信可能なファイル：{{objectToArrayByKey(config.file_upload_accept, 'label').join('/')}}</small>
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
              @click="delete_file(msg.sect, i)"
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

    <div class="mt-3 d-flex justify-content-end">
      <el-button
        type="primary"
        :disabled="messages.length < config.msg_max ? false : true"
        @click="messages.push( objMsgType('TEXT') )"
      >
        <i class="fa-solid fa-plus me-1"></i>
        メッセージを追加
      </el-button>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">キャンセル</el-button>
      <el-button
        type="primary"
        @click="send_lineMessage"
      >送信</el-button>
    </span>
  </el-dialog>
  `
})