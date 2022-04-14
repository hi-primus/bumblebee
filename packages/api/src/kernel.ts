import { KernelConnection, ServerConnection, KernelAPI, KernelMessage } from "@jupyterlab/services";

async function executeCode(sessionId: string, code: string) {

	const connection: KernelConnection = kernels[getKernelId(sessionId)].connection;
	
	let request = connection.requestExecute({
		code,
		store_history: false,
		allow_stdin: false,
		stop_on_error: false
	}, true);

	// let outputs: string[] | null = [];

	let response: any = {};

	request.onIOPub = (msg: KernelMessage.IIOPubMessage) => {
		if ( ["execute_result", "display_data"].includes(msg.header.msg_type) ) {
			
			const data = (msg as KernelMessage.IExecuteResultMsg).content.data['text/plain'] as string;
			
			if (msg.header.msg_type == "execute_result") {
				response = handleResponse(data);
			}

			// if (Array.isArray(outputs)) {
			// 	outputs.push(data);
			// } else {
			// 	console.log("unhandled", {data, msg_type: msg.header.msg_type});
			// }

		}
	};

	const statusResponse = await request.done;
	
	if (statusResponse.content.status === "error") {

		response = {
			...statusResponse.content,
			status: "error",
			_response: statusResponse
		},
		response = handleResponse(response);

		if (response.ename || response.traceback) {
			return {
				status: 'error',
				errorName: response.ename,
				error: response.evalue,
				traceback: response.traceback
			};
		} else {
			if (response.interrupt) {
				return {
					status: 'error',
					error: response.message || response.error,
					interrupt: true
				};
			}
			return {
				status: 'error',
				error: 'Unknown error',
				content: response
			};
		}

	} else {
		response = {
			...response,
			_response: statusResponse
		}
	}

	return response;
}

async function _createConnection (sessionId: string, kernelAddress: string) {

	let serverSettings = ServerConnection.makeSettings({
		baseUrl: kernelAddress,
	});

	let kernel = await KernelAPI.startNew({}, serverSettings)

	let model = await KernelAPI.getKernelModel(kernel.id, serverSettings)
	
	let connection = new KernelConnection({
		model,
		serverSettings
	});

	connection.iopubMessage.connect((sender: KernelConnection, msg: KernelMessage.IIOPubMessage) => {

		if ( ["execute_result", "display_data"].includes(msg.header.msg_type) ) {

			let isAsyncOut = false;
			let responseBody;
			
			try {
				let data = (msg as KernelMessage.IExecuteResultMsg).content.data['text/plain'] as string;
				let response = handleResponse(data);

				isAsyncOut = response?.async_out && response?.key;

				if (isAsyncOut && ['finished', 'error'].includes(response?.status)) {
					responseBody = response;
				}
				
				
			} catch (err) {
				if (msg.header.msg_type == 'execute_result' && isAsyncOut) {
					responseBody = {
						status: 'error',
						error: err.message
					}
				}
			}

			let asyncReply = kernels[getKernelId(sessionId)].asyncReply || (a => console.warn(`Warning, async reply callback is not defined. ${a}`));
			
			if (asyncReply && responseBody) {
				asyncReply(responseBody);
			}
		}

	});

	kernels[getKernelId(sessionId)] = {
		...kernels[getKernelId(sessionId)],
		kernel,
		serverSettings,
		model,
		connection
	}

	return sessionId;
}	

import axios from 'axios';
import { v1 as uuidv1 } from 'uuid';
import { KernelRoutines } from "./kernel-routines";

import { InterruptError, handleResponse } from 'bumblebee-utils'

let Queue = require('better-queue');

const kernels = [];
const configs = {};
const aliases = {};
const requests: { [fieldName: string]: typeof Queue } = {};

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
		// blank kernel
		kernels[getKernelId(sessionId)] = await resetKernel(sessionId);
	} else {
		// default kernel
		kernels[getKernelId(sessionId)] = kernels[getKernelId(sessionId)] || {};
	}

	// Create initialization payload
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
		!kernels[getKernelId(sessionId)].kernel ||
		!kernels[getKernelId(sessionId)].connection
	) {
		return false;
	}

	kernels[getKernelId(sessionId)].initialized = result;
	kernels[getKernelId(sessionId)].initializationPayload = payload;
	kernels[getKernelId(sessionId)].asyncReply = payload.asyncReply;
	
	return result;
};

