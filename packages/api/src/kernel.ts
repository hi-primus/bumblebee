import { client as WebSocketClient } from 'websocket';
import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';
import { KernelRoutines } from "./kernel-routines";

import { handleResponse } from 'bumblebee-utils'

let Queue = require('better-queue');

const kernels = [];
const configs = {};
const aliases = {};
const requests: { [fieldName: string]: typeof Queue } = {};
const toInterrupt = [];

let runningTask;

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

export const createSession = async function (clientId, sessionId) {
	if (sessionId && kernels[sessionId]) {
		aliases[clientId] = sessionId;
	} else if (clientId) {
		kernels[getKernelId(clientId)] = kernels[getKernelId(clientId)] || {};
	}
	
	kernels[getKernelId(clientId)].removeKernel = false;
	
	return kernels[getKernelId(clientId)];
};

export const initializeKernel = async function (sessionId, payload) {
	let result = false;

	if (payload?.reset !== false) {
		kernels[getKernelId(sessionId)] = await clearKernel(sessionId);
	} else {
		kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
	}
	if (!kernels[getKernelId(sessionId)].initialization) {
		kernels[getKernelId(sessionId)].initialization = initializeOptimusSession(
			sessionId,
			payload,
		);
		result = await kernels[getKernelId(sessionId)].initialization;
	}
	kernels[getKernelId(sessionId)].initialization = false;
	return { kernel: kernels[getKernelId(sessionId)], result };
};

