Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
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
    title="Shipping address"
    width="30%"
    :visible.sync="toggleDialog"
    :show-close="false"
    :before-close="handleClose"
  >
    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">Cancel</el-button>
      <el-button type="primary" @click="$emit('change', false)">Confirm</el-button>
    </span>
</el-dialog>
  `
})