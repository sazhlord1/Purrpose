import type { FastifyInstance } from 'fastify';
import { createHabitSchema, idParamsSchema } from '@purrpose/shared';
import { userIdOf } from '../auth.js';
import { clock } from '../clock.js';
import { getPrisma } from '../db.js';
import { makeHabitEngine, toHabitDto } from '../services/habits.js';
import { parse } from '../validate.js';

/** Detective Cheat: habit pacts and confessions. */
export function registerHabitRoutes(app: FastifyInstance): void {
  const engine = makeHabitEngine(getPrisma(), clock);

  app.get('/api/v1/habits', async request => {
    const habits = await engine.listHabits(userIdOf(request));
    return { habits, serverTime: clock.now() };
  });

  app.post('/api/v1/habits', async (request, reply) => {
    const input = parse(createHabitSchema, request.body);
    const habit = await engine.createHabit(userIdOf(request), request.role, input);
    return reply.code(201).send({ habit: toHabitDto(habit), serverTime: clock.now() });
  });

  app.post('/api/v1/habits/:id/slip', async request => {
    const { id } = parse(idParamsSchema, request.params);
    const habit = await engine.confessSlip(userIdOf(request), id);
    return { habit: toHabitDto(habit), serverTime: clock.now() };
  });

  app.delete('/api/v1/habits/:id', async (request, reply) => {
    const { id } = parse(idParamsSchema, request.params);
    await engine.graceDelete(userIdOf(request), id);
    return reply.code(204).send();
  });
}