export const initializeOptimusSession = async function (sessionId, payload) {

	let result;

	if (
		!payload &&
		kernels[getKernelId(sessionId)] &&
		kernels[getKernelId(sessionId)].initializationPayload
	) {
		payload = kernels[getKernelId(sessionId)].initializationPayload;
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
				let contentErr = err instanceof Error ? err.toString() : err;
				deleteKernel(sessionId);
				return {
					error: 'Internal error trying to create a kernel',
          content: contentErr,
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
		!kernels[getKernelId(sessionId)] ||
		!kernels[getKernelId(sessionId)].id ||
		!kernels[getKernelId(sessionId)].connection
	) {
		return false;
	}

	kernels[getKernelId(sessionId)].initialized = result;
	kernels[getKernelId(sessionId)].initializationPayload = payload;

	return result;
};

const assertConnection = async function (
	sessionId,
  kernel_address : any = undefined,
	assertOptimus = true
) {
	try {
		if (!kernels[getKernelId(sessionId)] || !kernels[getKernelId(sessionId)].id) {
			await createKernel(sessionId, kernel_address);
		}

		if (!kernels[getKernelId(sessionId)] || !kernels[getKernelId(sessionId)].id) {
			throw new Error('Kernel creation went wrong');
		}

		await createConnection(sessionId);

    if (assertOptimus) {
      if (!(kernels[getKernelId(sessionId)].initialized || kernels[getKernelId(sessionId)].id)) {
        if (!kernels[getKernelId(sessionId)].initialization) {
          kernels[getKernelId(sessionId)].initialization = initializeOptimusSession(sessionId, {
            payloadDefault: true,
          });
        }
        await kernels[getKernelId(sessionId)].initialization;
        kernels[getKernelId(sessionId)].initialization = false;
      }
    }

		return { status: "ok", content: kernels[getKernelId(sessionId)].connection};

	} catch (error) {
		return { status: "error", error };
	}
};

export const kernelHandler = function (sessionId) {

	if (!kernels[getKernelId(sessionId)].kernelHandler) {
    kernels[getKernelId(sessionId)].kernelHandler = new KernelRoutines(process.env.MEASURE_TIME);
  }

  return kernels[getKernelId(sessionId)].kernelHandler;
}

export const requestToKernel = async function (type, sessionId, payload, options : any = {}, asyncCallback = false): Promise<any> {

  kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};

  let kernelAddress : any = configKernel(sessionId).kernel_address;

  let assertOptimus = true;

	
  if (['features','init'].includes(type)) {
		
		if (process.env.OPTIMUS_PATH && !payload.optimusPath) {
			payload.optimusPath = process.env.OPTIMUS_PATH;
		}

		if (payload.optimusPath) {
			console.log("Using local Optimus", payload.optimusPath);
		}
		
    assertOptimus = false;

    if (payload.jupyter_address && payload.jupyter_address.ip && payload.jupyter_address.port) {
      kernelAddress = payload.jupyter_address.ip + ':' + payload.jupyter_address.port;
			configKernel(sessionId, { kernel_address: kernelAddress });
      console.log(`Using kernel address ${kernelAddress} on session ${sessionId}`);
    }

		configKernel(sessionId, { usePrefect: payload.usePrefect });
  }

	const connection = await assertConnection(
		sessionId,
    kernelAddress,
		assertOptimus
	);

	if (connection.status == "error" || !connection.content) {
		if (assertOptimus) {
			console.error('Assertion error when checking connection and optimus');
		} else {
			console.error('Assertion error when checking connection');
		}
		throw connection.error || new Error('Assertion error')
	}

	const startTime = new Date().getTime();

	let code = payload;

	if (!kernels[getKernelId(sessionId)].kernelHandler) {
    kernels[getKernelId(sessionId)].kernelHandler = new KernelRoutines(process.env.MEASURE_TIME);
  }

	switch (type) {
    case 'init':
      payload.engine = payload.engine || process.env.ENGINE || 'pandas';
      code = kernels[getKernelId(sessionId)].kernelHandler.init(payload);
      break;
    case 'code':
      code = kernels[getKernelId(sessionId)].kernelHandler.code(payload);
      break;
    case 'asyncCode':
      code = kernels[getKernelId(sessionId)].kernelHandler.asyncCode(payload);
      break;
    default:
      code = kernels[getKernelId(sessionId)].kernelHandler[type](payload);
      break;
	}

	const msg_id = kernels[getKernelId(sessionId)].uuid + Math.random();

	const hdr = {
		msg_id: msg_id,
		session: kernels[getKernelId(sessionId)].uuid,
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

	if (!kernels[getKernelId(sessionId)].promises) {
		kernels[getKernelId(sessionId)].promises = {};
	}

	const response: any = await new Promise((resolve, reject) => {
		kernels[getKernelId(sessionId)].promises[msg_id] = { resolve, reject };
		try {
			if (toInterrupt.includes(options.timestamp)) {
				throw new Error("Request interrupted early by user");
			}
			runningTask = {id: options.timestamp, type: options.category, msgId: msg_id};
			if (asyncCallback) {
				kernels[getKernelId(sessionId)].promises[msg_id].resolveAsync = asyncCallback;
			}
			kernels[getKernelId(sessionId)].connection.sendUTF(JSON.stringify(codeMsg));
		} catch (err) {
			reject(err);
		}
	});

	const endTime = new Date().getTime();

	response._serverTime = {
		start: startTime / 1000,
		end: endTime / 1000,
		duration: (endTime - startTime) / 1000,
	};

	return response;
};


export const interruptRequest = async function (sessionId, taskIdsOrTypes : (string | number)[] | string | number) {

	taskIdsOrTypes = [taskIdsOrTypes].flat(1);
	kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};

	let responseBodies = [];

	for (let taskIdOrType of taskIdsOrTypes) {
		
		let responseBody = {interrupt: false, reject: false, queueId: false};
		
		if (taskIdOrType && runningTask && [runningTask.id, runningTask.type].includes(taskIdOrType)) {
	
			const latePromise = kernels[getKernelId(sessionId)]?.promises[runningTask.msgId];
			const id = kernels[getKernelId(sessionId)].id;
			const ka = configKernel(sessionId).kernel_address || 0;
			let response = await axios.post(`${kernelBase(ka)}/api/kernels/${id}/interrupt`);
			
			responseBody.interrupt = true;
			
			if (latePromise?.reject) {
				latePromise.reject(new Error("Request interrupted by user"));
				responseBody.reject = true;
			}
			
			runningTask = null;
		}
		
		if (!responseBody.interrupt && typeof taskIdOrType === 'number') {
			toInterrupt.push(taskIdOrType);
			responseBody.queueId = true;
		}
		
		responseBodies.push(responseBody);

		if (!responseBody.interrupt) {
			console.warn(`Could not interrupt task ${taskIdOrType}, ${typeof taskIdOrType}`, runningTask);
		}
	}

	return responseBodies.length === 1 ? responseBodies[0] : responseBodies;
}

export const configKernel = function (sessionId, payload = {}) {

	if (!configs[getKernelId(sessionId)]) {
		configs[getKernelId(sessionId)] = {};
	}

  configs[getKernelId(sessionId)] = {
		...configs[getKernelId(sessionId)],
		...payload
	};

	return configs[getKernelId(sessionId)];

}

