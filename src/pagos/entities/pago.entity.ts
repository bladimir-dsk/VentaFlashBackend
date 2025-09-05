import { Empresa } from "src/empresa/entities/empresa.entity";
import { PlanVigencia } from "src/plan-vigencia/entities/plan-vigencia.entity";
import { User } from "src/users/entities/user.entity";
import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  OneToMany, 
  OneToOne, 
  PrimaryGeneratedColumn 
} from "typeorm";

@Entity()
export class Pago {
    @PrimaryGeneratedColumn()
    id_pago: number;

    @Column({ type: "float" })
    monto: number;

    @CreateDateColumn({type: 'timestamptz'})
    fecha_pago: Date;

    @Column()
    estado: boolean;

    // Fecha de expiración del pago
    @Column({ type: 'timestamptz', nullable: true })
    fecha_expiracion: Date;

    // Indica si es una renovación de un pago anterior
    @Column({ default: false })
    es_renovacion: boolean;

   

    @ManyToOne(() => PlanVigencia, planVigencia => planVigencia.pagos)
    @JoinColumn({name: 'id_planVigencia'})
    planVigencia: PlanVigencia

    @OneToOne(() => Empresa, empresa => empresa.Pago)
    empresa: Empresa;

    // Relación con Usuario
    @ManyToOne(() => User, usuario => usuario.pagos)
    @JoinColumn({ name: 'id_usuario' })
    usuario: User;

    @Column({ nullable: true })
    nombre_empresa: string;

    @Column({ nullable: true })
    rfc_empresa: string;

    // Método para calcular si el pago está expirado
    isExpired(): boolean {
        if (!this.fecha_expiracion) return true;
        return new Date() > this.fecha_expiracion;
    }


    // Relación con el pago anterior (para historial)
    @ManyToOne(() => Pago, pago => pago.renovaciones, { nullable: true })
    @JoinColumn({ name: 'id_pago_anterior' })
    pago_anterior: Pago;

    // Relación inversa para las renovaciones
    @OneToMany(() => Pago, pago => pago.pago_anterior)
    renovaciones: Pago[];


    @Column({ nullable: true })
    stripe_invoice_id: string;
  
    @Column({ type: 'json', nullable: true })
    factura_sat: {
      fecha: string;
      folio: string;
      rfcEmisor: string;
      rfcReceptor: string;
      subtotal: number;
      iva: number;
      total: number;
      concepto: string;
      metodoPago: string;
      formaPago: string;
      moneda: string;
      tipoComprobante: string;
      lugarExpedicion: string;
      certificado: string;
      sello: string;
      cadenaOriginal: string;
      xml: string;
      pdf: string;
    };
}