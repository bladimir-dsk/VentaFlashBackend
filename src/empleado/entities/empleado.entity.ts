import { Caja } from "src/cajas/entities/caja.entity";
import { Empresa } from "src/empresa/entities/empresa.entity";
import { Estatus } from "src/estatus/entities/estatus.entity";
import { Perfil } from "src/perfil/entities/perfil.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export class Empleado {

    @PrimaryGeneratedColumn()
    id_empleado: number;

    @Column()
    nombre: string;

    @Column({ nullable: true })
    email: string;

    @Column({nullable: true})
    emailPersonal: string;

    @Column({nullable: false, default: false})
    aplicaEnUsuario: boolean

    @ManyToOne(() => Empresa, empresa => empresa.empleado)
    @JoinColumn({name: 'id_empresa'})
    empresa: Empresa;

    @Column()
    userEmail: string;

    @Column({nullable: true})
    role: string;


    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'id_usuario', })
    user: User;

    @ManyToOne(() => Perfil, (perfil) => perfil.empleado)
    @JoinColumn({ name: 'id_perfil', })
    perfil: Perfil;

    @ManyToOne(() => Estatus, (estatus) => estatus.empleado)
    @JoinColumn({ name: 'id_estatus', })
    estatus: Estatus;

    @ManyToOne(() => Caja, (caja) => caja.empleado)
    @JoinColumn({ name: 'id_caja', })
    caja: Caja;
    

}