const DEFAULT_PRIORITY = 100;

const PRIORITIES = {
	requirement: 9,
	preview_sample: 8,
	sample: 7,
	preview_profiling: 6,
	operation: 5,
	after_update: 4,
	profiling: 3,
	info: 2,
	profiling_low: 1
}

const newQueue = function (sessionId) {
	return new Queue(async (task, cb)=>{
		let response;
		try {
			let promise = requestToKernel(task.type, sessionId, task.code, task.options, task.asyncCallback);
			if (task.options?.immediate) {
				response = promise;
			} else {
				response = await promise;
			}
		} catch (err) {
			response = {
				error: 'Internal error',
				err,
				status: 'error',
			};
		}
		cb(response);
	}, {
		id: 'id',
		filo: true,
		priority: (task, cb) => {
			let priority =  task.options?.immediate ? DEFAULT_PRIORITY : PRIORITIES[task.options?.category];
			if (!priority) {
				console.warn(`Unknown category ${task.options?.category} using highest priority`);
				priority = DEFAULT_PRIORITY;
			}
			return cb(null, priority);
		}
	});
}

const queueRequest = function (type, sessionId, code, options = {immediate: false}, asyncCallback = false) {
	return new Promise((res, rej) => {
		try {
			requests[sessionId] = requests[sessionId] || newQueue(sessionId);
			const id = Buffer.from(uuidv1(), 'utf8').toString('hex');
			requests[sessionId].push({
				id, type, code, options, asyncCallback
			}, res);
		} catch (err) {
			rej(err);
		}
	});
};

export const removeFromQueue = function (sessionId, category) {
	if (!Array.isArray(category)) {
		category = [category];
	}

	// get priorities from categories

	let priorities = category.map(c => PRIORITIES[c] || DEFAULT_PRIORITY);

	if (requests[sessionId]) {

		// get all the tasks with the given priority

		let taskIds = Object.entries(requests[sessionId]._store._priorities)
			.filter(([, priority]) => priorities.includes(priority))
			.map(([id]) => id);
		
		for (let i=0; i<taskIds.length; i++) {
			requests[sessionId].cancel(taskIds[i]);
		}

		return taskIds.length;
	}
	
	return false;
}

export const runCode = async function (code = '', sessionId = '', options = {category: false, immediate: false}, asyncCallback = false) {
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

		let queueLength;
		let startTime
		
		if (process.env.MEASURE_TIME) {
			startTime = new Date().getTime();
			queueLength = requests[sessionId] ? Object.keys(requests[sessionId]._store._priorities).length : -1;
		}

    let response;

    if (asyncCallback) {
			response = await queueRequest('asyncCode', sessionId, code, options, asyncCallback);
    } else {
      response = await queueRequest('code', sessionId, code, options, undefined);
    }

		if (response.constructor == Promise) {
			response = await response;
		}

		if (process.env.MEASURE_TIME) {
			const endTime = new Date().getTime();
			response._queueTime = {
				start: startTime / 1000,
				end: endTime / 1000,
				duration: (endTime - startTime) / 1000,
				length: queueLength
			};
			response._queueTime.lengthAfter = requests[sessionId] ? Object.keys(requests[sessionId]._store._priorities).length : -1;
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
      let contentErr = err instanceof Error ? err.toString() : err;
			return {
				status: 'error',
				error: 'Internal error',
				content: contentErr,
			};
		}
	}
};

