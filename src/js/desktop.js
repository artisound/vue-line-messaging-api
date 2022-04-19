(function(PLUGIN_ID) {
  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  'use strict';

  kintone.events.on('app.record.index.show', function() {
    const spaceElement = kintone.app.getHeaderMenuSpaceElement();
    spaceElement.id = 'vue-app';
    spaceElement.innerHTML = '<el-button type="primary" @click="toggleDialog">LINEメッセージ</el-button>';
    spaceElement.innerHTML += '<vue-modal v-model="dialog" ></vue-modal>';

    console.log(window);
    new Vue({
      el: '#vue-app',
      components: [
        'vue-modal'
      ],
      data() {
        return {
          config: config,
          dialog: false,
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
