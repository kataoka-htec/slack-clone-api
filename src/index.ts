import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import datasource from './datasource';
import workSpaceController from './module/workspaces/workspace.controller';
import authController from './module/auth/auth.controller';
import setCurrentUser from './middleware/set-current-user';
import channelController from './module/channels/channel.controller';
import messageController from './module/messages/message.controller';
import accountController from './module/account/account.controller';
import workspaceUserController from './module/workspace-users/workspace-user.controller';
import userController from './module/users/user.controller';

require('dotenv').config();
const port = 8888;
const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // 譛ｬ逡ｪ迺ｰ蠅・〒縺ｯ驕ｩ蛻・↑繧ｪ繝ｪ繧ｸ繝ｳ縺ｫ螟画峩縺励※縺上□縺輔＞
    methods: ['GET', 'POST'],
  },
});

// 繧ｽ繧ｱ繝・ヨ謗･邯壹ｒ莉悶・繝｢繧ｸ繝･繝ｼ繝ｫ縺ｧ蛻ｩ逕ｨ縺ｧ縺阪ｋ繧医≧縺ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・
export { io };

// JSON繝溘ラ繝ｫ繧ｦ繧ｧ繧｢縺ｮ險ｭ螳・
app.use(express.json());
app.use(cors());
app.use(setCurrentUser);

// 髱咏噪繝輔ぃ繧､繝ｫ驟堺ｿ｡縺ｮ險ｭ螳・
app.use('/uploads', express.static('uploads'));

// 繝ｫ繝ｼ繝医・險ｭ螳・
app.use('/auth', authController);
app.use('/account', accountController);
app.use('/workspaces', workSpaceController);
app.use('/channels', channelController);
app.use('/messages', messageController);
app.use('/workspace-users', workspaceUserController);
app.use('/users', userController);

io.on('connection', (socket) => {
  console.log('繧ｯ繝ｩ繧､繧｢繝ｳ繝域磁邯・ ', socket.id);

  socket.on('join-workspace', (workspaceId: string) => {
    socket.join(workspaceId);
  });

  socket.on('leave-workspace', (workspaceId: string) => {
    socket.leave(workspaceId);
  });

  socket.on('disconnect', () => {
    console.log('繧ｯ繝ｩ繧､繧｢繝ｳ繝亥・譁ｭ: ', socket.id);
  });
});

datasource
  .initialize()
  .then(async (connection) => {
    httpServer.listen(port, () =>
      console.log(`Server listening on port ${port}!`)
    );
  })
  .catch((error) => console.error(error));

app.get('/', (req: Request, res: Response) => {
  res.send('hello world');
});