export const createConnection = async function (sessionId) {

  kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};

  const ka = configKernel(sessionId).kernel_address || 0;

	if (!kernels[getKernelId(sessionId)].connecting) {
		kernels[getKernelId(sessionId)].connecting = new Promise((resolve, reject) => {

      kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};

			if (!kernels[getKernelId(sessionId)].client) {
				kernels[getKernelId(sessionId)].client = new WebSocketClient({
					closeTimeout: 20 * 60 * 1000,
				});
      }

			console.log(`Connecting to kernel ${wsKernelBase(ka)} (${getKernelId(sessionId)})`);

			kernels[getKernelId(sessionId)].client.connect(
				`${wsKernelBase(ka)}/api/kernels/${kernels[getKernelId(sessionId)].id}/channels`,
			);

			kernels[getKernelId(sessionId)].client.on('connect', function (connection) {
				// kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
        kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
        kernels[getKernelId(sessionId)].connection = connection;

        kernels[getKernelId(sessionId)].connection.on('close', function (message) {
          Object.values(kernels[getKernelId(sessionId)]?.promises || {}).forEach((promise: any)=>{
            promise.reject(`Socket closed: "${message}"`);
          })
          kernels[getKernelId(sessionId)] = {};
        })

        kernels[getKernelId(sessionId)].connection.on('error', function (message) {
          Object.values(kernels[getKernelId(sessionId)]?.promises || {}).forEach((promise: any)=>{
            promise.reject(`Socket error: "${message}"`);
          })
          kernels[getKernelId(sessionId)] = {};
        })

				kernels[getKernelId(sessionId)].connection.on('message', function (message) {
					try {

            let message_response;
            let msg_id;
            let response;

            if (message.type === 'utf8') {
              message_response = JSON.parse(message.utf8Data);
              msg_id = message_response.parent_header.msg_id;

              if (['execute_result', 'display_data'].includes(message_response.msg_type)) {

                response = message_response.content.data['text/plain'];

                let future_key;

                try {
                  let handledResponse = handleResponse(response);
                  response = handledResponse;
                  future_key = response?.key;
                } catch (err) {
                  if (message_response.msg_type == 'execute_result') {
                    throw err;
                  }
                }

                if (future_key) {
                  if (kernels[getKernelId(sessionId)].promises[future_key]) {
                    msg_id = future_key;
                  } else if (kernels[getKernelId(sessionId)].promises[msg_id].resolveAsync && future_key !== msg_id) {
                    kernels[getKernelId(sessionId)].promises[future_key] = kernels[getKernelId(sessionId)].promises[msg_id];
                    delete kernels[getKernelId(sessionId)].promises[msg_id];
                    msg_id = future_key;
                  }
                }
                else if (message_response.msg_type=='display_data') {
                  console.warn('Unknown display output', response);
                  return;
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
              response = handleResponse(message);
            }

            if (message_response && message_response.msg_type && response) {
              response._type = message_response.msg_type;
            }

						if (!kernels[getKernelId(sessionId)]) {

              console.log('Unresolved response (no kernel)', sessionId);
							throw new Error('Message received without kernel session');

						} else if (!kernels[getKernelId(sessionId)].promises) {

              console.log('Unresolved response (no promise pool)', sessionId);
							throw new Error('Message received without promises pool');

            } else if (!kernels[getKernelId(sessionId)].promises[msg_id]) {

              if (message_response.msg_type === 'execute_result') {
                console.log('Unresolved response (wrong msg_id)', msg_id, sessionId);
                throw new Error('Message received for unexecpected promise');
              }

            } else if (['execute_result', 'error'].includes(message_response.msg_type)) {

              kernels[getKernelId(sessionId)].promises[msg_id].resolve(response);

            } else if (['finished', 'error'].includes(response?.status) && kernels[getKernelId(sessionId)].promises[msg_id].resolveAsync) {

              kernels[getKernelId(sessionId)].promises[msg_id].resolveAsync(response)

            }

					} catch (err) {
						console.error(err.message || err);
					}
				});

				console.log('Connection', sessionId);

        setTimeout(() => { //
          console.log('Connection created', sessionId, getKernelId(sessionId));
          console.log('Total connections:', Object.keys(kernels).length);
					clearUnusedKernels(0, 1000, [getKernelId(sessionId)]);
					let connection = kernels[getKernelId(sessionId)]?.connection
					if (connection) {
						resolve(connection);
					} else {
						reject(new Error(`Connection not created for ${sessionId}`));
					}
        }, 1000);

			});

			kernels[getKernelId(sessionId)].client.on('connectFailed', function (error) {
				kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
				kernels[getKernelId(sessionId)].connection = false;
				console.error(
					'Connection to Jupyter Kernel Gateway failed',
					wsKernelBase(ka),
					kernels[getKernelId(sessionId)].id,
				);
				reject(error);
			});

		});
	}

	return kernels[getKernelId(sessionId)].connecting;
};

