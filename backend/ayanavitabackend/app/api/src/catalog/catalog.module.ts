import { Module } from '@nestjs/common'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'
import { AttributesController } from './attributes.controller'
import { AttributesService } from './attributes.service'
import { IngredientsController } from './ingredients.controller'
import { IngredientsService } from './ingredients.service'

@Module({
  controllers: [CategoriesController, ProductsController, AttributesController, IngredientsController],
  providers: [CategoriesService, ProductsService, AttributesService, IngredientsService],
})
export class CatalogModule {}
