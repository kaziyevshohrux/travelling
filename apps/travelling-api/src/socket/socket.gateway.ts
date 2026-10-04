import { Logger } from '@nestjs/common';
import { OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { webSocket } from 'rxjs/webSocket';
import { Server } from 'ws';
import * as WebSocket from 'ws'
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';
import * as url from 'url';

interface MessagePayload {
  event: string;
  text: string;
  memberData: Member;
};

interface infoPayload{
  event: string;
  totalClient: number;
  memberData: Member
  action : 'joined' | 'left';
}

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
  private logger: Logger = new Logger('SocketEventsGateway');
  private clients: Set<WebSocket> = new Set();
	private clientsAuthMap: Map<WebSocket, Member | null> = new Map();
	private messagesList: MessagePayload[] = [];
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server : Server;

  public afterInit(server: Server) {
    this.logger.verbose(`WebSocket Server Initialized & total [${this.clients.size}]`);
  }

  private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;
			console.log('token:', token);
			return await this.authService.verifyToken(token as string);
		} catch (err) {
			this.logger.error('Authentication failed', err);
			return null;
		}
	}

  public async handleConnection(client: WebSocket, req:any) {
    const authMember = await this.retrieveAuth(req);
    this.clientsAuthMap.set(client, authMember);

    this.clients.add(client);

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.verbose(`Connected ${clientNick} & total [${this.clients.size}] `);

    const infoMsg: infoPayload = {
      event : 'info',
      totalClient: this.clients.size,
      memberData: authMember,
      action: 'joined'
    };
    this.emitMessage(infoMsg)
    client.send(JSON.stringify({ event: 'getMessage', list: this.messagesList }));
   
  }

  public  handleDisconnect(client: WebSocket) {
     const authMember = this.clientsAuthMap.get(client);

    this.clients.delete(client);
    this.clientsAuthMap.delete(client);

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.verbose(`== Client disconnected ${clientNick} left total: ${this.clients.size} ==`);

    const infoMsg: infoPayload = {
      event : 'info',
      totalClient: this.clients.size,
      memberData: authMember,
      action: 'left'
    };
    this.broadCastMessage(client, infoMsg)
   

  }

  @SubscribeMessage('message')
  public async handleMessage(client: WebSocket, payload: string): Promise<void> {
    const authMember = this.clientsAuthMap.get(client);
    const newMessage: MessagePayload = {event : "message", text : payload, memberData: authMember}
    

    const clientNick: string = authMember?.memberNick ?? 'Guest';
    this.logger.verbose(`NEW Message: ${clientNick}: ${payload}`);
    this.messagesList.push(newMessage);

    if (this.messagesList.length > 5) this.messagesList.splice(0, this.messagesList.length - 5);
    this.emitMessage(newMessage);

  }


  private broadCastMessage(sender: WebSocket, message: infoPayload | MessagePayload) {
    this.server.clients.forEach((client) => {
      if(client !== sender && client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify(message))
      }
    })
  }

  private emitMessage(message : infoPayload | MessagePayload){
    this.server.clients.forEach((client) => {
      if(client.readyState === WebSocket.OPEN){
        client.send(JSON.stringify(message))
      }
    })
  }
}