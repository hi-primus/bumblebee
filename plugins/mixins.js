export default{
    data(){
        return{

        }
    },

    methods:{
        dataType(data) {
          if (data == 'string') {
            return 'ABC';
          } else if (data == 'int') {
            return '#';
          } else if (data == 'float') {
            return '##.#';
          } else if (data == 'boolean') {
            return '0/1';
          } else if (data == 'date') {
            return '##/##/####';
          }

        },
    }

}