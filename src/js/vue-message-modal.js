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
      message: '',
      isReply: false,
      objContents: [
        {
          label: 'テキスト',
          value: 'TEXT',
          icon: 'far fa-comment'
        },
        {
          label: 'スタンプ',
          value: 'STICKER',
          icon: 'far fa-smile'
        },
        {
          label: '写真',
          value: 'IMAGE',
          icon: 'far fa-image'
        },
        {
          label: 'ファイル',
          value: 'FILE',
          icon: 'far fa-file'
        },
        {
          label: 'リッチメッセージ',
          value: 'RICHTEXT',
          icon: 'fas fa-comment-dots'
        },
        {
          label: '受信Box',
          value: 'INFORMATION',
          icon: 'fas fa-clipboard'
        }
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
    console.log(this.config);
  },
  methods: {
    handleClose() {
      return;
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
      <span>タイミング</span>
      <el-radio v-model="radio" label="今すぐ配信">今すぐ配信</el-radio>
    </div>

    <el-card>
      <div class="d-flex justify-content-between" slot="header">
        <el-radio-group v-model="contentsRadio">
          <el-tooltip
            v-for="obj in objContents"
            :content="obj.label"
            placement="bottom"
          >
            <el-radio-button v-if="config.msg_sect.find(v => v == obj.value)" :label="obj.label"><i :class="obj.icon"></i></el-radio-button>
          </el-tooltip>
        </el-radio-group>

        <el-button-group>
          <el-button><i class="fas fa-chevron-up"></i></el-button>
          <el-button><i class="fas fa-chevron-down"></i></el-button>
          <el-button><i class="fas fa-eraser"></i></el-button>
          <el-button><i class="fas fa-times"></i></el-button>
        </el-button-group>
      </div>

      <template v-if="contentsRadio == 'テキスト'">
        <el-input
          type="textarea"
          v-model="message"
          placeholder="テキストを入力"
          :rows="10"
        ></el-input>
        <div class="d-flex justify-content-between">
          <div>
            <el-button v-if="config.msg_option.template">テンプレート</el-button>
            <el-button v-if="config.msg_option.embed_char">埋め込み文字</el-button>
            <el-checkbox v-if="config.msg_reply" v-model="isReply">返信を受け付けする</el-checkbox>
          </div>
          <div>
            <strong>{{ msgCount }}</strong><span>/500</span>
          </div>
        </div>
      </template>

      <template v-else-if="contentsRadio == '写真'">
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

      <template v-else-if="contentsRadio == 'ファイル'">
        <div class="modePanel mode-FILE"">
          <form class="upload-file user-icon-dnd-wrapper">
            <input type="file" name="upFile" class="inputForm input_file" accept="text/plain,.xlsx,.docx,.pdf" />
            <div class="preview_field"></div>
            <div class="drop_area modal-border text-center" style="padding:22px;"><a>ファイルをアップロード</a><div style="color:#adadad"><i class="far fa-file fa-3x"></i></div></div>
            <div class="icon_clear_button"><i class="far fa-window-close fa-2x"></i></div>
          </form>
          <small class="form-text text-muted small">※タイムコンシェル社にアップロードしたファイルURLを送信します<br>※ファイル保存期間は1週間</small>
        </div>
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