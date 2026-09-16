import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { categoryService } from './category.service';
import { Category } from './category.entity';
import { createCategoryDto } from './dto/create-category';
import { updateCategoryDto } from './dto/update-category';

@Controller('categories')
export class CategoryController {
  constructor(private readonly service: categoryService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ): Promise<Category> {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body()
    dto: createCategoryDto,
  ): Promise<Category> {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe)
    id: string,
    @Body()
    dto: updateCategoryDto,
  ): Promise<Category> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ): Promise<void> {
    return this.service.remove(id);
  }
}
