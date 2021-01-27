import { client as WebSocketClient } from 'websocket';
import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';
import kernelRoutines from './kernel-routines.js';

const kernels = [];

let kernel_addresses;
let kernel_types;
let kernel_bases;
let ws_kernel_bases;

const updateKernelBases = function () {
	if (!kernel_addresses) {
		kernel_addresses = (process.env.KERNEL_ADDRESS || `localhost:8888`).split(
			',',
		);
		kernel_bases = kernel_addresses.map((e) => 'http://' + e);
		ws_kernel_bases = kernel_addresses.map((e) => 'ws://' + e);
	}
};

const kernelBase = function (id) {
  if (typeof id === 'string') {
    return `http://${id}`;
  }
	updateKernelBases();
	return kernel_bases[id] || kernel_bases[0];
};

const wsKernelBase = function (id) {
  if (typeof id === 'string') {
    return `ws://${id}`;
  }
	updateKernelBases();
	return ws_kernel_bases[id] || ws_kernel_bases[0];
};

export const trimCharacters = (s, c) => {
	if (c === ']') c = '\\]';
	if (c === '\\') c = '\\\\';
	return s.replace(new RegExp('^[' + c + ']+|[' + c + ']+$', 'g'), '');
};

export const initializeKernel = async function (sessionId, payload) {
	let result = false;

	if (payload?.reset != '0') {
		kernels[sessionId] = await clearKernel(sessionId);
	} else {
		kernels[sessionId] = kernels[sessionId] || {};
	}
	if (!kernels[sessionId].initialization) {
		kernels[sessionId].initialization = initializeKernelSession(
			sessionId,
			payload,
		);
		result = await kernels[sessionId].initialization;
	}
	kernels[sessionId].initialization = false;
	return { kernel: kernels[sessionId], result };
};

export const initializeKernelSession = async function (sessionId, payload) {

	let result;

	if (
		!payload &&
		kernels[sessionId] &&
		kernels[sessionId].initializationPayload
	) {
		payload = kernels[sessionId].initializationPayload;
	} else if (!payload) {
		payload = {};
	}

	let tries = 3;
	while (tries > 0) {
		try {
			result = await requestToKernel('init', sessionId, payload);
		} catch (err) {
			tries--;
			if (err.toString().includes('Kernel creation')) {
				tries = 0;
			}
			if (tries <= 0) {
				// console.error(err);
				return {
					error: 'Internal Error',
          content: err.toString(),
          err,
					status: 'error',
				};
			}
			result = false;
		}
		if (!result) {
			await deleteKernel(sessionId);
		} else {
			break;
		}
	}

	if (
		!kernels[sessionId] ||
		!kernels[sessionId].id ||
		!kernels[sessionId].connection
	) {
		return false;
	}

	kernels[sessionId].initialized = result;
	kernels[sessionId].initializationPayload = payload;

	return result;
};

const assertSession = async function (
	sessionId,
	isInit = false,
	kernel_address : any = undefined,
) {
	try {
		if (!kernels[sessionId] || !kernels[sessionId].id) {
			await createKernel(sessionId, kernel_address);
		}

		if (!kernels[sessionId] || !kernels[sessionId].id) {
			throw new Error('Kernel creation went wrong');
		}

		await createConnection(sessionId);

		if (!isInit && !(kernels[sessionId].initialized || kernels[sessionId].id)) {
			if (!kernels[sessionId].initialization) {
				kernels[sessionId].initialization = initializeKernelSession(sessionId, {
					payloadDefault: true,
				});
			}
			await kernels[sessionId].initialization;
			kernels[sessionId].initialization = false;
		}

		return kernels[sessionId].connection;
	} catch (err) {
		// console.error('WebSocket Error');
		// console.error(err);
		return undefined;
	}
};

