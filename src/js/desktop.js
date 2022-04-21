(function(PLUGIN_ID) {
  'use strict';
  const config = kintone.plugin.app.getConfig(PLUGIN_ID)
  const data = (config.data && Object.keys( parse(config.data) ).length) ? parse(config.data) : {};
  console.log(data);

  kintone.events.on(['app.record.index.show', 'app.record.detail.show'], event => {
    if(event.type == 'app.record.index.show') {
      if(event.viewId == data.btn_views) {
        const spaceElement = kintone.app.getHeaderMenuSpaceElement();
        spaceElement.id = 'vue-app';
        spaceElement.innerHTML = '<el-button type="primary" @click="toggleDialog">LINEメッセージ</el-button>';
        spaceElement.innerHTML += '<vue-modal v-model="dialog" :config="config" :kintone-event="kintoneEvent" ></vue-modal>';
      }
    } else if (event.type == 'app.record.detail.show') {
      const btnEl = kintone.app.record.getSpaceElement(data.btn_spaceId);
      if(btnEl) {
        console.log(btnEl)
        const vueEl = document.createElement('div');
        vueEl.id = 'vue-app';
        vueEl.innerHTML = '<el-button type="primary" @click="toggleDialog">LINEメッセージ</el-button>';
        vueEl.innerHTML += '<vue-modal v-model="dialog" :config="config" :kintone-event="kintoneEvent" ></vue-modal>';
        btnEl.appendChild(vueEl);
      }
    }

    console.log(window);
    Vue.use(window.VueQuillEditor)
    new Vue({
      el: '#vue-app',
      components: [
        'vue-modal',
        'quill-editor'
      ],
      data() {
        return {
          config: data,
          dialog: false,
          kintoneEvent: event,
          dialogVisible: false
        }
      },
      methods: {
        toggleDialog () {
          this.dialog = !this.dialog;
        },
      }
    })
  });

})(kintone.$PLUGIN_ID);

function parse(json) {
  try {
    return JSON.parse(json);
  } catch {
    console.log('catch');
    return {};
  }
}