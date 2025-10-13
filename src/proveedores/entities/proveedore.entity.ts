import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';


@Entity()
export class Proveedore {
    @PrimaryGeneratedColumn()
    id_proveedor: number;

    @Column()
    nombre: string;
    
    @Column()
    email: string;
    
    @Column()
    telefono: string;
    
    @Column()
    empresa_proveedor: string;

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
