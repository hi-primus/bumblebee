import { client as WebSocketClient } from 'websocket';
import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';
import kernelRoutines from './kernel-routines.js';

import { handleResponse } from 'bumblebee-utils'

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
		kernels[sessionId].initialization = initializeOptimusSession(
			sessionId,
			payload,
		);
		result = await kernels[sessionId].initialization;
	}
	kernels[sessionId].initialization = false;
	return { kernel: kernels[sessionId], result };
};

export const initializeOptimusSession = async function (sessionId, payload) {

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
					error: 'Internal error trying to create a kernel',
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

const assertConnection = async function (
	sessionId,
  kernel_address : any = undefined,
	assertOptimus = true
) {
	try {
		if (!kernels[sessionId] || !kernels[sessionId].id) {
			await createKernel(sessionId, kernel_address);
		}

		if (!kernels[sessionId] || !kernels[sessionId].id) {
			throw new Error('Kernel creation went wrong');
		}

		await createConnection(sessionId);

    if (assertOptimus) {
      if (!(kernels[sessionId].initialized || kernels[sessionId].id)) {
        if (!kernels[sessionId].initialization) {
          kernels[sessionId].initialization = initializeOptimusSession(sessionId, {
            payloadDefault: true,
          });
        }
        await kernels[sessionId].initialization;
        kernels[sessionId].initialization = false;
      }
    }

		return kernels[sessionId].connection;
	} catch (err) {
		// console.error('WebSocket Error');
		// console.error(err);
		return undefined;
	}
};

export const requestToKernel = async function (type, sessionId, payload, asyncCallback = false) {

  kernels[sessionId] = kernels[sessionId] || {};

  var kernelAddress : any = kernels[sessionId].kernel_address;

  if (type == 'init' && !kernelAddress && payload.jupyter_address && payload.jupyter_address.ip && payload.jupyter_address.port) {
    kernelAddress = payload.jupyter_address.ip + ':' + payload.jupyter_address.port;
    kernels[sessionId].kernel_address = kernelAddress;
  }

  let assertOptimus = true;

  if (['features','init'].includes(type)) {
    assertOptimus = false;
  }

	const connection = await assertConnection(
		sessionId,
    kernelAddress,
		assertOptimus
	);

	if (!connection) {
		throw 'Socket error';
	}

	const startTime = new Date().getTime();

	let code = payload;

	switch (type) {
    case 'init':
      payload.engine = payload.engine || process.env.ENGINE || 'dask';
      code = kernelRoutines.init(payload);
      break;
    case 'code':
      code = kernelRoutines.code(payload);
      break;
    case 'asyncCode':
      code = kernelRoutines.asyncCode(payload);
      break;
    default:
      code = kernelRoutines[type](payload);
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

	const response: any = await new Promise((resolve, reject) => {
		kernels[sessionId].promises[msg_id] = { resolve, reject };
    if (asyncCallback) {
      kernels[sessionId].promises[msg_id].resolveAsync = asyncCallback;
    }
    kernels[sessionId].connection.sendUTF(JSON.stringify(codeMsg));
	});

	const endTime = new Date().getTime();

	response._serverTime = {
		start: startTime / 1000,
		end: endTime / 1000,
		duration: (endTime - startTime) / 1000,
	};

	return response;
};

export const runCode = async function (code = '', sessionId = '', asyncCallback = false) {
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

    let response;

    if (asyncCallback) {
      response = await requestToKernel('asyncCode', sessionId, code, asyncCallback);
    } else {
      response = await requestToKernel('code', sessionId, code);
    }

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
      console.error(err)
			return {
				status: 'error',
				error: 'Internal error',
				content: err.toString(),
			};
		}
	}
};

export const createConnection = async function (sessionId) {

  kernels[sessionId] = kernels[sessionId] || {};

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
				// kernels[sessionId] = kernels[sessionId] || {};
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

            var message_response;
            var msg_id;

            if (message.type === 'utf8') {
              message_response = JSON.parse(message.utf8Data);
              msg_id = message_response.parent_header.msg_id;
              var response;

              if (['execute_result', 'display_data'].includes(message_response.msg_type)) {

                response = message_response.content.data['text/plain'];
                response = handleResponse(response);

                let future_key = response?.key;

                if (future_key && kernels[sessionId].promises[future_key]) {
                  msg_id = future_key;
                } else if (kernels[sessionId].promises[msg_id].resolveAsync && future_key && future_key !== msg_id) {
                  kernels[sessionId].promises[future_key] = kernels[sessionId].promises[msg_id];
                  delete kernels[sessionId].promises[msg_id];
                  msg_id = future_key;
                }

              } else if (message_response.msg_type === 'error') {
                console.error('msg_type error on', sessionId);
                response = {
                  ...message_response.content,
                  status: 'error',
                  _response: message_response,
                };
                response = handleResponse(response);
              }
            } else {
              console.warn({
                status: 'error',
                content: 'Response from gateway is not utf8 type',
                error: 'Message type error',
                message: message,
              });
              response = handleResponse(message) ;
            }

						if (!kernels[sessionId]) {

              console.log('Unresolved response (no kernel)', sessionId);
							throw new Error('Message received without kernel session');

						} else if (!kernels[sessionId].promises) {

              console.log('Unresolved response (no promise pool)', sessionId);
							throw new Error('Message received without promises pool');

            } else if (!kernels[sessionId].promises[msg_id]) {

              if (message_response.msg_type === 'execute_result') {
                console.log('Unresolved response (wrong msg_id)', msg_id, sessionId);
                throw new Error('Message received for unexecpected promise');
              }

            } else if (['execute_result', 'error'].includes(message_response.msg_type)) {

              kernels[sessionId].promises[msg_id].resolve(response);

            } else if (response?.status == "finished" && kernels[sessionId].promises[msg_id].resolveAsync) {

              kernels[sessionId].promises[msg_id].resolveAsync(response)

            }

					} catch (err) {
						console.error(err.message || err);
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

export default {
	getKernel,
	setKernel,
	runCode,
	requestToKernel,
	initializeKernel,
	deleteEveryKernel,
};