const assertConnection = async function (
	sessionId,
  kernel_address : any = undefined,
	assertOptimus = true
) {
	try {
		if (!kernels[getKernelId(sessionId)] || !kernels[getKernelId(sessionId)].kernel) {
			await createKernelConnection(sessionId, kernel_address);
		}

		if (!kernels[getKernelId(sessionId)] || !kernels[getKernelId(sessionId)].kernel) {
			throw new Error('Kernel creation went wrong');
		}

    if (assertOptimus) {
      if (!(kernels[getKernelId(sessionId)].initialized || kernels[getKernelId(sessionId)].kernel)) {
        if (!kernels[getKernelId(sessionId)].initialization) {
          kernels[getKernelId(sessionId)].initialization = initializeOptimusSession(sessionId, {
            payloadDefault: true,
          });
        }
        await kernels[getKernelId(sessionId)].initialization;
        kernels[getKernelId(sessionId)].initialization = false;
      }
    }

		return { status: "ok", connection: kernels[getKernelId(sessionId)].connection, error: false};

	} catch (error) {
		return { status: "error", connection: false, error };
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

	const connectionAssertion = await assertConnection(
		sessionId,
    kernelAddress,
		assertOptimus
	);

	if (connectionAssertion.status == "error" || !connectionAssertion.connection) {
		if (assertOptimus) {
			console.error('Assertion error when checking connection and optimus');
		} else {
			console.error('Assertion error when checking connection');
		}
		throw connectionAssertion.error || new Error('Assertion error')
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

	let response;

	try {
		let toInterrupt = kernels[getKernelId(sessionId)].toInterrupt || [];
		if (toInterrupt.includes(options.timestamp)) {
			kernels[getKernelId(sessionId)].toInterrupt = toInterrupt.filter((t) => t !== options.timestamp);
			throw new InterruptError(`Request ${options.timestamp} interrupted early by user`);
		}
		response = await executeCode(sessionId, code);
		
	} catch (err) {
		response = err;
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
		
		let responseBody = { interrupt: false, reject: false, queueId: false };
		// let runningTask = kernels[getKernelId(sessionId)].runningTask;
		
		// if (taskIdOrType && runningTask && [runningTask.id, runningTask.type].includes(taskIdOrType)) {

		// 	console.debug(`Request to interrupt now: ${taskIdOrType}. Running task: ${runningTask.id}`);
	
		// 	const latePromise = kernels[getKernelId(sessionId)]?.promises[runningTask.msgId];
			
		// 	if (latePromise?.reject) {
		// 		console.debug(`Rejecting: ${taskIdOrType}`);
		// 		latePromise.reject(new InterruptError(`Request ${taskIdOrType} interrupted by user`));
		// 		responseBody.reject = true;
		// 	}
		
		// // TODO: Use jupyter services to interrupt
		// 	const id = kernels[getKernelId(sessionId)].id;
		// 	const ka = configKernel(sessionId).kernel_address || 0;
		// 	await axios.post(`${kernelBase(ka)}/api/kernels/${id}/interrupt`);
						
		// 	runningTask = null;
		// 	kernels[getKernelId(sessionId)].runningTask = null;
		// 	responseBody.interrupt = true;
		// }
		
		if (!responseBody.interrupt && typeof taskIdOrType === 'number') {
			// console.debug(`Request to interrupt later: ${taskIdOrType}`);
			kernels[getKernelId(sessionId)].toInterrupt = kernels[getKernelId(sessionId)].toInterrupt || [];
			kernels[getKernelId(sessionId)].toInterrupt.push(taskIdOrType);
			responseBody.queueId = true;
		}
		
		responseBodies.push(responseBody);

		// if (!responseBody.interrupt && !responseBody.queueId) {
		// 	console.warn(`Could not interrupt task ${taskIdOrType} with type ${typeof taskIdOrType}. Currently running: ${runningTask?.id}`);
		// }
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
			if (err.interrupt) {
				response = {
					error: err.message,
					status: 'error',
					interrupt: true,
				};
			} else {
				response = {
					error: 'Internal error',
					err,
					status: 'error',
				};
			}
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
		if (!checkKernelConnection(sessionId)) {
			await createKernelConnection(sessionId);
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
				errorName: err.errorName || err.ename,
				error: err.error || err.evalue,
				traceback: err.traceback,
			};
		}

		console.error("err", err)

		let contentErr = err instanceof Error ? err.toString() : err;
		
		if (err.interrupt) {
			return {
				status: 'error',
				error: err.message || err.error,
				interrupt: true,
			};
		} else {
			return {
				status: 'error',
				error: 'Internal error',
				content: contentErr,
			};
		}
	}
};

const createKernelConnection = async function (sessionId, kernelAddress : any = undefined) {
	try {
		let tries = 3;
		while (tries > 0) {
			try {

        if (!kernels[getKernelId(sessionId)]) {
          kernels[getKernelId(sessionId)] = {};
        }

        if (configKernel(sessionId).kernel_address && kernelAddress === undefined) {
          kernelAddress = configKernel(sessionId).kernel_address;
        }

				await _createConnection(sessionId, kernelBase(kernelAddress));

				configKernel(sessionId, {kernel_address: kernelAddress});			

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

const checkKernelConnection = function (sessionId) {
	return kernels[getKernelId(sessionId)] && kernels[getKernelId(sessionId)].kernel;
};

const resetKernel = async function (sessionId) {
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

	// TO-DO: use jupyter service to delete kernel

	let id = kernels[getKernelId(sessionId)].kernel?.id;
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
				if (kernels[getKernelId(sessionId)].removeKernel && checkKernelConnection(sessionId)) {
					let kernelResponse = await axios.delete(`${kernelBase(ka)}/api/kernels/${id}`);
		
					kernels[getKernelId(sessionId)].kernel = false;
					kernels[getKernelId(sessionId)].model = false;
					kernels[getKernelId(sessionId)].serverSettings = false;
					kernels[getKernelId(sessionId)].connection = false;
					kernels[getKernelId(sessionId)].initialized = false;
					kernels[getKernelId(sessionId)].initialization = false;
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
