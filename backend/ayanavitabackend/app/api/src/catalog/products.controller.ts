import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto, UpdateProductDto } from './dto/product.dto'
import { ProductQueryDto } from './dto/product-query.dto'
import { UpsertProductAttributesDto, UpsertProductIngredientsDto } from './dto/product-metadata.dto'
import { CreateProductImageDto, UpdateProductImageDto } from './dto/product-image.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { ImageUploadService } from '../services/ImageUploadService'

@Controller('catalog/products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.service.findAll(query)
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

  @Get(':id/images')
  listImages(@Param('id', ParseIntPipe) id: number) {
    return this.service.listImages(id)
  }

  @Post(':id/images')
  createImage(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateProductImageDto) {
    return this.service.createImage(id, dto)
  }

  @Post(':id/images/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('isPrimary', new ParseBoolPipe({ optional: true })) isPrimary?: boolean,
    @Body('sortOrder', new ParseIntPipe({ optional: true })) sortOrder?: number,
  ) {
    const uploaded = await this.imageUploadService.uploadImage(file)
    return this.service.createImage(id, { imageUrl: uploaded.url, isPrimary, sortOrder })
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() dto: UpdateProductImageDto,
  ) {
    return this.service.updateImage(id, imageId, dto)
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.service.removeImage(id, imageId)
  }


  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id)
  }
}
