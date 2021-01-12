import {
	SubscribeMessage,
	WebSocketGateway,
	OnGatewayInit,
	WsResponse,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from "uuid";

import {
	runCode,
	initializeKernel,
	deleteEveryKernel,
	requestToKernel,
} from './kernel';
import kernelRoutines from './kernel-routines';
import { getGenerator, generateCode, preparePayload } from 'optimus-code-api'

const prepareExecCodePayload = function(command: any) {

  var env: any = {
    ...process.env,
    _path: require('path').resolve('./').replace(/\\/g, "/")
  };

  return preparePayload(command, env)
}

const prepareResultCodePayload = function(command: any) {

  var env: any = {
    DO_ENDPOINT: 'ENDPOINT',
    DO_ACCESS_KEY_ID: 'ACCESS_KEY_ID',
    DO_SECRET_KEY: 'SECRET_KEY',
    DO_BUCKET: 'BUCKET',
    INSTANCE: process.env.INSTANCE,
    _path: '.'
  };

  return preparePayload(command, env)
}

const downloadFile = async function (payload: any, local: Boolean = false) {
  const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
  payload = {
    ...payload,
    file_name: `${payload.username}-${payload.workspace}-dataset-${uuidv4()}`,
    file_type: 'csv',
  };
  var resultPayload = {
    ...payload,
    endpoint: 'ENDPOINT',
    access_key_id: 'ACCESS_KEY_ID',
    secret_key: 'SECRET_KEY',
    bucket: 'BUCKET',
    local_address: './assets'
  };
  if (!resultPayload.url) {
    resultPayload.url = `${resultPayload.local_address}/${resultPayload.file_name}.${resultPayload.file_type}`;
  }
  var execPayload = {
    ...payload,
    endpoint: process.env.DO_ENDPOINT,
    access_key_id: process.env.DO_ACCESS_KEY_ID,
    secret_key: process.env.DO_SECRET_KEY,
    bucket: process.env.DO_BUCKET,
    // local_address: require('path').resolve('./')+'/assets'
    local_address: require('path').resolve('./').replace(/\\/g, "/")+'/assets'
  };
  if (!execPayload.url) {
    execPayload.url = `${execPayload.local_address}/${execPayload.file_name}.${execPayload.file_type}`;
  }
  var resultCode = ``;
  var code = ``;
  var result
  if (local) {
    var download_url = `${process.env.BACKEND_URL}/datasource/local/${payload.file_name}.${payload.file_type}`;
    resultCode = generateCode({ command: 'saveFile', ...resultPayload });
    code = generateCode({ command: 'saveFile', ...execPayload });
    result = {
      ...(await runCode(code, sessionId)),
      download_url
    };
  } else {
    var download_url = `https://${process.env.DO_BUCKET}.${process.env.DO_ENDPOINT}/${payload.username}/${payload.file_name}.${payload.file_type}`;
    resultCode = generateCode({ command: 'uploadToS3', ...resultPayload });
    code = generateCode({ command: 'uploadToS3', ...execPayload });
    result = {
      ...(await runCode(code, sessionId)),
      download_url
    };
  }
  return { data: result, code: resultCode };
}

@WebSocketGateway()
export class AppGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() wss: Server;
	private logger: Logger = new Logger('AppGateway');

	afterInit(server: Server) {
		this.logger.log('Initialized socket server');
		this.wss.clients;
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
  }

	handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('confirmation')
  async HandleMessage(client: Socket, payload): Promise<any> {
    if (payload.username) { // TO-DO: Confirmation
      client.emit('success', {});
    } else {
      client.disconnect();
    }
  }

	@SubscribeMessage('message')
	async handleMessage(client: Socket, payload): Promise<any> {

		if (payload.message === 'datasets') {

			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			let result = {};
			try {
				result = await requestToKernel('datasets', sessionId, null);
			} catch (err) {
				result = {
					status: 'error',
					error: 'Datasets info error',
					error2: err.toString(),
				};
			}
			const code = kernelRoutines.datasetsMin(payload);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
      });

		} else if (payload.message === 'initialize') {

			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			let result;
			try {
				const initPayload = await initializeKernel(sessionId, payload);
				result = initPayload.result;
				// console.log('[INITIALIZATION RESULT]', initPayload.result);
			} catch (err) {
				result = err;
				console.error('[INITIALIZATION ERROR]', err);
				result.status = 'error';
			}
			const code = kernelRoutines.init(payload, true);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
      });

		} else if (payload.message === 'download') {

      client.emit('reply', {
        ...(await downloadFile(payload, process.env.INSTANCE === 'LOCAL')),
				timestamp: payload.timestamp,
      });

		} else if (payload.message === 'cells' || payload.message === 'run') {

      var execCode: string;
      var resultCode: string;
      if (payload.codePayload) {
        var execCodePayload: any = prepareExecCodePayload(payload.codePayload);
        var resultCodePayload: any = prepareResultCodePayload(payload.codePayload);
        execCode = generateCode(execCodePayload, {}, false, true); // TO-DO: acceptStrings parameter depends on user permissions
        resultCode = generateCode(resultCodePayload, {}, false, true);
      } else {
        execCode = payload.code;
        resultCode = payload.code;
      }
      const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
      if (!execCode.includes("_output = ")) {
        execCode += '\n' + `_output = 'ok'`;
      }
			const result = await runCode(execCode, sessionId);
			client.emit('reply', {
				data: result,
				code: resultCode,
				timestamp: payload.timestamp,
      });

		} else if (payload.message === 'profile') {

			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			const code = `_output = ${payload.dfName}${getGenerator('profile', payload)(payload)}`;
			const result = await runCode(code, sessionId);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
			});
		}
		return { event: 'msgToClient', data: 'Hello world!' };
	}
}
