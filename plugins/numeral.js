  import Vue from 'vue'
  var numeral = require("numeral");

  Vue.filter("formatNumber", function (value) {
    return numeral(value).format("0 a");
  });