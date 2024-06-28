import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';


@Module({
    imports: [TypeOrmModule.forFeature([User]), JwtService],
    providers: [UsersResolver, UsersService]
})
export class UsersModule {}
