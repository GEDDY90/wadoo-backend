import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { CreateAccountOutput, CreateAccountInput } from "./dtos/create-account.dtos";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthUser } from "../auth/auth-user.decorator";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { Role } from "../auth/role.decorator";
import { LoginInput, LoginOutput } from "./dtos/login.tdo";
import { EditProfileInput, EditProfileOutput } from "./dtos/edit-profile.dto";

@Resolver(() => User)
export class UsersResolver {
    constructor(
        private readonly usersService: UsersService,
    ) {}

    @Mutation(() => CreateAccountOutput)
    async createAccount(
        @Args('input') createAccountInput: CreateAccountInput,
    ): Promise<CreateAccountOutput> {
        return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(() => LoginOutput)
    async login(
        @Args('input') loginInput: LoginInput, // Correction de la variable
    ): Promise<LoginOutput> {
        return this.usersService.login(loginInput);
    }

    @Role(['Any'])
    @Query(() => User)
    @UseGuards(AuthGuard)
    me(
        @AuthUser() authUser: User,
    ): User {
        return authUser;
    }

    @Role(['Any'])
    @Mutation(() => EditProfileOutput)
    async editProfile(
        @AuthUser() authUser: User,
        @Args('input') editProfileInput: EditProfileInput, // Correction de la typo
    ): Promise<EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileInput);
    }

    @Mutation(() => VerifyEmailOutput)
    async verifyEmail(
        @Args('input') { code }: VerifyEmailInput, // Ajout de 'input'
    ): Promise<VerifyEmailOutput> {
        return this.usersService.verifyEmail(code);
    }
}
