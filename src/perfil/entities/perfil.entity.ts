import { Empleado } from "src/empleado/entities/empleado.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Modulo } from "src/modulos/entities/modulo.entity";
import { User } from "src/users/entities/user.entity";

import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Perfil {

    @PrimaryGeneratedColumn()
    id_perfil: number;

    @Column()
    nb_perfil: string;


    @ManyToMany(() => Modulo, (modulo) => modulo.perfil, { cascade: true })
    @JoinTable(
        {
            name: 'modulosPerfiles',
            joinColumns: [{ name: 'id_perfil' }],
            inverseJoinColumns: [{ name: 'id_modulo' }]
        }
    ) 
    modulo: Modulo[];

    @OneToMany(() => Empleado, (empleado) => empleado.perfil)
    empleado: Empleado[];


    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;


    @ManyToOne(() => Empresa, empresa => empresa.empleado)
        @JoinColumn({name: 'id_empresa'})
        empresa: Empresa;

}