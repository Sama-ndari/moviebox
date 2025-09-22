import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Perform a global search' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Query('q') query: string) {
    return this.searchService.search(query);
  }
}
