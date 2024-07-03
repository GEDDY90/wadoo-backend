import { Resolver, Query, Mutation, InputType, Args} from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { CreateAccountOutput, CreateAccountInput } from "./dtos/create-account.dtos";
import { LoginInput, LoginOutput } from "./dtos/login.tdo";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "src/auth/auth.guard";
import { AuthUser } from "src/auth/auth-user.decorator";
import { UserProfileInput, UserProfileOuput } from "./dtos/user-profile.dto";
import { EditProfileIntput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { VerifyEmailInput, VerifyEmailOutput } from "./dtos/verify-email.dto";


@InputType()
@Resolver(of => User)
export class UsersResolver {
    constructor(
        private readonly usersService : UsersService) {}

    @Query(returns => Boolean )
    hi() {
        return true;
    }
    @Mutation(returns => CreateAccountOutput)
    async createAccount(
        @Args('input') createAccountInput: CreateAccountInput,
    ): Promise<CreateAccountOutput>{
        try {
            return this.usersService.createAccount(createAccountInput);
        }catch(error){
            return {
                error,
                ok: false,
            }
        }
    }

    @Mutation(returns => LoginOutput)
    async login(@Args("input") LoginInput: LoginInput):Promise<LoginOutput> {
        try{
            return this.usersService.login(LoginInput);
        }catch(error){
            return {
                ok: false,
                error,
            };
        }
    }
    @Query(returns => User)
    @UseGuards(AuthGuard)
    me(@AuthUser() authUser: User ){
        return authUser;
    }
    @UseGuards(AuthGuard)
    @Query(returns=> UserProfileOuput)
    async userProfile(@Args() userProfileInput : UserProfileInput): Promise <UserProfileOuput>{
        try{
            const user = await this.usersService.findById(userProfileInput.userId); 
            if(!user){
                throw Error();
            }
            return {
                ok:true,
                user,
            }
        }catch(e){
            return {
                error: "Utilisateur non trouvé",
                ok: false,
            }
        }
    }
    @UseGuards(AuthGuard)
    @Mutation(returns => EditProfileOutput)
    async editProfile(@AuthUser() authUser: User, @Args('input')editProfileInput:EditProfileIntput
    ): Promise <EditProfileOutput> {
        try{
            await this.usersService.editProfile(authUser.id, editProfileInput);
            return {ok:true};
        }catch(error){
            return {
                ok:false,
                error,
            };
        }
    }

    @Mutation(returns => VerifyEmailOutput)
    verifyEmail(@Args("input") {code} : VerifyEmailInput){
        this.usersService.verifyEmail(code);
    }
                
}