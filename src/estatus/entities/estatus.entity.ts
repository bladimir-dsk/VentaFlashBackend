import { Empleado } from "src/empleado/entities/empleado.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Estatus {

    @PrimaryGeneratedColumn()
    id_estatus: number;

    @Column()
    nb_estatus: string;

    @Column()
    tp_estatus: string;

    @Column()
    cv_estatus: string;

    @OneToMany(() => Empleado, (empleado) => empleado.estatus)
    empleado: Empleado[]

    @ManyToOne(() => Empresa, empresa => empresa.empleado)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

    @Column({nullable: true})
    userEmail: string;

    // @Column()
    // id_empresas: number;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

}