import axios from 'axios';
//import dataset from '@/static/dafta.json';

	let dataset = [];

	try {
		dataset = require('.././datasource/data.json');
	} catch (e) {
		console.log(e);
	}

export default function( { params, store} ){

    if(dataset!=''){
		store.commit('add', dataset);
		store.commit('error', false);
    }else{
		store.commit('error', true);
    }

}