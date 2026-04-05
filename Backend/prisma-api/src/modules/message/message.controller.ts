import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as messageService from './message.service';

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

export const list = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await messageService.getMessages(
      param(req.params.roomId),
      req.userId!,
      {
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        before: req.query.before as string | undefined,
      },
    );
    res.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get messages';
    res.status(400).json({ success: false, error: message });
  }
};

export const send = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { content, type } = req.body;
    if (!content || content.trim().length === 0) {
      res
        .status(400)
        .json({ success: false, error: 'Message content is required.' });
      return;
    }

    const msg = await messageService.sendMessage(
      param(req.params.roomId),
      req.userId!,
      content,
      type,
    );
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send message';
    res.status(400).json({ success: false, error: message });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await messageService.deleteMessage(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete message';
    res.status(403).json({ success: false, error: message });
  }
};
