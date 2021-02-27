<template>
  <v-main app>
    <v-container fluid class="py-0 layout-container">
      <slot/>
    </v-container>
  </v-main>
</template>

<script>

import { INTERCOM_APP_ID } from 'bumblebee-utils'

export default {
  mounted () {
    (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/'+INTERCOM_APP_ID;var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
    window.intercomSettings = {
      app_id: INTERCOM_APP_ID,
    };
    window.intercomSettings["vertical_padding"] = 48;
    window.Intercom("update");
  }
}
</script>
