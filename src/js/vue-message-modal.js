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
          <el-radio-button label="テキスト"><i class="far fa-comment"></i></el-radio-button>
          <el-radio-button label="スタンプ"><i class="far fa-smile"></i></el-radio-button>
          <el-radio-button label="画像"><i class="far fa-image"></i></el-radio-button>
          <el-radio-button label="写真"><i class="far fa-file"></i></el-radio-button>
          <el-radio-button label="受信"><i class="fas fa-comment-dots"></i></el-radio-button>
          <el-radio-button label="アンケート"><i class="fas fa-clipboard"></i></el-radio-button>
        </el-radio-group>

        <el-button-group>
          <el-button><i class="fas fa-chevron-up"></i></el-button>
          <el-button><i class="fas fa-chevron-down"></i></el-button>
          <el-button><i class="fas fa-eraser"></i></el-button>
          <el-button><i class="fas fa-times"></i></el-button>
        </el-button-group>
      </div>

      <div v-if="contentsRadio == 'テキスト'">
        <el-input
          type="textarea"
          v-model="message"
          placeholder="テキストを入力"
        ></el-input>
        <div class="d-flex">
          <div>
            <el-button>テンプレート</el-button>
            <el-button>埋め込み文字</el-button>
          </div>
          <strong>{{ msgCount }}</strong><span>/500</span>
        </div>

      </div>
    </el-card>

    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">Cancel</el-button>
      <el-button type="primary" @click="$emit('change', false)">Confirm</el-button>
    </span>
  </el-dialog>
  `
})