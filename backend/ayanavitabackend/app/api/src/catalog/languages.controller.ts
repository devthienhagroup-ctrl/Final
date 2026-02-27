import { Controller, Get } from '@nestjs/common'
import { LanguagesService } from './languages.service'

@Controller('catalog/languages')
export class LanguagesController {
  constructor(private readonly service: LanguagesService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }
}
