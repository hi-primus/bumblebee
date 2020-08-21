export default {
  computed: {
    hideOperations () {
      return this.$route.query.stable=='1'
    },
  }
}
