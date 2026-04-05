import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as roomService from './room.service';

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, isPrivate } = req.body;
    if (!name || name.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Room name is required.' });
      return;
    }

    const room = await roomService.createRoom(
      param(req.params.wsId),
      req.userId!,
      { name, description, isPrivate },
    );
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create room';
    res.status(400).json({ success: false, error: message });
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const rooms = await roomService.getRooms(
      param(req.params.wsId),
      req.userId!,
    );
    res.json({ success: true, data: rooms });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list rooms';
    res.status(400).json({ success: false, error: message });
  }
};

export const getById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const room = await roomService.getRoomById(
      param(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data: room });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to get room';
    res.status(404).json({ success: false, error: message });
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const room = await roomService.updateRoom(
      param(req.params.id),
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: room });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update room';
    res.status(403).json({ success: false, error: message });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await roomService.deleteRoom(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete room';
    res.status(403).json({ success: false, error: message });
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId: targetUserId } = req.body;
    if (!targetUserId) {
      res.status(400).json({ success: false, error: 'userId is required.' });
      return;
    }

    const member = await roomService.addRoomMember(
      param(req.params.id),
      req.userId!,
      targetUserId,
    );
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add member';
    res.status(400).json({ success: false, error: message });
  }
};

export const join = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const member = await roomService.joinRoom(
      param(req.params.id),
      req.userId!,
    );
    res.json({ success: true, data: member });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to join room';
    res.status(400).json({ success: false, error: message });
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await roomService.removeRoomMember(
      param(req.params.id),
      req.userId!,
      param(req.params.userId),
    );
    res.json({ success: true, message: 'Member removed from room' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove member';
    res.status(403).json({ success: false, error: message });
  }
};
