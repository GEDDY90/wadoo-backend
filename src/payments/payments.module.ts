import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payments.entity';
import { PaymentService } from './payments.service';
import { PaymentResolver } from './payments.resolver';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Payment,
            Restaurant
        ]),  // Importer le modèle Payment uniquement
    ],
    providers: [
        PaymentService,    // Fournir le service de paiement
        PaymentResolver,   // Fournir le resolver de paiement
    ],
    exports: [
        PaymentService,    // Exporter PaymentService pour qu'il soit utilisé dans d'autres modules si nécessaire
    ],
})
export class PaymentsModule {}
