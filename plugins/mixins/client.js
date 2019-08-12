var client;

export default {

	methods: {

    stopClient () {
      this.$store.commit('status', 'waiting')
      if (client)
        try {
          client.disconnect()
        } catch (error) {
          console.error(error)
        }
    },

		startClient (uuid,key) {
      this.$store.commit('status', 'loading')
			let wsbroker = process.env.WS_BROKER
			let wsport = process.env.WS_PORT

      // TODO: unique id //
			client = new Paho.MQTT.Client(
        wsbroker,
        wsport,
        '/ws',
        'myclientid_' + parseInt(Math.random() * 100, 10)
      )

      client.onConnectionLost = (responseObject) => {
				// TODO: warn //
				console.log('CONNECTION LOST - ' + responseObject.errorMessage)
			}
			client.onMessageArrived = (message) => {

        console.log('RECEIVE ON ' + message.destinationName)

        const fernet = require('fernet');

        let secret = new fernet.Secret(key)

        var token = new fernet.Token({
          secret: secret,
          token: message.payloadString,
          ttl: 0
        })

        const pako = require('pako');

        var originalInput = pako.inflate(atob(token.decode()),{ to: 'string' });
        // var originalInput = message.payloadString

        console.log("Uncompressed string - " + originalInput);

				try {
					this.$store.commit('add', JSON.parse(originalInput))
					// this.$store.commit('add', require('@/static/datasource/data.json'))
				} catch (error) {
					console.error(error)
					this.$store.commit('status', error)
        }

				// TODO: fill json //
			}

			let options = {
				timeout: 3,
				userName: 'mqtt-test',
				password: 'mqtt-test',
				keepAliveInterval: 30,
				onSuccess: () => {
					console.log('CONNECTION SUCCESS')
					client.subscribe(`${uuid}`, {
						qos: 1
					})

          this.$store.commit('status', 'success')

					/* TEST */
					// TODO: testing is not neccessary //
					let message = new Paho.MQTT.Message('gAAAAABdS0JhrOb6u0Z_FLU3WusUYdSxNm2Fj9CMAJ6jzB7BfE40lnMus3WLhWx9F1zJd6k65aE3-S5qTxTcHwIMVo6EmhUxZEEwlpxI5MoRZ8mSEHtZQh3l7xQmxOhtbEot0GSmyebPnzZh88mc7S1KvA4_VPdYc0IRrYxwz_Igkx3qEs4psHcf7xlKCx8sEB4gP_MMZ64QOhcQPpcvp13ZzNZ452TbNyZRO3XixGqckSrDvMJ15fDI1os1aOXcLu4fUGWKHqtrkSHX4EYjsAAXXp6VozjyDhqhBbt2Qk7R_3XM0L_w3iwRGob-TabcO8WF2tPAWbdR20oe-agqRtAbufTBM9GhIBeGupSAuFVeE0iNRMasRfSi4iWRfw_2ywprXm7pec2tizoBfIx2hu_1alt4zl_JnLoXGtxzSdQEWR9Qf5C5bSFA9X3ckQPIr-JtIJxxGIVYg5XhJJqa7k_9HtNhnAtw48baJ8mARcFAw3qxCoiITGkgtX_5EvEJQgKxgc-gCCq8Hkg9uqoldugWX6X5e_kwPG3sTyQUtZGDGNdmp0RkVx_Egws5sBqmR8NS47xYlHr-kHH5Es-OW3IkF1GAW28JFQmwoRa4CBHRy12oOA9M3xhZgAGCJka61NO6Dmvq_Or22vUewQRYHwCjpC2C1EryhYeVarX9FcCi_UxtjlhOdP9ILFtxrMSWEkWfh6D9vDSFeBEYnCxMKid56gJBiLYwRcjPiW_QuW8uPt5H4U12Q8rYlUc9K031GxNHhNLtorMlr1jpV0DEgSZLsjESgpiojW9dFAu17IV-5Cw5k1aAj3DibrCMmUi1GXRV_74Ns2EbO_z_za2pM2ljstHgr8HqP4U-uyR6goRFyRl1CJBgMkAksp66UMN6Duyyp5VB5o6qESoUu3xEexyiwRPibICo-0KAw2dYWKCPmE70_Lw4ieSDTsko7hjAh1Ydh9XcZojI643ljdWtQLbZfd3rv94QUJvrYUdfSiPXkvKNdGvUIc6bNQXr2f0Mr-F84Jaje1EEXQpFMeeexh1sB-TE6soup6AWYi6jMSGlsC0TVgERhDK_Sn0Xu4Ed9DHdN2f_g6UJTGIdZbZfB5qdr3KnRy0pHGe89p66uIunDbYGl2nPhaZwqpY9dS-7ErKGoqbVwydgwEl8VrIkrA5Fe7J-KfyHOWUr_ZfvdQYHfNFloOBquiz1ZTkmxB9mSNUUxAEIBk14K4DMOjgASv0C9IilZwfGbY-MawFpRp2SZIduH-LVyZPp77BojcpQTM3OnncPhhGRbwJ0pSpcvK_viSO6m2pO3GnkgW-ISMsRhq4cVLXSNLIBtjRXotXmcA2qknlNST95R_BV_MEXwe25pdIPe9jwE8WlPl2E6gfdjVf1BrijMw3omRJnnJTuFn-Tt7Q6Y0zVYuOs2MaO--4Sy1frElBsid2-WiBCT__bMVZMyBS2bFZBi71jqCVqFE1esMk7uPbviwrW1JeL2zcuMKd6_EBR5bEdU8aXp0RWSJzUYdSZR0RAytDiVKQqrSRSgOD98lEF8UhaxX6_MLp963-VLKnluDw8U2LtuUVSCOWSS5EwAKNSCP11ZWBhTb4GkBu_Zw9rmPk7q4SdJ5O1mIVoTR0cIAKOEzXkGXRfmPBX4adTFpt39UqfHAYWmkyfeHEL9lR2oBfL4e04X2oQdHD19eMc6FA9Nh_wlglWgEkCEMO5pfrEqGxQqnoSv-PjugX1uNFJySzg44kacwkdAKpeSrZ4AvFjzYBkeNJpWR-zhLOmQ2Oc8G6wdT4kbBlitDVxDwXucPI8GwfQP5eql4ZfO6H25qthJaUdQyCBedwDncufrscqTNdPI4w2xd37sFidYTgnM7hUNsgV3s8nYaEcHpVjEvP-3h8RxSOKxaBeoC-RDjA8jsuzfK4jYTDe5ftbdlQ8C6bciylJhCB3noJE4nmmnwM4gP-leCTzB_e7sPyarS9_Oi6tBIm8uNCuSlMOlG6HPmPH0-ekShaCp14rqhrXurWHOuez3f9we4l_HK8mEf-A3E6rmcSr2c-8wVf4DzWpuoG8d6TepGmUxpr-5QLJzCNZzTX7Pw0o7eedElg3LmDJXK5lAn9FUCJwkNRepRJPTNIEVbZgMVoEi9BuxzKFVcTy_4kBcoVgizpV7uMSkcbDjaWiT2P6s8cj0taEBpTAkVJDt3pFohOEYMxkMBlbcLBrxCUJg5S62EyDJdGdPwPsTyrgzZ8NXgv5zD6YTHTSXS-OWs_X2mudoTcVOJ36xY_t7bjMv3xZIfLJxWzWnCxNGglw5JQATtxFbbnE9z8WOib83HcxQ0T3jvHlFpjmGH07pmm-UgXoFddmLaRTnJJ4zNm287AWE888Wsa4LvFXtsRoJz4QtHoHE_vFREaJCrrQQx6CjsgSlUNm0FsvJapEUsVddR4zcloxduf2hw4LlOQPTuEcUXdM32maufUqOTu-_EpbgCJtbaPQfJCr_UrSO3NKmwAzYOPoK2k9dsARLfpjoCZ5pav5rXp37NgRMJ-pL22GOMsTBwanLknEHdej6wuEXI618whwLmLdbnIw75CBMv-E9RUumcsQNUdIgm7yqrghpg0lP5OdV9oQUtP9sm5mMnrBUfot0onRqrXRO1bnUHgAuU-ZuR3xBnOzBq_Fkih32voMCLEtsssMFCr-aFB3xSHgSiSDPx4p80Bm6FBn_ABX40ccbPFvvAosuHfeSZev9qyXcp6pHjaamJRZXQPekSzCI-k8UqqV_iC1DTcEJk-fadGYnojW8utUJH67pjMrJH4stImI4CGCxfIJxmTHTbkFC4SVWVIO-S-DxrwUcUbamaPbPB19IrddMhhVGlaxx8hSxZoz4cpSt57M4ADbp5jxZZtt5ZVOZYCpwbDLIM_6_HnvlJQo7ihmc0KiXOg74PZCf_iiB-dZ0ELu30JsC4MI2Mi_DqEqpqSTSf8VjYaIo_GdNDBYpIHHdDM6IVSnHg_CoPnOttHJ7RfGYavx-aTSJQi_olIoPvGtCvEvnRrik54kfUXE-LhtanZub2zMCv0F_rewRK_1WXInVqrRB_ePEolKjivkI1i0fGa6Q-k9Og4kwIjtfKNcGCJq04_gol040x_hW_8vwcqSY_F233yc8oFxT7V9ywPLNKwBb4kiD7a3_uK1JmzkMVtmllzNkwRNkvNq9OyzfiWyC1wrssZF7MJ4huOq2HgqCBz2ASGxz8veUZcpvDjrKdOBKQYlpNMG-iW3N-dCo9E1admd8PfdNaqf8lPO1cEaC_p5NxdCk71OS9uoF6LFm5t-d7MN5ByNGxR9EN1ZxVwd82wlRKkbt9IVN5UD4qv5snc-YfyFExcM8Y3eTWtO3ONjNqrEpxPmIwWb0MhybAyC8LQyHasxbMPCdxzTOMz889316XGS0SGqiY5hjtgI17pb1tPLfmpn663YJGIe-dqCBoa3PSgPlwelMUVOZnIKogBlvgCMe0kE3E_YxSBz0Xy3um8p8bqkn3aO1sQR_ymtoHOzRF-dFo7a1OAtdiTVNIYdhSj9nJp0-CJJd_ViWjqDe9v8CTjWr6MeGe66r-j3bqKgxAVMYLdi-FyMdVysC_OQIErB_q1gDJvm-9QR2-W7jcSljZnWHjeIF0aagiEfWRAfLtfMKERu-acv0m5NzOgkVgOXPqeL74HaGuuOgq_jipGiMUqrZNOc12jKdoIcZQbwDH_hbVWdk7VxmLvYKM1nv_iqNpx938yNgSfxcE_M2M_FUbNB7iKbzTZT4gSxKcJ5LrCGUla-PnNqwH5-kUwZ9pq0ZVSw1-NxcPxIHMNAGSWa0BZSulKnH5u312N0Hw7iW12NlVeNT6beP9Q-Aie5vKfZ2NsFzavPT5PMhhwT63khXMQmKSqtocJR_TByr3rrt82tzKiJqILBmMtfuC247HDVCEzA1B_0tnMicHjEdwz2mt80T68a5I4QqR2MMUyU9Envt5w5wqPXU47XlfeEuJr5zON-LA4xRru_sjXKQZ19YVLYIZdH0UHCZFtB0SRyFy80R0GZ5KQkCV24Ek1Yq77ZooKkUuVstk3va-BrWiG0tGvgmyflu2XoQEchXgryokroxKKfy-4kS4ZJsjmhZ8ociNcvrUc2INs9yk5kXLkkg1zYNofXZNwbjz0C_HzPrGfI2VwcFWfHZc_-2BFaqsxOWy4JencL1RzkAjBWnsooZz7P6ekPQotMEnos3yv7w2ZFNiphkjqiDULmFasdvk4abv5-7fwcuK1BAbF2vGQsEpp1fHIir6A6t_A6pQXZiwOFz-Vaaf_ohccgA_qMHeS17NezOX11LoQ_gmfMo7InsVkd6JG1ntXfeTSN_EPBgmxuk40JqDRh4hkYDgu3Qi3bDlVLGQ5yogWXIV_SZAPjnpXAe5JI_th97fBdXx_WEqCdoV8pn7HW_s4SDf1zwwgyguWbGe52t9BK7IJ_AiFThzhOWHZT3pZMxiNM6_kAIgyPKsxs6Ow7a7HjDpmjNFzGkSI4XfpxwT4b5CPtxAp-z741mhYlO2xx4_EKrPq43ACBFcW_uSS22FNGmJw9PN4O_1vRrsfoWH1kYWP5IfSS2FC_XxlunLDIpp0BFmJAZmriItS35g1ttfynixgfuJh0wBVU1vE6Yt48AFfZLHAzBhHJaINP8QxKxap_9xLYLzR3VNerj-iZxkhG42R9E_YcmONZ4dl5axT-XBG8gi7jrtsoYB-8wfY-DrVnSCQykDMY6E_y3J47T6qjO_b6LWBwWt_6lfMY8Cjwac59xt7ecAXjd_oO-G0ewWYID7NwZn1fw4MdRabIqowbJZPhFPqFHuwnA32hJmzJUA4Q5NH56niIQxKpvBnNumeCCTkZgz1LR5MQuQJUT6K83MxWUaAzfZhVjI7tM4icMASdtLUgZ9WdaSDtt0fBWFWD0cP2eBQ-Ektv4dWgytLDX40st54aFwYlFuT5_2KqR6nWnDRD8WjC9YkMAenp4yV4fjWjz_SYUYAVkVuIwkky7MdQTL5i0ykQIjUhLMNRk0G228YRN4q42BK08A7maHqMf5jKuHFc6lIdhRawX_QorUFhqG47OzpwEkVMubIHGyIXkpZMF2xp7YZn6Knw0L50Es4w18dVY30V2OiKtUZWDWYnVSR-S_dZJLYTOpP12gw__zxvkoNyi_iOsn_WiYkzMF-tgMwLqREEJOrenjaryNVSUUpoU9ZZDSXoMgVgupiEQX8tVplNfxSYs7c4mIzkuE7lyf77nNeo0tJ0vVNVY9HaAW0k11Eh0Wuu0OQYvsDS8f1OKL4sk5nd52l2ucvMkbfJlEbWfzT5UbgTdJJ_N0qchb_okAyEsK3Fv7ZxZydAycO0B6CFS11I6iu8c-fGh-Z2OOf6TlPP-GPAnOcvHHthvOo_9dYEwHw-YWRD6HRaWbPxsSh6h6sPmf-8c_JX8i5OOdwRvCV6vx3k2ZuU041rt8QsW7rqtywV8l2R6qYWNwlp84JSCcKBUcNJ-G7rR8Gb7LbyNTVbRq92ea_gkK4xFNamWQmP4uFrqBInh9mvo2k773UqMkP-LI1UV4NVy9o1cgyLlvUDzCb4xGRE1mrSo7_kG0sZ1Pud1kdc0as6UB_tLzqYH14Ty8DMb_jc7F2YlhQHCHG-Uzx75N87sqPPoVyEPBatHAEHFdVEgD9-nHHvMBq_94Pe4m8C78PIOb3Z99EkQfbFrP6_KXCQy1HLjJngPT9bG-r1zQLtG6SPzkal2_nkEkEGL4xsjS_ceRpRYGSSuPYUbrg-fMsfZM4XLk6oZwlepTu4g92fw28nLaZimibZj3pJmbFrY04g7gHQ4no7dQh1u2eM0LY7r1G5AfH647TM1AVRevEI17IZ4FEgiJrcKaj7U_yslO9K0-d-B92xxq9_F7d27c0ThoFpqSfALsP14GHektaSFg==')
					message.destinationName = `${uuid}`
					client.send(message)
					/* ---- */
				},
				onFailure: (message) => {
					console.log('CONNECTION FAILURE - ' + message.errorMessage)
					// TODO: warn //
				}
			}

			// TODO: check //
			options.useSSL = false
			// if (location.protocol == "https:") {
			//   options.useSSL = false;
			// }

			client.connect(options)
		}
	}
}
