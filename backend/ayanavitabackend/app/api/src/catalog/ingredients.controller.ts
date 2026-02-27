import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common'
import { IngredientsService } from './ingredients.service'
import { CreateIngredientKeyDto, UpdateIngredientKeyDto } from './dto/ingredient.dto'

@Controller('catalog/ingredients')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateIngredientKeyDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientKeyDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
