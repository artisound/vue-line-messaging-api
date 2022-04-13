(function(PLUGIN_ID) {
  'use strict';
  const thisAppId = kintone.app.getId();

  new Vue({
    el: '#vue-app',
    data() {
      return {
        config: kintone.plugin.app.getConfig(PLUGIN_ID),
        views: [],
      }
    },
    mounted: async function() {
      // 【API】自アプリの一覧情報取得
      const getViews = await client.app.getViews({ app: thisAppId }).then(rsp_view => {
        if (rsp_view.views) console.log(rsp_view.views)
      })
    },
    methods: {
      save_config() {
        kintone.plugin.app.setConfig(this.config)
      }
    }
  })

  // var $form = $('.js-submit-settings');
  // var $cancelButton = $('.js-cancel-button');
  // var $message = $('.js-text-message');
  // var config = 

  // if (config.message) {
  //   $message.val(config.message);
  // }
  // $form.on('submit', function(e) {
  //   e.preventDefault();
  //   ({message: $message.val()}, function() {
  //     alert('The plug-in settings have been saved. Please update the app!');
  //     window.location.href = '../../flow?app=' + kintone.app.getId();
  //   });
  // });
  // $cancelButton.on('click', function() {
  //   window.location.href = '../../' + kintone.app.getId() + '/plugin/';
  // });
})(kintone.$PLUGIN_ID);
