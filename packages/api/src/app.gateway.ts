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

import {
	runCode,
	initializeKernel,
	deleteEveryKernel,
	requestToKernel,
} from './kernel';
import kernelRoutines from './kernel-routines';
import { getGenerator } from 'optimus-code-api'

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
		} else if (payload.message === 'run') {
			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			const result = await runCode(`${payload.code}`, sessionId);
			client.emit('reply', {
				data: result,
				code: payload.code,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'download') {
      const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
      const file_name = `${payload.username}-dataset-${payload.timestamp}`;
      const file_type = `csv`;
      const resultPayload = {
        ...payload,
        file_name,
        file_type,
        endpoint: 'ENDPOINT',
        access_key_id: 'ACCESS_KEY_ID',
        secret_key: 'SECRET_KEY',
        bucket: 'BUCKET',
        local_address: './assets'
      };
      const execPayload = {
        ...payload,
        file_name,
        file_type,
        endpoint: process.env.DO_ENDPOINT,
        access_key_id: process.env.DO_ACCESS_KEY_ID,
        secret_key: process.env.DO_SECRET_KEY,
        bucket: process.env.DO_BUCKET,
        // local_address: require('path').resolve('./')+'/assets'
        local_address: require('path').resolve('./').replace(/\\/g, "/")+'/assets'
      };
      var resultCode = ``;
      var code = ``;
      var result
      if (process.env.INSTANCE === 'LOCAL') {
        resultCode = `_output = ${payload.dfName}${getGenerator('saveToLocal',resultPayload)(resultPayload)}`;
        code = `_output = ${payload.dfName}${getGenerator('saveToLocal',execPayload)(execPayload)}`;
        result = {
          ...(await runCode(code, sessionId)),
          url: `${process.env.BACKEND_URL}/datasource/local/downloads/${payload.username}/${payload.workspace}/${file_name}.${file_type}`,
        };
      } else {
        resultCode = `_output = ${payload.dfName}${getGenerator('uploadToS3',resultPayload)(resultPayload)}`;
        code = `_output = ${payload.dfName}${getGenerator('uploadToS3',execPayload)(execPayload)}`;
        result = {
          ...(await runCode(code, sessionId)),
          url: `https://${process.env.DO_BUCKET}.${process.env.DO_ENDPOINT}/${payload.username}/${file_name}.${file_type}`,
        };
      }

			client.emit('reply', {
        data: result,
				code: resultCode,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'cells') {
			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			let code = payload.code;
			code += '\n' + `_output = 'ok'`;
			const result = await runCode(code, sessionId);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'profile') {
			const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
			const code = `_output = ${payload.dfName}${getGenerator('profile',payload)(payload)}`;
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
