import { Controller, Post, Get, Put, Body, Param, UseGuards, Req, Delete, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WatchHistoryService } from './watch-history.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddToWatchHistoryDto, UpdateWatchHistoryDto } from './dto/addwatchHistory.dto';

@ApiTags('WatchHistory Management')
@Controller('watchhistory')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('JWT')
export class WatchHistoryController {
    constructor(private readonly watchHistoryService: WatchHistoryService) { }

    @Post(':userId')
    @ApiOperation({ summary: 'Add content to watch history' })
    @ApiResponse({ status: 201, description: 'Content added to watch history' })
    @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
    async addToHistory(@Param('userId') userId: string, @Body() dto: AddToWatchHistoryDto) {
        return this.watchHistoryService.addToHistory(userId,dto);
    }


    @Get('analytics/:userId')
    @ApiOperation({ summary: 'Get user watch history analytics' })
    @ApiResponse({ status: 200, description: 'User watch history analytics' })
    @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
    async getAnalytics(@Param('userId') userId: string) {
        return this.watchHistoryService.getAnalytics(userId);
    }

    @Get(':userId')
    @ApiOperation({ summary: 'Get user watch history' })
    @ApiResponse({ status: 200, description: 'User watch history' })
    @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
    async getHistory(@Param('userId') userId: string) {
        return this.watchHistoryService.getHistory(userId);
    }

    @Patch(':userId/:historyId')
    @ApiOperation({ summary: 'Update watch history entry' })
    @ApiResponse({ status: 200, description: 'Watch history entry updated' })
    @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
    @ApiParam({ name: 'historyId', required: true, description: 'ID of the watch history entry' })
    async updateHistory(@Param('userId') userId: string, @Param('historyId') historyId: string, @Body() dto: UpdateWatchHistoryDto) {
        return this.watchHistoryService.updateHistory(userId, historyId, dto);
    }

    @Delete(':userId/:historyId')
    @ApiOperation({ summary: 'Delete watch history entry' })
    @ApiResponse({ status: 200, description: 'Watch history entry deleted' })
    @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
    @ApiParam({ name: 'historyId', required: true, description: 'ID of the watch history entry' })
    async deleteHistory(@Param('userId') userId: string, @Param('historyId') historyId: string) {
        return this.watchHistoryService.deleteHistory(userId, historyId);
    }
}