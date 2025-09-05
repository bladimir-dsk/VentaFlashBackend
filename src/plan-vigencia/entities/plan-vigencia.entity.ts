import { Empresa } from "src/empresa/entities/empresa.entity";
import { Pago } from "src/pagos/entities/pago.entity";
import { Plane } from "src/planes/entities/plane.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class PlanVigencia {
    @PrimaryGeneratedColumn()
    id_plan_vigencia: number;

    @Column({nullable: true})
    nb_plan_vigencia: string;

    @Column({nullable: true})
    num_mes: number;

    @Column()
    duracion: number;

    @Column({ type: "float" })
    precio: number;

    @Column({type: 'boolean', default: true})
    estatus: boolean;

    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;

    @ManyToOne(() => Empresa, empresa => empresa.id_empresa)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

    @ManyToOne(() => Plane, plan => plan.id_plan)
    @JoinColumn({name: 'id_plan'})
    plan: Plane;

    @OneToMany(() => Pago, pago => pago.planVigencia)
    pagos: Pago[]


    // @OneToMany(() => Empresa, (empresa) => empresa.planVigencia)
    // empresas: Empresa[];
}