export const requestToKernel = async function (type, sessionId, payload) {

  var kernelAddress : any = kernels[sessionId].kernel_address;

  if (type == 'init' && !kernelAddress && payload.jupyter_address && payload.jupyter_address.ip && payload.jupyter_address.port) {
    kernelAddress = payload.jupyter_address.ip + ':' + payload.jupyter_address.port;
  }

	const connection = await assertSession(
		sessionId,
		type == 'init',
		kernelAddress,
	);

	if (!connection) {
		throw 'Socket error';
	}

	const startTime = new Date().getTime();

	let code = payload;

	switch (type) {
		case 'code':
			code = kernelRoutines.code(payload);
			break;
		case 'datasets':
			code = kernelRoutines.datasets(payload);
			break;
		case 'init':
      payload.engine = payload.engine || process.env.ENGINE || 'dask';
			code = kernelRoutines.init(payload);
			break;
	}

	const msg_id = kernels[sessionId].uuid + Math.random();

	const hdr = {
		msg_id: msg_id,
		session: kernels[sessionId].uuid,
		date: new Date().toISOString(),
		msg_type: 'execute_request',
		version: '5.3', // TO-DO: check
	};

	const codeMsg = {
		header: hdr,
		parent_header: hdr,
		metadata: {},
		content: { code: code + '\n', silent: false },
	};

	if (!kernels[sessionId].promises) {
		kernels[sessionId].promises = {};
	}

	const response = await new Promise((resolve, reject) => {
		kernels[sessionId].promises[msg_id] = { resolve, reject };
		kernels[sessionId].connection.sendUTF(JSON.stringify(codeMsg));
	});

	const responseHandled = handleResponse(response);

	if (responseHandled?.traceback?.map) {
		responseHandled.traceback = responseHandled.traceback.map((l) =>
			l.replace(
				/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
				'',
			),
		);
	}

	const endTime = new Date().getTime();

	responseHandled._serverTime = {
		start: startTime / 1000,
		end: endTime / 1000,
		duration: (endTime - startTime) / 1000,
	};

	return responseHandled;
};

export const runCode = async function (code = '', sessionId = '') {
	if (!sessionId) {
		return {
			error: {
				message: 'sessionId is empty',
				code: '400',
			},
			status: 'error',
			code: '400',
		};
	}

	try {
		if (!checkKernel(sessionId)) {
			await createKernel(sessionId);
		}

		const response = await requestToKernel('code', sessionId, code);

		if (response?.status === 'error') {
			throw response;
		}
		return response;
	} catch (err) {
		// console.error(err)
		if (err.ename || err.traceback) {
			return {
				status: 'error',
				errorName: err.ename,
				error: err.evalue,
				traceback: err.traceback,
			};
		} else {
			return {
				status: 'error',
				error: 'Internal error',
				content: err.toString(),
			};
		}
	}
};

export const createConnection = async function (sessionId) {
	const ka = kernels[sessionId].kernel_address || 0;

	if (!kernels[sessionId].connecting) {
		kernels[sessionId].connecting = new Promise((resolve, reject) => {

      kernels[sessionId] = kernels[sessionId] || {};

			if (!kernels[sessionId].client) {
				kernels[sessionId].client = new WebSocketClient({
					closeTimeout: 20 * 60 * 1000,
				});
      }

			kernels[sessionId].client.connect(
				`${wsKernelBase(ka)}/api/kernels/${kernels[sessionId].id}/channels`,
			);
			kernels[sessionId].client.on('connect', function (connection) {
				// kernels[sessionId] = kernels[sessionId] || {}
        kernels[sessionId].connection = connection;
        kernels[sessionId].connection.on('close', function (message) {
          Object.values(kernels[sessionId].promises || {}).forEach((promise: any)=>{
            promise.reject('Socket closed '+message);
          })
          kernels[sessionId] = {};
        })
        kernels[sessionId].connection.on('error', function (message) {
          Object.values(kernels[sessionId].promises || {}).forEach((promise: any)=>{
            promise.reject('Socket error '+message);
          })
          kernels[sessionId] = {};
        })
				kernels[sessionId].connection.on('message', function (message) {
					try {

            var response;
            var msg_id;

            if (message.type === 'utf8') {
              response = JSON.parse(message.utf8Data);
              msg_id = response.parent_header.msg_id;
              var result;
              if (response.msg_type === 'execute_result') {
                result = response.content.data['text/plain'];
              } else if (response.msg_type === 'error') {
                console.error('msg_type error on', sessionId);
                result = {
                  ...response.content,
                  status: 'error',
                  _response: response,
                };
              }
            } else {
              console.warn({
                status: 'error',
                content: 'Response from gateway is not utf8 type',
                error: 'Message type error',
                message: message,
              });
              result = message;
            }

						if (!kernels[sessionId]) {
              console.log('Unresolved result (no kernel)', sessionId);
							throw new Error('Message received without kernel session');
						} else if (!kernels[sessionId].promises) {
              console.log('Unresolved result (no promise pool)', sessionId);
							throw new Error('Message received without promises pool');
            } else if (!kernels[sessionId].promises[msg_id]) {
              if (response.msg_type === 'execute_result') {
                console.log('Unresolved result (wrong msg_id)', msg_id, sessionId);
                throw new Error('Message received for unexecpected promise');
              }
            } else if (['execute_result', 'error'].includes(response.msg_type)) {
              kernels[sessionId].promises[msg_id].resolve(result);
            }

					} catch (err) {
						console.error(err.message);
					}
				});
				console.log('Connection created', sessionId);
				resolve(kernels[sessionId].connection);
			});
			kernels[sessionId].client.on('connectFailed', function (error) {
				kernels[sessionId].connection = false;
				console.error(
					'Connection to Jupyter Kernel Gateway failed',
					wsKernelBase(ka),
					kernels[sessionId].id,
				);
				reject(error);
			});
		});
	}

	return kernels[sessionId].connecting;
};

