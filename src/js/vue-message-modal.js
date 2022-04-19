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
          <el-radio-button v-if="config.msg_sect.find(v => v == 'TEXT')" label="テキスト"><i class="far fa-comment"></i></el-radio-button>
          <el-radio-button v-if="config.msg_sect.find(v => v == 'STICKER')" label="スタンプ"><i class="far fa-smile"></i></el-radio-button>
          <el-radio-button v-if="config.msg_sect.find(v => v == 'IMAGE')" label="写真"><i class="far fa-file"></i></el-radio-button>
          <el-radio-button v-if="config.msg_sect.find(v => v == 'FILE')" label="ファイル"><i class="far fa-image"></i></el-radio-button>
          <el-radio-button v-if="config.msg_sect.find(v => v == 'RICHTEXT')" label="リッチメッセージ"><i class="fas fa-comment-dots"></i></el-radio-button>
          <el-radio-button v-if="config.msg_sect.find(v => v == 'INFORMATION')" label="受信Box"><i class="fas fa-clipboard"></i></el-radio-button>
        </el-radio-group>

        <el-button-group>
          <el-button><i class="fas fa-chevron-up"></i></el-button>
          <el-button><i class="fas fa-chevron-down"></i></el-button>
          <el-button><i class="fas fa-eraser"></i></el-button>
          <el-button><i class="fas fa-times"></i></el-button>
        </el-button-group>
      </div>

      {{ contentsRadio }}

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