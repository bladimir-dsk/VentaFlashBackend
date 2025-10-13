import { Empleado } from "src/empleado/entities/empleado.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"


@Entity()
export class Caja {

    @PrimaryGeneratedColumn()
    id_caja: number


    @Column()
    num_caja: number


    @Column()
    monto: number

    // @ManyToOne(() => Empleado, (empleado) => empleado.caja)
    // @JoinColumn({name: 'id_empleado'})
    // empleado: Empleado


    @ManyToOne(() => User, (user) => user.email,)
    @JoinColumn({name: 'userEmail', referencedColumnName: 'email', })
    user: User;

    //creamos una columna para el email de referencedcolumn
    @Column()
    userEmail: string;


    @ManyToOne(() => Empresa, empresa => empresa.empleado)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

    @OneToOne(() => Empleado, (empleado) => empleado.caja)
    empleado: Empleado;
}
