import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
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
      order: { createdAt: 'ASC' }
    });
}

async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado!');
    }

    return order;
}

    async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
        const order = await this.findOne(id);

        // determino a sequencia obrigatoria de mudança de status 
        const nextStatus : Record<Orderstatus, Orderstatus | undefined> = {
            [Orderstatus.NEW]: Orderstatus.PREPARING,
            [Orderstatus.PREPARING]: Orderstatus.READY,
            [Orderstatus.READY]: Orderstatus.DELIVERED,
            [Orderstatus.DELIVERED]: undefined,
            [Orderstatus.ITEMS]: undefined
        }

        //VERIFICO SE O CLIENTE ESTA ENVIANDO UM ESTATUS VALIDO
        if (nextStatus[dto.status] !== dto.status){
            throw new BadRequestException('status ivalido!')

        }
         
        order.status = dto.status

        return this.orderRepository.save(order);

    }
}