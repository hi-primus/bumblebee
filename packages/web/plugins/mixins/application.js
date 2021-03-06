export default {
  computed: {
    allowError () {
      return this.$route.query.allowError=='1'
    }
  }
}
