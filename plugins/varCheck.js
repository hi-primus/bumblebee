import Vue from 'vue';

Vue.filter("varCheck", function (value) {
    if (value!=null) {
        return value;
    } else {
        return 'Null';
    }
});