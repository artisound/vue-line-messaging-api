Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
    radio: '未選択'
  },
  props: ['dialog'],
  computed: {
    toggleDialog: {
      get() {
        return this.dialog;
      },
      set(newValue) {
        this.$emit('change', newValue);
      },
    }
  },
  methods: {
    handleClose() {
      return;
    }
  },
  template: `
  <el-dialog
    title="LINEメッセージ配信"
    width="30%"
    :visible.sync="toggleDialog"
    :show-close="false"
    :before-close="handleClose"
  >
    // タイミング指定
    <div>
      <span>配信区分</span>
      <el-radio v-model="radio" label="未選択">未選択</el-radio>
      <el-radio v-model="radio" label="確認後配信">確認後配信</el-radio>
      <el-radio v-model="radio" label="予約配信(一回のみ)">予約配信(一回のみ)</el-radio>
      <el-radio v-model="radio" label="予約配信(繰り返し)">予約配信(繰り返し)</el-radio>
      <el-radio v-model="radio" label="今すぐ配信">今すぐ配信</el-radio>
    </div>
    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">Cancel</el-button>
      <el-button type="primary" @click="$emit('change', false)">Confirm</el-button>
    </span>
  </el-dialog>
  `
})