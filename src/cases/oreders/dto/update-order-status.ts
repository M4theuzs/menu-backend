import { IsEnum } from "class-validator";
import { Orderstatus } from "../entities/order-entity";

export class UpdateOrderStatusDto {
    @IsEnum(Orderstatus)
    status: Orderstatus
}