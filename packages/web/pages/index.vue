<template>
  <div>Loading...</div>
</template>


<script>
const { version } = require("@/package.json");

export default {

  middleware: ({ store, redirect, route }) => {
    if (!store.state.auth.accessToken) {
      return redirect('/login', route.query)
    } else {
      return redirect('/workspace', route.query)
    }
  },

	data () {
		return {
		}
	},

	computed: {
	},

	watch: {
		async status(value) {
			if (this.useKernel) {
				switch (value) {
					case 'receiving back':
						this.stopClient(true);
						this.$store.commit('setCells', []);
						break;
					case 'receiving':
						this.$store.commit('kernel', 'loading');
						if (!this.$store.state.datasets.length) {
							this.$store.commit('newDataset');
						}

						try {
							var response = await this.socketPost('initialize', {
								session: this.$store.state.session,
								engine: this.$store.state.engine,
								tpw: this.$store.state.tpw,
								workers: this.$store.state.workers,
								reset: this.$route.query.reset
              })

              var reserved_words

              if (response.data.reserved_words) {
                reserved_words = response.data.reserved_words
                reserved_words.unary_operators = reserved_words.operators.unary
                reserved_words.binary_operators = reserved_words.operators.binary
                delete reserved_words.operators
              } else {
                reserved_words = {
                  functions: [ 'MOD', 'ABS', 'EXP', 'LOG',
                    'POW', 'CEILING', 'SQRT', 'FLOOR', 'TRUNC',
                    'RANDIANS', 'DEGREES', 'SIN', 'COS', 'TAN',
                    'ASIN', 'ACOS', 'ATAN', 'SINH', 'ASINH', 'COSH',
                    'TANH', 'ACOSH', 'ATANH'
                  ],
                  unary_operators: ['|', '&', '+', '-'],
                  binary_operators: ['+', '-', '*', '/']
                }
              }

              var reservedWords = []

              Object.entries(reserved_words).forEach(([key, words])=>{
                Object.entries(words).forEach(([word, description])=>{
                  reservedWords.push({type: key, text: word, description})
                })
              })
              this.$store.commit('mutation', {mutate: 'reservedWords', payload: reservedWords})

							if (!response.data.optimus) {
								throw response;
							}

							window.pushCode({ code: response.code });

							console.log('Optimus initialized', response.data);
							this.$store.commit('kernel', 'done');
						} catch (error) {
							if (error.code) {
								window.pushCode({ code: error.code, error: true });
							}
							console.error('Error initializing');
							printError(error);
							var appStatus = {
								error: new Error('Initialization error'),
								status: 'receiving'
							};
							this.$store.commit('setAppStatus', appStatus);
						}
						break;

					default:
						break;
				}
			}

			if (value == 'receiving') {
				var dataset = this.$route.query.dataset;
				if (dataset && this.$refs.tableBar) {
					this.$refs.tableBar.commandHandle({
						command: 'load file',
						noOperations: true,
						immediate: true,
						payload: { url: dataset, file_type: 'file', _moreOptions: true }
					});
				}
			}
		},

		tab(value) {
			if (value === undefined) {
				return;
			}

			let dataset = this.$store.state.datasets[value];

			if (value !== undefined && !dataset) {
				this.tab = this.$store.state.datasets[0] ? 0 : undefined;
				this.$store.commit('mutation', { mutate: 'tab', payload: 0 });
				return;
			}

			this.$store.commit('mutation', { mutate: 'tab', payload: value });
		},

		confirmDelete(value) {
			// TODO: Remove confirmation on empty datasets
		}
	},

	mounted() {
		console.log(`Bumblebee v${version}`);
	},


};
</script>