const createKernel = async function (sessionId, ka : any = undefined) {
	try {
		let tries = 3;
		while (tries > 0) {
			try {

        if (!kernels[getKernelId(sessionId)]) {
          kernels[getKernelId(sessionId)] = {};
        }

        if (configKernel(sessionId).kernel_address && ka === undefined) {
          ka = configKernel(sessionId).kernel_address;
        }

				console.log(`Creating a kernel for ${sessionId} on ${kernelBase(ka)}...`);

				const kernelResponse = await axios.post(
          `${kernelBase(ka)}/api/kernels`
        );

				console.log(`Kernel created for ${sessionId} on ${kernelBase(ka)}:`, kernelResponse.data.id);

        const uuid = Buffer.from(uuidv1(), 'utf8').toString('hex');


				kernels[getKernelId(sessionId)] = {
					...kernels[getKernelId(sessionId)],
					id: kernelResponse.data.id,
					uuid,
        };

				configKernel(sessionId, {kernel_address: ka});

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
	return kernels[getKernelId(sessionId)] && kernels[getKernelId(sessionId)].id;
};

const clearKernel = async function (sessionId) {
	await deleteKernel(sessionId);
	kernels[getKernelId(sessionId)] = {};
	return kernels[getKernelId(sessionId)];
};

export const getKernelId = function (id) {
	if (!kernels[id] && aliases[id]) {
		return aliases[id];
	}
	return id;
};

export const getKernel = function (sessionId) {
	return kernels[getKernelId(sessionId)];
};

export const setKernel = function (sessionId, kernelObject) {
	kernels[getKernelId(sessionId)] = kernelObject || {};
	return kernels[getKernelId(sessionId)] || {};
};

export const clearUnusedKernels = async function (kernelAddress, t = 0, ignore = []) {
	try {
		const response = await axios.get(
			`${kernelBase(kernelAddress)}/api/kernels`,
		);
	
		ignore = ignore.map(sessionId => kernels[getKernelId(sessionId)]?.id).filter(id => id);
	
		// delete kernels that are in the response and has no connections
	
		response.data.forEach(async (kernel) => {
			if (kernel.connections > 0 || ignore.includes(kernel.id)) {
				return;
			}
			let toDeleteEntry: [string, any] = Object.entries(kernels).find(([key, value]) => value.id === kernel.id);
			let toDelete: string;
			if (toDeleteEntry && toDeleteEntry[0]) {
				toDelete = toDeleteEntry[0];
			} else {
				toDelete = kernel.id;
				kernels[kernel.id] = { id: kernel.id };
				configKernel(kernel.id, { kernel_address: kernelAddress });
			}
			deleteKernel(toDelete, t);
		});
	
		// delete kernels that are not in the response
	
		Object.entries(kernels).forEach(([key, value]) => {
			if (value.id && !response.data.find((kernel) => kernel.id === value.id)) {
				if (value.kernel_address === kernelAddress) {
					delete kernels[key];
				}
			}
		});
	} catch (err) {
		console.error(err);
	}


	setTimeout(() => {
		console.log('Total connections:', Object.keys(kernels).length);
	}, t + 100);

}

export const deleteKernel = async function (sessionId, t = 0, immediateIfStarting = false) {
	kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
	kernels[getKernelId(sessionId)].removeKernel = true;

	let id = kernels[getKernelId(sessionId)].id;
	let ka = configKernel(sessionId).kernel_address || 0;

	try {
		if (immediateIfStarting && t>0) {
			let kernelResponse = await axios.get(`${kernelBase(ka)}/api/kernels/${id}`);
		
			if (kernelResponse.data.execution_state === 'starting') {
				console.log('Kernel to remove stuck starting, deleting immediately');
				t = 0;
			}
		}
	} catch (err) {
		console.log({err})
	}

	return new Promise(async (res, rej) => {
		let _delete = async () => {
			try {
				if (kernels[getKernelId(sessionId)].removeKernel && checkKernel(sessionId)) {
					let kernelResponse = await axios.delete(`${kernelBase(ka)}/api/kernels/${id}`);
		
					kernels[getKernelId(sessionId)].id = false;
					console.log('Deleting Session', getKernelId(sessionId), id);
					delete kernels[getKernelId(sessionId)];
				}
			} catch (err) {}
			res(kernels[getKernelId(sessionId)]);
		}

		
		if (t>0) {
			setTimeout(_delete, t);
		} else {
			_delete();
		}

	})
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
	interruptRequest,
	initializeKernel,
	deleteKernel,
	deleteEveryKernel
};
