import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrderDto, CreateOrderItemDto } from "./dto/create-order";
import { OrderItem } from "./entities/order-item.entity";
import { Order, Orderstatus } from "./entities/order-entity";
import { GuestCheckService } from "../guest-checks/guest-check.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProductService } from "../products/product.service";
import { UpdateOrderStatusDto } from "./dto/update-order-status";

@Injectable()
export class OrderService {
    constructor(
        private readonly guestCheckService: GuestCheckService,
        private readonly productService: ProductService,

        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,

        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>
    ){}


    private async  prepareItems(dto: CreateOrderItemDto): Promise<OrderItem>{
        const product = await this.productService.findOne(dto.productId);
        const subtotal = dto.quantity * Number(product.price);

        return this.orderItemRepository.create({
            product,
            quantity: dto.quantity,
            price: product.price,
            subtotal
        });
    }
    

    async create(dto: CreateOrderDto): Promise<Order>{
        // Regra #1 verificar se tem uma comanda aberta para determinada mesa 
        const guestCheck = await this.guestCheckService.findOrCreateOpened(dto.spotId);

        //monta o totalizador do pedido 
        const items: OrderItem[] = [];
        let total = 0;

        for (const itemDto of dto.items) {
            const item = await this.prepareItems(itemDto); // prepara pra inserir no banco
            items.push(item)
            total += Number(item.subtotal)

        }

        //monta o pedido 

        const order = this.orderRepository.create({
            guestCheck,
            status: Orderstatus.NEW,
            total,
            items
        })


        //gravar no banco o pedido
        return this.orderRepository.save(order);
    }

    findAll(): Promise<Order[]>{
    return this.orderRepository.find({
      order: { createdAt: 'ASC' },
      relations: { guestCheck: { spot: true }, items: { product: true } },
    });
}

async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { guestCheck: { spot: true }, items: { product: true } },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado!');
    }

    return order;
}

    async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
        const order = await this.findOne(id);

        // As transições são livres: qualquer status pode ir para qualquer outro.
        // O @IsEnum do DTO já garante que o valor enviado é um status válido.
        order.status = dto.status

        return this.orderRepository.save(order);

    }
}
