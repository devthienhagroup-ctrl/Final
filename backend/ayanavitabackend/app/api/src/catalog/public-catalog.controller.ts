import { Controller, Get, Param, Query } from '@nestjs/common'
import { PublicCatalogService } from './public-catalog.service'
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto'

@Controller('public/catalog')
export class PublicCatalogController {
  constructor(private readonly service: PublicCatalogService) {}

  @Get('products')
  list(@Query() query: PublicCatalogQueryDto) {
    return this.service.list(query, query.lang ?? 'vi')
  }

  @Get('products/:sku')
  detail(@Param('sku') sku: string, @Query('lang') lang = 'vi') {
    return this.service.detailBySku(sku, lang)
  }

  @Get('products/slug/:slug')
  detailBySlug(@Param('slug') slug: string, @Query('lang') lang = 'vi') {
    return this.service.detailBySlug(slug, lang)
  }
}
