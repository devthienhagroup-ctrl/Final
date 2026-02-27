import { Module } from '@nestjs/common'
import { ProductsController } from './products.controller'
import { ProductsService } from './products.service'

import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'

import { AttributesController } from './attributes.controller'
import { AttributesService } from './attributes.service'

import { IngredientsController } from './ingredients.controller'
import { IngredientsService } from './ingredients.service'
import { LanguagesController } from './languages.controller'
import { LanguagesService } from './languages.service'
import { ImageUploadService } from '../services/ImageUploadService'
import { PublicCatalogController } from './public-catalog.controller'
import { PublicCatalogService } from './public-catalog.service'

@Module({
  controllers: [
    ProductsController,
    CategoriesController,
    AttributesController,
    IngredientsController,
    LanguagesController,
    PublicCatalogController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    AttributesService,
    IngredientsService,
    LanguagesService,
    ImageUploadService,
    PublicCatalogService,
  ],
})
export class CatalogModule {}
