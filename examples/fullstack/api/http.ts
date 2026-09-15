import 'reflect-metadata';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Module,
  Post,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Tasks, TaskStore } from './application/tasks';
import { InvalidTitle } from './domain/task';
@Controller('tasks')
class TasksController {
  constructor(@Inject(Tasks) private readonly tasks: Tasks) {}
  @Get() list() {
    return this.tasks.list();
  }
  @Post() async create(@Body() body: unknown, @Headers('content-type') contentType?: string) {
    if (contentType?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      throw new UnsupportedMediaTypeException('Content-Type must be application/json.');
    }
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => key !== 'title')
    ) {
      throw new BadRequestException('Expected an object containing only title.');
    }
    try {
      return await this.tasks.create((body as { title?: unknown }).title);
    } catch (error) {
      if (error instanceof InvalidTitle) throw new BadRequestException(error.message);
      throw error;
    }
  }
}
export async function createApp(store: TaskStore) {
  @Module({
    controllers: [TasksController],
    providers: [{ provide: Tasks, useValue: new Tasks(store) }],
  })
  class AppModule {}
  return NestFactory.create(AppModule, { logger: false });
}
