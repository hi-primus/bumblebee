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
  kernelHandler,
  deleteKernel,
  requestToKernel,
  removeFromQueue,
  createSession
} from './kernel';

// import {
// 	runCode,
// 	initializeKernel,
//   deleteKernel,
// 	requestToKernel,
// } from './optimus-api';

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
    deleteKernel(client.id, 20000)
  }

	handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    client.on('disconnect', (err) => {
      if (err) {
        this.logger.warn(`Client disconnected: ${err}`);
      }
    });

    client.on("reconnection_attempt", () => {
      this.logger.log(`Attempting reconnection: ${client.id}`);
    });
    
    client.on("reconnect", () => {
      this.logger.log(`Reconnected: ${client.id}`);
    });

  }

  @SubscribeMessage('confirmation')
  async handleConfirmation(client: Socket, payload): Promise<any> {

    if (client) {
      const bearerToken = payload.authorization.split(' ')[1];

      let user = await this.authService.verifyUser(bearerToken);
      this.users[client.id] = user;

      if (payload?.username == user?.username) {
        createSession(client.id, payload.previousSessionId);
        client.emit('success', {});
      } else {
        console.warn('Username not matching', payload?.username, user?.username)
        client.disconnect();
      }
    }
  }

  @SubscribeMessage('initialize')
  async handleInitialize(client: Socket, payload): Promise<any> {

    let result: any = {};

    try {
      const initPayload = await initializeKernel(client.id, payload);
      result = initPayload.result;
      // console.log('[INITIALIZATION RESULT]', initPayload.result);
    } catch (err) {

      console.error(err);
      result.error = err.toString();
      result.status = 'error';

    }

    let kernelRoutines: any = kernelHandler(client.id);

    const resultCode = kernelRoutines.init(payload, true);
    client.emit('reply', {
      data: result,
      code: resultCode,
      timestamp: payload.timestamp,
    });

  }

  @SubscribeMessage('features')
	async handleFeatures(client: Socket, payload): Promise<any> {

    let result: any = {};
    try {
      result = await requestToKernel('features', client.id, payload);
      if (result.status == 'error') {
        throw result;
      }
    } catch (err) {
      console.error(err)
      if (err instanceof Error) {
        result = {
          status: 'error',
          error: 'Features info error',
          error2: err.toString(),
        };
      }
      else {
        result = err;
      }
    }
    client.emit('reply', {
      data: result,
      code: '',
      timestamp: payload.timestamp,
    });

  }

  @SubscribeMessage('remove')
  async handleRemove(client: Socket, payload): Promise<any> {
    let result = await removeFromQueue(client.id, payload.category);
    client.emit('reply', {
      data: result,
      timestamp: payload.timestamp,
    });
  }

  @SubscribeMessage('run')
	async handleRun(client: Socket, payload): Promise<any> {

    let result: any = {};
    let resultCode: string = "";

    try {
      let execCode: string;

      let isAsync: boolean = payload.isAsync;

      if (payload.codePayload) {
        let user = this.users[client.id];

        let resultCodePayload: any = await this.prepareCodePayload(payload.codePayload, true, user);
        [resultCode, isAsync] = generateCode(resultCodePayload, {}, false, true);

        let execCodePayload: any = await this.prepareCodePayload(payload.codePayload, false, user);
        [execCode, isAsync] = generateCode(execCodePayload, {}, false, true); // TO-DO: acceptStrings parameter depends on user permissions

      } else {
        execCode = payload.code;
        resultCode = payload.code;
      }

      if (!execCode.includes("_output = ")) {
        execCode = `_output = 'ok'\n${execCode}`;
      }

      if (process.env.DEBUG) {
        resultCode = execCode;
      }

      let asyncCallback = undefined;

      if (isAsync) {
        var _resultCode = resultCode;
        var _timestamp = payload.timestamp;
        asyncCallback = (_result) => {
          client.emit('reply', {
            data: _result,
            code: _resultCode,
            timestamp: _timestamp,
            finalResult: true
          });
        }
      }

      let category = payload?.category;

      result = await runCode(execCode, client.id, category, asyncCallback);

    } catch (err) {

      console.error(err);
      result.error = err.toString();
      result.status = 'error';

    }

    client.emit('reply', {
      data: result,
      code: resultCode,
      timestamp: payload.timestamp,
      reply: payload.reply
    });

  }

  @SubscribeMessage('profile')
	async handleProfile(client: Socket, payload): Promise<any> {

    const code = `_output = ${payload.dfName}${getGenerator('profile', payload)(payload)}`;
    const result = await runCode(code, client.id);
    client.emit('reply', {
      data: result,
      code,
      timestamp: payload.timestamp,
    });

	}
}
