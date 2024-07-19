import { Resolver, Query, Mutation, InputType, Args} from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { CreateAccountOutput, CreateAccountInput } from "./dtos/create-account.dtos";
import { LoginInput, LoginOutput } from "./dtos/login.tdo";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthUser } from "../auth/auth-user.decorator";
import { UserProfileInput, UserProfileOutput } from "./dtos/user-profile.dto";
import { EditProfileIntput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";
import { Role } from "src/auth/role.decorator";


@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService : UsersService) {}

    @Mutation(returns => CreateAccountOutput)
    async createAccount(
        @Args('input') createAccountInput: CreateAccountInput,
    ): Promise<CreateAccountOutput>{
        return this.usersService.createAccount(createAccountInput);
    }

    @Mutation(returns => LoginOutput)
    async login(@Args("input") LoginInput: LoginInput):Promise<LoginOutput> {
        return this.usersService.login(LoginInput);
    }
    @Query(returns => User)
    @Role(['Any'])
    @UseGuards(AuthGuard)
    me(@AuthUser() authUser: User ){
        return authUser;
    }
    @Query(returns=> UserProfileOutput)
    @Role(['Any'])
    async userProfile(@Args() userProfileInput : UserProfileInput): Promise <UserProfileOutput>{
        return this.usersService.findById(userProfileInput.userId); 

    }
    
    @Role(['Any'])
    @Mutation(returns => EditProfileOutput)
    async editProfile(@AuthUser() authUser: User, @Args('input')editProfileInput:EditProfileIntput
    ): Promise <EditProfileOutput> {
        return this.usersService.editProfile(authUser.id, editProfileInput);
    }

    @Mutation(returns => VerifyEmailOutput)
    verifyEmail(@Args("input") {code} : VerifyEmailInput): Promise<VerifyEmailOutput>{
        return this.usersService.verifyEmail(code);
    }
                
}