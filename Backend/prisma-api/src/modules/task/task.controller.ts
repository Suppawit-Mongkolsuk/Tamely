import { Response } from 'express';
import { AuthRequest } from '../../types';
import * as taskService from './task.service';

const param = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');

export const create = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, date, priority, assigneeId } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, error: 'Title is required.' });
      return;
    }
    if (!date) {
      res.status(400).json({ success: false, error: 'Date is required.' });
      return;
    }

    const task = await taskService.createTask(
      param(req.params.wsId),
      req.userId!,
      { workspaceId: param(req.params.wsId), title, description, date, priority, assigneeId },
    );
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create task';
    res.status(400).json({ success: false, error: message });
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const tasks = await taskService.getTasks(
      param(req.params.wsId),
      req.userId!,
      {
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
      },
    );
    res.json({ success: true, data: tasks });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to list tasks';
    res.status(400).json({ success: false, error: message });
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const task = await taskService.updateTask(
      param(req.params.id),
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: task });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update task';
    res.status(400).json({ success: false, error: message });
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await taskService.deleteTask(param(req.params.id), req.userId!);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete task';
    res.status(403).json({ success: false, error: message });
  }
};
