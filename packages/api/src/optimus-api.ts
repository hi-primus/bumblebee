import { KernelRoutines } from "./kernel-routines";

const sessions = [];

export const sessionAddress = function (sessionId) {
  return sessions[sessionId]["address"] || "127.0.0.1:5000";
}

export const initializeKernel = async function (sessionId, payload) {
	return { session: true }
};

export const kernelHandler = async function (sessionId) {
  return sessions[sessionId].kernelHandler
}

export const requestToKernel = async function (type, sessionId, payload, asyncCallback = false) {


  sessions[sessionId] = sessions[sessionId] || {};

  let sessionAddress : any = sessions[sessionId].address;

	let code : string;

  let assertOptimus = !['features','init'].includes(type);

	if (!sessions[sessionId].kernelHandler) {
    sessions[sessionId].kernelHandler = new KernelRoutines(process.env.MEASURE_TIME);
  }

	switch (type) {
    case 'init':
      payload.engine = payload.engine || process.env.ENGINE || 'pandas';
      code = sessions[sessionId].kernelHandler.init(payload);
      break;
    case 'code':
      code = sessions[sessionId].kernelHandler.code(payload);
      break;
    case 'asyncCode':
      code = sessions[sessionId].kernelHandler.asyncCode(payload);
      break;
    default:
      code = sessions[sessionId].kernelHandler[type](payload);
      break;
	}

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
	return true;
};

const createKernel = async function (sessionId, ka : any = undefined) {
	return true;
};

const checkKernel = function (sessionId) {
	return true;
};

const clearKernel = async function (sessionId) {
	return true;
};

export const getKernel = function (sessionId) {
	return sessions[sessionId];
};

export const setKernel = function (sessionId, kernelObject) {
	sessions[sessionId] = kernelObject || {};
	return sessions[sessionId] || {};
};

export const deleteKernel = async function (sessionId) {
	return true;
};

export const deleteEveryKernel = async function () {
	return true;
};

export default {
	getKernel,
	setKernel,
	runCode,
	requestToKernel,
	initializeKernel,
	deleteKernel,
	deleteEveryKernel
};
