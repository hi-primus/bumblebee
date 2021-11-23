<template>
  <v-main app>
    <v-container fluid class="pa-0 layout-container">
      <slot/>
    </v-container>
  </v-main>
</template>

<script>

import { INTERCOM_APP_ID } from 'bumblebee-utils'

export default {
  mounted () {
    this.enableIntercom()
  },

  methods: {
    enableIntercom () {
      if (INTERCOM_APP_ID && !process.env.DISABLE_INTERCOM) {
        window.intercomSettings = {
          app_id: INTERCOM_APP_ID
        };
        setTimeout(() => {
          window.intercomSettings = {
            app_id: INTERCOM_APP_ID,
            vertical_padding: 48
          };
          window.Intercom("update");
        }, 150);
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/'+INTERCOM_APP_ID;var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
      } else {
        window.Intercom = ()=>{};
        window.intercomSettings = {};
      }
    }
  }
}
</script>
