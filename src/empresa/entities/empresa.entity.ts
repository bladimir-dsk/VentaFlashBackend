import { create } from "domain";
import { Empleado } from "src/empleado/entities/empleado.entity";
import { Pago } from "src/pagos/entities/pago.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Empresa {

    @PrimaryGeneratedColumn()
    id_empresa: number;

    @Column({ nullable: false, default: 'sin nombre' })
    nombre: string;

    @Column({ nullable: true })
    path_foto_perfil: string;

    @Column({ nullable: true })
    rfc: string;

    @OneToOne(() => Pago, { eager: true })
    @JoinColumn({ name: 'id_pago' })
    Pago: Pago;

    @OneToMany(() => User, user => user.empresa)
    users: User[];

    @OneToMany(() => Empleado, empleado => empleado.empresa)
    empleado: Empleado[];

    
    @CreateDateColumn()
    createdAt: Date;

   
     
}
