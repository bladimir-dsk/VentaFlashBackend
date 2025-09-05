import { Empresa } from "src/empresa/entities/empresa.entity";
import { Modulo } from "src/modulos/entities/modulo.entity";
import { PlanVigencia } from "src/plan-vigencia/entities/plan-vigencia.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Plane {

    @PrimaryGeneratedColumn()
    id_plan: number;

    @Column()
    nb_plan: string;

    @Column({nullable: true})
    des_plan: string;
 
    @Column()
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

   @ManyToMany(() => Modulo, (modulo) => modulo.plan, { cascade: true })
    @JoinTable(
        {
            name: 'planModulos',
            joinColumns: [{ name: 'id_plan' }],
            inverseJoinColumns: [{ name: 'id_modulo' }]
        }
    ) 
    modulo: Modulo[];

    @OneToMany(() => PlanVigencia, (planVigencia) => planVigencia.plan)
    planVigencia: PlanVigencia[]
}
