import { Perfil } from "src/perfil/entities/perfil.entity";
import { Plane } from "src/planes/entities/plane.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm"


@Entity()
export class Modulo {

    @PrimaryGeneratedColumn()
    id_modulo: number


    @Column()
    nombre: string

    @Column({nullable: true})
    icono: string


    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;

    @ManyToMany(() => Perfil, (perfil) => perfil.modulo)
    perfil: Perfil[];

    @ManyToMany(() => Plane, (plan) => plan.modulo)
    plan: Plane[];

}
