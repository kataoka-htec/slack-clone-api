import { Router, Request, Response } from 'express';
import datasource from '../../datasource';
import { Message } from './message.entity';
import { Auth } from '../../lib/auth';
import { Channel } from '../channels/channel.entity';
import { upload } from '../../lib/file-uploader';
import { io } from '../../index';

const messageController = Router();
const messageRepository = datasource.getRepository(Message);
const channelRepository = datasource.getRepository(Channel);

// 繝√Ε繝ｳ繝阪Ν蜀・・縺吶∋縺ｦ縺ｮ繝｡繝・そ繝ｼ繧ｸ繧貞叙蠕・
messageController.get(
  '/:workspaceId/:channelId',
  Auth,
  async (req: Request, res: Response) => {
    try {
      const { workspaceId, channelId } = req.params;

      const messages = await messageRepository.find({
        where: { channelId, channel: { workspaceId } },
        relations: ['user', 'channel'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json(messages);
    } catch (error) {
      console.error('繝｡繝・そ繝ｼ繧ｸ蜿門ｾ励お繝ｩ繝ｼ:', error);
      res.status(500).json({ message: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆' });
    }
  }
);

// 繝｡繝・そ繝ｼ繧ｸ繧剃ｽ懈・
messageController.post(
  '/:workspaceId/:channelId',
  Auth,
  async (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      const { workspaceId, channelId } = req.params;

      const existingChannel = await channelRepository.findOne({
        where: {
          id: channelId,
          workspaceId,
          workspace: { workspaceUsers: { userId: req.currentUser.id } },
        },
        relations: ['workspace', 'workspace.workspaceUsers'],
      });

      if (existingChannel == null) {
        res.status(404).json({ message: '繝√Ε繝ｳ繝阪Ν縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ' });
        return;
      }

      if (!content) {
        res.status(400).json({ message: 'Message content is required' });
        return;
      }

      const message = await messageRepository.save({
        content,
        channelId,
        userId: req.currentUser.id,
      });

      const newMessage = await messageRepository.findOne({
        where: { id: message.id },
        relations: ['user'],
      });

      // Socket.IO繧剃ｽｿ逕ｨ縺励※繝ｪ繧｢繝ｫ繧ｿ繧､繝縺ｧ譁ｰ縺励＞繝｡繝・そ繝ｼ繧ｸ繧貞・菴薙↓驟堺ｿ｡
      io.to(workspaceId).emit('new-message', newMessage);

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('繝｡繝・そ繝ｼ繧ｸ菴懈・繧ｨ繝ｩ繝ｼ:', error);
      res.status(500).json({ message: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆' });
    }
  }
);

// 逕ｻ蜒上い繝・・繝ｭ繝ｼ繝峨お繝ｳ繝峨・繧､繝ｳ繝・
messageController.post(
  '/:workspaceId/:channelId/image',
  Auth,
  async (req: Request, res: Response) => {
    try {
      const { workspaceId, channelId } = req.params;

      const existingChannel = await channelRepository.findOne({
        where: {
          id: channelId,
          workspaceId,
          workspace: { workspaceUsers: { userId: req.currentUser.id } },
        },
        relations: ['workspace', 'workspace.workspaceUsers'],
      });

      if (existingChannel == null) {
        res.status(404).json({ message: '繝√Ε繝ｳ繝阪Ν縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ' });
        return;
      }
      const { fileUrl } = await upload(req, res, 'messages');
      if (fileUrl == null) {
        res.status(400).json({ message: '逕ｻ蜒上′繧｢繝・・繝ｭ繝ｼ繝峨＆繧後※縺・∪縺帙ｓ' });
        return;
      }
      const message = await messageRepository.save({
        channelId,
        userId: req.currentUser.id,
        imageUrl: fileUrl,
      });

      const messageWithUser = { ...message, user: req.currentUser };

      // Socket.IO繧剃ｽｿ逕ｨ縺励※繝ｪ繧｢繝ｫ繧ｿ繧､繝縺ｧ譁ｰ縺励＞逕ｻ蜒上Γ繝・そ繝ｼ繧ｸ繧貞・菴薙↓驟堺ｿ｡
      io.to(workspaceId).emit('new-message', messageWithUser);

      res.status(201).json(messageWithUser);
    } catch (error) {
      console.error('逕ｻ蜒上い繝・・繝ｭ繝ｼ繝峨お繝ｩ繝ｼ:', error);
      res.status(500).json({ message: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆' });
    }
  }
);

// 繝｡繝・そ繝ｼ繧ｸ繧貞炎髯､
messageController.delete('/:id', Auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingMessage = await messageRepository.findOne({
      where: { id, userId: req.currentUser.id },
      relations: ['channel'],
    });

    if (!existingMessage) {
      res.status(404).json({ message: '繝｡繝・そ繝ｼ繧ｸ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ' });
      return;
    }

    await messageRepository.delete(id);

    // Socket.IO繧剃ｽｿ逕ｨ縺励※繝ｪ繧｢繝ｫ繧ｿ繧､繝縺ｧ繝｡繝・そ繝ｼ繧ｸ蜑企勁繧貞・菴薙↓驟堺ｿ｡
    io.to(existingMessage.channel.workspaceId).emit('delete-message', id);

    res.status(200).json({ status: true });
  } catch (error) {
    console.error('繝｡繝・そ繝ｼ繧ｸ蜑企勁繧ｨ繝ｩ繝ｼ:', error);
    res.status(500).json({ message: '繧ｵ繝ｼ繝舌・繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆' });
  }
});

export default messageController;