const createKernel = async function (sessionId, ka : any = undefined) {
	try {
		let tries = 3;
		while (tries > 0) {
			try {

        if (!kernels[sessionId]) {
          kernels[sessionId] = {};
        }

        if (kernels[sessionId].kernel_address && ka === undefined) {
          ka = kernels[sessionId].kernel_address;
        }

				const kernelResponse = await axios.post(
          `${kernelBase(ka)}/api/kernels`
        );

        const uuid = Buffer.from(uuidv1(), 'utf8').toString('hex');


				kernels[sessionId] = {
					...kernels[sessionId],
					kernel_address: ka,
					id: kernelResponse.data.id,
					uuid,
        };

        break;

			} catch (err) {

				console.error('Kernel creating error, retrying', 3 - tries);
				tries--;
				if (tries > 0) {
					continue;
				}
				console.error(err);
        throw new Error('Kernel creation went wrong');

			}
		}
		// console.log('Kernel created', sessionId, ka);
		return sessionId;
	} catch (err) {
		throw new Error('Kernel creation went wrong');
	}
};

const checkKernel = function (sessionId) {
	return kernels[sessionId] && kernels[sessionId].id;
};

const clearKernel = async function (sessionId) {
	await deleteKernel(sessionId);
	kernels[sessionId] = {};
	return kernels[sessionId];
};

export const getKernel = function (sessionId) {
	return kernels[sessionId];
};

export const setKernel = function (sessionId, kernelObject) {
	kernels[sessionId] = kernelObject || {};
	return kernels[sessionId] || {};
};

const deleteKernel = async function (sessionId) {
	try {
		if (checkKernel(sessionId)) {
			const _id = kernels[sessionId].id;
			const ka = kernels[sessionId].kernel_address || 0;
			const kernelResponse = await axios.delete(`${kernelBase(ka)}/api/kernels/${_id}`);

			kernels[sessionId].id = false;
			console.log('Deleting Session', sessionId, _id);
		}
	} catch (err) {}
	return kernels[sessionId];
};

export const deleteEveryKernel = async function () {
	try {
		for (let i = 0; i < kernel_bases.length; i++) {
			try {

				const { data: kernels } = await axios.get(
					`${kernelBase(i)}/api/kernels`,
				);

				kernels.forEach(async (kernel) => {
					console.log(`Deleting kernel ${kernel.id}`);
					await axios.delete(`${kernelBase(i)}/api/kernels/${kernel.id}`);
				});
			} catch (err) {
				console.error('Error deleting kernels on', kernelBase(i));
			}
		}
	} catch (err) {
		console.error('Error on Kernels deleting');
	}
};

const handleResponse = function (response) {
	try {
		if (
			typeof response === 'object' &&
			!response['text/plain'] &&
			response['status']
		) {
			return response;
		} else if (typeof response === 'object' && response['text/plain']) {
			response = response['text/plain'];
		}

		if (typeof response !== 'string') {
			throw response;
		}

		const bracketIndex = response.indexOf('{');

		if (bracketIndex < 0) {
			throw { message: 'Invalid response format', response };
		}

		response = response.substr(bracketIndex);
		response = trimCharacters(response, "'");
		response = response.replace(/\bNaN\b/g, null);
		response = response.replace(/\\+\'/g, "'");
		response = response.replace(/\\\\"/g, '\\"');
		return JSON.parse(response);
	} catch (error) {
		console.error(error.toString());
		return JSON.parse(response);
	}
};

export default {
	getKernel,
	setKernel,
	runCode,
	requestToKernel,
	initializeKernel,
	deleteEveryKernel,
};
