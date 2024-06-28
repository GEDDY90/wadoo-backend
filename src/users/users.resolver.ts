import { Resolver, Query, Mutation, InputType, Args} from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { CreateAccountOutput, CreateAccountInput } from "./dtos/create-account.dtos";
import { LoginInput, LoginOutput } from "./dtos/login.tdo";


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
}