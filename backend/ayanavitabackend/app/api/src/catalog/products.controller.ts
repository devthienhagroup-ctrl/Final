import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'
import { UpsertProductAttributesDto, UpsertProductIngredientsDto } from './dto/product-metadata.dto'

@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto)
  }


  @Patch(':id/attributes')
  replaceAttributes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertProductAttributesDto,
  ) {
    return this.service.replaceAttributes(id, dto)
  }

  @Patch(':id/ingredients')
  replaceIngredients(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertProductIngredientsDto,
  ) {
    return this.service.replaceIngredients(id, dto)
  }


  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
