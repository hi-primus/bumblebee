export default {
  computed: {
    useKernel () {
      if (+process.env.USE_KERNEL) {
        return this.$route.query.kernel!=='0'
      } else {
        return this.$route.query.kernel==='1'
      }
    },
    appStable () {
      return this.$route.query.stable=='1'
    },
    useRegister (){
      return this.$route.query.register!=null
    },
  }
}
