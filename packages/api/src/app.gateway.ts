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
	requestToKernel,
} from './kernel';
import kernelRoutines from './kernel-routines';
import { getGenerator, generateCode, preparePayload } from 'optimus-code-api'

import { ConnectionService } from "./connection/connection.service";
import { GetUser } from './auth/dto/get-user.decorator.dto';
import { AuthService } from './auth/auth.service';

@WebSocketGateway()
export class AppGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() wss: Server;
  private logger: Logger = new Logger('AppGateway');
  constructor(
    private readonly connectionService: ConnectionService,
    private authService: AuthService
  ) {}

  private users: any = {};

  async prepareCodePayload(commands: any, isResult: Boolean = true, user: any) {

    let env: any;

    if (isResult) {
      env = {
        DO_ENDPOINT: 'ENDPOINT',
        DO_ACCESS_KEY_ID: 'ACCESS_KEY_ID',
        DO_SECRET_KEY: 'SECRET_KEY',
        DO_BUCKET: 'BUCKET',
        INSTANCE: process.env.INSTANCE,
        _path: '.'
      };
    }
    else {
      env = {
        ...process.env,
        _path: require('path').resolve('./').replace(/\\/g, "/")
      };
    }

    let preparedCommands = preparePayload(commands, env);

    let connections = {};

    let connectionIndex = 0;
    let databaseIndex = 0;

    for (let command of preparedCommands) {

      let connectionId = command.payload?._connection;

      if (connectionId) {

        let connectionCommand = connections[connectionId];

        if (!connectionCommand) {
          let connection = await this.connectionService.getOne(connectionId, user, !isResult, true);

          let varName;
          connectionCommand = {
            ...(connection.configuration as any),
            _id: connectionId,
          };

          if (connection.isDatabase) {
            connectionCommand.varName = `db${databaseIndex || ''}`;
            connectionCommand.command = 'createDatabase';
            databaseIndex++;
          } else {
            connectionCommand.varName = `conn${connectionIndex || ''}`;
            connectionCommand.command = 'createConnection',
            connectionIndex++;
          }


          connections[connectionId] = connectionCommand;
        }

        if (connectionCommand.command == 'createDatabase') {
          command.payload.dbName = connectionCommand.varName;
        } else if (connectionCommand.command == 'createConnection') {
          command.payload.conn = connectionCommand.varName;
        }

      }

    }

    return [
      ...Object.values(connections),
      ...preparedCommands
    ];
  }

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
  async handleConfirmation(client: Socket, payload): Promise<any> {

    if (client) {
      const bearerToken = payload.authorization.split(' ')[1];

      let user = await this.authService.verifyUser(bearerToken);
      this.users[client.id] = user;

      if (payload?.username == user?.username) {
        client.emit('success', {});
      } else {
        client.disconnect();
      }
    }
  }

  @SubscribeMessage('datasets')
	async handleDatasets(client: Socket, payload): Promise<any> {

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

  }

  @SubscribeMessage('initialize')
  async handleInitialize(client: Socket, payload): Promise<any> {


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

  }

  @SubscribeMessage('features')
	async handleFeatures(client: Socket, payload): Promise<any> {

    const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
    let result = {};
    try {
      result = await requestToKernel('features', sessionId, null, false);
    } catch (err) {
      result = {
        status: 'error',
        error: 'Features info error',
        error2: err.toString(),
      };
    }
    client.emit('reply', {
      data: result,
      code: '',
      timestamp: payload.timestamp,
    });

  }

  @SubscribeMessage('run')
	async handleRun(client: Socket, payload): Promise<any> {

    let execCode: string;
    let resultCode: string;
    if (payload.codePayload) {
      let user = this.users[client.id];
      let execCodePayload: any = await this.prepareCodePayload(payload.codePayload, false, user);
      let resultCodePayload: any = await this.prepareCodePayload(payload.codePayload, true, user);
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

  }

  @SubscribeMessage('profile')
	async handleProfile(client: Socket, payload): Promise<any> {

    const sessionId = payload.username + '_BBSESSION_' + payload.workspace;
    const code = `_output = ${payload.dfName}${getGenerator('profile', payload)(payload)}`;
    const result = await runCode(code, sessionId);
    client.emit('reply', {
      data: result,
      code,
      timestamp: payload.timestamp,
    });

	}
}
