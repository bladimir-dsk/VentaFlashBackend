import { ExecutionContext, createParamDecorator } from "@nestjs/common";


//createParamDecorator: sirve para inyectar datos adicionales en los parámetros de los controladores.
export const ActiveUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user
    }
)