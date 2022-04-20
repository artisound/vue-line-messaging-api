Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
  },
  props: ['dialog', 'config'],
  data() {
    return {
      radio: '今すぐ配信',
      contentsRadio: '',
      messages: [],
      stickers: stickers(),
      sticker_tab: Object.keys( stickers() )[0],
      isReply: false,
      objContents: [
        { label: 'テキスト',          value: 'TEXT',         icon: 'far fa-comment' },
        { label: 'スタンプ',          value: 'STICKER',      icon: 'far fa-smile' },
        { label: '写真',              value: 'IMAGE',        icon: 'far fa-image' },
        { label: 'ファイル',          value: 'FILE',         icon: 'far fa-file' },
        { label: 'リッチテキスト',    value: 'RICHTEXT',     icon: 'fas fa-comment-dots' },
        { label: '受信Box',           value: 'INFORMATION',  icon: 'fas fa-clipboard' },
      ]
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
  mounted() {
    const config = this.config;

    if(config.msg_sect.length) {
      const primary_sect = config.msg_sect[0];
      this.messages.push(this.objMsgType(primary_sect));
    }
  },
  methods: {
    handleClose() {
      return;
    },

    objMsgType(sect) {
      const obj = { sect: sect };
      switch(sect) {
        case 'TEXT':
          obj['format'] = { type: 'text', text: '' };
          break;
        case 'STICKER':
          obj['format'] = { type: 'sticker', packageId: '', stickerId: '' };
          break;
        case 'IMAGE':
          obj['format'] = { type: 'image', originalContentUrl: '', previewImageUrl: '' };
          break;
        case 'FILE':
          obj['url'] = '';
          break;
        case 'RICHTEXT':
          obj['contents'] = '';
          break;
        case 'INFORMATION':
          // obj['format'] = {};
          break;
      }
      return obj;
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
    changeSelectFile(file) {
      console.log(file)
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
    <div>
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
          ><i class="fas fa-chevron-up"></i></el-button>
          <el-button
            :disabled="messages.length == 1 || i == messages.length - 1 ? true : false"
            @click="messages.splice(i, 1, ...messages.splice(i + 1, 1, messages[i]))"
          ><i class="fas fa-chevron-down"></i></el-button>
          <el-button
            @click="$set(messages, i, objMsgType(msg.sect));"
          ><i class="fas fa-eraser"></i></el-button>
          <el-button
            :disabled="messages.length == 1 ? true : false"
            @click="messages.splice(i, 1);"
          ><i class="fas fa-times"></i></el-button>
        </el-button-group>
      </div>

      <template v-if="msg.sect == 'TEXT'">
        <el-input
          type="textarea"
          v-model="msg.format.text"
          placeholder="テキストを入力"
          :maxlength="500"
          :rows="10"
        ></el-input>
        <div class="d-flex justify-content-between">
          <div>
            <el-button v-if="config.msg_option.template">テンプレート</el-button>
            <el-button v-if="config.msg_option.embed_char">埋め込み文字</el-button>
            <el-checkbox v-if="config.msg_reply" v-model="isReply">返信を受け付けする</el-checkbox>
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
          drag
          action="https://timeconcier.jp/forline/tccom/v2/tcLibFileUpload/"
          accept="image/jpeg,image/png"
          class="w-100"
          :multiple="false"
          :on-change="(file) => {
            console.log(i)
            console.log(file)
            const reader = new FileReader()
            reader.readAsDataURL(file.raw)
            return reader.result
          }"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">ドラッグまたは<em>クリック</em>で写真をアップロード</div>
          <div class="el-upload__tip" slot="tip">jpg/png files with a size less than 500kb</div>
        </el-upload>
      </template>

      <template v-else-if="msg.sect == 'FILE'">
        <div class="modePanel mode-FILE">
          <form class="upload-file user-icon-dnd-wrapper">
            <input type="file" name="upFile" class="inputForm input_file" accept="text/plain,.xlsx,.docx,.pdf" />
            <div class="preview_field"></div>
            <div class="drop_area modal-border text-center" style="padding:22px;"><a>ファイルをアップロード</a><div style="color:#adadad"><i class="far fa-file fa-3x"></i></div></div>
            <div class="icon_clear_button"><i class="far fa-window-close fa-2x"></i></div>
          </form>
          <small class="form-text text-muted small">※タイムコンシェル社にアップロードしたファイルURLを送信します<br>※ファイル保存期間は1週間</small>
        </div>
      </template>

      <template v-else-if="msg.sect == 'RICHTEXT'">
        <quill-editor
          v-model="msg.contents"
          ref="quillEditor"
          :options="{
              theme: 'snow'
            }
          "
        ></vue-quill-editor>
      </template>

    </el-card>

    <div class="mt-3 d-flex justify-content-end">
      <el-button
        type="primary"
        :disabled="messages.length < 5 ? false : true"
        @click="messages.push( objMsgType('TEXT') )"
      >メッセージを追加</el-button>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">キャンセル</el-button>
      <el-button
        type="primary"
        @click="() => {
          console.log(messages)
        }"
      >確認</el-button>
    </span>
  </el-dialog>
  `
})