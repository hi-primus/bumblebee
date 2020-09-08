export default {
  computed: {
    hideOperations () {
      return this.$route.query.stable=='1'
    },
    allowError () {
      return this.$route.query.allowError=='1'
    }
  }
}
