import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common'
import { AttributesService } from './attributes.service'
import { CreateAttributeKeyDto, UpdateAttributeKeyDto } from './dto/attribute.dto'

@Controller('catalog/attributes')
export class AttributesController {
  constructor(private readonly service: AttributesService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateAttributeKeyDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttributeKeyDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
