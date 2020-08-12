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
    client.emit('success', {});
	}

	@SubscribeMessage('message')
	async handleMessage(client: Socket, payload): Promise<any> {
		if (payload.message === 'datasets') {
			const sessionId = payload.username + '_' + payload.workspace;
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
			const code = kernelRoutines.initMin(payload);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'run') {
			const sessionId = payload.username + '_' + payload.workspace;
			const result = await runCode(`${payload.code}`, sessionId);
			client.emit('reply', {
				data: result,
				code: payload.code,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'cells') {
			const sessionId = payload.username + '_' + payload.workspace;
			let code = payload.code;
			code += '\n' + `_output = 'ok'`;
			const result = await runCode(code, sessionId);
			client.emit('reply', {
				data: result,
				code,
				timestamp: payload.timestamp,
			});
		} else if (payload.message === 'profile') {
			const sessionId = payload.username + '_' + payload.workspace;
			const code = `_output = ${payload.dfName}.ext.profile(columns="*", output="json")`;
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
