import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe, NotFoundException, ForbiddenException, Put } from '@nestjs/common';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { WatchlistService } from './watchlist.service';
import { AddToWatchlistDto, UpdateWatchlistDto, RemoveFromWatchlistDto, ShareWatchlistDto } from './dto/addToWatchlist.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSharingDto } from './dto/update-sharing.dto';

@ApiTags('Watchlist Management')
@Controller('watchlist')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('JWT')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Add content to watchlist' })
  @ApiResponse({ status: 201, description: 'Content added to watchlist' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async addToWatchlist(@Body() dto: AddToWatchlistDto, @Param('userId') userId: string) {
    return this.watchlistService.addToWatchlist(userId, dto);
  }

  @Delete(':contentId/:contentType/:userId')
  @ApiOperation({ summary: 'Remove content from watchlist' })
  @ApiResponse({ status: 200, description: 'Content removed from watchlist' })
  @ApiParam({ name: 'contentId', description: 'ID of the content to remove' })
  @ApiParam({ name: 'contentType', description: 'Type of the content to remove' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async removeFromWatchlist(
    @Param('contentId') contentId: string,
    @Param('contentType') contentType: string,
    @Param('userId') userId: string,
  ) {
    const dto: RemoveFromWatchlistDto = { contentId, contentType };
    return this.watchlistService.removeFromWatchlist(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user watchlist' })
  @ApiResponse({ status: 200, description: 'User watchlist' })
  async getWatchlist(@Query('userId') userId: string) {
    return this.watchlistService.getWatchlist(userId);
  }
  
  @Put(':watchlistItemId/:userId')
  @ApiOperation({ summary: 'Update watchlist item' })
  @ApiResponse({ status: 200, description: 'Watchlist item updated' })
  @ApiParam({ name: 'watchlistItemId', description: 'ID of the watchlist item to update' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async updateWatchlist(
    @Param('watchlistItemId') watchlistItemId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWatchlistDto,
  ) {
    return this.watchlistService.updateWatchlist(userId, watchlistItemId, dto);
  }

  @Post('share/:userId')
  @ApiOperation({ summary: 'Share watchlist item' })
  @ApiResponse({ status: 200, description: 'Shareable link generated' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async shareWatchlist(@Body() dto: ShareWatchlistDto, @Param('userId') userId: string) {
    return this.watchlistService.shareWatchlist(userId, dto);
  }

  @Get('recommendations/:userId')
  @ApiOperation({ summary: 'Get watchlist-based recommendations' })
  @ApiResponse({ status: 200, description: 'Recommended content' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getRecommendations(@Param('userId') userId: string) {
    return this.watchlistService.getRecommendations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/sharing')
  @ApiOperation({ summary: 'Update sharing settings for a watchlist item' })
  @ApiResponse({ status: 200, description: 'Sharing settings updated' })
  @ApiBearerAuth('JWT')
  async updateSharingSettings(
    @Req() req,
    @Param('id') watchlistItemId: string,
    @Body() dto: UpdateSharingDto,
  ) {
    const userId = req.user.sub;
    return this.watchlistService.updateSharing(userId, watchlistItemId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('shared/:ownerId')
  @ApiOperation({ summary: 'Get a shared watchlist from another user' })
  @ApiResponse({ status: 200, description: 'Shared watchlist retrieved' })
  @ApiBearerAuth('JWT')
  async getSharedWatchlist(
    @Req() req,
    @Param('ownerId') ownerId: string,
  ) {
    const viewerId = req.user.sub;
    return this.watchlistService.getSharedWatchlist(viewerId, ownerId);
  }
}