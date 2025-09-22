import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
    constructor(private readonly usersService: UserService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    async findAll(@Query() query: QueryUsersDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/follow')
    @HttpCode(HttpStatus.OK)
    async follow(@Request() req, @Param('id') followId: string) {
        const userId = req.user.sub;
        return this.usersService.follow(userId, followId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/follow')
    @HttpCode(HttpStatus.OK)
    async unfollow(@Request() req, @Param('id') unfollowId: string) {
        const userId = req.user.sub;
        return this.usersService.unfollow(userId, unfollowId);
    }
}