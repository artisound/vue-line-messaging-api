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
      stickers: [],
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
    console.log(stickers());

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
      console.log(sect);
      const msgType = this.objMsgType(sect);
      console.log(i);
      console.log(msgType);
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
    <div>
      <div>タイミング</div>
      <el-radio v-model="radio" label="今すぐ配信">今すぐ配信</el-radio>
    </div>

    <el-card v-for="(msg, i) in messages" :key="i">
      <div class="d-flex justify-content-between" slot="header">
        <el-radio-group v-model="msg.sect">
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
            @click=""
          ><i class="fas fa-chevron-up"></i></el-button>
          <el-button
            :disabled="messages.length == 1 && i == messages.length - 1 ? true : false"
            @click=""
          ><i class="fas fa-chevron-down"></i></el-button>
          <el-button
            @click=""
          ><i class="fas fa-eraser"></i></el-button>
          <el-button
            :disabled="messages.length == 1 ? true : false"
            @click=""
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

      <template v-else-if="msg.sect == 'IMAGE'">
        <div class="modePanel mode-IMAGE">
          <form class="upload-file user-icon-dnd-wrapper">
            <input type="file" name="upFile" class="inputForm input_image" accept="image/png,image/jpeg,image/jpg" />
            <div class="preview_field"></div>
            <div class="drop_area modal-border text-center" style="padding:22px;"><a>写真をアップロード</a><div style="color:#adadad"><i class="far fa-image fa-3x"></i></div></div>
            <div class="icon_clear_button"><i class="far fa-window-close fa-2x"></i></div>
          </form>
          <small class="form-text text-muted small">ファイル形式：JPG、JPEG、PNG<br>ファイルサイズ：10MB以下</small>
        </div>
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

    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">キャンセル</el-button>
      <el-button type="primary" @click="$emit('change', false)">確認</el-button>
    </span>
  </el-dialog>
  `
})