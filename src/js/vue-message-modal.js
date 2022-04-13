Vue.component('vue-modal', {
  model: {
    prop: 'dialog',
    event: 'change',
    radio: '未選択',
    contentsRadio: '',
    date: '',
    time: '',
    daterange: '',
    interval: 1,
    intervalUnit: '',
    intervalUnits: [
      '日ごと',
      '週ごと',
      '月ごと',
      '年ごと'
    ],
    dayOfWeek: '',
    dayOfWeeks: [
      '日',
      '月',
      '火',
      '水',
      '木',
      '金',
      '土'
    ]
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

    <div v-if="radio != '未選択'">
      <div v-if="radio == '予約配信(一回のみ)'">
        <span>日時</span>
        <el-date-picker
          v-model="date"
          type="date"
          placeholder="日付を選択してください"
        ></el-date-picker>
        <el-time-select
          v-model="time"
          placeholder="時間を選択してください"
          :picker-options="{
            start: '00:00',
            step: '01:00',
            end: '23:00'
          }"
        ></el-time-select>
      </div>
      <div v-else-if="radio == 予約配信(繰り返し)">
        <span>期間</span>
        <el-date-picker
          v-model="daterange"
          type="daterange"
          range-separator="～"
        ></el-date-picker>

        <span>間隔</span>
        <el-input-number
          v-model="interval"
          :min="1"
          :max="4"
        ></el-input-number>
        <el-select v-model="intervalUnit">
          <el-option
            v-for="(unit, index) in intervalUnits"
            :key="'unit' + index"
            :label="unit"
            :value="unit
          >
          </el-option>
        </el-select>

        <span>曜日</span>
        <el-checkbox-group v-model="dayOfWeek">
          <el-checkbox-button
            v-for="(day, index) of dayOfWeeks"
            :key="'day' + index"
            :label="day"
          ></el-checkbox-button>
        </el-checkbox-group>
      </div>

      <el-card>
        <div slot="header">
          <el-radio-group v-model="contentsRadio">
            <el-radio-button label="テキスト"><i class="far fa-comment"></i></el-radio-button>
            <el-radio-button label="スタンプ"><i class="far fa-smile"></i></el-radio-button>
            <el-radio-button label="画像"><i class="far fa-image"></i></el-radio-button>
            <el-radio-button label="写真"><i class="far fa-file"></i></el-radio-button>
            <el-radio-button label="受信"><i class="fas fa-comment-dots"></i></el-radio-button>
            <el-radio-button label="アンケート"><i class="fas fa-clipboard"></i></el-radio-button>
          </el-radio-group>
        </div>
      </el-card>
    </div>

    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('change', false)">Cancel</el-button>
      <el-button type="primary" @click="$emit('change', false)">Confirm</el-button>
    </span>
  </el-dialog>
  `
})